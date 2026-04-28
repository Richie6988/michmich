import { create } from 'zustand';
import type { Trip, User, Participant, EquityZone } from '@barry/shared-types';

// Mock users for prototype
const MOCK_USERS: User[] = [
  { id: 'u1', email: 'chloe@test.barry', firstName: 'Chloe', lastName: 'Dubois', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.6, defaultMoneyWeight: 0.4, homeLocation: { lat: 48.8867, lng: 2.3399 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u2', email: 'tom@test.barry', firstName: 'Tom', lastName: 'Petit', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.3, defaultMoneyWeight: 0.7, homeLocation: { lat: 48.8915, lng: 2.3522 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u3', email: 'marc@test.barry', firstName: 'Marc', lastName: 'Laurent', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'bike', defaultTimeWeight: 0.5, defaultMoneyWeight: 0.5, homeLocation: { lat: 48.8675, lng: 2.3633 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u4', email: 'sarah@test.barry', firstName: 'Sarah', lastName: 'Martin', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'transit', defaultTimeWeight: 0.7, defaultMoneyWeight: 0.3, homeLocation: { lat: 48.8532, lng: 2.3693 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
  { id: 'u5', email: 'isabelle@test.barry', firstName: 'Isabelle', lastName: 'Bernard', avatarUrl: null, phone: null, locale: 'fr', defaultTransportMode: 'car', defaultTimeWeight: 0.5, defaultMoneyWeight: 0.5, homeLocation: { lat: 48.8421, lng: 2.2945 }, subscriptionTier: 'free', createdAt: new Date().toISOString() },
];

const MOCK_TRIPS: Trip[] = [
  {
    id: 't1', name: 'Diner Vendredi', description: 'On se retrouve pour un diner sympa !', organizerId: 'u1', tripType: 'dinner', status: 'constraints', scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(), stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null, inviteToken: 'abc123', selectedVenueId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    participants: [
      { id: 'p1', tripId: 't1', userId: 'u1', user: MOCK_USERS[0], status: 'constraints_set', transportMode: 'transit', timeWeight: 0.6, moneyWeight: 0.4, maxTime: 45, maxMoney: 5, originLocation: { lat: 48.8867, lng: 2.3399 }, originLabel: 'Montmartre', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p2', tripId: 't1', userId: 'u2', user: MOCK_USERS[1], status: 'constraints_set', transportMode: 'transit', timeWeight: 0.3, moneyWeight: 0.7, maxTime: 40, maxMoney: 3, originLocation: { lat: 48.8915, lng: 2.3522 }, originLabel: 'Porte de Clignancourt', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p3', tripId: 't1', userId: 'u3', user: MOCK_USERS[2], status: 'constraints_set', transportMode: 'bike', timeWeight: 0.5, moneyWeight: 0.5, maxTime: 30, maxMoney: null, originLocation: { lat: 48.8675, lng: 2.3633 }, originLabel: 'Republique', burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
      { id: 'p4', tripId: 't1', userId: 'u4', user: MOCK_USERS[3], status: 'accepted', transportMode: null, timeWeight: 0.5, moneyWeight: 0.5, maxTime: null, maxMoney: null, originLocation: null, originLabel: null, burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
    ],
  },
  {
    id: 't2', name: 'Weekend at Barry\'s', description: 'Un weekend entre potes, Barry trouve la ville !', organizerId: 'u4', tripType: 'weekend', status: 'draft', scheduledAt: new Date(Date.now() + 14 * 86400000).toISOString(), stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null, inviteToken: 'def456', selectedVenueId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    participants: [
      { id: 'p5', tripId: 't2', userId: 'u4', user: MOCK_USERS[3], status: 'accepted', transportMode: null, timeWeight: 0.5, moneyWeight: 0.5, maxTime: null, maxMoney: null, originLocation: null, originLabel: null, burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null },
    ],
  },
];

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;

  // Trips
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (tripId: string) => void;
  createTrip: (name: string, type: string, date: string) => Trip;
  updateTripStatus: (tripId: string, status: Trip['status']) => void;

  // Equity
  equityZones: EquityZone[];
  setEquityZones: (zones: EquityZone[]) => void;
  isCalculating: boolean;
  setCalculating: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: MOCK_USERS[0],
  isAuthenticated: true,
  trips: MOCK_TRIPS,
  activeTrip: null,
  equityZones: [],
  isCalculating: false,

  login: (email) => {
    const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  setActiveTrip: (tripId) => {
    const trip = get().trips.find(t => t.id === tripId) || null;
    set({ activeTrip: trip });
  },

  createTrip: (name, type, date) => {
    const user = get().currentUser!;
    const newTrip: Trip = {
      id: `t${Date.now()}`,
      name,
      description: null,
      organizerId: user.id,
      organizer: user,
      tripType: type as Trip['tripType'],
      status: 'inviting',
      scheduledAt: date,
      stealthMode: false,
      maxTimeBudget: null,
      maxMoneyBudget: null,
      inviteToken: Math.random().toString(36).slice(2, 10),
      selectedVenueId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants: [{
        id: `p${Date.now()}`, tripId: `t${Date.now()}`, userId: user.id, user, status: 'accepted',
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

  setEquityZones: (zones) => set({ equityZones: zones }),
  setCalculating: (v) => set({ isCalculating: v }),
}));
