import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Trip, User, EquityZone, ChatMessage, Cagnotte,
  GeoPoint,
  DatePoll, DateVoteResponse,
  Expense, ExpenseCategory, ExpenseSplitMode,
} from '@barry/shared-types';
import { buildShares } from '@/lib/utils/expenses';

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
  createGroupTrip: (name: string, type: string, date: string, friendNames?: string[]) => Trip;
  updateTripStatus: (tripId: string, status: Trip['status']) => void;
  addParticipantByName: (tripId: string, name: string) => void;
  removeParticipant: (tripId: string, participantId: string) => void;

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
}

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

  createGroupTrip: (name, type, date, friendNames) => {
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
      tripType: type as Trip['tripType'], status: 'inviting',
      scheduledAt: date,
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
      return {
        datePolls: { ...s.datePolls, [tripId]: { ...poll, votes: newVotes } },
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
    }),
    {
      name: 'barry-app-state',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : undefined as any)),
      // Only persist user-controlled data, NOT mock trips/chats
      partialize: (state) => ({
        preferences: state.preferences,
        paymentMethods: state.paymentMethods,
        inAppBalance: state.inAppBalance,
      }),
      // Don't try to read storage during SSR (avoids hydration mismatch)
      skipHydration: false,
    },
  ),
);
