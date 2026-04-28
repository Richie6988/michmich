'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { MapMarker, SoloDestination, TransportMode } from '@barry/shared-types';

const VENUE_ICONS: Record<string, string> = {
  restaurant: 'M7 2v20M17 2v6c0 2 1 3 3 3v11M3 11h8M3 7h8',
  bar: 'M3 5h18l-9 9-9-9zm9 9v6m-4 0h8',
  hotel: 'M3 21V8l9-4 9 4v13M9 21v-8h6v8',
  museum: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6',
  park: 'M12 2L8 8h3v6h2V8h3l-4-6zM5 14h14l-2 7H7l-2-7z',
  activity: 'M12 2l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z',
  bar_default: 'M12 2L2 22h20L12 2z',
  other: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z',
};

const COLORS = ['#10B981', '#F97316', '#8B5CF6', '#3B82F6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];

export default function SoloResultsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeSoloTrip, setActiveSoloTrip, soloTrips } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (id) setActiveSoloTrip(id as string);
  }, [id, setActiveSoloTrip]);

  const trip = activeSoloTrip || soloTrips.find(t => t.id === id);

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <BarryMascot mood="thinking" size={120} />
        <h2 className="font-display font-bold text-xl mt-6">Sortie introuvable</h2>
        <button onClick={() => router.push('/')} className="mt-4 text-barry-blue font-medium">
          Retour a la carte
        </button>
      </div>
    );
  }

  const selected = selectedId
    ? trip.destinations.find(d => d.id === selectedId)
    : trip.destinations[0];

  // Build markers
  const markers: MapMarker[] = [
    { id: 'origin', position: trip.origin, type: 'user' },
    ...trip.destinations.slice(0, 8).map((d, i) => ({
      id: d.id,
      position: d.venue.location,
      type: 'pin' as const,
      color: COLORS[i % COLORS.length],
      rank: i + 1,
      onClick: () => setSelectedId(d.id),
    })),
  ];

  return (
    <div className="fixed inset-0 bg-barry-canvas">
      {/* Map */}
      <div className="absolute inset-0">
        <BarryMap
          center={trip.origin}
          zoom={13}
          markers={markers}
          selectedMarkerId={selectedId || trip.destinations[0]?.id}
          height="100%"
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-md">
            <div className="text-xs text-barry-grey">Solo - {trip.destinations.length} spots trouves</div>
            <div className="text-sm font-semibold text-barry-black truncate">{trip.originLabel}</div>
          </div>
        </div>
      </div>

      {/* Bottom sheet with destinations */}
      <BottomSheet snapPoints={[0.2, 0.55, 0.92]} initialSnap={1}>
        <div className="pb-6">
          <div className="flex items-center justify-between mb-3 mt-1">
            <h2 className="font-display font-bold text-lg text-barry-black">
              {trip.destinations.length} spots pour toi
            </h2>
            <span className="text-xs text-barry-grey">Tries par pertinence</span>
          </div>

          <div className="space-y-2">
            {trip.destinations.slice(0, 12).map((dest, i) => (
              <DestinationCard
                key={dest.id}
                dest={dest}
                rank={i + 1}
                color={COLORS[i % COLORS.length]}
                selected={selected?.id === dest.id}
                onSelect={() => setSelectedId(dest.id)}
              />
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function DestinationCard({
  dest, rank, color, selected, onSelect,
}: {
  dest: SoloDestination;
  rank: number;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const fastestMode = Object.entries(dest.durations).reduce((a, b) => b[1] < a[1] ? b : a);
  const cheapestMode = Object.entries(dest.costs).reduce((a, b) => b[1] < a[1] ? b : a);
  const matchColor = dest.matchScore >= 80 ? '#10B981' : dest.matchScore >= 60 ? '#F59E0B' : '#94A3B8';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-2xl p-3.5 border transition-all ${
        selected
          ? 'border-barry-coral shadow-md ring-2 ring-orange-200/50'
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm shadow-sm"
          style={{ backgroundColor: color }}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-barry-black text-[15px] truncate">{dest.venue.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: matchColor }}>
                {dest.matchScore}%
              </span>
            </div>
          </div>

          <p className="text-xs text-barry-grey truncate mb-2">
            {dest.venue.description}
          </p>

          {/* Travel modes summary */}
          <div className="flex items-center gap-3 text-[11px] text-barry-black">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{fastestMode[1]} min</span>
              <span className="text-barry-grey">({modeLabel(fastestMode[0] as TransportMode)})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{cheapestMode[1] === 0 ? 'Gratuit' : `${cheapestMode[1]} EUR`}</span>
            </div>
          </div>

          {/* Highlights */}
          {dest.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {dest.highlights.slice(0, 3).map(h => (
                <span key={h} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded actions when selected */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          <BookActionButton icon="restaurant" label="Reserver" disabled />
          <BookActionButton icon="train" label="Y aller" />
          <BookActionButton icon="hotel" label="Hotel" disabled />
        </div>
      )}
    </button>
  );
}

function BookActionButton({ icon, label, disabled }: { icon: string; label: string; disabled?: boolean }) {
  const icons: Record<string, JSX.Element> = {
    restaurant: <><path d="M7 2v20M17 2v6c0 2 1 3 3 3v11M3 11h8M3 7h8" /></>,
    train: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></>,
    hotel: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
  };
  return (
    <button
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
        disabled
          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
          : 'bg-barry-blue text-white hover:bg-blue-700 active:scale-95'
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icons[icon]}
      </svg>
      {label}
    </button>
  );
}

function modeLabel(m: TransportMode): string {
  return { walk: 'a pied', bike: 'velo', transit: 'metro', car: 'voiture', train: 'train', flight: 'avion' }[m] || m;
}
