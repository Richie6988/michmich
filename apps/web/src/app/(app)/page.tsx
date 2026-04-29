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
  // Always go to the trip overview - the next-step card guides the user from there
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
            <span>{STATUS_LABEL[trip.status] || trip.status}</span>
            {date && <><span>·</span><span>{date}</span></>}
            <span>·</span>
            <span>{trip.participants.length} {trip.participants.length > 1 ? 'people' : 'person'}</span>
          </div>
        </div>

        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 group-hover:stroke-barry-blue transition-colors">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <BarryMark size={26} />
            <span className="font-display font-extrabold text-barry-blue text-lg tracking-tight">Barry</span>
          </div>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Profile and settings"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-barry-blue to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Hero / Greeting */}
        <div className="flex items-center gap-3 mb-6">
          <BarryMascot mood="default" size={64} animate={false} />
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Hey {currentUser?.firstName}.
            </h1>
            <p className="text-sm text-slate-500">Where the smart group meets.</p>
          </div>
        </div>

        {/* Primary CTA: Create new Barry */}
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
                  <p className="text-xs text-white/80 mt-0.5">Plan a trip - solo or with friends</p>
                </div>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" className="opacity-80 group-hover:translate-x-1 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Trips list */}
        {trips.length === 0 ? (
          <FirstTimeOnboarding />
        ) : (
          <div>
            {/* Tab switcher: active vs past */}
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
                {visible.map((trip, i) => (
                  <div key={trip.id} className={i > 0 ? 'border-t border-slate-100' : ''}>
                    <TripRow trip={trip} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-sm text-slate-500">
                  {tab === 'active' ? 'No active trips right now.' : 'No past trips yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FirstTimeOnboarding() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h3 className="font-display font-bold text-base text-slate-900 mb-4">How Barry works</h3>
      <div className="space-y-4">
        <Step n={1} title="Create a Barry" desc="Name your trip. Solo or with friends - same flow." />
        <Step n={2} title="Set preferences" desc="Time, budget, transport mode. Pick a date if it's a group trip." />
        <Step n={3} title="Get the spot" desc="Barry finds the fairest place on the map and shows it to everyone." />
        <Step n={4} title="Book and split" desc="Reserve in one tap. Track expenses and settle up after." />
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-50 text-barry-blue font-bold text-xs flex items-center justify-center flex-shrink-0">
        {n}
      </div>
      <div>
        <p className="font-medium text-sm text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
