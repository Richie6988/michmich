"""OSRM routing client with Haversine fallback for offline/prototype mode."""

import os
import math
from dataclasses import dataclass

import httpx

OSRM_URL = os.getenv("OSRM_URL", "http://localhost:5000")

# Average speeds by mode (km/h) for fallback estimation
MODE_SPEEDS = {
    "walk": 5.0,
    "bike": 15.0,
    "transit": 25.0,
    "car": 35.0,
    "train": 80.0,
}

# Cost per km by mode (EUR) for estimation
MODE_COSTS = {
    "walk": 0.0,
    "bike": 0.0,
    "transit": 0.06,  # ~EUR 2.15 Navigo ticket / ~35km average
    "car": 0.15,
    "train": 0.10,
}


@dataclass
class RouteResult:
    duration_seconds: float
    distance_meters: float
    cost_eur: float
    geometry: list[list[float]] | None = None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _fallback_route(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    mode: str,
) -> RouteResult:
    """Haversine-based estimation when OSRM is unavailable."""
    straight_km = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
    # Detour factor: real roads are ~1.3-1.4x straight line
    detour = {"walk": 1.3, "bike": 1.35, "transit": 1.5, "car": 1.4, "train": 1.2}
    real_km = straight_km * detour.get(mode, 1.4)
    speed = MODE_SPEEDS.get(mode, 25.0)
    duration_h = real_km / speed
    cost = real_km * MODE_COSTS.get(mode, 0.0)
    return RouteResult(
        duration_seconds=duration_h * 3600,
        distance_meters=real_km * 1000,
        cost_eur=round(cost, 2),
    )


async def get_route(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    mode: str = "car",
) -> RouteResult:
    """Get route from OSRM, falling back to Haversine if OSRM is down."""
    osrm_profile = {"walk": "foot", "bike": "bicycle", "car": "car", "transit": "car", "train": "car"}
    profile = osrm_profile.get(mode, "car")
    url = f"{OSRM_URL}/route/v1/{profile}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params={"overview": "simplified", "geometries": "geojson"})
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    dist_m = route["distance"]
                    dur_s = route["duration"]
                    # Adjust duration for non-car modes
                    if mode in ("walk", "bike", "transit"):
                        speed_ratio = MODE_SPEEDS.get("car", 35) / MODE_SPEEDS.get(mode, 25)
                        dur_s *= speed_ratio
                    cost = (dist_m / 1000) * MODE_COSTS.get(mode, 0.0)
                    geom = route.get("geometry", {}).get("coordinates")
                    return RouteResult(
                        duration_seconds=dur_s,
                        distance_meters=dist_m,
                        cost_eur=round(cost, 2),
                        geometry=geom,
                    )
    except (httpx.ConnectError, httpx.TimeoutException):
        pass

    # Fallback
    return _fallback_route(origin_lat, origin_lng, dest_lat, dest_lng, mode)


async def get_routes_batch(
    origins: list[tuple[float, float]],
    dest_lat: float, dest_lng: float,
    modes: list[str],
) -> list[RouteResult]:
    """Get routes from multiple origins to a single destination."""
    results = []
    for (olat, olng), mode in zip(origins, modes):
        r = await get_route(olat, olng, dest_lat, dest_lng, mode)
        results.append(r)
    return results
