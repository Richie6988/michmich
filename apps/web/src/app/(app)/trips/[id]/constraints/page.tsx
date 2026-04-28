'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark, BarryLoader } from '@/components/barry/brand';

const MODES = [
  { value: 'walk', label: 'A pied', color: '#10B981' },
  { value: 'bike', label: 'Velo', color: '#3B82F6' },
  { value: 'transit', label: 'Metro', color: '#8B5CF6' },
  { value: 'car', label: 'Voiture', color: '#F97316' },
];

export default function ConstraintsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, updateTripStatus } = useAppStore();
  const [mode, setMode] = useState('transit');
  const [maxTime, setMaxTime] = useState(45);
  const [maxBudget, setMaxBudget] = useState(10);
  const [weight, setWeight] = useState(0.5); // 0=time priority, 1=money priority
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (id && !activeTrip) setActiveTrip(id as string);
  }, [id, activeTrip, setActiveTrip]);

  const handleSubmit = () => {
    setSubmitted(true);
    // Simulate delay then navigate to map
    setTimeout(() => {
      updateTripStatus(id as string, 'calculating');
      router.push(`/trips/${id}/map`);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <BarryMascot mood="celebrating" size={80} />
        <h2 className="font-display font-bold text-xl mt-6 text-barry-black">Contraintes envoyees !</h2>
        <p className="text-barry-grey text-sm mt-2">Barry calcule le point ideal...</p>
        <div className="mt-6 flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-barry-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <BarryMascot mood="default" size={72} />
        <h1 className="font-display font-bold text-xl text-barry-black mt-3">
          Tes contraintes
        </h1>
        <p className="text-barry-grey text-sm mt-1">
          Dis a Barry tes limites, il trouvera le compromis ideal.
        </p>
      </div>

      {/* Transport mode */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-barry-black mb-3">Comment tu te deplaceras ?</label>
        <div className="flex gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                mode === m.value ? 'border-barry-blue bg-blue-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: mode === m.value ? m.color : '#E2E8F0' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className={`text-[11px] font-medium ${mode === m.value ? 'text-barry-blue' : 'text-barry-grey'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Max time slider */}
      <div className="mb-6 barry-card">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-barry-black">Temps max de trajet</label>
          <span className="text-lg font-bold text-barry-blue">{maxTime} min</span>
        </div>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={maxTime}
          onChange={e => setMaxTime(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-blue"
        />
        <div className="flex justify-between text-[10px] text-barry-grey mt-1">
          <span>5 min</span>
          <span>1h</span>
          <span>2h</span>
        </div>
      </div>

      {/* Max budget slider */}
      <div className="mb-6 barry-card">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-barry-black">Budget transport max</label>
          <span className="text-lg font-bold text-barry-coral">{maxBudget} EUR</span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={1}
          value={maxBudget}
          onChange={e => setMaxBudget(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-coral"
        />
        <div className="flex justify-between text-[10px] text-barry-grey mt-1">
          <span>Gratuit</span>
          <span>25 EUR</span>
          <span>50 EUR</span>
        </div>
      </div>

      {/* Priority weight */}
      <div className="mb-8 barry-card">
        <label className="block text-sm font-medium text-barry-black mb-3">
          Qu'est-ce qui compte le plus ?
        </label>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${weight < 0.4 ? 'text-barry-blue' : 'text-barry-grey'}`}>
            Temps
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weight}
            onChange={e => setWeight(Number(e.target.value))}
            className="flex-1 h-2 bg-gradient-to-r from-barry-blue to-barry-coral rounded-full appearance-none cursor-pointer"
          />
          <span className={`text-sm font-semibold ${weight > 0.6 ? 'text-barry-coral' : 'text-barry-grey'}`}>
            Budget
          </span>
        </div>
      </div>

      {/* Participants status */}
      {activeTrip && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3">
            Statut du groupe
          </h3>
          <div className="space-y-2">
            {activeTrip.participants.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-barry-blue/10 flex items-center justify-center text-xs font-bold text-barry-blue">
                    {p.user?.firstName?.[0]}
                  </div>
                  <span className="text-sm text-barry-black">{p.user?.firstName}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.status === 'constraints_set' ? 'bg-emerald-50 text-emerald-700' :
                  p.status === 'accepted' ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {p.status === 'constraints_set' ? 'Pret' : p.status === 'accepted' ? 'En attente' : 'Invite'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleSubmit} className="btn-primary w-full">
        Envoyer mes contraintes
      </button>
    </div>
  );
}
