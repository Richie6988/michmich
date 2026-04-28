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
