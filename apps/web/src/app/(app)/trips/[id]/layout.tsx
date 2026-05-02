'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { InteractiveMascot } from '@/components/barry/interactive-mascot';
import { AvatarStack } from '@/components/ui/avatar';
import { formatDateLong, formatDateShort } from '@/lib/utils/format-date';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, trips } = useAppStore();

  useEffect(() => {
    if (id) setActiveTrip(id as string);
  }, [id, setActiveTrip]);

  const trip = activeTrip || trips.find(t => t.id === id);
  const basePath = `/trips/${id}`;
  const isOverview = pathname === basePath;

  const subPage = (() => {
    if (pathname.endsWith('/constraints')) return 'My setup';
    if (pathname.endsWith('/map')) return 'Map';
    if (pathname.endsWith('/funds')) return 'Funds';
    if (pathname.endsWith('/booking')) return 'Booking';
    if (pathname.endsWith('/chat')) return 'Chat';
    if (pathname.endsWith('/cagnotte')) return 'Kitty';
    if (pathname.endsWith('/expenses')) return 'Expenses';
    if (pathname.endsWith('/itinerary')) return 'Directions';
    return null;
  })();

  // Trip date display
  const tripDateLabel = trip ? (() => {
    if (trip.mode === 'trip' && trip.scheduledAt && trip.endDate) {
      const start = new Date(trip.scheduledAt);
      const end = new Date(trip.endDate);
      const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
      return `${formatDateShort(trip.scheduledAt)} → ${formatDateShort(trip.endDate)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
    }
    if (trip.scheduledAt) return formatDateLong(trip.scheduledAt);
    return null;
  })() : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative">
      <a href="#trip-main" className="barry-skip-link">Skip to content</a>
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isOverview ? router.push('/') : router.push(basePath as any)}
              className="p-1 -ml-1 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Header mascot — small, on the left */}
            {isOverview && (
              <div className="flex-shrink-0">
                <InteractiveMascot defaultMood="happy" size={32} />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {subPage ? (
                <>
                  <Link href={basePath as any} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 font-medium truncate block">
                    {trip?.name || 'Trip'}
                  </Link>
                  <h1 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {subPage}
                  </h1>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                      {trip?.name || 'Trip'}
                    </h1>
                    {trip?.mode && (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        trip.mode === 'trip' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {trip.mode === 'trip' ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
                          </svg>
                        ) : (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <path d="M8 21h8M12 17v4M5 3h14l-2 11a4 4 0 01-4 3h-2a4 4 0 01-4-3L5 3z" />
                          </svg>
                        )}
                        {trip.mode === 'trip' ? 'Multi-day' : 'One day'}
                      </span>
                    )}
                  </div>
                  {tripDateLabel && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {tripDateLabel}
                    </p>
                  )}
                </>
              )}
            </div>
            {trip && (
              <AvatarStack users={trip.participants.map(p => p.user)} max={3} size={28} />
            )}
          </div>
        </div>
      </header>

      <main id="trip-main" className="max-w-2xl mx-auto pb-24 relative">
        {children}
      </main>

      {/* Floating side mascot — visible on wide screens (xl: 1280px+) */}
      <div className="hidden xl:block fixed left-8 bottom-8 z-20">
        <InteractiveMascot defaultMood="happy" size={120} />
      </div>
    </div>
  );
}
