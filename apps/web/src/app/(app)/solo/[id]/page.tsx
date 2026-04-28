'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { smartBookingLink, smartTransportLink, googleMapsPlace } from '@/lib/api/booking-links';
import type { MapMarker, SoloDestination, TransportMode } from '@barry/shared-types';

const COLORS = ['#10B981', '#F97316', '#8B5CF6', '#3B82F6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];

const MODE_LABELS: Record<TransportMode, string> = {
  walk: 'a pied', bike: 'velo', transit: 'metro', car: 'voiture', train: 'train', flight: 'avion',
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar / Cafe',
  hotel: 'Hotel',
  museum: 'Musee',
  park: 'Parc',
  activity: 'Activite',
  other: 'Lieu',
};

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
          Retour
        </button>
      </div>
    );
  }

  const selected = selectedId ? trip.destinations.find(d => d.id === selectedId) : trip.destinations[0];

  const markers: MapMarker[] = [
    { id: 'origin', position: trip.origin, type: 'user' },
    ...trip.destinations.slice(0, 12).map((d, i) => ({
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
      <div className="absolute inset-0">
        <BarryMap
          center={trip.origin} zoom={13} markers={markers}
          selectedMarkerId={selected?.id} height="100%"
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-md">
            <div className="text-xs text-barry-grey">
              Solo · {trip.destinations.length} {trip.destinations.length > 1 ? 'spots reels' : 'spot reel'}
            </div>
            <div className="text-sm font-semibold text-barry-black truncate">{trip.originLabel}</div>
          </div>
        </div>
      </div>

      <BottomSheet snapPoints={[0.2, 0.55, 0.92]} initialSnap={1}>
        <div className="pb-6">
          <div className="flex items-center justify-between mb-3 mt-1">
            <h2 className="font-display font-bold text-lg text-barry-black">
              {trip.destinations.length} spots reels pour toi
            </h2>
            <span className="text-[10px] text-barry-grey">Donnees OSM</span>
          </div>

          <div className="space-y-2">
            {trip.destinations.slice(0, 15).map((dest, i) => (
              <DestinationCard
                key={dest.id}
                dest={dest}
                rank={i + 1}
                color={COLORS[i % COLORS.length]}
                selected={selected?.id === dest.id}
                onSelect={() => setSelectedId(dest.id)}
                origin={trip.origin}
                originLabel={trip.originLabel}
              />
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function DestinationCard({
  dest, rank, color, selected, onSelect, origin, originLabel,
}: {
  dest: SoloDestination;
  rank: number;
  color: string;
  selected: boolean;
  onSelect: () => void;
  origin: { lat: number; lng: number };
  originLabel: string;
}) {
  const fastestMode = Object.entries(dest.durations).reduce((a, b) => b[1] < a[1] ? b : a);
  const cheapestMode = Object.entries(dest.costs).reduce((a, b) => b[1] < a[1] ? b : a);
  const matchColor = dest.matchScore >= 70 ? '#10B981' : dest.matchScore >= 50 ? '#F59E0B' : '#94A3B8';

  const booking = smartBookingLink(dest.venue);
  const transport = smartTransportLink(origin, dest.venue.location, fastestMode[0] as TransportMode, dest.distanceKm);

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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm shadow-sm"
          style={{ backgroundColor: color }}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-barry-black text-[15px] truncate">{dest.venue.name}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: matchColor }}>
              {dest.matchScore}%
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-barry-grey mb-1.5">
            <span className="font-medium">{CATEGORY_LABELS[dest.venue.category]}</span>
            {dest.venue.address.city && <span>· {dest.venue.address.city}</span>}
            <span>· {dest.distanceKm} km</span>
          </div>

          {dest.venue.description && (
            <p className="text-xs text-barry-grey truncate mb-2">{dest.venue.description}</p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-barry-black mb-1.5">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="font-semibold">{fastestMode[1]} min</span>
              <span className="text-barry-grey">({MODE_LABELS[fastestMode[0] as TransportMode]})</span>
            </div>
            <span className="font-medium">
              {cheapestMode[1] === 0 ? 'Gratuit' : `${cheapestMode[1]} EUR`}
            </span>
          </div>

          {dest.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {dest.highlights.slice(0, 3).map(h => (
                <span key={h} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {/* All modes breakdown */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(dest.durations).map(([mode, dur]) => (
              <div key={mode} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-[11px]">
                <span className="capitalize text-barry-grey">{MODE_LABELS[mode as TransportMode]}</span>
                <span className="font-semibold text-barry-black">{dur} min</span>
                {dest.costs[mode as TransportMode] > 0 && (
                  <span className="text-barry-grey">· {dest.costs[mode as TransportMode]} EUR</span>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons (REAL external links) */}
          <div className="flex gap-2">
            <a
              href={booking.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-barry-blue text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Reserver via {booking.service}
            </a>
            <a
              href={transport.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Y aller ({transport.service})
            </a>
          </div>

          {/* External info link */}
          {dest.venue.website ? (
            <a
              href={dest.venue.website.startsWith('http') ? dest.venue.website : `https://${dest.venue.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1 py-1.5 text-xs text-barry-grey hover:text-barry-blue transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Site officiel
            </a>
          ) : (
            <a
              href={googleMapsPlace(dest.venue)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1 py-1.5 text-xs text-barry-grey hover:text-barry-blue transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Voir sur Google Maps
            </a>
          )}
        </div>
      )}
    </button>
  );
}
