// ============================================================
// SOLO ZONES — when only one participant, Barry interprets
// "max travel time" as MAX RADIUS and recommends spots
// at the edges of that radius (not barycentre averaging)
// ============================================================

import type { GeoPoint, EquityZone } from '@barry/shared-types';

interface SoloEdgeZoneOptions {
  origin: GeoPoint;
  /** Max travel time in minutes — used as approximation for radius */
  maxTimeMin: number;
  /** Transport mode determines km/min approximation */
  mode: 'walk' | 'bike' | 'transit' | 'car' | 'train' | 'flight';
}

// Average speed in km/h for each transport mode
const AVERAGE_SPEED_KMH: Record<string, number> = {
  walk: 5,
  bike: 15,
  transit: 25, // urban transit average including waits
  car: 40,     // urban+suburban mix
  train: 80,   // includes station overhead
  flight: 600, // for long-distance trips
};

// 1 degree latitude ≈ 111 km
const KM_PER_DEGREE_LAT = 111;

/**
 * Compute 3 zones at the edges of the participant's max travel radius.
 * Useful for solo trips where averaging makes no sense.
 */
export function computeSoloEdgeZones({ origin, maxTimeMin, mode }: SoloEdgeZoneOptions): EquityZone[] {
  const speedKmh = AVERAGE_SPEED_KMH[mode] || 25;
  // Radius in km, with 0.7 factor since you don't always go in a straight line
  const radiusKm = Math.min(speedKmh * (maxTimeMin / 60) * 0.7, 1000);

  // Convert to degree offsets (lat is uniform, lng depends on lat)
  const dLat = radiusKm / KM_PER_DEGREE_LAT;
  const dLng = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(origin.lat * Math.PI / 180));

  // Pick 3 directions: NW, NE, S (covers 3 different "explorations")
  const directions: { dx: number; dy: number; label: string }[] = [
    { dx: -0.7, dy: 0.7, label: 'Northwest' },
    { dx: 0.7, dy: 0.7, label: 'Northeast' },
    { dx: 0, dy: -1, label: 'South' },
  ];

  return directions.map((d, i) => ({
    id: `solo-edge-${i + 1}`,
    rank: i + 1,
    center: {
      lat: origin.lat + d.dy * dLat,
      lng: origin.lng + d.dx * dLng,
    },
    label: `${d.label} edge (~${Math.round(radiusKm)}km)`,
    radius: radiusKm * 100, // approx in metres for the bounding circle
    equityScore: 100, // solo = perfectly fair to themselves
    burdenSpread: 0,
    venuesEstimated: 0,
  }));
}

/**
 * Determine if we should use solo edge mode (instead of equity-engine).
 */
export function shouldUseSoloEdgeMode(participantCount: number): boolean {
  return participantCount === 1;
}
