'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BarryNotification } from '@/lib/notifications/service';

interface ToastContextValue {
  toasts: BarryNotification[];
  push: (notif: BarryNotification) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<BarryNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((notif: BarryNotification) => {
    setToasts(prev => {
      // Dedupe by tag (tripId+type) to avoid stacking 5 'new task' toasts
      const tag = `${notif.tripId || 'global'}-${notif.type}`;
      const filtered = prev.filter(t => `${t.tripId || 'global'}-${t.type}` !== tag);
      return [...filtered, notif].slice(-3); // keep max 3 visible
    });
    // Auto-dismiss after 5s
    setTimeout(() => dismiss(notif.id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op fallback for components rendered outside the provider
    return {
      toasts: [],
      push: () => {},
      dismiss: () => {},
    } as ToastContextValue;
  }
  return ctx;
}

function ToastViewport({ toasts, dismiss }: { toasts: BarryNotification[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[3000] space-y-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} notif={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ notif, onDismiss }: { notif: BarryNotification; onDismiss: () => void }) {
  const handleClick = () => {
    if (notif.url && typeof window !== 'undefined') {
      window.location.href = notif.url;
    }
    onDismiss();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 flex items-start gap-2.5 barry-toast-pop"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_FOR_TYPE[notif.type] || 'bg-slate-100 dark:bg-slate-700'}`}>
        {ICON_FOR_TYPE[notif.type] || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        )}
      </div>
      <button
        onClick={handleClick}
        className="flex-1 min-w-0 text-left cursor-pointer"
      >
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">{notif.body}</p>
      </button>
      <button
        onClick={onDismiss}
        className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

const COLOR_FOR_TYPE: Record<string, string> = {
  poll_vote: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  new_task: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  task_added: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  funding_milestone: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  booking_confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  new_message: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
};

const ICON_FOR_TYPE: Record<string, React.ReactNode> = {
  poll_vote: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  new_task: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  task_added: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  funding_milestone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" /></svg>,
  booking_confirmed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  new_message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
};
