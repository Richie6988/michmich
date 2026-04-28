'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMark } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { Trip, MapMarker } from '@barry/shared-types';

const PARIS_DEFAULT = { lat: 48.8566, lng: 2.3522 };

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  draft: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Brouillon', dot: 'bg-gray-400' },
  inviting: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'Invitations', dot: 'bg-blue-500' },
  constraints: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Contraintes', dot: 'bg-amber-500' },
  calculating: { color: 'text-purple-700', bg: 'bg-purple-50', label: 'Calcul...', dot: 'bg-purple-500' },
  voting: { color: 'text-orange-700', bg: 'bg-orange-50', label: 'Vote', dot: 'bg-orange-500' },
  booked: { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Reserve', dot: 'bg-emerald-500' },
  completed: { color: 'text-gray-500', bg: 'bg-gray-50', label: 'Termine', dot: 'bg-gray-400' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-50', label: 'Annule', dot: 'bg-red-500' },
};

const TYPE_ICONS: Record<string, string> = {
  dinner: 'M3 11h18M5 11v9a1 1 0 001 1h12a1 1 0 001-1v-9M9 6c0-1.5 1-3 3-3s3 1.5 3 3',
  weekend: 'M21 10H3M16 2v4M8 2v4M3 6h18v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
  evg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  family: 'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8z',
  corporate: 'M3 21h18M5 21V7l8-4 8 4v14M9 9h2M9 13h2M9 17h2',
  custom: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77',
};

function TripCard({ trip }: { trip: Trip }) {
  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
  const date = trip.scheduledAt
    ? new Date(trip.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  const getHref = () => {
    switch (trip.status) {
      case 'draft':
      case 'inviting': return `/trips/${trip.id}`;
      case 'constraints': return `/trips/${trip.id}/constraints`;
      case 'calculating': return `/trips/${trip.id}/map`;
      case 'voting': return `/trips/${trip.id}/vote`;
      case 'booked':
      case 'completed': return `/trips/${trip.id}/itinerary`;
      default: return `/trips/${trip.id}`;
    }
  };

  return (
    <Link href={getHref()} className="block group">
      <div className="bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-barry-blue/30 hover:shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={TYPE_ICONS[trip.tripType] || TYPE_ICONS.custom} />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-barry-black text-[15px] truncate">{trip.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1 ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {date && <span className="text-gray-400">- {date}</span>}
              <span className="text-gray-400">- {trip.participants.length} pers.</span>
            </div>
          </div>

          {/* Avatars */}
          <div className="flex -space-x-1.5">
            {trip.participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981'][i % 3], zIndex: 3 - i }}
              >
                {p.user?.firstName?.[0] || '?'}
              </div>
            ))}
            {trip.participants.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                +{trip.participants.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { trips, currentUser, userLocation, setUserLocation } = useAppStore();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  // Request user location on mount
  useEffect(() => {
    if (userLocation) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUserLocation(PARIS_DEFAULT);
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setUserLocation(PARIS_DEFAULT);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  }, [userLocation, setUserLocation]);

  const center = userLocation || PARIS_DEFAULT;
  const activeTrips = trips.filter(t => !['completed', 'cancelled'].includes(t.status));

  // Build map markers
  const markers: MapMarker[] = [];
  if (userLocation) {
    markers.push({ id: 'me', position: userLocation, type: 'user' });
  }
  // Show active trip locations as pins on the map
  activeTrips.forEach((trip, i) => {
    // Use first participant origin as proxy location
    const firstWithOrigin = trip.participants.find(p => p.originLocation);
    if (firstWithOrigin?.originLocation) {
      markers.push({
        id: trip.id,
        position: firstWithOrigin.originLocation,
        type: 'pin',
        color: ['#F97316', '#10B981', '#8B5CF6'][i % 3],
        rank: i + 1,
      });
    }
  });

  return (
    <div className="fixed inset-0 bg-barry-canvas">
      {/* Map (full screen background) */}
      <div className="absolute inset-0">
        <BarryMap center={center} zoom={13} markers={markers} height="100%" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1001] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 shadow-sm border border-white/60">
            <BarryMark size={26} />
            <span className="font-display font-extrabold text-barry-blue text-base">Barry</span>
          </div>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white/60 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-barry-blue to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </div>
          </Link>
        </div>
      </div>

      {/* Locate me button */}
      <button
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos =>
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            );
          }
        }}
        className="absolute bottom-[60%] right-4 z-[1001] w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Ma position"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
        </svg>
      </button>

      {/* Bottom sheet with trips */}
      <BottomSheet snapPoints={[0.18, 0.5, 0.9]} initialSnap={1}>
        <div className="pb-4">
          {/* Greeting */}
          <div className="flex items-center justify-between mb-1 mt-1">
            <h1 className="font-display font-bold text-xl text-barry-black">
              Salut {currentUser?.firstName} !
            </h1>
            <span className="text-xs text-barry-grey">
              {locationStatus === 'granted' ? 'Position activee' : locationStatus === 'denied' ? 'Paris (defaut)' : 'Localisation...'}
            </span>
          </div>
          <p className="text-sm text-barry-grey mb-5">
            {activeTrips.length > 0
              ? `${activeTrips.length} ${activeTrips.length > 1 ? 'sorties en cours' : 'sortie en cours'}`
              : 'Decouvre des spots autour, ou organise une sortie avec tes amis.'}
          </p>

          {/* PRIMARY CTA — split in two for clarity */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <Link href="/solo/new" className="group">
              <div className="bg-gradient-to-br from-barry-coral to-orange-600 text-white rounded-2xl p-3.5 shadow-lg shadow-orange-500/15 hover:shadow-xl active:scale-[0.98] transition-all h-full">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Solo</span>
                </div>
                <p className="font-display font-bold text-sm leading-tight">Decouvrir autour de moi</p>
                <p className="text-[10px] text-white/70 mt-0.5">8 spots en 30s</p>
              </div>
            </Link>

            <Link href="/trips/new" className="group">
              <div className="bg-gradient-to-br from-barry-blue to-blue-700 text-white rounded-2xl p-3.5 shadow-lg shadow-blue-500/15 hover:shadow-xl active:scale-[0.98] transition-all h-full">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Groupe</span>
                </div>
                <p className="font-display font-bold text-sm leading-tight">Organiser avec mes amis</p>
                <p className="text-[10px] text-white/70 mt-0.5">Lieu equitable + cagnotte</p>
              </div>
            </Link>
          </div>

          {/* Active trips */}
          {activeTrips.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-sm font-semibold text-barry-black">
                  Sorties en cours
                </h2>
                <span className="text-[10px] text-gray-400">Glisse vers le haut pour voir plus</span>
              </div>
              <div className="space-y-2">
                {activeTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            </div>
          ) : (
            <FirstTimeOnboarding />
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

function FirstTimeOnboarding() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <h3 className="font-semibold text-sm text-barry-black mb-3">
        Comment ca marche en 3 etapes
      </h3>
      <div className="space-y-3">
        <OnboardStep n={1} title="Choisis le mode" desc="Solo pour decouvrir autour, Groupe pour organiser avec des amis." />
        <OnboardStep n={2} title="Donne tes contraintes" desc="Temps, budget, mode de transport. Barry fait le reste." />
        <OnboardStep n={3} title="Reserve en un clic" desc="Restaurants, hotels, activites — tout est connecte." />
      </div>
    </div>
  );
}

function OnboardStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-blue-50 text-barry-blue font-bold text-xs flex items-center justify-center flex-shrink-0">
        {n}
      </div>
      <div>
        <p className="font-medium text-sm text-barry-black">{title}</p>
        <p className="text-xs text-barry-grey leading-snug">{desc}</p>
      </div>
    </div>
  );
}
