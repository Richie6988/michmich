'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import type { TripType } from '@barry/shared-types';

const TRIP_TYPES: { value: TripType; label: string; icon: JSX.Element; color: string }[] = [
  { value: 'dinner', label: 'Diner', color: '#F97316', icon: <><path d="M7 2v20M17 2v6c0 2 1 3 3 3v11M3 11h8M3 7h8" /></> },
  { value: 'weekend', label: 'Weekend', color: '#10B981', icon: <><path d="M21 10H3M16 2v4M8 2v4M3 6h18v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /></> },
  { value: 'evg', label: 'EVG', color: '#8B5CF6', icon: <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77" /></> },
  { value: 'evjf', label: 'EVJF', color: '#EC4899', icon: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></> },
  { value: 'family', label: 'Famille', color: '#3B82F6', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></> },
  { value: 'custom', label: 'Autre', color: '#64748B', icon: <><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></> },
];

export default function CreateTripPage() {
  const router = useRouter();
  const createGroupTrip = useAppStore(s => s.createGroupTrip);
  const [name, setName] = useState('');
  const [type, setType] = useState<TripType>('dinner');
  const [date, setDate] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const trip = createGroupTrip(name, type, date || new Date(Date.now() + 3 * 86400000).toISOString());
    router.push(`/trips/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-32">
      {/* Header */}
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
        {/* Hero */}
        <div className="text-center mb-6">
          <BarryMascot mood="default" size={80} />
          <h1 className="font-display font-extrabold text-2xl text-barry-black mt-3 tracking-tight">
            Cree ton Barry
          </h1>
          <p className="text-barry-grey text-sm mt-1.5 max-w-xs mx-auto">
            Donne-lui un nom, choisis le type, c'est parti !
          </p>
        </div>

        {/* Name */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2">
            Nom de la sortie
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Diner du vendredi, Weekend a Lyon..."
            className="w-full text-lg font-display font-semibold text-barry-black placeholder:text-gray-300 placeholder:font-normal focus:outline-none"
            autoFocus
          />
        </div>

        {/* Type */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3">
            Type de sortie
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TRIP_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                  type === t.value
                    ? 'border-barry-blue bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: type === t.value ? t.color : `${t.color}15` }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={type === t.value ? 'white' : t.color}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {t.icon}
                  </svg>
                </div>
                <span className={`text-[11px] font-medium ${type === t.value ? 'text-barry-blue' : 'text-barry-grey'}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2">
            Date et heure
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-base font-medium text-barry-black focus:outline-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Creer le Barry
        </button>

        <p className="text-center text-[11px] text-barry-grey mt-4">
          Tu pourras inviter tes amis a l'etape suivante.
        </p>
      </main>
    </div>
  );
}
