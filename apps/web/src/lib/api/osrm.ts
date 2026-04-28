/**
 * OSRM Public API client — Real driving/walking/cycling routes.
 * No API key required. Public endpoint: https://router.project-osrm.org
 *
 * Limits: courteous use only. For production, self-host or use OpenRouteService with a key.
 */

import type { GeoPoint, TransportMode } from '@barry/shared-types';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

// Map our transport modes to OSRM profiles
const PROFILE_MAP: Record<string, string> = {
  walk: 'foot',
  bike: 'bike',
  car: 'car',
  transit: 'car',  // OSRM doesn't have transit; fallback to car for routing
  train: 'car',    // Same fallback
};

// Average cost per km by mode (EUR), for cost estimation
const COST_PER_KM: Record<TransportMode, number> = {
  walk: 0,
  bike: 0,
  transit: 0.06,
  car: 0.18,
  train: 0.10,
  flight: 0.50,
};

// Speed multiplier (since OSRM gives car speeds, adjust for transit)
const SPEED_RATIO: Record<TransportMode, number> = {
  walk: 1,
  bike: 1,
  transit: 1.5,  // transit is slower than driving in cities
  car: 1,
  train: 0.5,    // trains are faster on long distances
  flight: 0.2,
};

export interface RouteResult {
  durationSeconds: number;
  distanceMeters: number;
  costEur: number;
  geometry?: { type: 'LineString'; coordinates: [number, number][] };
}

/**
 * Calculate a route between two points for a specific mode.
 * Falls back to Haversine + average speeds if OSRM is unreachable.
 */
export async function getRoute(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TransportMode = 'car'
): Promise<RouteResult> {
  const profile = PROFILE_MAP[mode] || 'car';
  const url = `${OSRM_BASE}/${profile}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');

    const route = data.routes[0];
    const distM = route.distance as number;
    let durS = route.duration as number;

    // Adjust duration for non-direct car modes
    durS *= SPEED_RATIO[mode];

    return {
      durationSeconds: durS,
      distanceMeters: distM,
      costEur: Math.round((distM / 1000) * COST_PER_KM[mode] * 100) / 100,
      geometry: route.geometry,
    };
  } catch {
    return haversineFallback(origin, destination, mode);
  }
}

/**
 * Batch route calculation: 1 origin → many destinations.
 * Uses sequential calls (OSRM public is rate-limited).
 */
export async function getRoutesBatch(
  origin: GeoPoint,
  destinations: GeoPoint[],
  mode: TransportMode
): Promise<RouteResult[]> {
  // Limit concurrency to 5 to be polite
  const results: RouteResult[] = [];
  const concurrency = 5;
  for (let i = 0; i < destinations.length; i += concurrency) {
    const batch = destinations.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(d => getRoute(origin, d, mode)));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Get routes for ALL modes at once for a single destination.
 */
export async function getMultiModalRoutes(
  origin: GeoPoint,
  destination: GeoPoint,
  modes: TransportMode[]
): Promise<Record<TransportMode, RouteResult>> {
  const results = await Promise.all(modes.map(m => getRoute(origin, destination, m)));
  const out = {} as Record<TransportMode, RouteResult>;
  modes.forEach((mode, i) => { out[mode] = results[i]; });
  return out;
}

// Haversine fallback (when OSRM is unreachable)
const FALLBACK_SPEEDS: Record<TransportMode, number> = {
  walk: 5,
  bike: 15,
  transit: 25,
  car: 35,
  train: 80,
  flight: 500,
};

function haversineFallback(a: GeoPoint, b: GeoPoint, mode: TransportMode): RouteResult {
  const distKm = haversineKm(a, b) * 1.35; // detour factor
  const speed = FALLBACK_SPEEDS[mode];
  const durHours = distKm / speed;
  return {
    durationSeconds: durHours * 3600,
    distanceMeters: distKm * 1000,
    costEur: Math.round(distKm * COST_PER_KM[mode] * 100) / 100,
  };
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const aH = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aH), Math.sqrt(1 - aH));
}
