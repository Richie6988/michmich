/**
 * Typed API client for the Barry NestJS backend.
 *
 * Today the web app uses Zustand-only state (mock data, persisted to localStorage).
 * This client is the bridge so we can progressively replace store actions with real
 * server calls. The store keeps optimistic local state, and these calls mirror it
 * to the database.
 *
 * Auth: Bearer JWT in localStorage under 'barry_token'.
 *
 * Usage:
 *   import { api } from '@/lib/api/backend';
 *   const trip = await api.trips.create({ name: 'Friday dinner', mode: 'wanderlust' });
 */

const API_BASE = (typeof window !== 'undefined' && (window as any).__BARRY_API_URL)
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:3001/api/v1';

// ============================================================
// TOKEN helpers
// ============================================================

const TOKEN_KEY = 'barry_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// ============================================================
// Core fetch wrapper
// ============================================================

class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { skipAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === 'string'
      ? data
      : (data?.message || `${res.status} ${res.statusText}`);
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// ============================================================
// AUTH
// ============================================================
export const auth = {
  signup(dto: { email: string; password: string; firstName: string; lastName: string; phone?: string; locale?: string }) {
    return request<{ accessToken: string; user: any }>('POST', '/auth/signup', dto, { skipAuth: true });
  },
  login(dto: { email: string; password: string }) {
    return request<{ accessToken: string; user: any }>('POST', '/auth/login', dto, { skipAuth: true });
  },
  forgotPassword(email: string) {
    return request<{ ok: boolean }>('POST', '/auth/forgot-password', { email }, { skipAuth: true });
  },
  me() {
    return request<any>('GET', '/auth/me');
  },
};

// ============================================================
// USERS
// ============================================================
export const users = {
  me() { return request<any>('GET', '/users/me'); },
  update(patch: any) { return request<any>('PATCH', '/users/me', patch); },
  setHomeLocation(lat: number, lng: number, label?: string) {
    return request<any>('POST', '/users/me/home-location', { lat, lng, label });
  },
};

// ============================================================
// TRIPS
// ============================================================
export const trips = {
  list() { return request<any[]>('GET', '/trips'); },
  get(id: string) { return request<any>('GET', `/trips/${id}`); },
  create(dto: { name: string; description?: string; tripType?: string; mode?: 'wanderlust' | 'trip'; scheduledAt?: string; endDate?: string; friendNames?: string[] }) {
    return request<any>('POST', '/trips', dto);
  },
  update(id: string, patch: any) { return request<any>('PATCH', `/trips/${id}`, patch); },
  duplicate(id: string, name?: string) {
    return request<any>('POST', `/trips/${id}/duplicate`, { name });
  },
  remove(id: string) { return request<void>('DELETE', `/trips/${id}`); },

  // Participants
  addByName(tripId: string, name: string) {
    return request<any>('POST', `/trips/${tripId}/participants`, { name });
  },
  removeParticipant(tripId: string, participantId: string) {
    return request<void>('DELETE', `/trips/${tripId}/participants/${participantId}`);
  },
  updateMyConstraints(tripId: string, dto: any) {
    return request<any>('PATCH', `/trips/${tripId}/me/constraints`, dto);
  },

  // Tasks
  listTasks(tripId: string) { return request<any[]>('GET', `/trips/${tripId}/tasks`); },
  createTask(tripId: string, dto: { title: string; description?: string; assignedToId?: string }) {
    return request<any>('POST', `/trips/${tripId}/tasks`, dto);
  },
  toggleTask(tripId: string, taskId: string) {
    return request<any>('PATCH', `/trips/${tripId}/tasks/${taskId}/toggle`);
  },
  reassignTask(tripId: string, taskId: string, assignedToId: string | null) {
    return request<any>('PATCH', `/trips/${tripId}/tasks/${taskId}/assign`, { assignedToId });
  },
  removeTask(tripId: string, taskId: string) {
    return request<void>('DELETE', `/trips/${tripId}/tasks/${taskId}`);
  },

  // Photos
  listPhotos(tripId: string) { return request<any[]>('GET', `/trips/${tripId}/photos`); },
  addPhoto(tripId: string, imageUrl: string, caption?: string) {
    return request<any>('POST', `/trips/${tripId}/photos`, { imageUrl, caption });
  },
  removePhoto(tripId: string, photoId: string) {
    return request<void>('DELETE', `/trips/${tripId}/photos/${photoId}`);
  },
};

// ============================================================
// JOIN (public, no auth)
// ============================================================
export const join = {
  lookup(token: string) {
    return request<any>('GET', `/join/${token}`, undefined, { skipAuth: true });
  },
};

// ============================================================
// VOTES
// ============================================================
export const votes = {
  list(tripId: string, voteType: 'pin' | 'venue' | 'accommodation' | 'date') {
    return request<any[]>('GET', `/trips/${tripId}/votes/${voteType}`);
  },
  cast(tripId: string, dto: { voteType: 'pin' | 'venue' | 'accommodation'; targetId: string; response: 'love' | 'meh' | 'no' }) {
    return request<any>('POST', `/trips/${tripId}/votes`, dto);
  },
  clear(tripId: string, voteType: string, targetId: string) {
    return request<void>('DELETE', `/trips/${tripId}/votes/${voteType}/${targetId}`);
  },
  // Date poll
  getPoll(tripId: string) { return request<any>('GET', `/trips/${tripId}/date-poll`); },
  addOption(tripId: string, date: string) {
    return request<any>('POST', `/trips/${tripId}/date-poll/options`, { date });
  },
  voteDate(tripId: string, optionId: string, response: 'yes' | 'maybe' | 'no') {
    return request<any>('POST', `/trips/${tripId}/date-poll/vote`, { optionId, response });
  },
  closePoll(tripId: string, selectedOptionId: string) {
    return request<any>('POST', `/trips/${tripId}/date-poll/close`, { selectedOptionId });
  },
};

// ============================================================
// EQUITY
// ============================================================
export const equity = {
  health() { return request<{ up: boolean; latencyMs?: number }>('GET', '/equity/health', undefined, { skipAuth: true }); },
  zones(tripId: string) { return request<any[]>('GET', `/trips/${tripId}/zones`); },
  compute(tripId: string) { return request<any[]>('POST', `/trips/${tripId}/zones/compute`); },
  getPin(tripId: string) { return request<any>('GET', `/trips/${tripId}/pin`); },
  lockPin(tripId: string, zoneId: string) {
    return request<any>('POST', `/trips/${tripId}/pin/lock`, { zoneId });
  },
};

// ============================================================
// VENUES
// ============================================================
export const venues = {
  near(lat: number, lng: number, opts: { radius?: number; category?: string } = {}) {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      ...(opts.radius && { radius: String(opts.radius) }),
      ...(opts.category && { category: opts.category }),
    });
    return request<any[]>('GET', `/venues/near?${params}`);
  },
  accommodations(tripId: string) {
    return request<any[]>('GET', `/trips/${tripId}/accommodations`);
  },
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications = {
  list(unreadOnly = false) {
    return request<any[]>('GET', `/notifications${unreadOnly ? '?unread=true' : ''}`);
  },
  markRead(id: string) { return request<void>('PATCH', `/notifications/${id}/read`); },
  markAllRead() { return request<void>('PATCH', '/notifications/read-all'); },
  subscribe(sub: { endpoint: string; p256dh: string; auth: string }) {
    return request<any>('POST', '/notifications/subscriptions', sub);
  },
  unsubscribe(endpoint: string) {
    return request<void>('DELETE', '/notifications/subscriptions', { endpoint });
  },
};

// ============================================================
// SINGLE NAMESPACE EXPORT
// ============================================================
export const api = {
  auth,
  users,
  trips,
  join,
  votes,
  equity,
  venues,
  notifications,
  ApiError,
};

export { ApiError };
