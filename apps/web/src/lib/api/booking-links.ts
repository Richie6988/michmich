/**
 * Booking deep links — Real URLs to external booking services.
 * No keys needed; these are public search URLs.
 *
 * In Phase 3B these will be replaced with real API integrations
 * (TheFork API, Booking.com Affiliate API, SNCF Connect API).
 */

import type { GeoPoint, Venue, TransportMode } from '@barry/shared-types';

/** Google Maps directions from A to B with mode. */
export function googleMapsDirections(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TransportMode = 'transit'
): string {
  const modeMap: Record<string, string> = {
    walk: 'walking', bike: 'bicycling', car: 'driving',
    transit: 'transit', train: 'transit', flight: 'transit',
  };
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=${modeMap[mode] || 'transit'}`;
}

/** Google Maps view of a place (using its name + coordinates). */
export function googleMapsPlace(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name} ${venue.address.city || ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${venue.location.lat},${venue.location.lng}`;
}

/** Citymapper directions (mobile-first transit app). */
export function citymapperDirections(origin: GeoPoint, destination: GeoPoint): string {
  return `https://citymapper.com/directions?startcoord=${origin.lat},${origin.lng}&endcoord=${destination.lat},${destination.lng}`;
}

/** TheFork search for a restaurant (search by name + city). */
export function theForkSearch(venue: Venue): string {
  const query = encodeURIComponent(`${venue.name} ${venue.address.city || ''}`);
  return `https://www.thefork.fr/search/?cityId=&searchString=${query}`;
}

/** Booking.com search for hotels near a location. */
export function bookingDotComSearch(point: GeoPoint, label?: string): string {
  if (label) {
    return `https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(label)}`;
  }
  return `https://www.booking.com/searchresults.fr.html?latitude=${point.lat}&longitude=${point.lng}`;
}

/** Airbnb search around a location. */
export function airbnbSearch(point: GeoPoint, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${point.lat},${point.lng}`;
  return `https://www.airbnb.fr/s/${q}/homes`;
}

/** SNCF Connect search for trains between two cities/stations. */
export function sncfConnectSearch(origin: GeoPoint, destination: GeoPoint): string {
  return `https://www.sncf-connect.com/app/home/search?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
}

/** Trainline search for trains. */
export function trainlineSearch(originLabel: string, destinationLabel: string): string {
  const o = encodeURIComponent(originLabel);
  const d = encodeURIComponent(destinationLabel);
  return `https://www.thetrainline.com/fr/recherche/${o}-${d}`;
}

/** GetYourGuide for activities at a destination. */
export function getYourGuideSearch(label: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(label)}`;
}

/** Resy reservation for restaurants (US/select EU cities). */
export function resySearch(venue: Venue): string {
  return `https://resy.com/search?query=${encodeURIComponent(venue.name)}`;
}

/** Generic web search fallback. */
export function googleSearch(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Smart booking link: picks the right service based on venue category.
 */
export function smartBookingLink(venue: Venue): { url: string; service: string } {
  switch (venue.category) {
    case 'restaurant':
    case 'bar':
      return { url: theForkSearch(venue), service: 'TheFork' };
    case 'hotel':
      return { url: bookingDotComSearch(venue.location, venue.name), service: 'Booking.com' };
    case 'activity':
    case 'museum':
      return { url: getYourGuideSearch(venue.name), service: 'GetYourGuide' };
    default:
      return { url: googleMapsPlace(venue), service: 'Google Maps' };
  }
}

/**
 * Best transport booking link based on distance + mode.
 */
export function smartTransportLink(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: TransportMode,
  distanceKm?: number
): { url: string; service: string } {
  // Long distance trains
  if ((distanceKm || 0) > 100 && (mode === 'train' || mode === 'transit')) {
    return { url: sncfConnectSearch(origin, destination), service: 'SNCF Connect' };
  }
  // Short urban
  if (mode === 'transit' || mode === 'walk' || mode === 'bike') {
    return { url: citymapperDirections(origin, destination), service: 'Citymapper' };
  }
  // Default: Google Maps
  return { url: googleMapsDirections(origin, destination, mode), service: 'Google Maps' };
}
