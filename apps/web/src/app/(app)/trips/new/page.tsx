'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

export default function CreateTripPage() {
  const router = useRouter();
  const createGroupTrip = useAppStore(s => s.createGroupTrip);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const trip = createGroupTrip(
      name,
      'custom',
      date || new Date(Date.now() + 3 * 86400000).toISOString()
    );
    router.push(`/trips/${trip.id}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-32">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="-ml-2 p-2 hover:bg-gray-100 rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <BarryMark size={22} />
            <span className="font-display font-bold text-barry-blue">Barry</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <BarryMascot mood="default" size={80} />
          <h1 className="font-display font-extrabold text-2xl text-barry-black mt-3 tracking-tight">
            Plan a meet-up
          </h1>
          <p className="text-barry-grey text-sm mt-1.5 max-w-xs mx-auto">
            Name it. We'll handle the rest. Invite friends after if you want.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2">
            Name your trip
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Friday dinner, Marc's birthday, weekend in Lyon..."
            className="w-full text-lg font-display font-semibold text-barry-black placeholder:text-gray-300 placeholder:font-normal focus:outline-none"
            autoFocus
          />
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2">
            When (optional)
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-base font-medium text-barry-black focus:outline-none"
          />
          <p className="text-[11px] text-barry-grey mt-2">
            You can leave this blank and decide later.
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create my Barry
        </button>

        <p className="text-center text-[11px] text-barry-grey mt-4">
          Next: invite friends, set constraints, get the fairest spot.
        </p>
      </main>
    </div>
  );
}
