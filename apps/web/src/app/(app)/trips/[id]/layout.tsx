'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { InteractiveMascot } from '@/components/barry/interactive-mascot';
import { AvatarStack, Avatar } from '@/components/ui/avatar';
import dynamic from 'next/dynamic';
const TripChatSidebar = dynamic(() => import('@/components/trip/trip-chat-sidebar').then(m => m.TripChatSidebar), {
  ssr: false,
  // Empty loading state - sidebar materializes when JS loads, no skeleton needed
  loading: () => null,
});
import { formatDateLong, formatDateShort } from '@/lib/utils/format-date';

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, trips, currentUser, isAuthenticated, isGuest } = useAppStore();

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
              className="p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-700 dark:text-slate-200">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <HelpButton tripName={trip?.name} />

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
            {/* Right: clickable current user avatar (-> profile) or sign-in icon (req 6 + 20) */}
            {isAuthenticated && !isGuest && currentUser ? (
              <Link
                href="/profile"
                className="flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Open profile"
                title={`${currentUser.firstName}'s profile`}
              >
                <Avatar user={currentUser} size={32} className="ring-2 ring-white dark:ring-slate-800 shadow-md" />
              </Link>
            ) : (
              <Link
                href={`/login?redirect=${encodeURIComponent(pathname || '/')}`}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-barry-blue text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                aria-label="Sign in"
                title="Sign in"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main id="trip-main" className={`max-w-2xl xl:max-w-3xl mx-auto pb-24 barry-safe-bottom relative ${isOverview ? 'xl:mr-[340px]' : ''}`}>
        {children}
      </main>

      {/* req 27: Persistent chat sidebar (desktop) / floating bottom-sheet (mobile) */}
      {trip && isOverview && (
        <TripChatSidebar tripId={trip.id} />
      )}

      {/* Floating side mascot - visible on wide screens (xl: 1280px+), only on subpages where chat sidebar is hidden */}
      {!isOverview && (
        <div className="hidden xl:block fixed left-8 bottom-8 z-20">
          <InteractiveMascot defaultMood="happy" size={120} />
        </div>
      )}
    </div>
  );
}

/**
 * HelpButton - small (?) icon in trip header that opens contextual help.
 * Replaces the old "Contact support" link in profile.
 */
function HelpButton({ tripName }: { tripName?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
        aria-label="Help"
        title="Help"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-slate-600 dark:text-slate-300">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 barry-dialog-fade"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-5 barry-dialog-pop"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-barry-blue flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">Need a hand?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  We&rsquo;re here for you{tripName ? ` while you plan "${tripName}"` : ''}.
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <a
                href={`mailto:hello@barry.app?subject=Help with ${tripName || 'my Barry'}&body=Hi Barry team,%0D%0A%0D%0A`}
                className="flex items-center gap-3 px-3 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Email us</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">hello@barry.app - we reply within 24h</p>
                </div>
              </a>

              <a
                href="https://barry.app/help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Help center</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Guides, FAQ, troubleshooting</p>
                </div>
              </a>

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
