'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import type { Reservation } from '@barry/shared-types';

const TYPE_ICON: Record<string, JSX.Element> = {
  venue: <><path d="M3 2v7c0 1.1.9 2 2 2h2v9M21 6h-3v3a3 3 0 003 3v9M11 7H7M11 11H7M11 15H7" /></>,
  accommodation: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
  transport: <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h8a3 3 0 003-3 3 3 0 00-3-3H7a3 3 0 01-3-3 3 3 0 013-3h8" /></>,
};

const TYPE_COLOR: Record<string, string> = {
  venue: '#F97316', accommodation: '#8B5CF6', transport: '#2563EB',
};

const TYPE_LABEL: Record<string, string> = {
  venue: 'Venue', accommodation: 'Stay', transport: 'Transport',
};

export default function BookingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { reservations, performBookings, activeTrip, trips } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);

  const [phase, setPhase] = useState<'ready' | 'booking' | 'done'>('ready');
  const [progress, setProgress] = useState(0);

  const tripReservations = reservations[id as string] || [];

  useEffect(() => {
    if (tripReservations.length > 0) setPhase('done');
  }, [tripReservations.length]);

  const handleBook = async () => {
    setPhase('booking');
    // Simulate API calls with progress
    for (let p = 0; p <= 100; p += 10) {
      setProgress(p);
      await new Promise(r => setTimeout(r, 150));
    }
    performBookings(id as string);
    setPhase('done');
  };

  if (!trip) return null;

  if (phase === 'booking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-extrabold text-2xl mt-6 text-slate-900 tracking-tight">
          Barry is booking
        </h2>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          Reserving venues, accommodation, and transport...
        </p>
        <div className="w-64 mt-6 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-barry-blue to-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2 font-mono">{progress}%</p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="px-4 py-6 pb-32">
        <div className="text-center mb-6">
          <BarryMascot mood="celebrating" size={120} />
          <h1 className="font-display font-extrabold text-3xl text-slate-900 mt-3 tracking-tight">
            All booked
          </h1>
          <p className="text-sm text-slate-500 mt-1">Your trip is locked in.</p>
        </div>

        <div className="space-y-2 mb-4">
          {tripReservations.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-emerald-200 p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${TYPE_COLOR[r.type]}15` }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR[r.type]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {TYPE_ICON[r.type]}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{r.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{r.confirmationCode}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{r.amount.toFixed(2)} EUR</p>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    {r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push(`/trips/${id}` as any)}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          Back to trip
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-3">
          Confirmation emails sent to all participants. After the trip, head to Expenses to settle.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-32">
      <div className="text-center mb-6">
        <BarryMascot mood="happy" size={100} />
        <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
          Ready to book
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Funds collected. Tap below and Barry locks in everything.
        </p>
      </div>

      <button
        onClick={handleBook}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
      >
        Book everything now
      </button>
      <p className="text-center text-[11px] text-slate-400 mt-3">
        Demo mode: simulated bookings with confirmation codes.
      </p>
    </div>
  );
}
