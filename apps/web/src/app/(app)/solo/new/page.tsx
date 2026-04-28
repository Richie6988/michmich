'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import { findVenuesNearby } from '@/lib/api/osm';
import { getRoutesBatch } from '@/lib/api/osrm';
import { reverseGeocode } from '@/lib/api/nominatim';
import type { TransportMode, VenueCategory } from '@barry/shared-types';

const MODES: { value: TransportMode; label: string; icon: JSX.Element; speed: number }[] = [
  { value: 'walk', label: 'Walk', speed: 5, icon: <path d="M13 4a2 2 0 100-4 2 2 0 000 4zm-3.5 5.5L6 13l2 4 2-2 1 4h2l-1-7m-3-3.5l1-2h3l3 3-1 1-3-2" /> },
  { value: 'bike', label: 'Bike', speed: 15, icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'transit', label: 'Transit', speed: 25, icon: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19l-2 3M16 19l2 3M8 7h.01M16 7h.01" /></> },
  { value: 'car', label: 'Car', speed: 35, icon: <><path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path d="M2 13l1.5-5A2 2 0 015.5 7h13a2 2 0 011.94 1.5L22 13M2 13h20M5 17H3v-4" /></> },
  { value: 'train', label: 'Train', speed: 80, icon: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></> },
  { value: 'flight', label: 'Flight', speed: 500, icon: <><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z" /></> },
];

const CATEGORIES: { value: VenueCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Anything' },
  { value: 'restaurant', label: 'Food' },
  { value: 'bar', label: 'Drinks' },
  { value: 'museum', label: 'Culture' },
  { value: 'park', label: 'Outdoors' },
  { value: 'activity', label: 'Activities' },
];

export default function SoloNewPage() {
  const router = useRouter();
  const { userLocation } = useAppStore();

  const [originLabel, setOriginLabel] = useState('My location');
  const [maxTime, setMaxTime] = useState(30);
  const [maxBudget, setMaxBudget] = useState(10);
  const [selectedModes, setSelectedModes] = useState<TransportMode[]>(['walk', 'transit']);
  const [selectedCategories, setSelectedCategories] = useState<(VenueCategory | 'all')[]>(['all']);
  const [submitting, setSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation) return;
    reverseGeocode(userLocation).then(label => {
      if (label) setOriginLabel(label);
    });
  }, [userLocation]);

  const toggleMode = (mode: TransportMode) => {
    setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
  };

  const toggleCategory = (cat: VenueCategory | 'all') => {
    if (cat === 'all') {
      setSelectedCategories(['all']);
    } else {
      setSelectedCategories(prev => {
        const without = prev.filter(c => c !== 'all' && c !== cat);
        return prev.includes(cat) ? (without.length ? without : ['all']) : [...without, cat];
      });
    }
  };

  const handleSubmit = async () => {
    if (!userLocation || selectedModes.length === 0) return;
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const fastestMode = selectedModes.reduce((best, m) => {
        const speed = MODES.find(x => x.value === m)!.speed;
        return speed > best.speed ? { mode: m, speed } : best;
      }, { mode: selectedModes[0], speed: 0 });

      const radiusKm = (fastestMode.speed * maxTime) / 60;
      const radiusM = Math.min(50000, radiusKm * 1000);

      setProgressStep('Searching real venues nearby...');
      const cats: VenueCategory[] = selectedCategories.includes('all')
        ? ['restaurant', 'bar', 'museum', 'park', 'activity', 'hotel']
        : selectedCategories.filter(c => c !== 'all') as VenueCategory[];
      const venues = await findVenuesNearby(userLocation, radiusM, cats, 25);

      if (venues.length === 0) {
        setErrorMsg('No spots found in this area. Try expanding the time or changing modes.');
        setSubmitting(false);
        return;
      }

      setProgressStep(`Calculating routes for ${venues.length} spots...`);
      const fastestRoutes = await getRoutesBatch(userLocation, venues.map(v => v.location), fastestMode.mode);

      const validIndices = fastestRoutes
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.durationSeconds / 60 <= maxTime)
        .map(({ i }) => i);

      if (validIndices.length === 0) {
        setErrorMsg('No spots reachable within this time. Try increasing the time budget.');
        setSubmitting(false);
        return;
      }

      setProgressStep('Comparing transport options...');
      const validVenues = validIndices.map(i => venues[i]);
      const allRoutesByMode: Record<TransportMode, any[]> = {} as any;
      for (const mode of selectedModes) {
        if (mode === fastestMode.mode) {
          allRoutesByMode[mode] = validIndices.map(i => fastestRoutes[i]);
        } else {
          allRoutesByMode[mode] = await getRoutesBatch(userLocation, validVenues.map(v => v.location), mode);
        }
      }

      setProgressStep('Almost there...');
      const destinations = validVenues.map((venue, idx) => {
        const distanceKm = (allRoutesByMode[fastestMode.mode][idx].distanceMeters || 0) / 1000;
        const durations: Record<string, number> = {};
        const costs: Record<string, number> = {};
        for (const mode of selectedModes) {
          durations[mode] = Math.round(allRoutesByMode[mode][idx].durationSeconds / 60);
          costs[mode] = allRoutesByMode[mode][idx].costEur;
        }

        const fastest = Math.min(...Object.values(durations));
        const cheapest = Math.min(...Object.values(costs));

        const timeFit = Math.max(0, 1 - fastest / maxTime);
        const budgetFit = cheapest <= maxBudget ? Math.max(0, 1 - cheapest / Math.max(maxBudget, 1)) : 0;
        const qualityBoost = (venue.rating || 0) / 5 || 0.6;
        const matchScore = Math.round((timeFit * 0.4 + budgetFit * 0.3 + qualityBoost * 0.3) * 100);

        const highlights: string[] = [];
        if (cheapest === 0) highlights.push('Free');
        else if (cheapest < 3) highlights.push('Cheap');
        if (fastest <= 15) highlights.push('Very close');
        if (venue.priceLevel === 1) highlights.push('Budget-friendly');
        if (venue.category === 'park') highlights.push('Outdoors');
        if (venue.category === 'museum') highlights.push('Culture');

        return {
          id: `dest-${venue.id}`,
          venue,
          distanceKm: Math.round(distanceKm * 10) / 10,
          durations: durations as any,
          costs: costs as any,
          matchScore,
          highlights,
        };
      })
      .filter(d => Object.values(d.costs).some(c => c <= maxBudget))
      .sort((a, b) => b.matchScore - a.matchScore);

      const trip = {
        id: `s${Date.now()}`,
        userId: 'u1',
        name: `Discovery ${new Date().toLocaleDateString('en-GB')}`,
        origin: userLocation,
        originLabel,
        modes: selectedModes,
        maxTime, maxBudget,
        category: 'all' as const,
        createdAt: new Date().toISOString(),
        destinations,
      };
      useAppStore.setState(s => ({ soloTrips: [trip, ...s.soloTrips], activeSoloTrip: trip }));

      router.push(`/solo/${trip.id}`);
    } catch (err: any) {
      console.error('Solo discovery error:', err);
      setErrorMsg(err?.message || 'Network error. Please try again in a moment.');
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center px-4 z-50">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-bold text-2xl text-barry-black mt-6">
          Barry is on it.
        </h2>
        <p className="text-barry-grey text-sm mt-2 text-center max-w-xs">
          {progressStep || 'Connecting to map services'}
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-barry-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <div className="mt-6 text-[10px] text-barry-grey font-mono">
          OpenStreetMap - OSRM - Live data
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pb-32">
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
        <div className="text-center mb-6">
          <BarryMascot mood="default" size={80} />
          <h1 className="font-display font-extrabold text-2xl text-barry-black mt-3 tracking-tight">
            What's around you?
          </h1>
          <p className="text-barry-grey text-sm mt-1.5 max-w-xs mx-auto">
            Real venues. Real travel times. Sourced live from OpenStreetMap.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        {/* Origin */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-barry-grey font-medium">Starting from</p>
              <p className="font-semibold text-barry-black truncate">{originLabel}</p>
            </div>
          </div>
        </div>

        {/* What */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3">
            Looking for
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => {
              const selected = selectedCategories.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all ${
                    selected
                      ? 'border-barry-coral bg-orange-50 text-orange-700'
                      : 'border-gray-100 bg-white text-barry-grey hover:border-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modes */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3">
            How I travel
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {MODES.map(m => {
              const selected = selectedModes.includes(m.value);
              return (
                <button
                  key={m.value}
                  onClick={() => toggleMode(m.value)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all ${
                    selected ? 'border-barry-coral bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected ? '#F97316' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {m.icon}
                  </svg>
                  <span className={`text-[9px] font-medium ${selected ? 'text-orange-700' : 'text-barry-grey'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time */}
        <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-barry-grey uppercase tracking-wider">Max travel time</label>
            <span className="text-xl font-display font-bold text-barry-blue">
              {maxTime < 60 ? `${maxTime} min` : `${(maxTime / 60).toFixed(maxTime % 60 === 0 ? 0 : 1)}h`}
            </span>
          </div>
          <input
            type="range" min={15} max={240} step={15} value={maxTime}
            onChange={e => setMaxTime(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-blue"
          />
          <div className="flex justify-between text-[10px] text-barry-grey mt-1.5">
            <span>15 min</span><span>1h</span><span>2h</span><span>4h</span>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-barry-grey uppercase tracking-wider">Transport budget</label>
            <span className="text-xl font-display font-bold text-barry-coral">
              {maxBudget === 0 ? 'Free' : `${maxBudget} EUR`}
            </span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={maxBudget}
            onChange={e => setMaxBudget(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-barry-coral"
          />
          <div className="flex justify-between text-[10px] text-barry-grey mt-1.5">
            <span>Free</span><span>50 EUR</span><span>100 EUR</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedModes.length === 0 || !userLocation}
          className="w-full bg-gradient-to-r from-barry-coral to-orange-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find spots
        </button>

        <p className="text-[10px] text-center text-barry-grey mt-3">
          Powered by OpenStreetMap. No tracking. No API keys.
        </p>
      </main>
    </div>
  );
}
