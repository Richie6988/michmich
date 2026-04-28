/**
 * Overpass API client — Real OSM venue search.
 * No API key required. Public endpoint: https://overpass-api.de/api/interpreter
 *
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import type { GeoPoint, Venue, VenueCategory } from '@barry/shared-types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Map OSM amenity/tourism/leisure tags to our categories
const CATEGORY_QUERIES: Record<string, { tags: string[]; category: VenueCategory; minRating?: number }> = {
  restaurant: { tags: ['amenity=restaurant', 'amenity=fast_food'], category: 'restaurant' },
  bar: { tags: ['amenity=bar', 'amenity=pub', 'amenity=cafe'], category: 'bar' },
  hotel: { tags: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house'], category: 'hotel' },
  museum: { tags: ['tourism=museum', 'tourism=gallery'], category: 'museum' },
  park: { tags: ['leisure=park', 'leisure=garden'], category: 'park' },
  activity: { tags: ['leisure=escape_game', 'tourism=attraction', 'leisure=bowling_alley'], category: 'activity' },
};

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Find venues around a point within a radius (meters).
 * Returns up to `limit` venues, deduplicated and ranked by relevance.
 */
export async function findVenuesNearby(
  center: GeoPoint,
  radiusM: number,
  categories: VenueCategory[] = ['restaurant', 'bar', 'museum', 'park', 'activity', 'hotel'],
  limit = 30
): Promise<Venue[]> {
  // Build Overpass QL query: union of all selected category tags
  const tagQueries: string[] = [];
  const wantedKeys = new Set<string>();
  for (const cat of categories) {
    const config = CATEGORY_QUERIES[cat];
    if (!config) continue;
    for (const tag of config.tags) {
      const [k] = tag.split('=');
      wantedKeys.add(k);
      tagQueries.push(`node["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:${radiusM},${center.lat},${center.lng});`);
    }
  }

  const query = `
    [out:json][timeout:15];
    (
      ${tagQueries.join('\n      ')}
    );
    out center 100;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`);
  }

  const data: OverpassResponse = await res.json();

  const venues: Venue[] = [];
  for (const el of data.elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (!lat || !lng || !name) continue;

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
      rating: null, // OSM doesn't have ratings
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      website: el.tags?.website || el.tags?.['contact:website'] || null,
      photos: [],
      coverPhotoUrl: null,
      accessibility: {
        wheelchair: el.tags?.wheelchair === 'yes',
      },
    });
  }

  // Dedupe by name + close location (within ~50m)
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
  // OSM doesn't have explicit prices, but cuisine/stars give hints
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
  if (tags.cuisine) parts.push(`Cuisine: ${tags.cuisine.replace(/_/g, ' ')}`);
  if (tags.stars) parts.push(`${tags.stars} étoiles`);
  if (tags.outdoor_seating === 'yes') parts.push('Terrasse');
  if (tags.takeaway === 'yes') parts.push('À emporter');
  if (tags.opening_hours) parts.push(tags.opening_hours);
  return parts.length ? parts.join(' · ') : null;
}

function haversineM(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const aH = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aH), Math.sqrt(1 - aH));
}
