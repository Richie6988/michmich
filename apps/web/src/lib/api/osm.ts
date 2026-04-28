/**
 * Overpass API client - Real OSM venue search.
 * Uses multiple mirror endpoints with automatic failover.
 * No API key required.
 */

import type { GeoPoint, Venue, VenueCategory } from '@barry/shared-types';

// Public Overpass mirrors - we try them in order
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

const CATEGORY_TAGS: Record<VenueCategory, string[]> = {
  restaurant: ['amenity=restaurant', 'amenity=fast_food'],
  bar: ['amenity=bar', 'amenity=pub', 'amenity=cafe'],
  hotel: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house'],
  museum: ['tourism=museum', 'tourism=gallery'],
  park: ['leisure=park', 'leisure=garden'],
  activity: ['leisure=escape_game', 'tourism=attraction', 'leisure=bowling_alley'],
  other: [],
};

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Find venues around a point. Resilient with retry + mirror failover.
 */
export async function findVenuesNearby(
  center: GeoPoint,
  radiusM: number,
  categories: VenueCategory[] = ['restaurant', 'bar', 'museum', 'park', 'activity', 'hotel'],
  limit = 30,
): Promise<Venue[]> {
  const tagQueries: string[] = [];
  for (const cat of categories) {
    const tags = CATEGORY_TAGS[cat] || [];
    for (const tag of tags) {
      const [k, v] = tag.split('=');
      tagQueries.push(`node["${k}"="${v}"](around:${radiusM},${center.lat},${center.lng});`);
    }
  }

  if (tagQueries.length === 0) return [];

  const query = `[out:json][timeout:25];(${tagQueries.join('')});out center 80;`;

  // Try each mirror with retry
  let lastError: Error | null = null;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const data = await fetchWithRetry(mirror, query, 2);
      return parseOverpassResponse(data, limit);
    } catch (err) {
      lastError = err as Error;
      console.warn(`Overpass mirror ${mirror} failed:`, err);
    }
  }

  // All mirrors failed - throw a friendly error
  throw new Error(
    'All OSM mirrors are slow or unreachable right now. ' +
    'Please retry in a moment or reduce search radius. ' +
    `Last error: ${lastError?.message || 'unknown'}`
  );
}

async function fetchWithRetry(url: string, query: string, retries: number): Promise<any> {
  let lastErr: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        if (res.status === 504 || res.status === 429 || res.status >= 500) {
          // Retry on server errors
          throw new Error(`HTTP ${res.status}`);
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      lastErr = err as Error;
      if (i < retries) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastErr || new Error('Unknown error');
}

function parseOverpassResponse(data: any, limit: number): Venue[] {
  const elements: OverpassElement[] = data.elements || [];
  const venues: Venue[] = [];

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (lat == null || lng == null || !name) continue;

    const category = inferCategory(el.tags || {});
    if (!category) continue;

    venues.push({
      id: `osm-${el.type}-${el.id}`,
      name,
      category,
      location: { lat, lng },
      address: {
        street: el.tags?.['addr:street'] && el.tags?.['addr:housenumber']
          ? `${el.tags['addr:housenumber']} ${el.tags['addr:street']}`
          : el.tags?.['addr:street'],
        city: el.tags?.['addr:city'],
        zip: el.tags?.['addr:postcode'],
        country: el.tags?.['addr:country'],
      },
      description: buildDescription(el.tags || {}),
      priceLevel: inferPriceLevel(el.tags || {}),
      rating: null,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      website: el.tags?.website || el.tags?.['contact:website'] || null,
      photos: [],
      coverPhotoUrl: null,
      accessibility: {
        wheelchair: el.tags?.wheelchair === 'yes',
      },
    });
  }

  // Dedupe by name + close location
  const deduped: Venue[] = [];
  for (const v of venues) {
    const dup = deduped.find(d =>
      d.name.toLowerCase() === v.name.toLowerCase() &&
      haversineM(d.location, v.location) < 50
    );
    if (!dup) deduped.push(v);
  }
  return deduped.slice(0, limit);
}

function inferCategory(tags: Record<string, string>): VenueCategory | null {
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'restaurant';
  if (tags.amenity === 'bar' || tags.amenity === 'pub' || tags.amenity === 'cafe') return 'bar';
  if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') return 'hotel';
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'museum';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
  if (tags.leisure === 'escape_game' || tags.tourism === 'attraction' || tags.leisure === 'bowling_alley') return 'activity';
  return null;
}

function inferPriceLevel(tags: Record<string, string>): number | null {
  if (tags.stars) {
    const s = parseInt(tags.stars);
    if (s >= 5) return 4;
    if (s >= 4) return 3;
    if (s >= 3) return 2;
    return 1;
  }
  if (tags.fee === 'no') return 1;
  return null;
}

function buildDescription(tags: Record<string, string>): string | null {
  const parts: string[] = [];
  if (tags.cuisine) parts.push(tags.cuisine.replace(/_/g, ' ').replace(/;/g, ', '));
  if (tags.stars) parts.push(`${tags.stars} stars`);
  if (tags.outdoor_seating === 'yes') parts.push('Outdoor seating');
  if (tags.takeaway === 'yes') parts.push('Takeaway');
  if (tags.opening_hours) parts.push(tags.opening_hours);
  return parts.length ? parts.join(' - ') : null;
}

function haversineM(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const aH = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aH), Math.sqrt(1 - aH));
}
