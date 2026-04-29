// ============================================================
// BARRY — Shared Types
// Used by: apps/web, apps/mobile, apps/api
// ============================================================

// --- Enums ---

export type TransportMode = 'walk' | 'bike' | 'transit' | 'car' | 'train' | 'flight';

export type TripType = 'dinner' | 'weekend' | 'evg' | 'evjf' | 'family' | 'corporate' | 'custom';

export type TripStatus =
  | 'draft'
  | 'inviting'
  | 'constraints'
  | 'calculating'
  | 'voting'
  | 'booked'
  | 'completed'
  | 'cancelled';

export type ParticipantStatus =
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'constraints_set'
  | 'voted';

export type VenueCategory =
  | 'restaurant'
  | 'bar'
  | 'hotel'
  | 'activity'
  | 'museum'
  | 'park'
  | 'other';

export type NotificationType =
  | 'invite'
  | 'constraint_reminder'
  | 'vote_start'
  | 'vote_reminder'
  | 'booking_confirmed'
  | 'trip_update'
  | 'system';

export type SubscriptionTier = 'free' | 'pro';

// --- Geometry ---

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  coordinates: [number, number][];
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

// --- User ---

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  locale: string;
  defaultTransportMode: TransportMode;
  defaultTimeWeight: number;
  defaultMoneyWeight: number;
  homeLocation: GeoPoint | null;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export interface UserPreferences {
  defaultTransportMode: TransportMode;
  defaultTimeWeight: number;
  defaultMoneyWeight: number;
  homeLocation: GeoPoint | null;
  locale: string;
}

// --- Trip ---

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  organizerId: string;
  organizer?: User;
  tripType: TripType;
  status: TripStatus;
  scheduledAt: string | null;
  stealthMode: boolean;
  maxTimeBudget: number | null;
  maxMoneyBudget: number | null;
  inviteToken: string;
  participants: Participant[];
  equityZones?: EquityZone[];
  selectedVenueId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  tripType: TripType;
  scheduledAt?: string;
  stealthMode?: boolean;
  maxTimeBudget?: number;
  maxMoneyBudget?: number;
}

// --- Participant ---

export interface Participant {
  id: string;
  tripId: string;
  userId: string;
  user?: User;
  status: ParticipantStatus;
  transportMode: TransportMode | null;
  timeWeight: number;
  moneyWeight: number;
  maxTime: number | null;
  maxMoney: number | null;
  originLocation: GeoPoint | null;
  originLabel: string | null;
  burdenScore: number | null;
  routeDuration: number | null;
  routeDistance: number | null;
  routeCost: number | null;
  routeGeometry: RouteGeometry | null;
  voteVenueId: string | null;
}

export interface SetConstraintsInput {
  transportMode: TransportMode;
  timeWeight: number;
  moneyWeight: number;
  maxTime: number;
  maxMoney?: number;
  originLocation: GeoPoint;
  originLabel?: string;
}

// --- Venue ---

export interface Venue {
  id: string;
  name: string;
  category: VenueCategory;
  location: GeoPoint;
  address: VenueAddress;
  description: string | null;
  priceLevel: number | null;
  rating: number | null;
  phone: string | null;
  website: string | null;
  photos: string[];
  coverPhotoUrl: string | null;
  accessibility: Record<string, boolean>;
}

export interface VenueAddress {
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
}

// --- Equity Zone ---

export interface EquityZone {
  id: string;
  tripId: string;
  center: GeoPoint;
  label: string | null;
  equityScore: number;
  maxBurden: number;
  meanBurden: number;
  stdDevBurden: number;
  burdens: Record<string, number>;  // userId -> burden value
  rank: number;
  isSelected: boolean;
  venues?: Venue[];
}

// --- Equity Calculation ---

export interface EquityRequest {
  tripId: string;
  participants: EquityParticipant[];
  searchRadiusKm?: number;
  gridResolution?: number;
}

export interface EquityParticipant {
  id: string;
  origin: GeoPoint;
  mode: TransportMode;
  timeWeight: number;
  moneyWeight: number;
  maxTime: number;
  maxMoney: number | null;
}

export interface EquityResponse {
  tripId: string;
  zones: EquityZone[];
  calculationTimeMs: number;
}

// --- Voting ---

export interface VoteInput {
  venueId: string;
  approved: boolean;  // swipe right = true, left = false
}

export interface VoteResult {
  venueId: string;
  venue: Venue;
  approvals: number;
  rejections: number;
  totalVotes: number;
  approvalRate: number;
}

// --- WebSocket Events ---

export interface WsEvent<T = unknown> {
  event: string;
  data: T;
}

export interface WsTripUpdated {
  tripId: string;
  field: string;
  value: unknown;
}

export interface WsParticipantJoined {
  tripId: string;
  participant: Participant;
}

export interface WsConstraintsUpdated {
  tripId: string;
  userId: string;
}

export interface WsCalculationComplete {
  tripId: string;
  zones: EquityZone[];
}

export interface WsVoteCast {
  tripId: string;
  userId: string;
  venueId: string;
  approved: boolean;
}

export interface WsVoteComplete {
  tripId: string;
  winner: VoteResult;
}

// --- Notification ---

export interface Notification {
  id: string;
  userId: string;
  tripId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

// --- Auth ---

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  locale?: string;
}

// --- API Response Wrappers ---

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// SOLO MODE — Discover what you can do around you
// ============================================================

export type TripMode = 'solo' | 'group';

export interface SoloTrip {
  id: string;
  userId: string;
  name: string;
  origin: GeoPoint;
  originLabel: string;
  modes: TransportMode[];
  maxTime: number;       // minutes
  maxBudget: number;     // EUR
  category: VenueCategory | 'all';
  createdAt: string;
  destinations: SoloDestination[];
}

export interface SoloDestination {
  id: string;
  venue: Venue;
  distanceKm: number;
  durations: Record<TransportMode, number>;  // mode -> minutes
  costs: Record<TransportMode, number>;       // mode -> EUR
  matchScore: number;    // 0-100, how well it fits the constraints
  highlights: string[];  // tags like "great rating", "fast", "cheap"
}

// ============================================================
// GROUP CHAT
// ============================================================

export interface ChatMessage {
  id: string;
  tripId: string;
  userId: string;
  user?: User;
  content: string;
  type: 'text' | 'system' | 'vote_update' | 'cagnotte_update';
  createdAt: string;
}

// ============================================================
// CAGNOTTE (Group Kitty)
// ============================================================

export interface Cagnotte {
  id: string;
  tripId: string;
  totalTarget: number;       // EUR — total amount needed
  collected: number;          // EUR — currently collected
  contributions: Contribution[];
  status: 'open' | 'completed' | 'refunded';
  createdAt: string;
}

export interface Contribution {
  id: string;
  cagnotteId: string;
  userId: string;
  user?: User;
  amount: number;             // EUR
  status: 'pending' | 'paid' | 'refunded';
  paidAt: string | null;
}

// ============================================================
// EXTENDED TRIP (with mode discriminator)
// ============================================================

export interface TripExtended extends Trip {
  mode: TripMode;
  chat?: ChatMessage[];
  cagnotte?: Cagnotte;
}

// ============================================================
// DATE POLL (Doodle-like) — find a date that works for everyone
// ============================================================

export interface DatePollOption {
  id: string;
  /** ISO date string (YYYY-MM-DD or full ISO with time) */
  date: string;
  /** Optional label like "evening" or "afternoon" */
  label?: string;
}

export type DateVoteResponse = 'yes' | 'maybe' | 'no';

export interface DateVote {
  userId: string;
  optionId: string;
  response: DateVoteResponse;
  votedAt: string;
}

export interface DatePoll {
  id: string;
  tripId: string;
  options: DatePollOption[];
  votes: DateVote[];
  status: 'open' | 'closed';
  selectedOptionId: string | null;
  createdAt: string;
  closesAt: string | null;
}

// ============================================================
// EXPENSES (Tricount-like) — split costs after the trip
// ============================================================

export type ExpenseCategory =
  | 'food'
  | 'drinks'
  | 'transport'
  | 'accommodation'
  | 'activity'
  | 'shopping'
  | 'other';

export type ExpenseSplitMode = 'equal' | 'custom' | 'shares' | 'percent';

export interface ExpenseShare {
  userId: string;
  /** Amount the user owes for this expense (EUR) */
  amount: number;
  /** For 'shares' split mode: number of shares this user takes (default 1) */
  shares?: number;
}

export interface Expense {
  id: string;
  tripId: string;
  /** Who paid */
  paidBy: string;
  payer?: User;
  /** What was bought */
  description: string;
  category: ExpenseCategory;
  /** Total amount in EUR */
  amount: number;
  currency: string;
  /** ISO date when the expense happened */
  date: string;
  splitMode: ExpenseSplitMode;
  /** Who shares the cost and how much they each owe */
  shares: ExpenseShare[];
  createdAt: string;
}

export interface Settlement {
  fromUserId: string;
  fromUser?: User;
  toUserId: string;
  toUser?: User;
  amount: number;
  currency: string;
}

export interface ExpenseBalance {
  userId: string;
  user?: User;
  /** Sum of all amounts the user paid for the group */
  totalPaid: number;
  /** Sum of all amounts the user owes */
  totalOwed: number;
  /** Net balance (positive = group owes them, negative = they owe group) */
  net: number;
}


// ============================================================
// PIN VOTE (vote on Barry's suggested zones)
// ============================================================

export interface PinVote {
  userId: string;
  zoneId: string;
  votedAt: string;
}

// ============================================================
// VENUE VOTE (vote on bars/restaurants in the chosen zone)
// ============================================================

export type VenueVoteResponse = 'love' | 'meh' | 'no';

export interface VenueVote {
  userId: string;
  venueId: string;
  response: VenueVoteResponse;
  votedAt: string;
}

// ============================================================
// ACCOMMODATION (hotel / BnB / Airbnb for multi-day trips)
// ============================================================

export type AccommodationType = 'hotel' | 'bnb' | 'airbnb' | 'hostel' | 'other';

export interface Accommodation {
  id: string;
  tripId: string;
  type: AccommodationType;
  name: string;
  pricePerNight: number;
  nights: number;
  totalPrice: number;
  rooms: number;
  votes: VenueVote[];
  selected: boolean;
}

// ============================================================
// PER-PARTICIPANT TRANSPORT BOOKING
// ============================================================

export interface TransportLeg {
  participantId: string;
  participantName?: string;
  mode: TransportMode;
  estimatedCost: number;
  /** Reduction card e.g. 'jeune', 'senior', 'invalidite' */
  reductionCard: string | null;
  reductionPct: number;
  finalCost: number;
  /** True if user opts to book this leg themselves outside Barry */
  selfBooked: boolean;
  status: 'pending' | 'configured' | 'booked';
}

// ============================================================
// FUNDS REQUEST (Kitty 2.0 - precise amounts before booking)
// ============================================================

export interface FundsRequest {
  id: string;
  tripId: string;
  /** Total amount needed (venues + accommodation + transport) */
  totalAmount: number;
  breakdown: {
    venues: number;
    accommodation: number;
    transport: number;
    other: number;
  };
  contributions: FundsContribution[];
  status: 'open' | 'partial' | 'complete' | 'cancelled';
  createdAt: string;
  closedAt: string | null;
}

export interface FundsContribution {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  paidFromBalance: number;
  paidFromCard: number;
  status: 'pending' | 'paid' | 'failed';
  paidAt: string | null;
}

// ============================================================
// BOOKING RESERVATION (the final action — Barry books everything)
// ============================================================

export interface Reservation {
  id: string;
  tripId: string;
  type: 'venue' | 'accommodation' | 'transport';
  reference: string;
  description: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmationCode: string | null;
}

// ============================================================
// IN-APP BALANCE TRANSACTION (history of credits/debits)
// ============================================================

export interface BalanceTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'spend' | 'refund' | 'reimbursement';
  amount: number;
  description: string;
  tripId: string | null;
  createdAt: string;
}
