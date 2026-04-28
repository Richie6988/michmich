'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import {
  smartBookingLink, smartTransportLink, googleMapsPlace,
  bookingDotComSearch, googleSearch,
} from '@/lib/api/booking-links';
import type { MapMarker, SoloDestination, TransportMode } from '@barry/shared-types';

const COLORS = ['#10B981', '#F97316', '#8B5CF6', '#3B82F6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];

const MODE_LABELS: Record<TransportMode, string> = {
  walk: 'walk', bike: 'bike', transit: 'transit', car: 'car', train: 'train', flight: 'flight',
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant', bar: 'Bar', hotel: 'Hotel',
  museum: 'Museum', park: 'Park', activity: 'Activity', other: 'Place',
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

  // Auto-select first result on load
  useEffect(() => {
    if (trip && !selectedId && trip.destinations.length > 0) {
      setSelectedId(trip.destinations[0].id);
    }
  }, [trip?.id]);

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <BarryMascot mood="thinking" size={120} />
        <h2 className="font-display font-bold text-xl mt-6">Trip not found</h2>
        <button onClick={() => router.push('/')} className="mt-4 text-barry-blue font-medium">
          Back to map
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
    <div className="fixed inset-0 bg-barry-canvas overflow-hidden">
      <div className="absolute inset-0">
        <BarryMap
          center={selected ? selected.venue.location : trip.origin}
          zoom={13}
          markers={markers}
          selectedMarkerId={selected?.id}
          height="100%"
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[1001] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.push('/')} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 shadow-md">
            <div className="text-xs text-barry-grey">
              {trip.destinations.length} live {trip.destinations.length > 1 ? 'spots' : 'spot'}
            </div>
            <div className="text-sm font-semibold text-barry-black truncate">{trip.originLabel}</div>
          </div>
          <button
            onClick={() => router.push('/solo/new')}
            className="w-10 h-10 bg-barry-coral rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="Edit criteria"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      <BottomSheet snapPoints={[0.22, 0.55, 0.92]} initialSnap={1}>
        <div className="pb-6">
          <div className="flex items-center justify-between mb-3 mt-1">
            <h2 className="font-display font-bold text-lg text-barry-black">
              {trip.destinations.length} spots for you
            </h2>
            <span className="text-[10px] text-barry-grey">Sorted by best match</span>
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

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer ${
        selected ? 'border-barry-coral shadow-md ring-2 ring-orange-200/50' : 'border-gray-100 hover:border-gray-200'
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
            {dest.venue.address.city && <span>- {dest.venue.address.city}</span>}
            <span>- {dest.distanceKm} km</span>
          </div>

          {dest.venue.description && !selected && (
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
              {cheapestMode[1] === 0 ? 'Free' : `${cheapestMode[1]} EUR`}
            </span>
          </div>

          {dest.highlights.length > 0 && !selected && (
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

      {/* Expanded: VENUE FIRST, then secondary actions */}
      {selected && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Full description */}
          {dest.venue.description && (
            <p className="text-sm text-barry-black mb-3 leading-snug">{dest.venue.description}</p>
          )}

          {/* Address */}
          {(dest.venue.address.street || dest.venue.address.city) && (
            <div className="flex items-start gap-1.5 text-xs text-barry-grey mb-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>
                {[dest.venue.address.street, dest.venue.address.city, dest.venue.address.zip].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* All modes detail */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-barry-grey mb-1.5">All transport options</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(dest.durations).map(([mode, dur]) => (
                <div key={mode} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg text-[11px]">
                  <span className="capitalize text-barry-grey">{MODE_LABELS[mode as TransportMode]}</span>
                  <span className="font-semibold text-barry-black">{dur} min</span>
                  {dest.costs[mode as TransportMode] > 0 && (
                    <span className="text-barry-grey">- {dest.costs[mode as TransportMode]} EUR</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* PRIMARY ACTION: Get there */}
          {(() => {
            const transport = smartTransportLink(origin, dest.venue.location, fastestMode[0] as TransportMode, dest.distanceKm);
            return (
              <a
                href={transport.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-barry-blue to-blue-700 text-white text-sm font-semibold shadow-md mb-2 active:scale-[0.98] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Get directions ({transport.service})
              </a>
            );
          })()}

          {/* SECONDARY ACTIONS */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <SecondaryAction
              href={smartBookingLink(dest.venue).url}
              service={smartBookingLink(dest.venue).service}
              label={dest.venue.category === 'hotel' ? 'Book' : dest.venue.category === 'restaurant' ? 'Reserve' : 'Tickets'}
              icon="book"
            />
            <SecondaryAction
              href={bookingDotComSearch(dest.venue.location, dest.venue.address.city || dest.venue.name)}
              service="Booking"
              label="Stay nearby"
              icon="bed"
            />
            <SecondaryAction
              href={dest.venue.website ? (dest.venue.website.startsWith('http') ? dest.venue.website : `https://${dest.venue.website}`) : googleSearch(dest.venue.name + ' ' + (dest.venue.address.city || ''))}
              service={dest.venue.website ? 'Site' : 'Search'}
              label="Info"
              icon="info"
            />
          </div>

          <a
            href={googleMapsPlace(dest.venue)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block text-center text-[11px] text-barry-grey hover:text-barry-blue py-1"
          >
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

function SecondaryAction({ href, service, label, icon }: { href: string; service: string; label: string; icon: string }) {
  const icons: Record<string, JSX.Element> = {
    book: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    bed: <><path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20" /><circle cx="7" cy="13" r="2.5" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col items-center gap-0.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icons[icon]}
      </svg>
      <span className="text-[10px] font-semibold text-barry-black">{label}</span>
      <span className="text-[8px] text-barry-grey -mt-0.5">{service}</span>
    </a>
  );
}
