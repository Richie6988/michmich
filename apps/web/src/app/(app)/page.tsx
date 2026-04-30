'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
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
  const date = trip.scheduledAt ? formatDateShort(trip.scheduledAt) : null;
  const href: any = `/trips/${trip.id}`;
  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-3 py-3 px-3 hover:bg-slate-50 rounded-xl transition-colors">
        <AvatarStack users={trip.participants.map(p => p.user)} max={3} size={36} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-[15px] truncate mb-0.5">{trip.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { trips, currentUser, isAuthenticated, isGuest, logout } = useAppStore();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [menuOpen, setMenuOpen] = useState(false);

  const activeTrips = trips.filter(t => !['completed', 'cancelled'].includes(t.status));
  const pastTrips = trips.filter(t => ['completed', 'cancelled'].includes(t.status));
  const visible = tab === 'active' ? activeTrips : pastTrips;
  const hasTrips = trips.length > 0;
  const showAuthedExperience = isAuthenticated && !isGuest && hasTrips;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <BarryMark size={26} />
            <span className="font-display font-extrabold text-xl text-barry-blue tracking-tight">Barry</span>
          </div>

          {/* Auth corner: avatar+menu if logged, Login button if not */}
          {isAuthenticated && !isGuest && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-full pl-2 pr-1 py-1 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-700 max-w-[90px] truncate hidden sm:inline">
                  {currentUser.firstName}
                </span>
                <Avatar user={currentUser} size={36} className="shadow-md" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 w-56 z-40">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 1116 0" />
                      </svg>
                      Profile & preferences
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </>
              )}
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
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-[1.05] mb-3">
          Stop arguing about{' '}
          <span className="bg-gradient-to-r from-barry-blue via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            where to meet.
          </span>
        </h1>
        <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          Barry is the smart way to plan with friends. He picks the fairest spot, splits the bills,
          books your transport — and your hotel if you're going far.
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
          {showAuthCTA && (
            <Link href="/login" className="text-barry-blue font-semibold hover:underline self-center">
              Already have an account? Sign in
            </Link>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">No credit card · Solo or with friends · Web-based, nothing to install</p>
      </section>

      {/* THE PROBLEM Barry solves */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <div className="text-center mb-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">The trip-planning hellloop</p>
          <h2 className="font-display font-bold text-xl text-slate-900 mt-1">Sound familiar?</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProblemCard
            iconColor="#E11D48"
            icon={<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>}
            title="Endless group chat"
            desc='"Where should we meet?" then 47 messages then no decision.'
          />
          <ProblemCard
            iconColor="#E11D48"
            icon={<><circle cx="12" cy="10" r="3"/><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/></>}
            title="Always the same person travels far"
            desc="That one friend who's always stuck with the longest commute."
          />
          <ProblemCard
            iconColor="#E11D48"
            icon={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></>}
            title="Settling up later is awful"
            desc='"Wait, who paid for the Airbnb? Marc still owes me 47 EUR."'
          />
        </div>
      </section>

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

      {/* HOW IT WORKS */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-1">How Barry works</h2>
        <p className="text-xs text-slate-500 mb-5">Four steps. No friction.</p>
        <div className="space-y-4">
          <BigStep n={1} color="from-blue-500 to-blue-700" title="Tell Barry what you want" desc="A Friday dinner? A weekend in Lisbon? Wanderlust or trip — pick one. Add friends." />
          <BigStep n={2} color="from-orange-500 to-pink-600" title="Everyone's preferences" desc="Each person sets their starting point, transport mode, budget. Barry handles the math." />
          <BigStep n={3} color="from-emerald-500 to-teal-600" title="Barry suggests, you vote" desc="Fair venue zones, hotels, restaurants, activities. You vote with thumbs. Group's pick wins." />
          <BigStep n={4} color="from-violet-500 to-purple-700" title="Fund it, book it, enjoy it" desc="Each pays their share. Barry books it all. Tickets, maps, contacts in your inbox." />
        </div>
      </section>

      {/* MADE FOR */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="font-display font-bold text-xl mb-1">Made for…</h2>
          <p className="text-xs text-slate-400 mb-4">Whoever's been the de facto trip organizer.</p>
          <div className="space-y-2.5">
            <UseCase
              icon={<><path d="M8 21h8M12 17v4M5 3h14l-2 11a4 4 0 01-4 3h-2a4 4 0 01-4-3L5 3z"/></>}
              title="Friday dinners"
              desc="Five friends, five corners of the city. Barry picks the bistro."
            />
            <UseCase
              icon={<><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8"/></>}
              title="Weekend trips"
              desc="Three nights in Barcelona, six people, three departure cities. Done."
            />
            <UseCase
              icon={<><path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21z"/></>}
              title="EVG / EVJF / weddings"
              desc="The whole crew, fairly. Even Bertrand from Lille gets a fair shake."
            />
            <UseCase
              icon={<><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87"/></>}
              title="Family reunions"
              desc="Grandma in Brittany, brothers scattered. Meet in the middle."
            />
            <UseCase
              icon={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
              title="Team offsites"
              desc="Distributed teams. Barry computes the fairest hub."
            />
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <Stat value="6 min" label="Avg setup time" />
        <Stat value="40+" label="Loyalty cards supported" />
        <Stat value="0 €" label="To start" />
      </section>

      {/* FINAL CTA */}
      <section className="text-center py-6">
        <p className="font-display font-bold text-2xl text-slate-900 mb-1">Ready to plan something?</p>
        <p className="text-sm text-slate-500 mb-4">Free, no friction, takes a minute.</p>
        <Link href="/trips/new">
          <div className="inline-block bg-gradient-to-r from-barry-blue to-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-[0.98] transition-all">
            Create my first Barry
          </div>
        </Link>
      </section>

      <footer className="border-t border-slate-200 pt-6 mt-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <Link href="/legal/terms" className="hover:text-slate-700">Terms</Link>
          <span>·</span>
          <Link href="/legal/privacy" className="hover:text-slate-700">Privacy</Link>
          <span>·</span>
          <Link href="/legal/cookies" className="hover:text-slate-700">Cookies</Link>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Made with care for everyone tired of group chats.</p>
      </footer>
    </>
  );
}

function PillarCard({ color, icon, title, subtitle }: { color: string; icon: React.ReactNode; title: string; subtitle: string }) {
  const bg: any = { blue: 'bg-blue-50', orange: 'bg-orange-50', emerald: 'bg-emerald-50' };
  const fg: any = { blue: '#2563EB', orange: '#F97316', emerald: '#10B981' };
  return (
    <div className={`${bg[color] || 'bg-slate-50'} rounded-2xl p-4`}>
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fg[color] || '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <h3 className="font-display font-bold text-sm text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 leading-snug">{subtitle}</p>
    </div>
  );
}

function ProblemCard({ iconColor, icon, title, desc }: { iconColor: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-rose-50 rounded-2xl p-3 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <p className="font-bold text-[13px] text-slate-900 mb-1">{title}</p>
      <p className="text-[11px] text-slate-600 leading-snug">{desc}</p>
    </div>
  );
}

function BigStep({ n, color, title, desc }: { n: number; color: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-md`}>
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-bold text-sm text-slate-900 mb-0.5">{title}</p>
        <p className="text-xs text-slate-600 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function UseCase({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2.5 backdrop-blur-sm">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-slate-300 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
      <p className="font-display font-extrabold text-2xl bg-gradient-to-br from-barry-blue to-blue-700 bg-clip-text text-transparent">{value}</p>
      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

// ============================================================
// RETURNING USER VIEW (has trips)
// ============================================================
function ReturningUserView({ currentUser, trips, tab, setTab, activeTrips, pastTrips, visible }: any) {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <BarryMascot mood="default" size={64} animate={false} />
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            Hey {currentUser?.firstName}.
          </h1>
          <p className="text-sm text-slate-500">
            {activeTrips.length > 0
              ? `${activeTrips.length} ongoing ${activeTrips.length === 1 ? 'plan' : 'plans'}.`
              : 'Where the smart group meets.'}
          </p>
        </div>
      </div>

      <Link href="/trips/new" className="block group mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-barry-blue to-blue-700 text-white rounded-3xl p-5 shadow-xl shadow-blue-500/20 hover:shadow-2xl active:scale-[0.99] transition-all">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="font-display font-extrabold text-xl tracking-tight">New Barry</p>
                <p className="text-xs text-white/80 mt-0.5">Wanderlust or trip — your call</p>
              </div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" className="opacity-80 group-hover:translate-x-1 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-3">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
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
            tab === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Past
          {pastTrips.length > 0 && (
            <span className="ml-1.5 text-[10px] font-bold bg-slate-300 text-slate-700 px-1.5 py-0.5 rounded-full">
              {pastTrips.length}
            </span>
          )}
        </button>
      </div>

      {visible.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          {visible.map((trip: Trip, i: number) => (
            <div key={trip.id} className={i > 0 ? 'border-t border-slate-100' : ''}>
              <TripRow trip={trip} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <p className="text-sm text-slate-500">
            {tab === 'active' ? 'No ongoing trips right now.' : 'No past trips yet.'}
          </p>
        </div>
      )}
    </>
  );
}
