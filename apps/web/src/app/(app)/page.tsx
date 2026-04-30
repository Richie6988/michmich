'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMark, BarryMascot } from '@/components/barry/brand';
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
        <div className="flex -space-x-2">
          {trip.participants.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
              style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6'][i % 4], zIndex: 4 - i }}
            >
              {p.user?.firstName?.[0] || '?'}
            </div>
          ))}
          {trip.participants.length > 3 && (
            <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 shadow-sm">
              +{trip.participants.length - 3}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-[15px] truncate mb-0.5">{trip.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[trip.status] || 'bg-slate-400'}`} />
            <span className="font-medium">{STATUS_LABEL[trip.status] || trip.status}</span>
            {date && <><span className="text-slate-300">·</span><span>{date}</span></>}
            {trip.mode && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {trip.mode === 'trip' ? '🏨' : '🍷'}
                </span>
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
  const { trips, currentUser } = useAppStore();
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const activeTrips = trips.filter(t => !['completed', 'cancelled'].includes(t.status));
  const pastTrips = trips.filter(t => ['completed', 'cancelled'].includes(t.status));
  const visible = tab === 'active' ? activeTrips : pastTrips;

  const hasTrips = trips.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <BarryMark size={26} />
            <span className="font-display font-extrabold text-xl text-barry-blue tracking-tight">Barry</span>
          </div>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-md hover:shadow-lg transition-shadow">
            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {hasTrips ? (
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
          <LandingView currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// LANDING VIEW (no trips yet) — marketing-style page
// ============================================================
function LandingView({ currentUser }: { currentUser: any }) {
  return (
    <>
      {/* HERO */}
      <section className="text-center pt-8 pb-10">
        <div className="inline-block mb-4">
          <BarryMascot mood="happy" size={120} />
        </div>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-[1.05] mb-3">
          Hey {currentUser?.firstName || 'there'}.
          <br />
          <span className="bg-gradient-to-r from-barry-blue via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Plans, sorted.
          </span>
        </h1>
        <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          The smart way to plan with friends. Barry finds where to meet, sorts the bills, books the trip — so you can actually enjoy it.
        </p>

        <Link href="/trips/new" className="inline-block mt-6">
          <div className="bg-gradient-to-r from-barry-blue to-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center gap-2">
            <span className="text-base">Create my first Barry</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
        <p className="text-[11px] text-slate-400 mt-2">Free · Solo or with friends · No app to download</p>
      </section>

      {/* WHY BARRY — 3 pillars */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <PillarCard
          color="blue"
          icon={<><circle cx="12" cy="10" r="3" /><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /></>}
          title="Fair to everyone"
          subtitle="Barry's algorithm spreads commute time so nobody gets the long haul. Quietly fair — no debates."
        />
        <PillarCard
          color="orange"
          icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
          title="Saves hours"
          subtitle="No more group chats trying to find a date, place, hotel. Barry runs it. You decide. Done in minutes."
        />
        <PillarCard
          color="emerald"
          icon={<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /></>}
          title="Splits everything"
          subtitle="Transport, hotel, dinner. Barry tracks who paid what, who owes what, settles in one tap."
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-1">How Barry works</h2>
        <p className="text-xs text-slate-500 mb-5">Four steps. No friction.</p>
        <div className="space-y-4">
          <BigStep n={1} color="from-blue-500 to-blue-700" title="Tell Barry what you want" desc="A Friday dinner? A weekend in Lisbon? Wanderlust or trip — pick one. Add friends optionally." />
          <BigStep n={2} color="from-orange-500 to-pink-600" title="Everyone's preferences" desc="Each person sets where they're coming from, transport mode, max time and budget. Barry handles the rest." />
          <BigStep n={3} color="from-emerald-500 to-teal-600" title="Barry suggests, you vote" desc="Fair venue zones, hotels, restaurants. You vote with thumbs up/down. Group's pick wins." />
          <BigStep n={4} color="from-violet-500 to-purple-700" title="Fund it, book it, enjoy it" desc="Each participant pays their share. Barry books it all. You get tickets, maps, contacts in your inbox." />
        </div>
      </section>

      {/* SOCIAL-PROOF / WHO IT'S FOR */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="font-display font-bold text-xl mb-1">Made for…</h2>
          <p className="text-xs text-slate-400 mb-4">Whoever's been the de facto trip organizer.</p>
          <div className="space-y-2.5">
            <UseCase emoji="🍷" title="Friday dinners" desc="Five friends, five corners of the city. Barry picks the bistro." />
            <UseCase emoji="🏨" title="Weekend trips" desc="Three nights in Barcelona, six people, three departure cities. Done." />
            <UseCase emoji="💍" title="EVG / EVJF / weddings" desc="The whole crew, fairly. Even Bertrand from Lille gets a fair shake." />
            <UseCase emoji="👨‍👩‍👧" title="Family reunions" desc="Grandma in Brittany, brothers scattered. Meet in the middle." />
            <UseCase emoji="💼" title="Team offsites" desc="Distributed teams. Barry computes the fairest hub." />
          </div>
        </div>
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
    </>
  );
}

function PillarCard({ color, icon, title, subtitle }: { color: string; icon: React.ReactNode; title: string; subtitle: string }) {
  const bg = { blue: 'bg-blue-50', orange: 'bg-orange-50', emerald: 'bg-emerald-50' }[color] || 'bg-slate-50';
  const fg = { blue: '#2563EB', orange: '#F97316', emerald: '#10B981' }[color] || '#64748B';
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <h3 className="font-display font-bold text-sm text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-600 leading-snug">{subtitle}</p>
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

function UseCase({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-xl px-3 py-2.5 backdrop-blur-sm">
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-slate-300 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

// ============================================================
// RETURNING USER VIEW (has trips)
// ============================================================
function ReturningUserView({ currentUser, trips, tab, setTab, activeTrips, pastTrips, visible }: any) {
  return (
    <>
      {/* Greeting + mascot */}
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

      {/* Primary CTA */}
      <Link href="/trips/new" className="block group mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-barry-blue to-blue-700 text-white rounded-3xl p-5 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.99] transition-all">
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

      {/* Tabs */}
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
