/**
 * Nominatim API client — Free OSM-based geocoding.
 * No API key required. Public endpoint: https://nominatim.openstreetmap.org
 *
 * Usage policy: max 1 request/second, must include User-Agent.
 * Docs: https://nominatim.org/release-docs/develop/api/Overview/
 */

import type { GeoPoint } from '@barry/shared-types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Reverse geocode: lat/lng → readable address.
 */
export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?lat=${point.lat}&lon=${point.lng}&format=json&accept-language=fr,en&zoom=16`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.address) return data?.display_name || null;

    // Build a friendly short label
    const a = data.address;
    const parts: string[] = [];
    if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood!);
    if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village!);
    if (parts.length === 0) return data.display_name;
    return parts.join(', ');
  } catch {
    return null;
  }
}

/**
 * Forward geocode: address → coordinates.
 */
export async function geocode(query: string, limit = 5): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&accept-language=fr,en`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
