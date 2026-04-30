// ============================================================
// ACTIVITIES CATALOG
// Things to do during a trip or wanderlust outing
// ============================================================

export interface ActivityOpt {
  id: string;
  name: string;
  category: 'cultural' | 'outdoor' | 'food' | 'wellness' | 'nightlife' | 'sports';
  /** Where: 'wanderlust' = same-day, 'trip' = part of multi-day stay, 'both' */
  scope: 'wanderlust' | 'trip' | 'both';
  duration: string; // e.g. '2h', 'Half day'
  pricePerPerson: number; // EUR
  rating: number;
  description: string;
  address: string;
  imageUrl: string;
  zoneIds?: string[]; // optional zone affinity for filtering
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop&q=70`;

export const ACTIVITIES_CATALOG: ActivityOpt[] = [
  // CULTURAL
  {
    id: 'act-musee-orsay', name: 'Musée d\'Orsay', category: 'cultural', scope: 'both',
    duration: '2h', pricePerPerson: 16, rating: 4.7,
    description: 'World-class collection of Impressionist and Post-Impressionist masterpieces in a former railway station.',
    address: 'Esplanade Valéry Giscard d\'Estaing, 75007 Paris',
    imageUrl: IMG('photo-1564399579883-451a5d44ec08'),
  },
  {
    id: 'act-louvre', name: 'Louvre Highlights Tour', category: 'cultural', scope: 'both',
    duration: '3h', pricePerPerson: 45, rating: 4.6,
    description: 'Skip-the-line guided tour of the Louvre\'s greatest hits including the Mona Lisa.',
    address: 'Rue de Rivoli, 75001 Paris',
    imageUrl: IMG('photo-1499856871958-5b9627545d1a'),
  },
  {
    id: 'act-catacombes', name: 'Catacombs of Paris', category: 'cultural', scope: 'both',
    duration: '1h30', pricePerPerson: 29, rating: 4.4,
    description: 'Eerie underground ossuary holding the remains of more than 6 million Parisians.',
    address: '1 Avenue du Colonel Henri Rol-Tanguy, 75014 Paris',
    imageUrl: IMG('photo-1551431009-a802eeec77b1'),
  },

  // OUTDOOR
  {
    id: 'act-seine-cruise', name: 'Sunset Seine Cruise', category: 'outdoor', scope: 'both',
    duration: '1h', pricePerPerson: 18, rating: 4.5,
    description: 'Glide past Notre-Dame, the Louvre and the Eiffel Tower as the sun sets.',
    address: 'Pont Neuf, 75001 Paris',
    imageUrl: IMG('photo-1502602898657-3e91760cbb34'),
  },
  {
    id: 'act-bike-tour', name: 'Bike tour of hidden Paris', category: 'outdoor', scope: 'both',
    duration: '3h', pricePerPerson: 38, rating: 4.8,
    description: 'Discover hidden passages, secret gardens and quirky cafés on two wheels.',
    address: '24 Rue Edgar Faure, 75015 Paris',
    imageUrl: IMG('photo-1532375810709-75b1da00537c'),
  },
  {
    id: 'act-luxembourg', name: 'Picnic at Jardin du Luxembourg', category: 'outdoor', scope: 'both',
    duration: 'Flexible', pricePerPerson: 12, rating: 4.7,
    description: 'Pre-arranged picnic basket from a local épicerie. Find a chair, watch the boats.',
    address: 'Jardin du Luxembourg, 75006 Paris',
    imageUrl: IMG('photo-1524499982521-1ffd58dd89ea'),
  },

  // FOOD (wanderlust-friendly)
  {
    id: 'act-cooking-class', name: 'French Cooking Class', category: 'food', scope: 'both',
    duration: '3h', pricePerPerson: 95, rating: 4.9,
    description: 'Learn to make a 3-course French meal with a chef. Eat what you cook, with wine pairing.',
    address: '17 Rue Notre-Dame de Bonne Nouvelle, 75002 Paris',
    imageUrl: IMG('photo-1556909114-f6e7ad7d3136'),
  },
  {
    id: 'act-wine-tasting', name: 'Wine tasting in a cellar', category: 'food', scope: 'both',
    duration: '1h30', pricePerPerson: 45, rating: 4.7,
    description: 'Taste 6 wines from across France in an old vaulted cellar. Sommelier explains each.',
    address: '7 Rue de Trévise, 75009 Paris',
    imageUrl: IMG('photo-1510812431401-41d2bd2722f3'),
  },
  {
    id: 'act-cheese-tour', name: 'Cheese & charcuterie walking tour', category: 'food', scope: 'both',
    duration: '2h30', pricePerPerson: 65, rating: 4.6,
    description: 'Walk Le Marais sampling artisan cheeses, cured meats, baguette. Three stops.',
    address: 'Rue de Bretagne starting point, 75003 Paris',
    imageUrl: IMG('photo-1452195100486-9cc805987862'),
  },

  // WELLNESS (trip-friendly)
  {
    id: 'act-spa', name: 'Spa & hammam afternoon', category: 'wellness', scope: 'trip',
    duration: '3h', pricePerPerson: 75, rating: 4.5,
    description: 'Traditional hammam + scrub + tea. A genuine reset between busy days.',
    address: '39 Rue Saint-Honoré, 75001 Paris',
    imageUrl: IMG('photo-1544161515-4ab6ce6db874'),
  },

  // NIGHTLIFE (wanderlust)
  {
    id: 'act-jazz-club', name: 'Jazz at Caveau de la Huchette', category: 'nightlife', scope: 'wanderlust',
    duration: '3h', pricePerPerson: 18, rating: 4.6,
    description: 'Iconic jazz cellar with live swing band. Dance floor, low ceilings, real Paris.',
    address: '5 Rue de la Huchette, 75005 Paris',
    imageUrl: IMG('photo-1493225457124-a3eb161ffa5f'),
  },
  {
    id: 'act-cabaret', name: 'Cabaret Show with dinner', category: 'nightlife', scope: 'both',
    duration: '4h', pricePerPerson: 165, rating: 4.4,
    description: 'Classic Parisian cabaret with feathered dancers and 3-course dinner.',
    address: 'Rue Pigalle, 75009 Paris',
    imageUrl: IMG('photo-1514525253161-7a46d19cd819'),
  },

  // SPORTS / outdoor active (trip)
  {
    id: 'act-hiking', name: 'Day hike at Fontainebleau', category: 'sports', scope: 'trip',
    duration: 'Full day', pricePerPerson: 25, rating: 4.8,
    description: 'Train to Fontainebleau, hike through the famous boulder fields and forest.',
    address: 'Fontainebleau forest, 60km south of Paris',
    imageUrl: IMG('photo-1551632811-561732d1e306'),
  },
  {
    id: 'act-padel', name: 'Padel court rental', category: 'sports', scope: 'wanderlust',
    duration: '1h30', pricePerPerson: 22, rating: 4.5,
    description: 'Court for 4 + rackets and balls included. The fastest-growing sport in France.',
    address: '5 Avenue de la Porte Brunet, 75019 Paris',
    imageUrl: IMG('photo-1554068865-24cecd4e34b8'),
  },
];

/** Filter activities by trip mode */
export function activitiesForMode(mode: 'wanderlust' | 'trip'): ActivityOpt[] {
  return ACTIVITIES_CATALOG.filter(a => a.scope === mode || a.scope === 'both');
}

/** Find activity by id */
export function findActivityById(id: string): ActivityOpt | null {
  return ACTIVITIES_CATALOG.find(a => a.id === id) || null;
}

// ============================================================
// CAR RENTAL CATALOG (trip mode only)
// ============================================================

export interface CarRentalOpt {
  id: string;
  brand: string; // e.g. 'Hertz', 'Europcar'
  carModel: string; // e.g. 'Renault Clio', 'Peugeot 3008'
  category: 'compact' | 'midsize' | 'suv' | 'van' | 'electric';
  pricePerDay: number;
  rating: number;
  seats: number;
  transmission: 'manual' | 'automatic';
  fuel: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  description: string;
  pickupLocation: string;
  imageUrl: string;
}

export const CAR_RENTAL_CATALOG: CarRentalOpt[] = [
  {
    id: 'car-clio', brand: 'Hertz', carModel: 'Renault Clio', category: 'compact',
    pricePerDay: 45, rating: 4.3, seats: 5, transmission: 'manual', fuel: 'petrol',
    description: 'Compact and fuel-efficient. Easy to park anywhere in town.',
    pickupLocation: 'Gare de Lyon, Paris',
    imageUrl: IMG('photo-1583121274602-3e2820c69888'),
  },
  {
    id: 'car-208', brand: 'Europcar', carModel: 'Peugeot 208', category: 'compact',
    pricePerDay: 42, rating: 4.4, seats: 5, transmission: 'manual', fuel: 'petrol',
    description: 'Stylish little hatchback. Decent boot for two suitcases.',
    pickupLocation: 'Gare du Nord, Paris',
    imageUrl: IMG('photo-1494976388531-d1058494cdd8'),
  },
  {
    id: 'car-3008', brand: 'Sixt', carModel: 'Peugeot 3008', category: 'suv',
    pricePerDay: 79, rating: 4.6, seats: 5, transmission: 'automatic', fuel: 'diesel',
    description: 'Roomy SUV. Great for road trips with luggage and four passengers.',
    pickupLocation: 'CDG Airport, Paris',
    imageUrl: IMG('photo-1568844293986-8d0400bd4745'),
  },
  {
    id: 'car-tesla', brand: 'Hertz', carModel: 'Tesla Model 3', category: 'electric',
    pricePerDay: 110, rating: 4.7, seats: 5, transmission: 'automatic', fuel: 'electric',
    description: 'All-electric, autopilot, free Supercharger access. Zero fuel cost.',
    pickupLocation: 'Orly Airport, Paris',
    imageUrl: IMG('photo-1560958089-b8a1929cea89'),
  },
  {
    id: 'car-traffic', brand: 'Avis', carModel: 'Renault Traffic', category: 'van',
    pricePerDay: 95, rating: 4.2, seats: 9, transmission: 'manual', fuel: 'diesel',
    description: 'Nine-seater van. Perfect for the whole group plus all the gear.',
    pickupLocation: 'Gare Montparnasse, Paris',
    imageUrl: IMG('photo-1494976388901-7509ef3d9d12'),
  },
  {
    id: 'car-cmax', brand: 'Europcar', carModel: 'Citroën C4 SpaceTourer', category: 'midsize',
    pricePerDay: 68, rating: 4.4, seats: 7, transmission: 'automatic', fuel: 'hybrid',
    description: 'Family-sized hybrid. Sliding doors, three rows of seats.',
    pickupLocation: 'Gare de l\'Est, Paris',
    imageUrl: IMG('photo-1502877338535-766e1452684a'),
  },
];

export function findCarRentalById(id: string): CarRentalOpt | null {
  return CAR_RENTAL_CATALOG.find(c => c.id === id) || null;
}
