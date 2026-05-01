'use client';

// ============================================================
// BARRY NOTIFICATIONS SERVICE
//
// Client-side notification helper using the browser Notification API.
// For real cross-device push (when phone is closed, etc), a server-side
// Web Push subscription endpoint is needed - that's deferred to backend wave.
//
// What works in this v1 (no backend):
//  - Permission opt-in flow
//  - In-app toast for any event
//  - Native browser Notification when the tab is backgrounded
//  - Service worker registered for future push subscription support
//
// Events fired:
//  - poll_vote        : someone voted on date poll
//  - new_task         : task assigned to me
//  - task_added       : task added to trip (digest)
//  - funding_milestone: 25/50/100% funded
//  - booking_confirmed: trip booked, report ready
//  - new_message      : new chat message (rate-limited)
// ============================================================

export type BarryEventType =
  | 'poll_vote' | 'new_task' | 'task_added'
  | 'funding_milestone' | 'booking_confirmed' | 'new_message';

export interface BarryNotification {
  id: string;
  type: BarryEventType;
  title: string;
  body: string;
  tripId?: string;
  url?: string;
  timestamp: number;
}

/** Has the user granted browser permission to show notifications? */
export function getPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/** Ask the browser for permission. Returns the resulting state. */
export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    // Older Safari uses callback API
    return new Promise<NotificationPermission>((resolve) => {
      Notification.requestPermission((p) => resolve(p));
    });
  }
}

/**
 * Show a native browser notification. Falls back silently if permission
 * isn't granted. Caller should also fire the in-app toast (handled separately).
 */
export function showBrowserNotification(notif: BarryNotification, opts: { iconUrl?: string } = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // Only show native if tab is hidden (otherwise the in-app toast is enough)
  if (typeof document !== 'undefined' && !document.hidden) return;

  try {
    const n = new Notification(notif.title, {
      body: notif.body,
      icon: opts.iconUrl || '/favicon.svg',
      tag: `barry-${notif.tripId || 'global'}-${notif.type}`,
      data: { tripId: notif.tripId, url: notif.url },
    });
    n.onclick = () => {
      window.focus();
      if (notif.url) window.location.href = notif.url;
      n.close();
    };
  } catch {
    // Some browsers throw if the page isn't HTTPS or in an unsupported context
  }
}

/**
 * Register a service worker for future push subscription.
 * Calling this is safe even if the SW file doesn't exist yet — it'll just fail silently.
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/barry-sw.js');
  } catch {
    // SW file may not be served yet — fail silently for now
  }
}

// ============================================================
// EVENT BUILDERS — call these from store actions to fire notifs
// ============================================================

export function buildPollVoteNotif(tripName: string, voterName: string, tripId: string): BarryNotification {
  return {
    id: `poll-${Date.now()}`,
    type: 'poll_vote',
    title: `New vote on ${tripName}`,
    body: `${voterName} just voted on the date poll.`,
    tripId,
    url: `/trips/${tripId}`,
    timestamp: Date.now(),
  };
}

export function buildNewTaskNotif(tripName: string, taskTitle: string, tripId: string): BarryNotification {
  return {
    id: `task-${Date.now()}`,
    type: 'new_task',
    title: `New task: ${taskTitle}`,
    body: `Assigned to you in ${tripName}.`,
    tripId,
    url: `/trips/${tripId}`,
    timestamp: Date.now(),
  };
}

export function buildFundingMilestoneNotif(tripName: string, percent: number, tripId: string): BarryNotification {
  return {
    id: `fund-${Date.now()}`,
    type: 'funding_milestone',
    title: `${tripName} ${percent}% funded`,
    body: percent === 100 ? "Everyone's paid. Time to book!" : `${percent}% of the funds are in.`,
    tripId,
    url: `/trips/${tripId}`,
    timestamp: Date.now(),
  };
}

export function buildBookingConfirmedNotif(tripName: string, tripId: string): BarryNotification {
  return {
    id: `booking-${Date.now()}`,
    type: 'booking_confirmed',
    title: `Booked! ${tripName}`,
    body: 'Your reservations are confirmed. Check your report.',
    tripId,
    url: `/trips/${tripId}`,
    timestamp: Date.now(),
  };
}
