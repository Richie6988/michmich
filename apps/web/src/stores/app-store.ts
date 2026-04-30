import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Trip, User, EquityZone, ChatMessage, Cagnotte,
  GeoPoint,
  DatePoll, DateVoteResponse,
  Expense, ExpenseCategory, ExpenseSplitMode,
  PinVote, VenueVote, VenueVoteResponse,
  Accommodation, AccommodationType,
  TransportLeg, TransportMode,
  FundsRequest, FundsContribution,
  Reservation,
  BalanceTransaction,
} from '@barry/shared-types';
import { buildShares, computeBalances, computeSettlements } from '@/lib/utils/expenses';
import { findVenueById, venueCostPerPerson } from '@/lib/data/venues';

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
    id: 't1', name: 'Friday Dinner', description: 'Catching up over a nice dinner!',
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
    id: 't2', name: "Weekend at Barry's", description: 'A friend weekend, Barry picks the city!',
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
// MOCK CHAT
// ============================================================

const MOCK_CHATS: Record<string, ChatMessage[]> = {
  t1: [
    { id: 'm1', tripId: 't1', userId: 'u1', user: MOCK_USERS[0], content: 'Hey team! Ready for Friday?', type: 'text', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'm2', tripId: 't1', userId: 'u2', user: MOCK_USERS[1], content: 'Yep, just set my preferences', type: 'text', createdAt: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString() },
    { id: 'm3', tripId: 't1', userId: 'system', user: undefined, content: 'Marc just set his preferences', type: 'system', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'm4', tripId: 't1', userId: 'u3', user: MOCK_USERS[2], content: 'Coming by bike, cannot be too far', type: 'text', createdAt: new Date(Date.now() - 86400000 + 7200000).toISOString() },
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
// MOCK DATE POLLS (Doodle-style)
// ============================================================

const MOCK_POLLS: Record<string, DatePoll> = {
  t1: {
    id: 'poll1',
    tripId: 't1',
    options: [
      { id: 'opt1', date: addDays(2), label: 'Friday evening' },
      { id: 'opt2', date: addDays(3), label: 'Saturday evening' },
      { id: 'opt3', date: addDays(9), label: 'Friday after' },
      { id: 'opt4', date: addDays(10), label: 'Saturday after' },
    ],
    votes: [
      { userId: 'u1', optionId: 'opt1', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u1', optionId: 'opt2', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u1', optionId: 'opt3', response: 'maybe', votedAt: new Date().toISOString() },
      { userId: 'u1', optionId: 'opt4', response: 'no', votedAt: new Date().toISOString() },
      { userId: 'u2', optionId: 'opt1', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u2', optionId: 'opt2', response: 'maybe', votedAt: new Date().toISOString() },
      { userId: 'u2', optionId: 'opt3', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u2', optionId: 'opt4', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u3', optionId: 'opt1', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u3', optionId: 'opt2', response: 'yes', votedAt: new Date().toISOString() },
      { userId: 'u3', optionId: 'opt3', response: 'no', votedAt: new Date().toISOString() },
      { userId: 'u3', optionId: 'opt4', response: 'maybe', votedAt: new Date().toISOString() },
    ],
    status: 'open',
    selectedOptionId: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    closesAt: null,
  },
};

function addDays(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}

// ============================================================
// MOCK EXPENSES (Tricount-style, post-trip)
// ============================================================

const MOCK_EXPENSES: Record<string, Expense[]> = {
  t1: [
    {
      id: 'e1', tripId: 't1', paidBy: 'u1', payer: MOCK_USERS[0],
      description: 'Dinner at Chez Janou', category: 'food',
      amount: 168.50, currency: 'EUR',
      date: new Date(Date.now() - 86400000).toISOString(),
      splitMode: 'equal',
      shares: [
        { userId: 'u1', amount: 42.13 },
        { userId: 'u2', amount: 42.13 },
        { userId: 'u3', amount: 42.12 },
        { userId: 'u4', amount: 42.12 },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'e2', tripId: 't1', paidBy: 'u2', payer: MOCK_USERS[1],
      description: 'Uber back home', category: 'transport',
      amount: 32, currency: 'EUR',
      date: new Date(Date.now() - 86400000).toISOString(),
      splitMode: 'equal',
      shares: [
        { userId: 'u1', amount: 8 },
        { userId: 'u2', amount: 8 },
        { userId: 'u3', amount: 8 },
        { userId: 'u4', amount: 8 },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'e3', tripId: 't1', paidBy: 'u3', payer: MOCK_USERS[2],
      description: 'Drinks at Candelaria', category: 'drinks',
      amount: 64, currency: 'EUR',
      date: new Date(Date.now() - 86400000).toISOString(),
      splitMode: 'equal',
      shares: [
        { userId: 'u1', amount: 16 },
        { userId: 'u2', amount: 16 },
        { userId: 'u3', amount: 16 },
        { userId: 'u4', amount: 16 },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

// ============================================================
// STORE
// ============================================================

interface UserPreferences {
  defaultTransportMode: 'walk' | 'bike' | 'transit' | 'car' | 'train';
  language: 'en' | 'fr' | 'es';
  notifications: boolean;
  homeLocation: GeoPoint | null;
  homeLabel: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'sepa';
  last4?: string;
  brand?: string;
  label: string;
  isDefault: boolean;
}

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;

  // User preferences (persisted to localStorage)
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;

  // Payment & balance
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (pm: Omit<PaymentMethod, 'id'>) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  inAppBalance: number; // EUR available for future trips
  addToBalance: (amount: number) => void;
  spendFromBalance: (amount: number) => void;

  // Geolocation
  userLocation: GeoPoint | null;
  setUserLocation: (loc: GeoPoint | null) => void;

  // Group trips
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (tripId: string) => void;
  createGroupTrip: (
    name: string,
    type: string,
    date: string,
    friendNames?: string[],
    mode?: 'wanderlust' | 'trip',
    endDate?: string,
  ) => Trip;
  updateTripStatus: (tripId: string, status: Trip['status']) => void;
  addParticipantByName: (tripId: string, name: string) => void;
  removeParticipant: (tripId: string, participantId: string) => void;
  updateParticipantConstraints: (tripId: string, userId: string, patch: {
    transportMode?: TransportMode;
    timeWeight?: number;
    moneyWeight?: number;
    maxTime?: number | null;
    maxMoney?: number | null;
    originLocation?: GeoPoint | null;
    originLabel?: string | null;
  }) => void;

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

  // Date polls (Doodle)
  datePolls: Record<string, DatePoll>;
  createDatePoll: (tripId: string, options: { date: string; label?: string }[]) => DatePoll;
  voteDatePoll: (tripId: string, optionId: string, response: DateVoteResponse) => void;
  closeDatePoll: (tripId: string, selectedOptionId: string) => void;
  addDateOption: (tripId: string, date: string) => void;

  // Expenses (Tricount)
  expenses: Record<string, Expense[]>;
  addExpense: (tripId: string, input: {
    description: string;
    amount: number;
    paidBy: string;
    category: ExpenseCategory;
    date: string;
    splitMode: ExpenseSplitMode;
    participantIds: string[];
    customShares?: { userId: string; value: number }[];
  }) => Expense;
  removeExpense: (tripId: string, expenseId: string) => void;
  /** Closes the expense ledger - sends settlements to in-app balance */
  closeExpenseLedger: (tripId: string) => Settlement[];

  // ============================================================
  // JOURNEY: Pin votes (vote on Barry's zones)
  // ============================================================
  pinVotes: Record<string, PinVote[]>;
  pickedZone: Record<string, string | null>;
  voteForPin: (tripId: string, zoneId: string) => void;
  closePinVote: (tripId: string, zoneId: string) => void;

  // Venue votes (vote on bars/restaurants in chosen zone)
  venueVotes: Record<string, VenueVote[]>;
  pickedVenue: Record<string, string | null>;
  voteForVenue: (tripId: string, venueId: string, response: VenueVoteResponse) => void;
  closeVenueVote: (tripId: string, venueId: string) => void;

  // Accommodations (multi-day trips)
  accommodations: Record<string, Accommodation[]>;
  addAccommodation: (tripId: string, input: Omit<Accommodation, 'id' | 'votes' | 'selected'>) => void;
  voteForAccommodation: (tripId: string, accId: string, response: VenueVoteResponse) => void;
  selectAccommodation: (tripId: string, accId: string) => void;

  // Transport legs (per-participant)
  transportLegs: Record<string, TransportLeg[]>;
  initTransportLegs: (tripId: string) => void;
  updateTransportLeg: (tripId: string, participantId: string, patch: Partial<TransportLeg>) => void;

  // Funds request (Kitty 2.0)
  fundsRequests: Record<string, FundsRequest>;
  createFundsRequest: (tripId: string) => FundsRequest;
  payFundsContribution: (tripId: string, contributionId: string, useBalance: boolean) => void;

  // Reservations (final bookings)
  reservations: Record<string, Reservation[]>;
  performBookings: (tripId: string) => Reservation[];

  // Balance history
  balanceTransactions: BalanceTransaction[];

  // Helper for the imported computeSettlements (we re-export for typed Settlement)
  _computeSettlementsTypeRef?: never;
}

// Re-import for use in actions
type Settlement = ReturnType<typeof computeSettlements>[number];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  currentUser: MOCK_USERS[0],
  isAuthenticated: true,
  userLocation: null,
  trips: MOCK_TRIPS,
  activeTrip: null,
  equityZones: [],
  isCalculating: false,
  chats: MOCK_CHATS,
  cagnottes: MOCK_CAGNOTTES,
  datePolls: MOCK_POLLS,
  expenses: MOCK_EXPENSES,

  preferences: {
    defaultTransportMode: 'transit',
    language: 'en',
    notifications: true,
    homeLocation: MOCK_USERS[0].homeLocation,
    homeLabel: 'Home',
  },
  paymentMethods: [],
  inAppBalance: 0,

  updatePreferences: (patch) => set(s => ({ preferences: { ...s.preferences, ...patch } })),

  addPaymentMethod: (pm) => set(s => {
    const id = `pm${Date.now()}`;
    const isFirst = s.paymentMethods.length === 0;
    return {
      paymentMethods: [...s.paymentMethods, { ...pm, id, isDefault: isFirst || pm.isDefault }],
    };
  }),
  removePaymentMethod: (id) => set(s => ({
    paymentMethods: s.paymentMethods.filter(p => p.id !== id),
  })),
  setDefaultPaymentMethod: (id) => set(s => ({
    paymentMethods: s.paymentMethods.map(p => ({ ...p, isDefault: p.id === id })),
  })),
  addToBalance: (amount) => set(s => ({ inAppBalance: Math.round((s.inAppBalance + amount) * 100) / 100 })),
  spendFromBalance: (amount) => set(s => ({
    inAppBalance: Math.max(0, Math.round((s.inAppBalance - amount) * 100) / 100),
  })),

  addParticipantByName: (tripId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set(s => {
      const trip = s.trips.find(t => t.id === tripId);
      if (!trip) return s;
      const newParticipantId = `p${Date.now()}`;
      const guestUserId = `guest-${Date.now()}`;
      const guestUser: User = {
        id: guestUserId,
        email: '',
        firstName: trimmed.split(' ')[0],
        lastName: trimmed.split(' ').slice(1).join(' ') || '',
        avatarUrl: null,
        phone: null,
        locale: 'en',
        defaultTransportMode: 'transit',
        defaultTimeWeight: 0.5,
        defaultMoneyWeight: 0.5,
        homeLocation: null,
        subscriptionTier: 'free',
        createdAt: new Date().toISOString(),
      };
      const updated: Trip = {
        ...trip,
        participants: [
          ...trip.participants,
          {
            id: newParticipantId, tripId, userId: guestUserId, user: guestUser, status: 'invited',
            transportMode: 'transit', timeWeight: 0.5, moneyWeight: 0.5,
            maxTime: null, maxMoney: null, originLocation: null, originLabel: null,
            burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null,
          },
        ],
      };
      return {
        trips: s.trips.map(t => t.id === tripId ? updated : t),
        activeTrip: s.activeTrip?.id === tripId ? updated : s.activeTrip,
      };
    });
  },

  removeParticipant: (tripId, participantId) => set(s => {
    const trip = s.trips.find(t => t.id === tripId);
    if (!trip) return s;
    if (trip.participants.length <= 1) return s; // cannot remove last
    const updated: Trip = {
      ...trip,
      participants: trip.participants.filter(p => p.id !== participantId),
    };
    return {
      trips: s.trips.map(t => t.id === tripId ? updated : t),
      activeTrip: s.activeTrip?.id === tripId ? updated : s.activeTrip,
    };
  }),

  updateParticipantConstraints: (tripId, userId, patch) => set(s => {
    const trip = s.trips.find(t => t.id === tripId);
    if (!trip) return s;
    const updated: Trip = {
      ...trip,
      participants: trip.participants.map(p => {
        if (p.userId !== userId) return p;
        return {
          ...p,
          ...patch,
          status: 'constraints_set' as const,
        };
      }),
    };
    return {
      trips: s.trips.map(t => t.id === tripId ? updated : t),
      activeTrip: s.activeTrip?.id === tripId ? updated : s.activeTrip,
    };
  }),

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

  createGroupTrip: (name, type, date, friendNames, mode, endDate) => {
    const user = get().currentUser!;
    const id = `t${Date.now()}`;
    const orgPart = {
      id: `p${Date.now()}`, tripId: id, userId: user.id, user, status: 'accepted' as const,
      transportMode: user.defaultTransportMode, timeWeight: user.defaultTimeWeight, moneyWeight: user.defaultMoneyWeight,
      maxTime: null, maxMoney: null, originLocation: user.homeLocation, originLabel: 'Home',
      burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null,
    };
    const guestParts = (friendNames || [])
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .map((n, i) => {
        const guestId = `guest-${Date.now()}-${i}`;
        const firstName = n.split(' ')[0];
        const lastName = n.split(' ').slice(1).join(' ') || '';
        const guestUser: User = {
          id: guestId, email: '', firstName, lastName, avatarUrl: null, phone: null,
          locale: 'en', defaultTransportMode: 'transit', defaultTimeWeight: 0.5, defaultMoneyWeight: 0.5,
          homeLocation: null, subscriptionTier: 'free', createdAt: new Date().toISOString(),
        };
        return {
          id: `p${Date.now()}-${i + 1}`, tripId: id, userId: guestId, user: guestUser, status: 'invited' as const,
          transportMode: 'transit' as const, timeWeight: 0.5, moneyWeight: 0.5,
          maxTime: null, maxMoney: null, originLocation: null, originLabel: null,
          burdenScore: null, routeDuration: null, routeDistance: null, routeCost: null, routeGeometry: null, voteVenueId: null,
        };
      });
    const newTrip: Trip = {
      id, name, description: null,
      organizerId: user.id, organizer: user,
      tripType: type as Trip['tripType'],
      mode: mode || 'wanderlust',
      status: 'inviting',
      scheduledAt: date,
      endDate: endDate || null,
      stealthMode: false, maxTimeBudget: null, maxMoneyBudget: null,
      inviteToken: Math.random().toString(36).slice(2, 10),
      selectedVenueId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      participants: [orgPart, ...guestParts],
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

  // ============================================================
  // DATE POLLS (Doodle)
  // ============================================================

  createDatePoll: (tripId, options) => {
    const poll: DatePoll = {
      id: `poll${Date.now()}`,
      tripId,
      options: options.map((o, i) => ({
        id: `opt${Date.now()}-${i}`,
        date: o.date,
        label: o.label,
      })),
      votes: [],
      status: 'open',
      selectedOptionId: null,
      createdAt: new Date().toISOString(),
      closesAt: null,
    };
    set(s => ({ datePolls: { ...s.datePolls, [tripId]: poll } }));
    return poll;
  },

  voteDatePoll: (tripId, optionId, response) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const poll = s.datePolls[tripId];
      if (!poll) return s;
      const otherVotes = poll.votes.filter(v => !(v.userId === userId && v.optionId === optionId));
      const newVotes = [...otherVotes, { userId, optionId, response, votedAt: new Date().toISOString() }];
      // Recompute scores: yes=2, maybe=1, no=0
      const newOptions = poll.options.map(o => {
        const optVotes = newVotes.filter(v => v.optionId === o.id);
        const score = optVotes.reduce((sum, v) =>
          sum + (v.response === 'yes' ? 2 : v.response === 'maybe' ? 1 : 0), 0);
        return { ...o, score };
      });
      return {
        datePolls: { ...s.datePolls, [tripId]: { ...poll, votes: newVotes, options: newOptions } },
      };
    });
  },

  closeDatePoll: (tripId, selectedOptionId) => {
    set(s => {
      const poll = s.datePolls[tripId];
      if (!poll) return s;
      return {
        datePolls: {
          ...s.datePolls,
          [tripId]: { ...poll, status: 'closed' as const, selectedOptionId },
        },
      };
    });
  },

  addDateOption: (tripId, date) => {
    set(s => {
      let poll = s.datePolls[tripId];
      if (!poll) {
        // Create poll on first add
        poll = {
          id: `poll-${tripId}`,
          tripId,
          status: 'open' as const,
          selectedOptionId: null,
          options: [],
          votes: [],
          createdAt: new Date().toISOString(),
        };
      }
      const optionId = `do${Date.now()}`;
      const newOption = { id: optionId, date, score: 0 };
      // Avoid duplicates
      if (poll.options.find(o => o.date === date)) return s;
      return {
        datePolls: {
          ...s.datePolls,
          [tripId]: { ...poll, options: [...poll.options, newOption] },
        },
      };
    });
  },

  // ============================================================
  // EXPENSES (Tricount)
  // ============================================================

  addExpense: (tripId, input) => {
    const trip = get().trips.find(t => t.id === tripId);
    const payerUser = trip?.participants.find(p => p.userId === input.paidBy)?.user;
    const shares = buildShares(input.amount, input.participantIds, input.splitMode, input.customShares);
    const expense: Expense = {
      id: `e${Date.now()}`,
      tripId,
      paidBy: input.paidBy,
      payer: payerUser,
      description: input.description,
      category: input.category,
      amount: input.amount,
      currency: 'EUR',
      date: input.date,
      splitMode: input.splitMode,
      shares,
      createdAt: new Date().toISOString(),
    };
    set(s => ({
      expenses: {
        ...s.expenses,
        [tripId]: [...(s.expenses[tripId] || []), expense],
      },
    }));
    return expense;
  },

  removeExpense: (tripId, expenseId) => {
    set(s => ({
      expenses: {
        ...s.expenses,
        [tripId]: (s.expenses[tripId] || []).filter(e => e.id !== expenseId),
      },
    }));
  },

  closeExpenseLedger: (tripId) => {
    const state = get();
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return [];
    const users = trip.participants.map(p => p.user!).filter(Boolean);
    const tripExpenses = state.expenses[tripId] || [];
    const balances = computeBalances(tripExpenses, users);
    const settlements = computeSettlements(balances);

    // Apply: each settlement transfers from debtor's external pay to creditor's in-app balance
    // For the current user, if they are owed money, credit balance.
    const me = state.currentUser?.id;
    const myCredits = settlements
      .filter(s => s.toUserId === me)
      .reduce((sum, s) => sum + s.amount, 0);

    if (myCredits > 0) {
      const tx: BalanceTransaction = {
        id: `bt${Date.now()}`,
        userId: me!,
        type: 'reimbursement',
        amount: myCredits,
        description: `Reimbursement from "${trip.name}"`,
        tripId,
        createdAt: new Date().toISOString(),
      };
      set(s => ({
        inAppBalance: Math.round((s.inAppBalance + myCredits) * 100) / 100,
        balanceTransactions: [tx, ...s.balanceTransactions],
      }));
    }
    return settlements;
  },

  // ============================================================
  // PIN VOTES
  // ============================================================
  pinVotes: {},
  pickedZone: {},
  voteForPin: (tripId, zoneId) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const existing = (s.pinVotes[tripId] || []).filter(v => v.userId !== userId);
      return {
        pinVotes: {
          ...s.pinVotes,
          [tripId]: [...existing, { userId, zoneId, votedAt: new Date().toISOString() }],
        },
      };
    });
  },
  closePinVote: (tripId, zoneId) => {
    set(s => ({ pickedZone: { ...s.pickedZone, [tripId]: zoneId } }));
  },

  // VENUE VOTES
  venueVotes: {},
  pickedVenue: {},
  voteForVenue: (tripId, venueId, response) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const existing = (s.venueVotes[tripId] || []).filter(v => !(v.userId === userId && v.venueId === venueId));
      return {
        venueVotes: {
          ...s.venueVotes,
          [tripId]: [...existing, { userId, venueId, response, votedAt: new Date().toISOString() }],
        },
      };
    });
  },
  closeVenueVote: (tripId, venueId) => {
    set(s => ({ pickedVenue: { ...s.pickedVenue, [tripId]: venueId } }));
  },

  // ACCOMMODATIONS
  accommodations: {},
  addAccommodation: (tripId, input) => {
    const acc: Accommodation = {
      ...input,
      id: `acc${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      votes: [],
      selected: false,
    };
    set(s => ({
      accommodations: {
        ...s.accommodations,
        [tripId]: [...(s.accommodations[tripId] || []), acc],
      },
    }));
  },
  voteForAccommodation: (tripId, accId, response) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const list = s.accommodations[tripId] || [];
      const updated = list.map(a => {
        if (a.id !== accId) return a;
        const otherVotes = a.votes.filter(v => v.userId !== userId);
        return { ...a, votes: [...otherVotes, { userId, venueId: accId, response, votedAt: new Date().toISOString() }] };
      });
      return { accommodations: { ...s.accommodations, [tripId]: updated } };
    });
  },
  selectAccommodation: (tripId, accId) => {
    set(s => {
      const list = s.accommodations[tripId] || [];
      return {
        accommodations: {
          ...s.accommodations,
          [tripId]: list.map(a => ({ ...a, selected: a.id === accId })),
        },
      };
    });
  },

  // TRANSPORT LEGS
  transportLegs: {},
  initTransportLegs: (tripId) => {
    const state = get();
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return;

    // Use the picked zone (or first zone) as the destination
    const zoneId = state.pickedZone[tripId];
    // Best-effort destination - look in equityZones (last calculation)
    const zone = state.equityZones.find(z => z.id === zoneId);
    const destination: GeoPoint = zone?.center || { lat: 48.8589, lng: 2.3613 }; // Marais default

    const haversine = (a: GeoPoint, b: GeoPoint): number => {
      const R = 6371; // km
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLng = (b.lng - a.lng) * Math.PI / 180;
      const lat1 = a.lat * Math.PI / 180;
      const lat2 = b.lat * Math.PI / 180;
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };

    // Cost per km for each transport mode (EUR)
    const costPerKm: Record<TransportMode, number> = {
      walk: 0,
      bike: 0,
      transit: 0.5, // metro/bus average
      car: 0.85, // fuel + parking
      train: 1.2,
      flight: 8,
    };
    const minCost: Record<TransportMode, number> = {
      walk: 0, bike: 0, transit: 2.10, car: 3, train: 5, flight: 50,
    };

    const legs: TransportLeg[] = trip.participants.map(p => {
      const mode = (p.transportMode || 'transit') as TransportMode;
      const origin = p.originLocation;
      const distanceKm = origin ? haversine(origin, destination) : 5;
      // Round-trip cost
      const rawCost = Math.max(minCost[mode], distanceKm * 2 * costPerKm[mode]);
      const estimatedCost = Math.round(rawCost * 100) / 100;
      return {
        participantId: p.id,
        participantName: p.user?.firstName,
        mode,
        estimatedCost,
        reductionCard: null,
        reductionPct: 0,
        finalCost: estimatedCost,
        selfBooked: false,
        status: 'pending' as const,
      };
    });
    set(s => ({ transportLegs: { ...s.transportLegs, [tripId]: legs } }));
  },
  updateTransportLeg: (tripId, participantId, patch) => {
    set(s => {
      const list = s.transportLegs[tripId] || [];
      return {
        transportLegs: {
          ...s.transportLegs,
          [tripId]: list.map(l => {
            if (l.participantId !== participantId) return l;
            const updated = { ...l, ...patch };
            updated.finalCost = Math.round(updated.estimatedCost * (1 - updated.reductionPct / 100) * 100) / 100;
            return updated;
          }),
        },
      };
    });
  },

  // FUNDS REQUEST
  fundsRequests: {},
  createFundsRequest: (tripId) => {
    const state = get();
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) {
      // Build dummy
      return {
        id: `fr${Date.now()}`, tripId, totalAmount: 0,
        breakdown: { venues: 0, accommodation: 0, transport: 0, other: 0 },
        contributions: [],
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        closedAt: null,
      };
    }
    const accs = state.accommodations[tripId] || [];
    const selectedAcc = accs.find(a => a.selected);
    const accommodationCost = selectedAcc ? selectedAcc.totalPrice : 0;
    const legs = state.transportLegs[tripId] || [];
    const transportCost = legs.filter(l => !l.selfBooked).reduce((s, l) => s + l.finalCost, 0);
    const venueId = state.pickedVenue[tripId];
    const venue = venueId ? findVenueById(venueId) : null;
    const venuePerPerson = venue ? venueCostPerPerson(venue) : 35;
    const venueCost = venueId ? trip.participants.length * venuePerPerson : 0;
    const total = accommodationCost + transportCost + venueCost;

    // Don't persist empty requests
    if (total === 0) {
      return {
        id: `fr-empty`, tripId, totalAmount: 0,
        breakdown: { venues: 0, accommodation: 0, transport: 0, other: 0 },
        contributions: [],
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        closedAt: null,
      };
    }

    const perPerson = trip.participants.length ? Math.ceil(total / trip.participants.length) : 0;

    const fr: FundsRequest = {
      id: `fr${Date.now()}`, tripId, totalAmount: total,
      breakdown: {
        venues: venueCost,
        accommodation: accommodationCost,
        transport: transportCost,
        other: 0,
      },
      contributions: trip.participants.map(p => ({
        id: `fc${Date.now()}-${p.id}`,
        userId: p.userId,
        user: p.user,
        amount: perPerson,
        paidFromBalance: 0,
        paidFromCard: 0,
        status: 'pending' as const,
        paidAt: null,
      })),
      status: 'open',
      createdAt: new Date().toISOString(),
      closedAt: null,
    };
    set(s => ({ fundsRequests: { ...s.fundsRequests, [tripId]: fr } }));
    return fr;
  },
  payFundsContribution: (tripId, contributionId, useBalance) => {
    set(s => {
      const fr = s.fundsRequests[tripId];
      if (!fr) return s;
      const contribution = fr.contributions.find(c => c.id === contributionId);
      if (!contribution) return s;

      const me = s.currentUser?.id;
      const isMe = contribution.userId === me;
      let fromBalance = 0;
      let newAppBalance = s.inAppBalance;
      let txList = s.balanceTransactions;

      if (isMe && useBalance) {
        fromBalance = Math.min(s.inAppBalance, contribution.amount);
        newAppBalance = Math.round((s.inAppBalance - fromBalance) * 100) / 100;
        if (fromBalance > 0) {
          txList = [
            {
              id: `bt${Date.now()}`,
              userId: me!,
              type: 'spend' as const,
              amount: -fromBalance,
              description: `Trip contribution`,
              tripId,
              createdAt: new Date().toISOString(),
            },
            ...s.balanceTransactions,
          ];
        }
      }

      const fromCard = contribution.amount - fromBalance;

      const updatedContrib: FundsContribution = {
        ...contribution,
        paidFromBalance: fromBalance,
        paidFromCard: fromCard,
        status: 'paid' as const,
        paidAt: new Date().toISOString(),
      };
      const updatedFR: FundsRequest = {
        ...fr,
        contributions: fr.contributions.map(c => c.id === contributionId ? updatedContrib : c),
      };
      // Status
      const allPaid = updatedFR.contributions.every(c => c.status === 'paid');
      const somePaid = updatedFR.contributions.some(c => c.status === 'paid');
      updatedFR.status = allPaid ? 'complete' : somePaid ? 'partial' : 'open';

      return {
        fundsRequests: { ...s.fundsRequests, [tripId]: updatedFR },
        inAppBalance: newAppBalance,
        balanceTransactions: txList,
      };
    });
  },

  // RESERVATIONS
  reservations: {},
  performBookings: (tripId) => {
    const state = get();
    const accs = state.accommodations[tripId] || [];
    const selectedAcc = accs.find(a => a.selected);
    const venueId = state.pickedVenue[tripId];
    const legs = state.transportLegs[tripId] || [];

    const reservations: Reservation[] = [];

    if (venueId) {
      const venue = findVenueById(venueId);
      const perPerson = venue ? venueCostPerPerson(venue) : 35;
      reservations.push({
        id: `r${Date.now()}-v`,
        tripId, type: 'venue',
        reference: venueId,
        description: venue ? `${venue.name} - ${venue.category}` : 'Restaurant / Bar reservation',
        amount: (state.trips.find(t => t.id === tripId)?.participants.length || 1) * perPerson,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        confirmationCode: 'BR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      });
    }
    if (selectedAcc) {
      reservations.push({
        id: `r${Date.now()}-a`,
        tripId, type: 'accommodation',
        reference: selectedAcc.id,
        description: selectedAcc.name,
        amount: selectedAcc.totalPrice,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        confirmationCode: 'BR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      });
    }
    legs.filter(l => !l.selfBooked).forEach((l, i) => {
      reservations.push({
        id: `r${Date.now()}-t${i}`,
        tripId, type: 'transport',
        reference: l.participantId,
        description: `Transport for ${l.participantName} (${l.mode})`,
        amount: l.finalCost,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        confirmationCode: 'BR-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      });
    });

    set(s => ({
      reservations: { ...s.reservations, [tripId]: reservations },
      trips: s.trips.map(t => t.id === tripId ? { ...t, status: 'booked' as const } : t),
    }));
    return reservations;
  },

  balanceTransactions: [],
    }),
    {
      name: 'barry-app-state',
      version: 2, // bump when persisted shape changes
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : undefined as any)),
      // Only persist user-controlled data, NOT mock trips/chats
      partialize: (state) => ({
        preferences: state.preferences,
        paymentMethods: state.paymentMethods,
        inAppBalance: state.inAppBalance,
        balanceTransactions: state.balanceTransactions,
      }),
      // Migrate older versions
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) return persistedState;
        // v0/v1 -> v2: ensure balanceTransactions array exists
        if (version < 2) {
          persistedState.balanceTransactions = persistedState.balanceTransactions || [];
          persistedState.paymentMethods = persistedState.paymentMethods || [];
          persistedState.inAppBalance = persistedState.inAppBalance ?? 0;
        }
        return persistedState;
      },
      // Don't try to read storage during SSR (avoids hydration mismatch)
      skipHydration: false,
    },
  ),
);
