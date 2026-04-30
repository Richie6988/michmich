// ============================================================
// SHARED VENUE CATALOG
// Used by /venues, /booking, and overview to show consistent names
// ============================================================

export interface VenueOpt {
  id: string;
  name: string;
  category: string;
  price: number; // 1-4 dollar signs
  rating: number;
  description: string;
  address: string;
  tags: string[];
  bgIndex: number;
}

export const VENUES_BY_ZONE: Record<string, VenueOpt[]> = {
  'demo-z1': [ // Marais
    { id: 'mar-1', name: 'Chez Janou', category: 'Restaurant', price: 2, rating: 4.4,
      description: 'Iconic Marais bistro. Legendary chocolate mousse.',
      address: '2 Rue Roger Verlomme, 75003', tags: ['French', 'Terrace'], bgIndex: 0 },
    { id: 'mar-2', name: 'Le Perchoir Marais', category: 'Bar', price: 3, rating: 4.1,
      description: 'Rooftop with a view over the Paris skyline.',
      address: '33 Rue de la Verrerie, 75004', tags: ['Rooftop', 'Cocktails'], bgIndex: 1 },
    { id: 'mar-3', name: 'Breizh Cafe', category: 'Restaurant', price: 2, rating: 4.3,
      description: 'Best crepes in Paris. Artisanal Breton cider.',
      address: '109 Rue Vieille du Temple, 75003', tags: ['Crepes', 'Organic'], bgIndex: 2 },
    { id: 'mar-4', name: 'Candelaria', category: 'Bar', price: 2, rating: 4.5,
      description: 'Speakeasy hidden behind a taqueria.',
      address: '52 Rue de Saintonge, 75003', tags: ['Speakeasy', 'Mexican'], bgIndex: 3 },
  ],
  'demo-z2': [ // Republique
    { id: 'rep-1', name: 'Holybelly 5', category: 'Brunch', price: 2, rating: 4.5,
      description: 'Cult brunch spot. Pancakes worth the wait.',
      address: '5 Rue Lucien Sampaix, 75010', tags: ['Brunch', 'Coffee'], bgIndex: 0 },
    { id: 'rep-2', name: 'Le Mary Celeste', category: 'Bar', price: 3, rating: 4.4,
      description: 'Natural wine and seasonal cocktails.',
      address: '1 Rue Commines, 75003', tags: ['Wine', 'Tapas'], bgIndex: 1 },
    { id: 'rep-3', name: 'Du Pain et des Idees', category: 'Bakery', price: 1, rating: 4.7,
      description: 'Artisan bakery. Get there before noon.',
      address: '34 Rue Yves Toudic, 75010', tags: ['Bakery', 'Pastry'], bgIndex: 2 },
    { id: 'rep-4', name: 'Le Comptoir General', category: 'Bar', price: 2, rating: 4.0,
      description: 'Hidden along Canal Saint-Martin. Quirky vibe.',
      address: '80 Quai de Jemmapes, 75010', tags: ['Hidden', 'Eclectic'], bgIndex: 3 },
  ],
  'demo-z3': [ // Bastille
    { id: 'bas-1', name: 'Septime', category: 'Restaurant', price: 4, rating: 4.6,
      description: 'Michelin-starred. Modern French. Reserve weeks ahead.',
      address: '80 Rue de Charonne, 75011', tags: ['Michelin', 'Modern'], bgIndex: 0 },
    { id: 'bas-2', name: 'Le Servan', category: 'Restaurant', price: 3, rating: 4.4,
      description: 'Asian-French fusion. Seasonal and sharp.',
      address: '32 Rue Saint-Maur, 75011', tags: ['Fusion', 'Wine'], bgIndex: 1 },
    { id: 'bas-3', name: 'Aux Deux Amis', category: 'Bar', price: 2, rating: 4.3,
      description: 'Tiny natural wine bar. Always packed for a reason.',
      address: '45 Rue Oberkampf, 75011', tags: ['Wine', 'Small plates'], bgIndex: 2 },
    { id: 'bas-4', name: 'Bistrot Paul Bert', category: 'Restaurant', price: 3, rating: 4.5,
      description: 'Old-school bistro. Steak frites done right.',
      address: '18 Rue Paul Bert, 75011', tags: ['French', 'Classic'], bgIndex: 3 },
  ],
};

export const FALLBACK_VENUES: VenueOpt[] = VENUES_BY_ZONE['demo-z1'];

/** Find a venue by its ID across all zones */
export function findVenueById(venueId: string): VenueOpt | null {
  for (const venues of Object.values(VENUES_BY_ZONE)) {
    const found = venues.find(v => v.id === venueId);
    if (found) return found;
  }
  return null;
}

/** Estimate per-person cost at a venue based on price level (EUR) */
export function venueCostPerPerson(venue: VenueOpt | null): number {
  if (!venue) return 35;
  // 1 = ~15 EUR (bakery/cafe), 2 = ~30 EUR (bistro), 3 = ~50 EUR, 4 = ~85 EUR (Michelin)
  const map = [15, 30, 50, 85];
  return map[Math.min(venue.price - 1, 3)] || 35;
}
