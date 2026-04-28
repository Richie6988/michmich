/**
 * Equity Engine API client.
 * Calls the Python FastAPI microservice at localhost:8000
 * which uses real OSRM routing (with Haversine fallback).
 */

import type {
  EquityRequest, EquityResponse, EquityZone,
  GeoPoint, TransportMode, Participant,
} from '@barry/shared-types';

const EQUITY_URL = process.env.NEXT_PUBLIC_EQUITY_URL || 'http://localhost:8000/api/v1/equity';

export interface CalculateEquityInput {
  tripId: string;
  participants: Array<{
    id: string;
    origin: GeoPoint;
    mode: TransportMode;
    timeWeight: number;
    moneyWeight: number;
    maxTime: number;
    maxMoney: number | null;
  }>;
  searchRadiusKm?: number;
  gridResolution?: number;
}

export async function calculateEquity(input: CalculateEquityInput): Promise<EquityResponse> {
  const body = {
    trip_id: input.tripId,
    participants: input.participants.map(p => ({
      id: p.id,
      origin: { lat: p.origin.lat, lng: p.origin.lng },
      mode: p.mode,
      time_weight: p.timeWeight,
      money_weight: p.moneyWeight,
      max_time: p.maxTime,
      max_money: p.maxMoney,
    })),
    search_radius_km: input.searchRadiusKm || 15,
    grid_resolution: input.gridResolution || 15,
  };

  const res = await fetch(`${EQUITY_URL}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Equity Engine error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    tripId: data.trip_id,
    zones: (data.zones || []).map((z: any): EquityZone => ({
      id: `zone-${z.rank}`,
      tripId: data.trip_id,
      center: z.center,
      label: z.label,
      equityScore: z.equity_score,
      maxBurden: z.max_burden,
      meanBurden: z.mean_burden,
      stdDevBurden: z.std_dev_burden,
      burdens: z.burdens,
      rank: z.rank,
      isSelected: false,
    })),
    calculationTimeMs: data.calculation_time_ms,
  };
}

/**
 * Helper: convert participants from store to API format.
 */
export function participantsToApiFormat(participants: Participant[]) {
  return participants
    .filter(p => p.originLocation && p.transportMode && p.maxTime)
    .map(p => ({
      id: p.userId,
      origin: p.originLocation!,
      mode: p.transportMode!,
      timeWeight: p.timeWeight,
      moneyWeight: p.moneyWeight,
      maxTime: p.maxTime!,
      maxMoney: p.maxMoney,
    }));
}

/**
 * Health check — useful to detect if Equity Engine is running.
 */
export async function isEquityEngineUp(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:8000/health', {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
