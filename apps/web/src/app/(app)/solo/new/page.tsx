'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import type { TransportMode } from '@barry/shared-types';

const MODES: { value: TransportMode; label: string; icon: JSX.Element }[] = [
  { value: 'walk', label: 'A pied', icon: <path d="M13 4a2 2 0 100-4 2 2 0 000 4zm-3.5 5.5L6 13l2 4 2-2 1 4h2l-1-7m-3-3.5l1-2h3l3 3-1 1-3-2" /> },
  { value: 'bike', label: 'Velo', icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'transit', label: 'Metro', icon: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19l-2 3M16 19l2 3M8 7h.01M16 7h.01" /></> },
  { value: 'car', label: 'Voiture', icon: <><path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path d="M2 13l1.5-5A2 2 0 015.5 7h13a2 2 0 011.94 1.5L22 13M2 13h20M5 17H3v-4" /></> },
  { value: 'train', label: 'Train', icon: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></> },
];

export default function SoloNewPage() {
  const router = useRouter();
  const { userLocation, createSoloTrip } = useAppStore();

  const [originLabel, setOriginLabel] = useState('Ma position');
  const [maxTime, setMaxTime] = useState(60);
  const [maxBudget, setMaxBudget] = useState(15);
  const [selectedModes, setSelectedModes] = useState<TransportMode[]>(['transit', 'walk']);
  const [submitting, setSubmitting] = useState(false);

  const toggleMode = (mode: TransportMode) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleSubmit = async () => {
    if (!userLocation || selectedModes.length === 0) return;
    setSubmitting(true);

    // Simulate calculation delay
    await new Promise(r => setTimeout(r, 1200));

    const trip = createSoloTrip({
      name: `Decouverte ${new Date().toLocaleDateString('fr-FR')}`,
      origin: userLocation,
      originLabel,
      modes: selectedModes,
      maxTime,
      maxBudget,
    });
    router.push(`/solo/${trip.id}`);
  };

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-bold text-2xl text-barry-black mt-6">
          Barry cherche...
        </h2>
        <p className="text-barry-grey text-sm mt-2 text-center max-w-xs">
          Analyse des spots dans un rayon de {maxTime} minutes
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pb-32">
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
            Decouvre autour de toi
          </h1>
          <p className="text-barry-grey text-sm mt-1.5 max-w-xs mx-auto">
            Dis a Barry ce qui te plait, il te trouve les meilleurs spots.
          </p>
        </div>

        {/* Origin */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-barry-grey font-medium">Point de depart</p>
              <p className="font-semibold text-barry-black">{originLabel}</p>
              {userLocation && (
                <p className="text-[11px] text-barry-grey font-mono">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modes */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3">
            Comment je me deplace
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MODES.map(m => {
              const selected = selectedModes.includes(m.value);
              return (
                <button
                  key={m.value}
                  onClick={() => toggleMode(m.value)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-barry-coral bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={selected ? '#F97316' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {m.icon}
                  </svg>
                  <span className={`text-[10px] font-medium ${selected ? 'text-orange-700' : 'text-barry-grey'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedModes.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-2">Choisis au moins un mode de transport</p>
          )}
        </div>

        {/* Max time */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-barry-grey uppercase tracking-wider">Temps max</label>
            <span className="text-xl font-display font-bold text-barry-blue">
              {maxTime < 60 ? `${maxTime} min` : `${(maxTime / 60).toFixed(maxTime % 60 === 0 ? 0 : 1)}h`}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={240}
            step={15}
            value={maxTime}
            onChange={e => setMaxTime(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-blue"
          />
          <div className="flex justify-between text-[10px] text-barry-grey mt-1.5">
            <span>15 min</span><span>1h</span><span>2h</span><span>4h</span>
          </div>
        </div>

        {/* Max budget */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-barry-grey uppercase tracking-wider">Budget transport</label>
            <span className="text-xl font-display font-bold text-barry-coral">
              {maxBudget === 0 ? 'Gratuit' : `${maxBudget} EUR`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={maxBudget}
            onChange={e => setMaxBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-coral"
          />
          <div className="flex justify-between text-[10px] text-barry-grey mt-1.5">
            <span>0 EUR</span><span>50 EUR</span><span>100 EUR</span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={selectedModes.length === 0 || !userLocation}
          className="w-full bg-gradient-to-r from-barry-coral to-orange-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trouve les spots
        </button>
      </main>
    </div>
  );
}
