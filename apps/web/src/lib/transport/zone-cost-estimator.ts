/**
 * Estimate per-participant transport cost to a zone center.
 *
 * Uses Haversine distance + per-mode pricing models. This is an estimate
 * shown on the zone comparison cards so users can see "my budget" before
 * voting on a zone.
 *
 * For real bookings the actual cost comes from the route engine + reduction
 * cards. This is a quick preview.
 */

import type { GeoPoint, TransportMode, Participant } from '@barry/shared-types';

/** Approx kilometre cost rates per transport mode (EUR per km, one-way) */
const PER_KM_COST: Record<string, number> = {
  walk: 0,
  bike: 0,
  transit: 0.18,    // metro/tram blend
  car: 0.32,         // fuel + amortized
  train: 0.22,       // regional + TGV blend
  flight: 0.55,      // short-haul Europe
};

/** Approx kilometres-per-minute by mode for time estimation */
const KM_PER_MIN: Record<string, number> = {
  walk: 0.08,
  bike: 0.27,
  transit: 0.55,
  car: 0.6,
  train: 1.5,
  flight: 12,
};

/** Distance in km via Haversine (approximation, good enough for preview) */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface TransportEstimate {
  participantId: string;
  userId: string;
  firstName: string;
  mode: TransportMode;
  distanceKm: number;
  durationMin: number;
  costOneWayEur: number;
  /** Round-trip cost (typically what users see budgeted) */
  costRoundTripEur: number;
}

/**
 * Estimate per-participant transport for a target zone.
 * Returns one entry per participant with origin set; participants without
 * origin are skipped.
 */
export function estimateZoneTransport(
  zoneCenter: GeoPoint,
  participants: Participant[],
): TransportEstimate[] {
  const results: TransportEstimate[] = [];

  for (const p of participants) {
    if (!p.originLocation) continue;
    const mode = (p.transportMode || 'transit') as TransportMode;
    const distanceKm = haversineKm(p.originLocation, zoneCenter);
    const kmPerMin = KM_PER_MIN[mode] || 0.55;
    const durationMin = Math.round(distanceKm / kmPerMin);
    const perKm = PER_KM_COST[mode] || 0.18;
    const costOneWay = Math.round(distanceKm * perKm * 100) / 100;
    results.push({
      participantId: p.id,
      userId: p.userId,
      firstName: p.user?.firstName || '?',
      mode,
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      costOneWayEur: costOneWay,
      costRoundTripEur: Math.round(costOneWay * 2 * 100) / 100,
    });
  }

  return results;
}

/** Sum cost across all participants, round trip, for a zone */
export function totalTransportCost(estimates: TransportEstimate[]): number {
  return Math.round(estimates.reduce((s, e) => s + e.costRoundTripEur, 0) * 100) / 100;
}
