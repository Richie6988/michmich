'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/barry-mascot';
import type { TripType, TransportMode } from '@barry/shared-types';

const TRIP_TYPES: { value: TripType; label: string; icon: string }[] = [
  { value: 'dinner', label: 'Diner', icon: 'M3 3h18v18H3z' },
  { value: 'weekend', label: 'Weekend', icon: 'M21 10H3M16 2v4M8 2v4' },
  { value: 'evg', label: 'EVG', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77' },
  { value: 'evjf', label: 'EVJF', icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z' },
  { value: 'family', label: 'Famille', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
  { value: 'custom', label: 'Autre', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' },
];

const TRANSPORT_MODES: { value: TransportMode; label: string; icon: string }[] = [
  { value: 'walk', label: 'A pied', icon: 'M13 4a1 1 0 100-2 1 1 0 000 2zM9.5 18.5L7 22M16.5 13.5L19 17M10 16l-2-4 7-3 2 4' },
  { value: 'bike', label: 'Velo', icon: 'M5 18a3 3 0 100-6 3 3 0 000 6zM19 18a3 3 0 100-6 3 3 0 000 6zM12 18V6l4 6H7' },
  { value: 'transit', label: 'Metro/Bus', icon: 'M4 11V6a4 4 0 014-4h8a4 4 0 014 4v5M4 15v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 19v2M16 19v2M4 11h16' },
  { value: 'car', label: 'Voiture', icon: 'M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4zM5 9l2-4h10l2 4M3 13h18v4H3z' },
  { value: 'train', label: 'Train', icon: 'M4 4v13a3 3 0 003 3h10a3 3 0 003-3V4M4 11h16M9 20l-2 3M15 20l2 3M8 7h.01M16 7h.01' },
];

export default function CreateTripPage() {
  const router = useRouter();
  const createTrip = useAppStore(s => s.createTrip);
  const [name, setName] = useState('');
  const [type, setType] = useState<TripType>('dinner');
  const [date, setDate] = useState('');
  const [selectedModes, setSelectedModes] = useState<TransportMode[]>(['transit']);
  const [step, setStep] = useState(0); // 0 = name/type, 1 = date/modes

  const toggleMode = (mode: TransportMode) => {
    setSelectedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const trip = createTrip(name, type, date || new Date().toISOString());
    router.push(`/trips/${trip.id}`);
  };

  return (
    <div className="px-4 py-6">
      {/* Barry header */}
      <div className="text-center mb-8">
        <BarryMascot pose="friendly" size={100} />
        <h1 className="font-display font-bold text-2xl text-barry-black mt-4">
          {step === 0 ? 'Creer un Barry' : 'Dernieres infos'}
        </h1>
        <p className="text-barry-grey text-sm mt-1">
          {step === 0
            ? 'Dis-moi quel type de sortie tu prevois'
            : 'Quand et comment tout le monde se deplace ?'
          }
        </p>
      </div>

      {step === 0 ? (
        <>
          {/* Trip name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-barry-black mb-2">Nom de la sortie</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Diner vendredi, Weekend a Barry's..."
              className="barry-input text-base"
              autoFocus
            />
          </div>

          {/* Trip type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-barry-black mb-3">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TRIP_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    type === t.value
                      ? 'border-barry-blue bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke={type === t.value ? '#2563EB' : '#94A3B8'}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d={t.icon} />
                  </svg>
                  <span className={`text-xs font-medium ${type === t.value ? 'text-barry-blue' : 'text-barry-grey'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => name.trim() && setStep(1)}
            disabled={!name.trim()}
            className="btn-primary w-full"
          >
            Suivant
          </button>
        </>
      ) : (
        <>
          {/* Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-barry-black mb-2">Date et heure</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="barry-input text-base"
            />
          </div>

          {/* Transport modes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-barry-black mb-3">
              Modes de transport disponibles
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSPORT_MODES.map(m => {
                const selected = selectedModes.includes(m.value);
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleMode(m.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-barry-blue bg-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={selected ? '#2563EB' : '#94A3B8'}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d={m.icon} />
                    </svg>
                    <span className={`text-sm font-medium ${selected ? 'text-barry-blue' : 'text-barry-grey'}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1">
              Retour
            </button>
            <button onClick={handleCreate} className="btn-primary flex-1">
              Creer le Barry
            </button>
          </div>
        </>
      )}
    </div>
  );
}
