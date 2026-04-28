'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMark, BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { formatDateShort } from '@/lib/utils/format-date';
import type { Trip, MapMarker } from '@barry/shared-types';

const PARIS_DEFAULT = { lat: 48.8566, lng: 2.3522 };

const STATUS_LABEL: Record<string, string> = {
  draft: 'Drafting',
  inviting: 'Inviting',
  constraints: 'Setup',
  calculating: 'Crunching',
  voting: 'Voting',
  booked: 'Booked',
  completed: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-slate-400',
  inviting: 'bg-blue-500',
  constraints: 'bg-amber-500',
  calculating: 'bg-purple-500',
  voting: 'bg-orange-500',
  booked: 'bg-emerald-500',
  completed: 'bg-slate-300',
  cancelled: 'bg-rose-500',
};

function TripRow({ trip }: { trip: Trip }) {
  const date = trip.scheduledAt ? formatDateShort(trip.scheduledAt) : null;
  const href: any = (() => {
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
  })();

  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-3 py-3 px-1 hover:bg-slate-50 rounded-xl transition-colors">
        <div className="flex -space-x-2">
          {trip.participants.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6'][i % 4], zIndex: 4 - i }}
            >
              {p.user?.firstName?.[0] || '?'}
            </div>
          ))}
          {trip.participants.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
              +{trip.participants.length - 3}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-slate-900 text-[15px] truncate">{trip.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_DOT[trip.status] || 'bg-slate-400'}`} />
            <span>{STATUS_LABEL[trip.status] || trip.status}</span>
            {date && <><span>·</span><span>{date}</span></>}
          </div>
        </div>

        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 group-hover:stroke-barry-blue transition-colors">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { trips, currentUser, userLocation, setUserLocation } = useAppStore();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [mounted, setMounted] = useState(false);

  // Mark hydrated to render dynamic content client-side only
  useEffect(() => { setMounted(true); }, []);

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

  const markers: MapMarker[] = [];
  if (userLocation) markers.push({ id: 'me', position: userLocation, type: 'user' });

  return (
    <div className="fixed inset-0 bg-slate-50 overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0">
        <BarryMap center={center} zoom={13} markers={markers} height="100%" />
      </div>

      {/* Search bar (sticky top) */}
      <div className="absolute top-0 left-0 right-0 z-[1001] pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 max-w-lg mx-auto">
          <div className="flex-1 bg-white rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-100 flex items-center gap-2 pl-4 pr-1 py-1">
            <BarryMark size={22} />
            <button
              className="flex-1 text-left py-2 text-sm text-slate-400 truncate"
              onClick={() => alert('Search coming next iteration')}
            >
              Where to?
            </button>
            <Link
              href="/profile"
              className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-barry-blue to-blue-700 flex items-center justify-center text-white text-[10px] font-bold">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Locate me button (above bottom sheet) */}
      <button
        onClick={() => {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos =>
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            );
          }
        }}
        className="absolute bottom-[55%] right-3 z-[1001] w-11 h-11 bg-white rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all border border-slate-100"
        aria-label="My location"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
        </svg>
      </button>

      {/* Bottom sheet */}
      <BottomSheet snapPoints={[0.18, 0.5, 0.92]} initialSnap={1}>
        <div className="pb-6">
          {/* Hero CTAs - the magic moment */}
          <div className="grid grid-cols-2 gap-3 mb-5 mt-2">
            <Link href="/solo/new" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-barry-coral to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all h-full">
                {/* Decorative blob */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Solo</span>
                  </div>
                  <p className="font-display font-bold text-base leading-tight">Discover spots near me</p>
                  <p className="text-[11px] text-white/80 mt-1">Live picks in 30s</p>
                </div>
              </div>
            </Link>

            <Link href="/trips/new" className="group">
              <div className="relative overflow-hidden bg-gradient-to-br from-barry-blue to-blue-700 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all h-full">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">Group</span>
                  </div>
                  <p className="font-display font-bold text-base leading-tight">Plan with my friends</p>
                  <p className="text-[11px] text-white/80 mt-1">Fair spot + shared kitty</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Active trips */}
          {mounted && activeTrips.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-2 mb-4">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">In motion</h2>
                <span className="text-[10px] text-slate-400">{activeTrips.length} {activeTrips.length > 1 ? 'trips' : 'trip'}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {activeTrips.map(trip => <TripRow key={trip.id} trip={trip} />)}
              </div>
            </div>
          )}

          {/* First-time hint - shown only when there are no active trips */}
          {mounted && activeTrips.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <div className="flex items-start gap-3">
                <BarryMascot mood="default" size={48} />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-slate-900 mb-1">Where the smart group meets.</h3>
                  <p className="text-xs text-slate-500 leading-snug">
                    Tap <span className="font-medium text-slate-700">Solo</span> to find the best spots around you, or <span className="font-medium text-slate-700">Group</span> to plan a fair meet-up.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Inspiration row */}
          <div className="mb-2 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Try a quick Barry</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction
                href="/solo/new"
                title="Free outdoors"
                subtitle="30 min walk"
                color="emerald"
              />
              <QuickAction
                href="/solo/new"
                title="Date night"
                subtitle="Bar within 5 EUR"
                color="rose"
              />
              <QuickAction
                href="/solo/new"
                title="Culture trip"
                subtitle="Museum nearby"
                color="amber"
              />
              <QuickAction
                href="/trips/new"
                title="Friday dinner"
                subtitle="Group of 4"
                color="blue"
              />
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function QuickAction({ href, title, subtitle, color }: {
  href: string; title: string; subtitle: string;
  color: 'emerald' | 'rose' | 'amber' | 'blue';
}) {
  const palette = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
  }[color];

  return (
    <Link href={href as any} className="block">
      <div className={`${palette.bg} ${palette.border} border rounded-xl p-3 hover:shadow-sm transition-all active:scale-[0.97]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
          <p className={`text-xs font-semibold ${palette.text}`}>{title}</p>
        </div>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
    </Link>
  );
}
