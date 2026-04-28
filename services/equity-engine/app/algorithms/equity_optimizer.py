"""
Barry Equity Optimizer — Minimax burden optimization.

Finds the geographic point that minimizes the maximum individual burden
across all group participants, considering time and cost constraints.
"""

import time
import math
import asyncio
from dataclasses import dataclass

import numpy as np
from scipy.spatial import KDTree
from sklearn.cluster import KMeans

from app.models.equity import (
    EquityParticipant, EquityRequest, EquityResponse,
    EquityZoneResult, BurdenBreakdown, GeoPoint,
)
from app.services.osrm_client import get_route, haversine_km, RouteResult


@dataclass
class GridPoint:
    lat: float
    lng: float
    burdens: dict[str, float]
    breakdowns: list[BurdenBreakdown]
    equity_score: float = 0.0
    composite_score: float = 0.0
    max_burden: float = 0.0
    mean_burden: float = 0.0
    std_dev: float = 0.0
    valid: bool = True


# Paris neighborhood labels (prototype)
PARIS_NEIGHBORHOODS = [
    (48.8566, 2.3522, "Centre / Les Halles"),
    (48.8606, 2.3376, "Louvre / Palais Royal"),
    (48.8530, 2.3499, "Saint-Michel / Quartier Latin"),
    (48.8575, 2.3514, "Chatelet / Hotel de Ville"),
    (48.8588, 2.3622, "Le Marais"),
    (48.8531, 2.3698, "Bastille"),
    (48.8636, 2.3611, "Haut Marais / Arts et Metiers"),
    (48.8705, 2.3465, "Grands Boulevards"),
    (48.8738, 2.3447, "Opera / Grands Magasins"),
    (48.8671, 2.3328, "Bourse / Sentier"),
    (48.8506, 2.3565, "Ile Saint-Louis"),
    (48.8570, 2.3430, "Pont Neuf"),
    (48.8649, 2.3800, "Oberkampf / Menilmontant"),
    (48.8534, 2.3796, "Nation / Faidherbe"),
    (48.8766, 2.3590, "Canal Saint-Martin"),
    (48.8861, 2.3390, "Montmartre"),
    (48.8450, 2.3508, "Gobelins / Mouffetard"),
    (48.8530, 2.3283, "Odeon / Saint-Germain"),
    (48.8462, 2.3444, "Place d'Italie"),
    (48.8658, 2.3223, "Saint-Lazare"),
]


def _get_neighborhood_label(lat: float, lng: float) -> str | None:
    """Find nearest Paris neighborhood name."""
    min_dist = float("inf")
    label = None
    for nlat, nlng, name in PARIS_NEIGHBORHOODS:
        d = haversine_km(lat, lng, nlat, nlng)
        if d < min_dist:
            min_dist = d
            label = name
    return label if min_dist < 2.0 else None


def _generate_grid(
    participants: list[EquityParticipant],
    radius_km: float,
    resolution: int,
) -> list[tuple[float, float]]:
    """Generate candidate grid points centered on the geographic centroid."""
    lats = [p.origin.lat for p in participants]
    lngs = [p.origin.lng for p in participants]
    center_lat = sum(lats) / len(lats)
    center_lng = sum(lngs) / len(lngs)

    # Convert km to degrees (approximate)
    lat_deg = radius_km / 111.0
    lng_deg = radius_km / (111.0 * math.cos(math.radians(center_lat)))

    points = []
    for i in range(resolution):
        for j in range(resolution):
            lat = center_lat - lat_deg + (2 * lat_deg * i / (resolution - 1))
            lng = center_lng - lng_deg + (2 * lng_deg * j / (resolution - 1))
            points.append((lat, lng))

    return points


def _compute_burden(
    participant: EquityParticipant,
    route: RouteResult,
) -> float:
    """Compute weighted burden for a single participant-route pair."""
    time_min = route.duration_seconds / 60.0
    cost_eur = route.cost_eur
    return (time_min * participant.time_weight) + (cost_eur * participant.money_weight)


def _check_constraints(
    participant: EquityParticipant,
    route: RouteResult,
) -> bool:
    """Check if route violates any hard constraints."""
    time_min = route.duration_seconds / 60.0
    if time_min > participant.max_time:
        return False
    if participant.max_money is not None and route.cost_eur > participant.max_money:
        return False
    return True


async def _evaluate_point(
    lat: float, lng: float,
    participants: list[EquityParticipant],
) -> GridPoint | None:
    """Evaluate a single candidate point against all participants."""
    routes = await asyncio.gather(*[
        get_route(p.origin.lat, p.origin.lng, lat, lng, p.mode.value)
        for p in participants
    ])

    # Check constraints
    for p, r in zip(participants, routes):
        if not _check_constraints(p, r):
            return None

    # Compute burdens
    burdens = {}
    breakdowns = []
    for p, r in zip(participants, routes):
        burden = _compute_burden(p, r)
        burdens[p.id] = burden
        breakdowns.append(BurdenBreakdown(
            user_id=p.id,
            burden=round(burden, 2),
            duration_min=round(r.duration_seconds / 60, 1),
            distance_km=round(r.distance_meters / 1000, 1),
            cost_eur=r.cost_eur,
        ))

    burden_vals = list(burdens.values())
    mean_b = float(np.mean(burden_vals))
    std_b = float(np.std(burden_vals))
    max_b = float(np.max(burden_vals))

    # Equity score: 1 = perfect equity, 0 = very unequal
    equity = 1 - (std_b / mean_b) if mean_b > 0 else 0
    equity = max(0, min(1, equity))

    # Composite: 70% equity + 30% minimize max burden
    max_possible = max(p.max_time for p in participants)
    norm_max = 1 - (max_b / max_possible) if max_possible > 0 else 0
    composite = 0.7 * equity + 0.3 * norm_max

    return GridPoint(
        lat=lat, lng=lng,
        burdens=burdens,
        breakdowns=breakdowns,
        equity_score=round(equity * 100, 1),
        composite_score=round(composite * 100, 1),
        max_burden=round(max_b, 2),
        mean_burden=round(mean_b, 2),
        std_dev=round(std_b, 2),
    )


def _cluster_top_points(points: list[GridPoint], n_zones: int = 3) -> list[list[GridPoint]]:
    """Cluster top points into zones using KMeans."""
    if len(points) <= n_zones:
        return [[p] for p in points]

    coords = np.array([[p.lat, p.lng] for p in points])
    n_clusters = min(n_zones, len(points))
    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    labels = kmeans.fit_predict(coords)

    clusters: dict[int, list[GridPoint]] = {}
    for point, label in zip(points, labels):
        clusters.setdefault(int(label), []).append(point)

    return list(clusters.values())


async def compute_equity(request: EquityRequest) -> EquityResponse:
    """Main equity computation pipeline."""
    start_time = time.time()

    # 1. Generate candidate grid
    grid = _generate_grid(
        request.participants,
        request.search_radius_km,
        request.grid_resolution,
    )
    total_points = len(grid)

    # 2. Evaluate all points (with concurrency limit)
    sem = asyncio.Semaphore(20)

    async def eval_with_sem(lat, lng):
        async with sem:
            return await _evaluate_point(lat, lng, request.participants)

    results = await asyncio.gather(*[
        eval_with_sem(lat, lng) for lat, lng in grid
    ])

    # 3. Filter valid points
    valid_points = [r for r in results if r is not None]
    if not valid_points:
        return EquityResponse(
            trip_id=request.trip_id,
            zones=[],
            calculation_time_ms=int((time.time() - start_time) * 1000),
            grid_points_evaluated=total_points,
            valid_points=0,
        )

    # 4. Sort by composite score
    valid_points.sort(key=lambda p: p.composite_score, reverse=True)

    # 5. Take top 30% and cluster into 3 zones
    top_n = max(3, len(valid_points) // 3)
    top_points = valid_points[:top_n]
    clusters = _cluster_top_points(top_points, n_zones=3)

    # 6. Pick best point per cluster as zone center
    zones = []
    for rank, cluster in enumerate(clusters, 1):
        best = max(cluster, key=lambda p: p.composite_score)
        label = _get_neighborhood_label(best.lat, best.lng)
        zones.append(EquityZoneResult(
            center=GeoPoint(lat=round(best.lat, 6), lng=round(best.lng, 6)),
            label=label,
            equity_score=best.equity_score,
            composite_score=best.composite_score,
            max_burden=best.max_burden,
            mean_burden=best.mean_burden,
            std_dev_burden=best.std_dev,
            burdens={k: round(v, 2) for k, v in best.burdens.items()},
            breakdowns=best.breakdowns,
            rank=rank,
        ))

    # Sort by composite score descending
    zones.sort(key=lambda z: z.composite_score, reverse=True)
    for i, z in enumerate(zones, 1):
        z.rank = i

    elapsed_ms = int((time.time() - start_time) * 1000)

    return EquityResponse(
        trip_id=request.trip_id,
        zones=zones,
        calculation_time_ms=elapsed_ms,
        grid_points_evaluated=total_points,
        valid_points=len(valid_points),
    )
