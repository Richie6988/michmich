'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { useDialog } from '@/components/ui/dialog';
import { BarryMark, BarryMascot } from '@/components/barry/brand';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { formatDateShort } from '@/lib/utils/format-date';
import type { Trip } from '@barry/shared-types';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Drafting',
  inviting: 'Inviting',
  constraints: 'Setup',
  calculating: 'Crunching',
  voting: 'Voting',
  booked: 'Booked',
  completed: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-400',
  inviting: 'bg-blue-500',
  constraints: 'bg-amber-500',
  calculating: 'bg-purple-500',
  voting: 'bg-orange-500',
  booked: 'bg-emerald-500',
  completed: 'bg-slate-300',
  cancelled: 'bg-rose-500',
};

function TripRow({ trip }: { trip: Trip }) {
  const router = useRouter();
  const { duplicateTrip, archiveTrip, deleteTrip } = useAppStore();
  const { confirm } = useDialog();
  const [menuOpen, setMenuOpen] = useState(false);
  const date = trip.scheduledAt ? formatDateShort(trip.scheduledAt) : null;
  const href: any = `/trips/${trip.id}`;
  // Archive does double duty: 'mark as finished' + 'hide from list'

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const newTrip = duplicateTrip(trip.id);
    if (newTrip) router.push(`/trips/${newTrip.id}` as any);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const ok = await confirm({
      title: 'Archive this Barry?',
      body: `"${trip.name}" will be hidden from your main list. You can find it again under "Archived Barrys" and restore it any time.`,
      variant: 'info',
      confirmLabel: 'Archive',
    });
    if (ok) archiveTrip(trip.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    const ok = await confirm({
      title: 'Delete this Barry?',
      body: `"${trip.name}" and all its data (chat, votes, expenses, photos) will be permanently deleted. This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
    });
    if (ok) deleteTrip(trip.id);
  };

  // Note: 'Mark as finished' was merged into Archive in Wave 25 per user request.
  // A finished trip IS an archived trip - same outcome, less menu noise.

  return (
    <div className="relative group">
      <Link href={href} className="block">
        <div className="flex items-center gap-3 py-3 px-3 hover:bg-slate-50 dark:bg-slate-900 rounded-xl transition-colors">
          <AvatarStack users={trip.participants.map(p => p.user)} max={3} size={36} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-[15px] truncate mb-0.5">{trip.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[trip.status] || 'bg-slate-400'}`} />
              <span className="font-medium">{STATUS_LABEL[trip.status] || trip.status}</span>
              {date && <><span className="text-slate-300">·</span><span>{date}</span></>}
              {trip.mode && (
                <><span className="text-slate-300">·</span>
                {trip.mode === 'trip' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M8 21h8M12 17v4M5 3h14l-2 11a4 4 0 01-4 3h-2a4 4 0 01-4-3L5 3z" />
                  </svg>
                )}
                </>
              )}
            </div>
          </div>

          {/* Right side: kebab menu + chevron */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); }}
              className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
              aria-label="More actions"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* Per-row dropdown */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 w-52 z-40">
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Duplicate Barry
            </button>
            {/* Archive + Delete separator */}
            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
            <button
              onClick={handleArchive}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archive
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a2 2 0 012-2h0a2 2 0 012 2v2" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { trips, currentUser, isAuthenticated, isGuest, logout, unarchiveTrip } = useAppStore();
  const [tab, setTab] = useState<'active' | 'past' | 'archived'>('active');
  const [menuOpen, setMenuOpen] = useState(false);

  // Archived trips are excluded from active+past lists, shown only in 'archived' tab
  const archivedTrips = trips.filter(t => (t as any).archivedAt);
  const nonArchived = trips.filter(t => !(t as any).archivedAt);
  const activeTrips = nonArchived.filter(t => !['completed', 'cancelled'].includes(t.status));
  const pastTrips = nonArchived.filter(t => ['completed', 'cancelled'].includes(t.status));
  const visible = tab === 'active' ? activeTrips : tab === 'past' ? pastTrips : archivedTrips;
  const hasTrips = trips.length > 0;
  const showAuthedExperience = isAuthenticated && !isGuest && hasTrips;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <BarryMark size={26} />
            <span className="font-display font-extrabold text-xl text-barry-blue tracking-tight">Barry</span>
          </div>

          {/* Auth corner: avatar -> profile direct link, separate Logout button */}
          {isAuthenticated && !isGuest && currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full pl-2 pr-1 py-1 transition-colors"
                title="Profile & preferences"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate hidden sm:inline">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <Avatar user={currentUser} size={36} className="shadow-md" />
              </Link>
              <button
                onClick={() => logout()}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-1.5"
                title="Log out"
                aria-label="Log out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-barry-blue text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {showAuthedExperience ? (
          <ReturningUserView
            currentUser={currentUser}
            trips={trips}
            tab={tab}
            setTab={setTab}
            activeTrips={activeTrips}
            pastTrips={pastTrips}
            archivedTrips={archivedTrips}
            visible={visible}
          />
        ) : (
          <LandingView currentUser={currentUser} isAuthenticated={isAuthenticated} isGuest={isGuest} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// LANDING VIEW — marketing page with arguments
// ============================================================
function LandingView({ currentUser, isAuthenticated, isGuest }: any) {
  const showAuthCTA = !isAuthenticated || isGuest;
  return (
    <>
      {/* HERO */}
      <section className="text-center pt-6 pb-10">
        <div className="inline-block mb-4 relative">
          <BarryMascot mood="happy" size={120} />
          <div className="absolute -top-2 -right-4 bg-amber-400 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full shadow-md rotate-6">
            Free
          </div>
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 dark:text-slate-100 tracking-tight leading-[1.05] mb-3">
          Stop arguing about{' '}
          <span className="bg-gradient-to-r from-barry-blue via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            where to meet.
          </span>
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Barry is the smart way to plan with friends. He picks the fairest spot, splits the bills,
          books your transport, and your hotel if you&rsquo;re going far.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link href="/trips/new" className="inline-block">
            <div className="bg-gradient-to-r from-barry-blue to-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl active:scale-[0.98] transition-all flex items-center gap-2 justify-center">
              <span className="text-base">{showAuthCTA ? 'Try Barry now' : 'Create my first Barry'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
          {/* Try a sample trip button (CRITICAL_REVIEW UX gap 5) - lets prospects browse without signup */}
          {showAuthCTA && (
            <Link href="/trips/tr1?demo=1" className="inline-block">
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-4 rounded-2xl hover:border-barry-blue hover:text-barry-blue active:scale-[0.98] transition-all flex items-center gap-2 justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-sm">Try a sample trip</span>
              </div>
            </Link>
          )}
          {showAuthCTA && (
            <Link href="/login" className="text-barry-blue font-semibold hover:underline self-center">
              Already have an account? Sign in
            </Link>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">No credit card. Solo or with friends. Works on phone, tablet, laptop.</p>
      </section>

      {/* THE TRIP-PLANNING HELLLOOP - now more visual/fun, animated cycle */}
      <HellLoopSection />

      {/* WHY Barry — 3 pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <PillarCard
          color="blue"
          icon={<><circle cx="12" cy="10" r="3" /><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /></>}
          title="Fair to everyone"
          subtitle="Barry's algorithm spreads commute time so nobody gets the long haul."
        />
        <PillarCard
          color="orange"
          icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
          title="Saves hours"
          subtitle="No more group chats trying to find a date and place. Barry runs it. Done in minutes."
        />
        <PillarCard
          color="emerald"
          icon={<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></>}
          title="Splits everything"
          subtitle="Transport, hotel, dinner. Barry tracks who paid what. Settles in one tap."
        />
      </section>

      {/* SUCCESS STORIES - Barry would have rocked it */}
      <BarryRocksSection />

      {/* NUMBERS */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <Stat value="6 min" label="Avg setup time" />
        <Stat value="40+" label="Loyalty cards supported" />
        <Stat value="0 EUR" label="To start" />
      </section>

      {/* WORKS EVERYWHERE — phone, tablet, laptop */}
      <section className="bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-5 mb-6 flex items-center gap-4">
        <BarryMascot mood="default" size={56} animate={false} />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">Works on every screen</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Phone, tablet, laptop. No download. Add to your home screen for one-tap access.</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-6">
        <p className="font-display font-bold text-2xl text-slate-900 dark:text-slate-100 mb-1">Ready to plan something?</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Free, no friction, takes a minute.</p>
        <Link href="/trips/new">
          <div className="inline-block bg-gradient-to-r from-barry-blue to-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-[0.98] transition-all">
            Create my first Barry
          </div>
        </Link>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6 text-center">
        <Link href="/legal" className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300">
          Legal & privacy
        </Link>
        <p className="text-[10px] text-slate-400 mt-2">Made with care for everyone tired of group chats.</p>
      </footer>
    </>
  );
}

/**
 * Hellloop section — animated visual cycle of the 3 pains.
 * Cards rotate through "step 1 -> step 2 -> step 3 -> back to start" feeling.
 */
function HellLoopSection() {
  return (
    <section className="relative bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-rose-950/30 dark:via-orange-950/20 dark:to-amber-950/30 rounded-3xl border border-rose-100 dark:border-rose-900/40 p-6 mb-6 overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-rose-300/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-sm border border-rose-200 dark:border-rose-800 mb-2">
            <span className="w-2 h-2 bg-rose-500 rounded-full barry-pulse" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">The trip-planning hellloop</p>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 tracking-tight leading-tight">Sound familiar?</h2>
        </div>

        {/* Visual cycle - 3 cards with arrows between them */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2 relative">
          <HellCard
            n={1}
            emoji={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
            title="47 messages"
            quote='"Where should we meet?"'
            anim="barry-shake-msg"
          />
          <HellCard
            n={2}
            emoji={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></svg>}
            title="Same friend, longest commute"
            quote='"Marc, you live closest, you pick."'
            anim="barry-tilt"
          />
          <HellCard
            n={3}
            emoji={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>}
            title="Settling up sucks"
            quote='"Marc still owes me 47 EUR."'
            anim="barry-bounce-coin"
          />
        </div>

        {/* The escape hatch */}
        <div className="mt-6 flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-md border-2 border-emerald-200 dark:border-emerald-900/60">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">Barry breaks the loop in 6 minutes.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Setup once, decide together, settle automatically.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HellCard({ n, emoji, title, quote, anim }: { n: number; emoji: React.ReactNode; title: string; quote: string; anim: string }) {
  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm border border-rose-100 dark:border-rose-900/40">
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow-md">
        {n}
      </div>
      <div className={`w-10 h-10 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-2 ${anim}`}>
        {emoji}
      </div>
      <p className="font-bold text-[13px] text-slate-900 dark:text-slate-100 text-center leading-snug">{title}</p>
      <p className="text-[11px] text-rose-600 dark:text-rose-400 text-center italic mt-1 font-medium">{quote}</p>
    </div>
  );
}

/**
 * BarryRocksSection — concrete success scenarios where Barry would crush it.
 * Shows actual outcome ("Barry would have...") instead of a generic "Made for X" list.
 */
function BarryRocksSection() {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-start gap-3 mb-5">
          <BarryMascot mood="happy" size={56} animate={false} />
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Real scenarios</p>
            <h2 className="font-display font-extrabold text-2xl tracking-tight">Barry would have rocked it</h2>
          </div>
        </div>

        <div className="space-y-3">
          <RockCase
            scenario="Friday dinner, 5 friends, 5 metro lines."
            outcome="Barry picks the bistro at the fair midpoint near Bastille. 6 minutes, 0 group chat."
            icon={<><path d="M8 21h8M12 17v4M5 3h14l-2 11a4 4 0 01-4 3h-2a4 4 0 01-4-3L5 3z"/></>}
          />
          <RockCase
            scenario="Weekend in Barcelona, 6 friends, 3 departure cities."
            outcome="Barry finds the cheapest combined trains, splits the Airbnb evenly, books everything in 12 minutes."
            icon={<><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8"/></>}
          />
          <RockCase
            scenario="Cousin's bachelorette, 12 girls, scattered across France."
            outcome="Barry handles the polling, picks the venue with the lowest average commute, splits the dinner. No spreadsheet."
            icon={<><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"/></>}
          />
          <RockCase
            scenario="Family reunion, grandma in Brittany, brothers in 4 cities."
            outcome="Barry computes the fairest hub for everyone. Train tickets booked, hotel split, grandma's place mapped."
            icon={<><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></>}
          />
          <RockCase
            scenario="Team offsite, distributed remote crew."
            outcome="Barry computes the geographic centroid, pre-vetted hotels, books the conference room. Decision in 8 minutes."
            icon={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
          />
        </div>
      </div>
    </section>
  );
}

function RockCase({ scenario, outcome, icon }: { scenario: string; outcome: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3 backdrop-blur-sm border border-white/5">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-white leading-snug">{scenario}</p>
        <div className="flex items-start gap-1.5 mt-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
          <p className="text-[12px] text-emerald-300 leading-snug">{outcome}</p>
        </div>
      </div>
    </div>
  );
}

function PillarCard({ color, icon, title, subtitle }: { color: string; icon: React.ReactNode; title: string; subtitle: string }) {
  const bg: any = { blue: 'bg-blue-50 dark:bg-blue-950', orange: 'bg-orange-50', emerald: 'bg-emerald-50' };
  const fg: any = { blue: '#2563EB', orange: '#F97316', emerald: '#10B981' };
  return (
    <div className={`${bg[color] || 'bg-slate-50 dark:bg-slate-900'} rounded-2xl p-4`}>
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center mb-3 shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fg[color] || '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{subtitle}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-center">
      <p className="font-display font-extrabold text-2xl bg-gradient-to-br from-barry-blue to-blue-700 bg-clip-text text-transparent">{value}</p>
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// RETURNING USER VIEW (has trips)
// ============================================================
function ReturningUserView({ currentUser, trips, tab, setTab, activeTrips, pastTrips, archivedTrips, visible }: any) {
  return (
    <>
      {/* Single hero card: greeting + create CTA merged (no redundancy) */}
      <HeroCard currentUser={currentUser} activeCount={activeTrips.length} />

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-3">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'active' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Ongoing
          {activeTrips.length > 0 && (
            <span className="ml-1.5 text-[10px] font-bold bg-barry-blue text-white px-1.5 py-0.5 rounded-full">
              {activeTrips.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'past' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Past
          {pastTrips.length > 0 && (
            <span className="ml-1.5 text-[10px] font-bold bg-slate-300 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
              {pastTrips.length}
            </span>
          )}
        </button>
        {archivedTrips && archivedTrips.length > 0 && (
          <button
            onClick={() => setTab('archived')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'archived' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Archived
            <span className="ml-1.5 text-[10px] font-bold bg-slate-300 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
              {archivedTrips.length}
            </span>
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          {visible.map((trip: Trip, i: number) => (
            <div key={trip.id} className={i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}>
              <TripRow trip={trip} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tab === 'active' ? 'No ongoing trips right now.' :
             tab === 'archived' ? 'No archived trips.' : 'No past trips yet.'}
          </p>
        </div>
      )}
    </>
  );
}

/**
 * HeroCard - single combined greeting + create-new-Barry CTA. Replaces the
 * old "Hey Chloe" header + separate "Need help planning" tile, which were
 * redundant and felt cluttered.
 */
function HeroCard({ currentUser, activeCount }: { currentUser: any; activeCount: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href="/trips/new" className="block group mb-6">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 rounded-3xl p-5 border border-blue-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl active:scale-[0.99] transition-all overflow-hidden"
      >
        {/* Decorative blur circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200 dark:bg-blue-900/40 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-200 dark:bg-indigo-900/40 rounded-full blur-3xl opacity-50" />

        <div className="relative flex items-center gap-4">
          <div className={hovered ? 'barry-mascot-wiggle' : 'barry-mascot-idle'}>
            <BarryMascot mood="happy" size={68} animate={false} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Hey {currentUser?.firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              {activeCount > 0
                ? `You have ${activeCount} ongoing ${activeCount === 1 ? 'plan' : 'plans'}. Start another?`
                : 'Tap me to plan your next Barry.'}
            </p>
            <div className="flex items-center gap-1 mt-2 text-barry-blue text-xs font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>New Barry</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
