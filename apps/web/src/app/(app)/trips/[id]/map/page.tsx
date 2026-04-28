'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/barry-mascot';

// Mock equity zones for prototype
const MOCK_ZONES = [
  {
    id: 'z1', rank: 1, label: 'Le Marais', center: { lat: 48.8588, lng: 2.3622 },
    equityScore: 94.2, compositeScore: 91.5, maxBurden: 18.3, meanBurden: 14.7, stdDevBurden: 2.1,
    burdens: { u1: 16.2, u2: 18.3, u3: 12.1, u4: 12.2 },
    breakdowns: [
      { userId: 'u1', name: 'Chloe', duration: 22, distance: 3.8, cost: 2.15, mode: 'transit' },
      { userId: 'u2', name: 'Tom', duration: 25, distance: 4.2, cost: 2.15, mode: 'transit' },
      { userId: 'u3', name: 'Marc', duration: 8, distance: 2.1, cost: 0, mode: 'bike' },
      { userId: 'u4', name: 'Sarah', duration: 12, distance: 1.4, cost: 2.15, mode: 'transit' },
    ],
  },
  {
    id: 'z2', rank: 2, label: 'Bastille', center: { lat: 48.8531, lng: 2.3698 },
    equityScore: 88.7, compositeScore: 86.3, maxBurden: 21.5, meanBurden: 16.2, stdDevBurden: 3.4,
    burdens: { u1: 21.5, u2: 19.8, u3: 10.3, u4: 13.2 },
    breakdowns: [
      { userId: 'u1', name: 'Chloe', duration: 28, distance: 5.1, cost: 2.15, mode: 'transit' },
      { userId: 'u2', name: 'Tom', duration: 30, distance: 5.5, cost: 2.15, mode: 'transit' },
      { userId: 'u3', name: 'Marc', duration: 10, distance: 2.8, cost: 0, mode: 'bike' },
      { userId: 'u4', name: 'Sarah', duration: 6, distance: 0.8, cost: 2.15, mode: 'transit' },
    ],
  },
  {
    id: 'z3', rank: 3, label: 'Grands Boulevards', center: { lat: 48.8705, lng: 2.3465 },
    equityScore: 82.1, compositeScore: 80.9, maxBurden: 24.1, meanBurden: 17.8, stdDevBurden: 4.8,
    burdens: { u1: 10.1, u2: 12.3, u3: 24.1, u4: 24.7 },
    breakdowns: [
      { userId: 'u1', name: 'Chloe', duration: 12, distance: 1.9, cost: 2.15, mode: 'transit' },
      { userId: 'u2', name: 'Tom', duration: 15, distance: 2.4, cost: 2.15, mode: 'transit' },
      { userId: 'u3', name: 'Marc', duration: 18, distance: 4.5, cost: 0, mode: 'bike' },
      { userId: 'u4', name: 'Sarah', duration: 25, distance: 4.2, cost: 2.15, mode: 'transit' },
    ],
  },
];

function ZoneCard({ zone, selected, onSelect }: {
  zone: typeof MOCK_ZONES[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const equityColor = zone.equityScore >= 90 ? 'text-emerald-600' : zone.equityScore >= 80 ? 'text-amber-600' : 'text-red-500';
  const equityBg = zone.equityScore >= 90 ? 'bg-emerald-50' : zone.equityScore >= 80 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left barry-card transition-all duration-200 ${
        selected ? 'ring-2 ring-barry-blue shadow-md' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
            zone.rank === 1 ? 'bg-barry-green' : zone.rank === 2 ? 'bg-barry-yellow' : 'bg-barry-grey'
          }`}>
            {zone.rank}
          </div>
          <div>
            <h3 className="font-semibold text-barry-black text-sm">{zone.label}</h3>
            <p className="text-[11px] text-barry-grey">Zone {zone.rank}</p>
          </div>
        </div>
        <div className={`${equityBg} px-2.5 py-1 rounded-full`}>
          <span className={`text-xs font-bold ${equityColor}`}>
            {zone.equityScore}%
          </span>
        </div>
      </div>

      {/* Participant breakdown */}
      <div className="space-y-1.5">
        {zone.breakdowns.map(b => (
          <div key={b.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-barry-blue/10 flex items-center justify-center text-[9px] font-bold text-barry-blue">
                {b.name[0]}
              </div>
              <span className="text-xs text-barry-black">{b.name}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-barry-grey">
              <span>{b.duration} min</span>
              <span>{b.distance} km</span>
              <span className="font-medium text-barry-black">{b.cost > 0 ? `${b.cost} EUR` : 'Gratuit'}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-barry-blue">
            Zone selectionnee
          </span>
        </div>
      )}
    </button>
  );
}

export default function EquityMapPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { updateTripStatus } = useAppStore();
  const [selectedZone, setSelectedZone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calcProgress, setCalcProgress] = useState(0);

  useEffect(() => {
    // Simulate calculation progress
    const interval = setInterval(() => {
      setCalcProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = () => {
    updateTripStatus(id as string, 'voting');
    router.push(`/trips/${id}/vote`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <BarryMascot pose="thinking" size={140} animate />
        <h2 className="font-display font-bold text-xl mt-6 text-barry-black">
          Barry calcule...
        </h2>
        <p className="text-barry-grey text-sm mt-2 text-center max-w-xs">
          Analyse de {400} points, {4} participants, {3} modes de transport
        </p>
        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-barry-blue to-barry-green rounded-full transition-all duration-300"
            style={{ width: `${Math.min(calcProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-barry-grey mt-2">{Math.min(Math.round(calcProgress), 100)}%</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      {/* Header with Barry celebrating */}
      <div className="text-center mb-4">
        <BarryMascot pose="celebrating" size={80} />
        <h1 className="font-display font-bold text-xl text-barry-black mt-2">
          Barry a trouve 3 zones !
        </h1>
        <p className="text-barry-grey text-sm mt-1">
          Zones classees par equite. Choisis celle qui te plait.
        </p>
      </div>

      {/* Mock map visualization */}
      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-blue-100 via-green-50 to-amber-50">
        {/* Simplified map with zone indicators */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Grid pattern */}
          <svg width="100%" height="100%" className="absolute inset-0 opacity-10">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#64748B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Zone circles */}
          {MOCK_ZONES.map((z, i) => {
            const positions = [
              { x: '50%', y: '40%' },
              { x: '35%', y: '60%' },
              { x: '65%', y: '55%' },
            ];
            const sizes = [60, 50, 45];
            const colors = ['#10B981', '#F59E0B', '#94A3B8'];
            return (
              <div
                key={z.id}
                className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  selectedZone === i ? 'ring-4 ring-barry-blue/30 scale-110' : 'opacity-70'
                }`}
                style={{
                  left: positions[i].x,
                  top: positions[i].y,
                  width: sizes[i],
                  height: sizes[i],
                  backgroundColor: `${colors[i]}33`,
                  border: `3px solid ${colors[i]}`,
                  transform: `translate(-50%, -50%) ${selectedZone === i ? 'scale(1.1)' : ''}`,
                }}
                onClick={() => setSelectedZone(i)}
              >
                <span className="text-xs font-bold" style={{ color: colors[i] }}>
                  {z.rank}
                </span>
              </div>
            );
          })}

          {/* Participant pins */}
          {['Montmartre', 'Clignancourt', 'Republique', 'Bastille'].map((label, i) => {
            const pPositions = [
              { x: '45%', y: '15%' },
              { x: '55%', y: '10%' },
              { x: '60%', y: '35%' },
              { x: '65%', y: '70%' },
            ];
            return (
              <div
                key={label}
                className="absolute"
                style={{ left: pPositions[i].x, top: pPositions[i].y, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-4 h-4 rounded-full bg-barry-blue border-2 border-white shadow-sm" />
              </div>
            );
          })}
        </div>

        {/* Map label */}
        <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-[10px] text-barry-grey">
            Mapbox (connecter token pour la carte interactive)
          </span>
        </div>
      </div>

      {/* Zone cards */}
      <div className="space-y-3 mb-6">
        {MOCK_ZONES.map((zone, i) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            selected={selectedZone === i}
            onSelect={() => setSelectedZone(i)}
          />
        ))}
      </div>

      <button onClick={handleConfirm} className="btn-primary w-full">
        Lancer le vote pour {MOCK_ZONES[selectedZone].label}
      </button>
    </div>
  );
}
