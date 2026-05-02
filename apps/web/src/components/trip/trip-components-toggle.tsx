'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';

interface TripComponentsToggleProps {
  tripId: string;
  isOwner: boolean;
  isMultiDay: boolean;
}

const COMPONENTS = [
  {
    key: 'restaurant' as const,
    label: 'Restaurant',
    icon: <><path d="M3 7h18M3 12h18M3 17h18" /></>,
    iconAlt: <><path d="M5 12V7a2 2 0 012-2h2a2 2 0 012 2v5M11 12V7M11 12c0 5-3 5-3 5M19 5v17M16 5h6M16 5c0 4 1.5 6 3 6" /></>,
    color: 'orange',
  },
  {
    key: 'accommodation' as const,
    label: 'Hotel',
    icon: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
    color: 'blue',
  },
  {
    key: 'activities' as const,
    label: 'Activities',
    icon: <><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></>,
    color: 'emerald',
  },
  {
    key: 'car' as const,
    label: 'Car rental',
    icon: <><circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /><path d="M2 16.5V13l2-5h13l3 5v3.5" /></>,
    color: 'violet',
  },
];

const COLOR_STYLES: Record<string, { active: string; activeText: string; idle: string }> = {
  orange: { active: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700', activeText: 'text-orange-700 dark:text-orange-300', idle: 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700' },
  blue: { active: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700', activeText: 'text-blue-700 dark:text-blue-300', idle: 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700' },
  emerald: { active: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700', activeText: 'text-emerald-700 dark:text-emerald-300', idle: 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700' },
  violet: { active: 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700', activeText: 'text-violet-700 dark:text-violet-300', idle: 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700' },
};

const COLOR_TO_HEX: Record<string, string> = {
  orange: '#F97316',
  blue: '#2563EB',
  emerald: '#10B981',
  violet: '#8B5CF6',
};

export function TripComponentsToggle({ tripId, isOwner, isMultiDay }: TripComponentsToggleProps) {
  const { tripComponents, toggleTripComponent } = useAppStore();
  const components = tripComponents[tripId] || {
    accommodation: isMultiDay,
    restaurant: true,
    activities: false,
    car: false,
  };

  const enabledCount = Object.values(components).filter(Boolean).length;

  if (!isOwner) {
    // Read-only summary for non-owners
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          What this Barry covers
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMPONENTS.filter(c => components[c.key]).map(c => {
            const styles = COLOR_STYLES[c.color];
            return (
              <span key={c.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${styles.active} ${styles.activeText}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLOR_TO_HEX[c.color]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {c.icon}
                </svg>
                {c.label}
              </span>
            );
          })}
          {enabledCount === 0 && (
            <p className="text-[11px] text-slate-400 italic">Owner hasn&rsquo;t picked any category yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          What does this Barry need?
        </p>
        <span className="text-[10px] text-slate-400">
          {enabledCount} of {COMPONENTS.length} active
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug">
        Tap to activate the categories you want Barry to handle.
        We only show comparisons for what you turn on.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {COMPONENTS.map(c => {
          const isActive = components[c.key];
          const styles = COLOR_STYLES[c.color];
          return (
            <button
              key={c.key}
              onClick={() => toggleTripComponent(tripId, c.key)}
              className={`relative p-3 rounded-xl border-2 transition-all text-center active:scale-95 ${
                isActive ? styles.active : `bg-white dark:bg-slate-900 ${styles.idle}`
              }`}
              aria-pressed={isActive}
            >
              {/* Check badge when active */}
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? COLOR_TO_HEX[c.color] : '#94A3B8'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="mx-auto mb-1.5"
              >
                {c.icon}
              </svg>
              <p className={`text-xs font-bold ${isActive ? styles.activeText : 'text-slate-600 dark:text-slate-400'}`}>
                {c.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
