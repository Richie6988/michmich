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
  imageUrl: string;
}

// Curated Unsplash photos by photo ID. Each URL hits images.unsplash.com directly.
// w=400 keeps payload small for horizontal scroll cards.
const IMG = (id: string) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=70`;

export const VENUES_BY_ZONE: Record<string, VenueOpt[]> = {
  'demo-z1': [ // Marais
    { id: 'mar-1', name: 'Chez Janou', category: 'Restaurant', price: 2, rating: 4.4,
      description: 'Iconic Marais bistro. Provencal classics, terrace, legendary chocolate mousse you serve yourself.',
      address: '2 Rue Roger Verlomme, 75003', tags: ['French', 'Terrace', 'Bistro'], bgIndex: 0,
      imageUrl: IMG('photo-1517248135467-4c7edcad34c4') }, // bistro tables
    { id: 'mar-2', name: 'Le Perchoir Marais', category: 'Bar', price: 3, rating: 4.1,
      description: 'Rooftop with sweeping views over Paris. Cocktails, small plates, sunset crowd.',
      address: '33 Rue de la Verrerie, 75004', tags: ['Rooftop', 'Cocktails', 'Views'], bgIndex: 1,
      imageUrl: IMG('photo-1551024601-bec78aea704b') }, // rooftop bar
    { id: 'mar-3', name: 'Breizh Cafe', category: 'Restaurant', price: 2, rating: 4.3,
      description: 'Best crepes in Paris. Buckwheat galettes, artisanal Breton cider in stone cups.',
      address: '109 Rue Vieille du Temple, 75003', tags: ['Crepes', 'Organic', 'Brittany'], bgIndex: 2,
      imageUrl: IMG('photo-1565299507177-b0ac66763828') }, // crepes
    { id: 'mar-4', name: 'Candelaria', category: 'Bar', price: 2, rating: 4.5,
      description: 'Speakeasy hidden behind a tiny taqueria. Mezcal cocktails, no signage, in the know only.',
      address: '52 Rue de Saintonge, 75003', tags: ['Speakeasy', 'Mexican', 'Cocktails'], bgIndex: 3,
      imageUrl: IMG('photo-1514933651103-005eec06c04b') }, // dark cocktail bar
  ],
  'demo-z2': [ // Republique
    { id: 'rep-1', name: 'Holybelly 5', category: 'Brunch', price: 2, rating: 4.5,
      description: 'Cult brunch spot. Pancakes worth the queue, single-origin coffee, all day breakfast.',
      address: '5 Rue Lucien Sampaix, 75010', tags: ['Brunch', 'Coffee', 'Pancakes'], bgIndex: 0,
      imageUrl: IMG('photo-1525351484163-7529414344d8') }, // pancakes
    { id: 'rep-2', name: 'Le Mary Celeste', category: 'Bar', price: 3, rating: 4.4,
      description: 'Natural wine, seasonal cocktails, oysters. Industrial-chic counter spot.',
      address: '1 Rue Commines, 75003', tags: ['Wine', 'Oysters', 'Tapas'], bgIndex: 1,
      imageUrl: IMG('photo-1470337458703-46ad1756a187') }, // wine bar
    { id: 'rep-3', name: 'Du Pain et des Idees', category: 'Bakery', price: 1, rating: 4.7,
      description: 'Artisan bakery, get there before noon. The escargot pistache is mandatory.',
      address: '34 Rue Yves Toudic, 75010', tags: ['Bakery', 'Pastry', 'Bread'], bgIndex: 2,
      imageUrl: IMG('photo-1555507036-ab1f4038808a') }, // bakery
    { id: 'rep-4', name: 'Le Comptoir General', category: 'Bar', price: 2, rating: 4.0,
      description: 'Hidden along Canal Saint-Martin. Quirky vibe, ginger juice, eclectic concerts.',
      address: '80 Quai de Jemmapes, 75010', tags: ['Hidden', 'Eclectic', 'Concerts'], bgIndex: 3,
      imageUrl: IMG('photo-1572116469696-31de0f17cc34') }, // eclectic bar
  ],
  'demo-z3': [ // Bastille
    { id: 'bas-1', name: 'Septime', category: 'Restaurant', price: 4, rating: 4.6,
      description: 'Michelin-starred. Modern French. Tasting menu only. Reserve weeks ahead.',
      address: '80 Rue de Charonne, 75011', tags: ['Michelin', 'Modern', 'Tasting'], bgIndex: 0,
      imageUrl: IMG('photo-1414235077428-338989a2e8c0') }, // fine dining plate
    { id: 'bas-2', name: 'Le Servan', category: 'Restaurant', price: 3, rating: 4.4,
      description: 'Asian-French fusion by the Levha sisters. Seasonal, sharp, always packed.',
      address: '32 Rue Saint-Maur, 75011', tags: ['Fusion', 'Wine', 'Sharing'], bgIndex: 1,
      imageUrl: IMG('photo-1466978913421-dad2ebd01d17') }, // asian fusion
    { id: 'bas-3', name: 'Aux Deux Amis', category: 'Bar', price: 2, rating: 4.3,
      description: 'Tiny natural wine bar on Oberkampf. Chalkboard menu, packed for a reason.',
      address: '45 Rue Oberkampf, 75011', tags: ['Wine', 'Small plates', 'Natural'], bgIndex: 2,
      imageUrl: IMG('photo-1543007630-9710e4a00a20') }, // small plates
    { id: 'bas-4', name: 'Bistrot Paul Bert', category: 'Restaurant', price: 3, rating: 4.5,
      description: 'Old-school bistro. Steak frites done right, chalkboard menu, cassoulet on Tuesdays.',
      address: '18 Rue Paul Bert, 75011', tags: ['French', 'Classic', 'Bistrot'], bgIndex: 3,
      imageUrl: IMG('photo-1485921325833-c519f76c4927') }, // steak frites
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

// ============================================================
// ACCOMMODATION CATALOG
// ============================================================

export interface AccommodationOpt {
  id: string;
  type: 'hotel' | 'bnb' | 'airbnb' | 'hostel' | 'other';
  name: string;
  pricePerNight: number;
  rating: number;
  description: string;
  address: string;
  amenities: string[];
  imageUrl: string;
  bookingUrl?: string;
}

export const DEMO_ACCOMMODATIONS: AccommodationOpt[] = [
  {
    id: 'acc-h1', type: 'hotel', name: 'Hotel du Petit Moulin',
    pricePerNight: 285, rating: 4.5,
    description: 'Boutique 4-star designed by Christian Lacroix. Each room is unique. Heart of the Marais.',
    address: '29-31 Rue du Poitou, 75003 Paris',
    amenities: ['Free WiFi', 'Breakfast', 'AC', 'Concierge'],
    imageUrl: IMG('photo-1566073771259-6a8506099945'), // hotel room
  },
  {
    id: 'acc-h2', type: 'hotel', name: 'Hotel Jeanne d\'Arc',
    pricePerNight: 165, rating: 4.2,
    description: 'Charming 3-star in the Marais. Clean, quiet, walking distance to everything.',
    address: '3 Rue de Jarente, 75004 Paris',
    amenities: ['Free WiFi', 'Lift', 'Reception 24/7'],
    imageUrl: IMG('photo-1551882547-ff40c63fe5fa'), // hotel exterior
  },
  {
    id: 'acc-a1', type: 'airbnb', name: 'Sunny loft near Bastille',
    pricePerNight: 195, rating: 4.7,
    description: 'Bright 60m² loft on the 4th floor. King bed + sofa bed, full kitchen, washer.',
    address: 'Rue de la Roquette, 75011 Paris',
    amenities: ['Kitchen', 'Washer', 'Self check-in', 'Workspace'],
    imageUrl: IMG('photo-1502672260266-1c1ef2d93688'), // loft
  },
  {
    id: 'acc-a2', type: 'airbnb', name: 'Cozy studio in Republique',
    pricePerNight: 110, rating: 4.4,
    description: 'Compact 25m² studio. Queen bed, kitchenette. Great for two travelers on a budget.',
    address: 'Rue de Lancry, 75010 Paris',
    amenities: ['Kitchenette', 'Self check-in', 'Heating'],
    imageUrl: IMG('photo-1522708323590-d24dbb6b0267'), // studio
  },
  {
    id: 'acc-b1', type: 'bnb', name: 'BnB Le Pavillon',
    pricePerNight: 145, rating: 4.6,
    description: 'Family-run BnB in a 19th-century townhouse. Garden breakfast, host gives walking tour tips.',
    address: 'Rue de Turenne, 75003 Paris',
    amenities: ['Breakfast', 'Garden', 'Host on-site'],
    imageUrl: IMG('photo-1564501049412-61c2a3083791'), // bnb
  },
  {
    id: 'acc-b2', type: 'bnb', name: 'Maison du Canal',
    pricePerNight: 125, rating: 4.5,
    description: 'Quiet BnB along Canal Saint-Martin. Two rooms, shared cozy lounge, vintage decor.',
    address: 'Quai de Valmy, 75010 Paris',
    amenities: ['Breakfast', 'Lounge', 'Free WiFi'],
    imageUrl: IMG('photo-1555854877-bab0e564b8d5'), // bnb cozy
  },
];

export function findAccommodationById(id: string): AccommodationOpt | null {
  return DEMO_ACCOMMODATIONS.find(a => a.id === id) || null;
}
