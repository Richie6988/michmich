'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { getRoute } from '@/lib/api/osrm';
import { smartBookingLink, smartTransportLink, googleMapsDirections } from '@/lib/api/booking-links';
import type { TransportMode, Participant, Venue, MapMarker } from '@barry/shared-types';

interface ParticipantRoute {
  participant: Participant;
  duration: number;
  distance: number;
  cost: number;
  color: string;
}

// Default venue when no selection yet — Place des Vosges (real OSM venue)
const DEFAULT_VENUE: Venue = {
  id: 'default-venue',
  name: 'Place des Vosges',
  category: 'park',
  location: { lat: 48.8557, lng: 2.3655 },
  address: { street: 'Place des Vosges', city: 'Paris', zip: '75004', country: 'FR' },
  description: 'Plus ancienne place planifiee de Paris',
  priceLevel: 1,
  rating: 4.8,
  phone: null,
  website: null,
  photos: [],
  coverPhotoUrl: null,
  accessibility: {},
};

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const { activeTrip, trips } = useAppStore();
  const [routes, setRoutes] = useState<ParticipantRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const trip = activeTrip || trips.find(t => t.id === id);
  const venue = DEFAULT_VENUE; // TODO: get from trip.selectedVenueId in store

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const colors = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EC4899'];
      const validParticipants = trip.participants.filter(p => p.originLocation && p.transportMode);

      const results = await Promise.all(
        validParticipants.map(async (p, i) => {
          const route = await getRoute(p.originLocation!, venue.location, p.transportMode!);
          return {
            participant: p,
            duration: Math.round(route.durationSeconds / 60),
            distance: Math.round((route.distanceMeters / 1000) * 10) / 10,
            cost: route.costEur,
            color: colors[i % colors.length],
          };
        })
      );

      if (!cancelled) {
        setRoutes(results);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trip?.id]);

  if (!trip) {
    return (
      <div className="px-4 py-12 text-center">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-barry-grey mt-4">Sortie introuvable</p>
      </div>
    );
  }

  const totalCost = routes.reduce((s, r) => s + r.cost, 0);
  const avgDuration = routes.length ? Math.round(routes.reduce((s, r) => s + r.duration, 0) / routes.length) : 0;
  const equityScore = routes.length
    ? Math.round((1 - (Math.max(...routes.map(r => r.duration)) - Math.min(...routes.map(r => r.duration))) / Math.max(...routes.map(r => r.duration), 1)) * 100)
    : 0;

  const date = trip.scheduledAt
    ? new Date(trip.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Date a fixer';

  const handleCopy = () => {
    navigator.clipboard?.writeText(`Rendez-vous: ${venue.name} (${venue.address.street}, ${venue.address.city}) ${date}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const booking = smartBookingLink(venue);

  // Map markers
  const markers: MapMarker[] = [
    { id: 'venue', position: venue.location, type: 'pin', color: '#2563EB', rank: 1 },
    ...routes.map(r => ({
      id: r.participant.id,
      position: r.participant.originLocation!,
      type: 'origin' as const,
      color: r.color,
      label: r.participant.user?.firstName?.[0] || '?',
    })),
  ];

  return (
    <div className="px-4 py-4">
      {/* Hero */}
      <div className="text-center mb-4">
        <BarryMascot mood="celebrating" size={80} />
        <h1 className="font-display font-extrabold text-2xl text-barry-black mt-2 tracking-tight">
          C'est parti !
        </h1>
        <p className="text-barry-grey text-sm mt-1">Tout est cale.</p>
      </div>

      {/* Equity score banner */}
      <div className="bg-gradient-to-br from-barry-blue to-blue-700 rounded-3xl p-4 mb-4 text-white shadow-lg shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">Score d'equite calcule</p>
            <p className="font-display font-extrabold text-3xl mt-0.5">{equityScore}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100" style={{ height: 200 }}>
        <BarryMap center={venue.location} zoom={13} markers={markers} height="100%" />
      </div>

      {/* Venue card */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-barry-black">{venue.name}</h3>
            <p className="text-xs text-barry-grey truncate">
              {[venue.address.street, venue.address.city].filter(Boolean).join(', ')}
            </p>
            {venue.rating && (
              <div className="flex items-center gap-1 mt-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                </svg>
                <span className="text-xs font-medium text-amber-700">{venue.rating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-barry-grey">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="capitalize">{date}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl p-3 text-center border border-gray-100">
          <p className="text-xl font-display font-bold text-barry-blue">{avgDuration}</p>
          <p className="text-[10px] text-barry-grey">min moyenne</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-gray-100">
          <p className="text-xl font-display font-bold text-barry-coral">{totalCost.toFixed(2)} EUR</p>
          <p className="text-[10px] text-barry-grey">total transport</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-gray-100">
          <p className="text-xl font-display font-bold text-barry-green">{routes.length}</p>
          <p className="text-[10px] text-barry-grey">participants</p>
        </div>
      </div>

      {/* Per-person routes */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2 px-1">
          Itineraire par personne (calcul en direct)
        </h3>
        {loading ? (
          <div className="bg-white rounded-2xl p-4 text-center text-sm text-barry-grey">
            Calcul des routes...
          </div>
        ) : (
          <div className="space-y-2">
            {routes.map(r => {
              const transportLink = smartTransportLink(
                r.participant.originLocation!,
                venue.location,
                r.participant.transportMode!,
                r.distance,
              );
              return (
                <div key={r.participant.id} className="bg-white rounded-2xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: r.color }}
                      >
                        {r.participant.user?.firstName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-barry-black">{r.participant.user?.firstName}</p>
                        <p className="text-[11px] text-barry-grey">
                          {r.participant.originLabel} · {r.participant.transportMode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-barry-black">{r.duration} min</p>
                      <p className="text-[11px] text-barry-grey">{r.distance} km · {r.cost > 0 ? `${r.cost} EUR` : 'gratuit'}</p>
                    </div>
                  </div>
                  <a
                    href={transportLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-barry-blue font-semibold hover:underline"
                  >
                    Itineraire {transportLink.service}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2 mb-4">
        <a
          href={booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-barry-coral to-orange-600 text-white font-semibold py-3.5 rounded-2xl shadow-md text-center"
        >
          Reserver via {booking.service}
        </a>

        <button
          onClick={handleCopy}
          className="w-full bg-white text-barry-blue font-semibold py-3 rounded-2xl border border-barry-blue/20 hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {copied ? 'Copie !' : 'Copier le rendez-vous'}
        </button>

        <a
          href={googleMapsDirections({ lat: 0, lng: 0 }, venue.location)}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-xs text-barry-grey hover:text-barry-blue py-2"
        >
          Voir sur Google Maps
        </a>
      </div>
    </div>
  );
}
