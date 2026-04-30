'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { InteractiveMascot } from '@/components/barry/interactive-mascot';
import { AvatarStack } from '@/components/ui/avatar';
import { formatDateLong, formatDateShort } from '@/lib/utils/format-date';
import { downloadIcs, downloadPdf } from '@/lib/utils/trip-export';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, trips, duplicateTrip, reservations, transportLegs } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 relative">
      <a href="#trip-main" className="barry-skip-link">Skip to content</a>
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isOverview ? router.push('/') : router.push(basePath as any)}
              className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors"
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
                  <Link href={basePath as any} className="text-[11px] text-slate-500 hover:text-slate-700 font-medium truncate block">
                    {trip?.name || 'Trip'}
                  </Link>
                  <h1 className="font-display font-bold text-base text-slate-900 truncate">
                    {subPage}
                  </h1>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display font-bold text-base text-slate-900 truncate">
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
                        {trip.mode === 'trip' ? 'Trip' : 'Wanderlust'}
                      </span>
                    )}
                  </div>
                  {tripDateLabel && (
                    <p className="text-[11px] text-slate-500 truncate">
                      {tripDateLabel}
                    </p>
                  )}
                </>
              )}
            </div>
            {trip && (
              <div className="flex items-center gap-2">
                <AvatarStack users={trip.participants.map(p => p.user)} max={3} size={28} />
                {/* More menu - only on overview */}
                {isOverview && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(o => !o)}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                      aria-label="More actions"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 w-56 z-40">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              const newTrip = duplicateTrip(trip.id);
                              if (newTrip) {
                                router.push(`/trips/${newTrip.id}` as any);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Duplicate Barry
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              const url = `${window.location.origin}/join/${trip.inviteToken}`;
                              navigator.clipboard.writeText(url);
                              alert('Invite link copied!');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                            </svg>
                            Copy invite link
                          </button>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              downloadIcs({ trip });
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Add to calendar (.ics)
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              downloadPdf({
                                trip,
                                reservations: reservations[trip.id] || [],
                                transportLegs: transportLegs[trip.id] || [],
                              });
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Export PDF recap
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
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
