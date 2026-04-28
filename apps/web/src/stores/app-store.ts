import { create } from 'zustand';
import type {
  Trip, User, EquityZone, ChatMessage, Cagnotte,
  SoloTrip, SoloDestination, Venue, TripMode, GeoPoint,
} from '@barry/shared-types';

// ============================================================
// MOCK USERS
// ============================================================

const MOCK_USERS: User[] = [
  { id: 'u1', email: 'chloe@test.barry', firstName: 'Chloe', lastName: 'Dubois', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.6, defaultMoneyWeight: 0.4, homeLocation: { lat: 48.8867, lng: 2.3399 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u2', email: 'tom@test.barry', firstName: 'Tom', lastName: 'Petit', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.3, defaultMoneyWeight: 0.7, homeLocation: { lat: 48.8915, lng: 2.3522 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u3', email: 'marc@test.barry', firstName: 'Marc', lastName: 'Laurent', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'bike', defaultTimeWeight: 0.5, defaultMoneyWeight: 0.5, homeLocation: { lat: 48.8675, lng: 2.3633 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u4', email: 'sarah@test.barry', firstName: 'Sarah', lastName: 'Martin', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.7, defaultMoneyWeight: 0.3, homeLocation: { lat: 48.8532, lng: 2.3693 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u5', email: 'isabelle@test.barry', firstName: 'Isabelle', lastName: 'Bernard', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'car', defaultTimeWeight: 0.5, defaultMoneyWeight: 0.5, homeLocation: { lat: 48.8421, lng: 2.2945 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
];

// ============================================================
// MOCK GROUP TRIPS
// ============================================================

const MOCK_TRIPS: Trip[] = [
  {
    id: 't1', name: 'Diner Vendredi', description: 'On se retrouve pour un diner sympa !',
    organizerId: 'u1', organizer: MOCK_USERS[0],
    tripType: 'dinner', status: 'constraints',
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null,
    inviteToken: 'abc123', selectedVenueId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    participants: [
      { id: 'p1', tripId: 't1', userId: 'u1', user: MOCK_USERS[0], status: 'constraints_set', transportMode: 'transit', timeWeight: 0.6, moneyWeight: 0.4, maxTime: 45, maxMoney: 5, originLocation: { lat: 48.8867, lng: 2.3399 }, originLabel: 'Montmartre', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p2', tripId: 't1', userId: 'u2', user: MOCK_USERS[1], status: 'constraints_set', transportMode: 'transit', timeWeight: 0.3, moneyWeight: 0.7, maxTime: 40, maxMoney: 3, originLocation: { lat: 48.8915, lng: 2.3522 }, originLabel: 'Clignancourt', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p3', tripId: 't1', userId: 'u3', user: MOCK_USERS[2], status: 'constraints_set', transportMode: 'bike', timeWeight: 0.5, moneyWeight: 0.5, maxTime: 30, maxMoney: null, originLocation: { lat: 48.8675, lng: 2.3633 }, originLabel: 'Republique', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p4', tripId: 't1', userId: 'u4', user: MOCK_USERS[3], status: 'accepted', transportMode: null, timeWeight: 0.5, moneyWeight: 0.5, maxTime: null, maxMoney: null, originLocation: null, originLabel: null, burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
    ],
  },
  {
    id: 't2', name: "Weekend at Barry's", description: 'Un weekend entre potes, Barry trouve la ville !',
    organizerId: 'u4', organizer: MOCK_USERS[3],
    tripType: 'weekend', status: 'draft',
    scheduledAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null,
    inviteToken: 'def456', selectedVenueId: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    participants: [
      { id: 'p5', tripId: 't2', userId: 'u4', user: MOCK_USERS[3], status: 'accepted', transportMode: null, timeWeight: 0.5, moneyWeight: 0.5, maxTime: null, maxMoney: null, originLocation: null, originLabel: null, burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
    ],
  },
];

// ============================================================
// MOCK SOLO TRIPS — what to do around me
// ============================================================

const PARIS_VENUES: Venue[] = [
  { id: 'v1', name: 'Chez Janou', category: 'restaurant', location: { lat: 48.8571, lng: 2.3651 }, address: { street: '2 Rue Roger Verlomme', city: 'Paris', zip: '75003' }, description: 'Bistrot mythique, mousse au chocolat legendaire', priceLevel: 2, rating: 4.4, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v2', name: 'Le Perchoir', category: 'bar', location: { lat: 48.8643, lng: 2.3588 }, address: { street: '33 Rue de la Verrerie', city: 'Paris', zip: '75004' }, description: 'Rooftop avec vue sur les toits de Paris', priceLevel: 3, rating: 4.1, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v3', name: 'Breizh Cafe', category: 'restaurant', location: { lat: 48.8611, lng: 2.3610 }, address: { street: '109 Rue Vieille du Temple', city: 'Paris', zip: '75003' }, description: 'Les meilleures crepes de Paris', priceLevel: 2, rating: 4.3, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v4', name: 'Place des Vosges', category: 'park', location: { lat: 48.8557, lng: 2.3655 }, address: { street: 'Place des Vosges', city: 'Paris', zip: '75004' }, description: 'Plus ancienne place planifiee de Paris', priceLevel: 1, rating: 4.8, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v5', name: 'Musee Carnavalet', category: 'museum', location: { lat: 48.8575, lng: 2.3621 }, address: { street: '23 Rue de Sevigne', city: 'Paris', zip: '75003' }, description: "Histoire de Paris a travers les ages", priceLevel: 1, rating: 4.6, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v6', name: 'Candelaria', category: 'bar', location: { lat: 48.8630, lng: 2.3647 }, address: { street: '52 Rue de Saintonge', city: 'Paris', zip: '75003' }, description: 'Speakeasy mexicain, mezcal et tacos', priceLevel: 2, rating: 4.5, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v7', name: 'Hotel du Petit Moulin', category: 'hotel', location: { lat: 48.8638, lng: 2.3618 }, address: { street: '29 Rue du Poitou', city: 'Paris', zip: '75003' }, description: "Hotel boutique design Christian Lacroix", priceLevel: 3, rating: 4.3, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
  { id: 'v8', name: 'Escape Hunt', category: 'activity', location: { lat: 48.8706, lng: 2.3480 }, address: { street: '44 Rue Richer', city: 'Paris', zip: '75009' }, description: 'Escape rooms scenarios immersifs', priceLevel: 2, rating: 4.4, phone: null, website: null, photos: [], coverPhotoUrl: null, accessibility: {} },
];

// ============================================================
// MOCK CHAT
// ============================================================

const MOCK_CHATS: Record<string, ChatMessage[]> = {
  t1: [
    { id: 'm1', tripId: 't1', userId: 'u1', user: MOCK_USERS[0], content: 'Salut la team ! Pret pour vendredi ?', type: 'text', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'm2', tripId: 't1', userId: 'u2', user: MOCK_USERS[1], content: 'Carrement, j\'ai mis mes contraintes', type: 'text', createdAt: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString() },
    { id: 'm3', tripId: 't1', userId: 'system', user: undefined, content: 'Marc a defini ses contraintes', type: 'system', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'm4', tripId: 't1', userId: 'u3', user: MOCK_USERS[2], content: 'Je viens en velo, faut pas que ca soit trop loin', type: 'text', createdAt: new Date(Date.now() - 86400000 + 7200000).toISOString() },
  ],
};

// ============================================================
// MOCK CAGNOTTES
// ============================================================

const MOCK_CAGNOTTES: Record<string, Cagnotte> = {
  t1: {
    id: 'cag1', tripId: 't1',
    totalTarget: 180, collected: 90,
    status: 'open',
    createdAt: new Date().toISOString(),
    contributions: [
      { id: 'c1', cagnotteId: 'cag1', userId: 'u1', user: MOCK_USERS[0], amount: 45, status: 'paid', paidAt: new Date().toISOString() },
      { id: 'c2', cagnotteId: 'cag1', userId: 'u2', user: MOCK_USERS[1], amount: 45, status: 'paid', paidAt: new Date().toISOString() },
      { id: 'c3', cagnotteId: 'cag1', userId: 'u3', user: MOCK_USERS[2], amount: 45, status: 'pending', paidAt: null },
      { id: 'c4', cagnotteId: 'cag1', userId: 'u4', user: MOCK_USERS[3], amount: 45, status: 'pending', paidAt: null },
    ],
  },
};

// ============================================================
// HELPERS
// ============================================================

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const aH = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aH), Math.sqrt(1 - aH));
}

function generateSoloDestinations(origin: GeoPoint, modes: string[], maxTime: number, maxBudget: number): SoloDestination[] {
  const speeds: Record<string, number> = { walk: 5, bike: 15, transit: 25, car: 35, train: 80 };
  const costs: Record<string, number> = { walk: 0, bike: 0, transit: 0.06, car: 0.15, train: 0.10 };

  return PARIS_VENUES.map(venue => {
    const distKm = haversineKm(origin, venue.location) * 1.35; // detour factor
    const durations: Record<string, number> = {};
    const costsByMode: Record<string, number> = {};
    let bestDuration = Infinity;
    let bestCost = Infinity;

    for (const mode of modes) {
      const dur = (distKm / speeds[mode]) * 60;
      const cost = distKm * costs[mode];
      durations[mode] = Math.round(dur);
      costsByMode[mode] = Math.round(cost * 100) / 100;
      if (dur < bestDuration) bestDuration = dur;
      if (cost < bestCost) bestCost = cost;
    }

    // Match score: how well it fits the constraints
    const timeFit = bestDuration <= maxTime ? (1 - bestDuration / maxTime) * 100 : 0;
    const budgetFit = bestCost <= maxBudget ? (1 - bestCost / Math.max(maxBudget, 1)) * 100 : 0;
    const ratingBoost = (venue.rating || 0) * 5;
    const matchScore = Math.min(100, Math.round((timeFit * 0.4 + budgetFit * 0.3 + ratingBoost * 0.3)));

    const highlights: string[] = [];
    if (venue.rating && venue.rating >= 4.5) highlights.push('Tres bien note');
    if (bestCost === 0) highlights.push('Gratuit');
    else if (bestCost < 3) highlights.push('Pas cher');
    if (bestDuration <= 15) highlights.push('Rapide');
    if (venue.priceLevel === 1) highlights.push('Budget-friendly');
    if (venue.category === 'park' || venue.category === 'museum') highlights.push('Culture');

    return {
      id: `dest-${venue.id}`,
      venue,
      distanceKm: Math.round(distKm * 10) / 10,
      durations: durations as Record<string, number>,
      costs: costsByMode as Record<string, number>,
      matchScore,
      highlights,
    };
  })
  .filter(d => Object.values(d.durations).some(t => t <= maxTime))
  .sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================
// STORE
// ============================================================

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;

  // Geolocation
  userLocation: GeoPoint | null;
  setUserLocation: (loc: GeoPoint | null) => void;

  // Group trips
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (tripId: string) => void;
  createGroupTrip: (name: string, type: string, date: string) => Trip;
  updateTripStatus: (tripId: string, status: Trip['status']) => void;

  // Solo trips
  soloTrips: SoloTrip[];
  activeSoloTrip: SoloTrip | null;
  setActiveSoloTrip: (id: string) => void;
  createSoloTrip: (input: { name: string; origin: GeoPoint; originLabel: string; modes: string[]; maxTime: number; maxBudget: number }) => SoloTrip;

  // Equity zones
  equityZones: EquityZone[];
  setEquityZones: (zones: EquityZone[]) => void;
  isCalculating: boolean;
  setCalculating: (v: boolean) => void;

  // Chat
  chats: Record<string, ChatMessage[]>;
  sendMessage: (tripId: string, content: string) => void;

  // Cagnotte
  cagnottes: Record<string, Cagnotte>;
  payContribution: (tripId: string, contributionId: string) => void;
  initCagnotte: (tripId: string, totalAmount: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: MOCK_USERS[0],
  isAuthenticated: true,
  userLocation: null,
  trips: MOCK_TRIPS,
  activeTrip: null,
  soloTrips: [],
  activeSoloTrip: null,
  equityZones: [],
  isCalculating: false,
  chats: MOCK_CHATS,
  cagnottes: MOCK_CAGNOTTES,

  login: (email) => {
    const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  setUserLocation: (loc) => set({ userLocation: loc }),

  setActiveTrip: (tripId) => {
    const trip = get().trips.find(t => t.id === tripId) || null;
    set({ activeTrip: trip });
  },

  createGroupTrip: (name, type, date) => {
    const user = get().currentUser!;
    const id = `t${Date.now()}`;
    const newTrip: Trip = {
      id, name, description: null,
      organizerId: user.id, organizer: user,
      tripType: type as Trip['tripType'], status: 'inviting',
      scheduledAt: date,
      stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null,
      inviteToken: Math.random().toString(36).slice(2, 10),
      selectedVenueId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      participants: [{
        id: `p${Date.now()}`, tripId: id, userId: user.id, user, status: 'accepted',
        transportMode: user.defaultTransportMode, timeWeight: user.defaultTimeWeight, moneyWeight: user.defaultMoneyWeight,
        maxTime: null, maxMoney: null, originLocation: user.homeLocation, originLabel: 'Domicile',
        burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null,
      }],
    };
    set(s => ({ trips: [newTrip, ...s.trips], activeTrip: newTrip }));
    return newTrip;
  },

  updateTripStatus: (tripId, status) => {
    set(s => ({
      trips: s.trips.map(t => t.id === tripId ? { ...t, status } : t),
      activeTrip: s.activeTrip?.id === tripId ? { ...s.activeTrip, status } : s.activeTrip,
    }));
  },

  setActiveSoloTrip: (id) => {
    const t = get().soloTrips.find(s => s.id === id) || null;
    set({ activeSoloTrip: t });
  },

  createSoloTrip: ({ name, origin, originLabel, modes, maxTime, maxBudget }) => {
    const user = get().currentUser!;
    const id = `s${Date.now()}`;
    const destinations = generateSoloDestinations(origin, modes, maxTime, maxBudget);
    const trip: SoloTrip = {
      id, userId: user.id, name,
      origin, originLabel,
      modes: modes as any,
      maxTime, maxBudget,
      category: 'all',
      createdAt: new Date().toISOString(),
      destinations,
    };
    set(s => ({ soloTrips: [trip, ...s.soloTrips], activeSoloTrip: trip }));
    return trip;
  },

  setEquityZones: (zones) => set({ equityZones: zones }),
  setCalculating: (v) => set({ isCalculating: v }),

  sendMessage: (tripId, content) => {
    const user = get().currentUser!;
    const msg: ChatMessage = {
      id: `m${Date.now()}`, tripId, userId: user.id, user,
      content, type: 'text', createdAt: new Date().toISOString(),
    };
    set(s => ({
      chats: { ...s.chats, [tripId]: [...(s.chats[tripId] || []), msg] },
    }));
  },

  payContribution: (tripId, contributionId) => {
    set(s => {
      const cag = s.cagnottes[tripId];
      if (!cag) return s;
      const updatedContribs = cag.contributions.map(c =>
        c.id === contributionId ? { ...c, status: 'paid' as const, paidAt: new Date().toISOString() } : c
      );
      const collected = updatedContribs.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
      return {
        cagnottes: {
          ...s.cagnottes,
          [tripId]: { ...cag, contributions: updatedContribs, collected },
        },
      };
    });
  },

  initCagnotte: (tripId, totalAmount) => {
    const trip = get().trips.find(t => t.id === tripId);
    if (!trip) return;
    const perPerson = Math.ceil(totalAmount / trip.participants.length);
    const cag: Cagnotte = {
      id: `cag${Date.now()}`, tripId,
      totalTarget: totalAmount, collected: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
      contributions: trip.participants.map(p => ({
        id: `c${Date.now()}-${p.userId}`,
        cagnotteId: `cag${Date.now()}`,
        userId: p.userId, user: p.user,
        amount: perPerson,
        status: 'pending' as const,
        paidAt: null,
      })),
    };
    set(s => ({ cagnottes: { ...s.cagnottes, [tripId]: cag } }));
  },
}));
