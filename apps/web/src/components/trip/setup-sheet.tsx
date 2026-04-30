'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { reverseGeocode, geocode, type NominatimResult } from '@/lib/api/nominatim';
import type { TransportMode, GeoPoint } from '@barry/shared-types';

const TRANSPORT_OPTIONS: { value: TransportMode; label: string; icon: JSX.Element; color: string }[] = [
  { value: 'walk', label: 'Walk', color: '#10B981',
    icon: <><circle cx="12" cy="3" r="2" /><path d="M9 21l1.5-6.5L8 12V8h1.5l3-2 2 4 2 1M14 21l-2-7" /></> },
  { value: 'bike', label: 'Bike', color: '#3B82F6',
    icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'transit', label: 'Transit', color: '#8B5CF6',
    icon: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19l-2 3M16 19l2 3M8 7h.01M16 7h.01" /></> },
  { value: 'car', label: 'Car', color: '#F97316',
    icon: <><path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path d="M2 13l1.5-5A2 2 0 015.5 7h13a2 2 0 011.94 1.5L22 13M2 13h20" /></> },
  { value: 'train', label: 'Train', color: '#06B6D4',
    icon: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></> },
];

const REDUCTION_OPTIONS = [
  { value: null, label: 'None', pct: 0 },
  { value: 'jeune', label: 'Youth', pct: 30 },
  { value: 'senior', label: 'Senior', pct: 30 },
  { value: 'student', label: 'Student', pct: 25 },
  { value: 'disability', label: 'Disability', pct: 50 },
  { value: 'large_family', label: 'Large family', pct: 30 },
];

export function SetupSheet({ tripId, participantId, onClose }: {
  tripId: string;
  participantId: string;
  onClose: () => void;
}) {
  const { trips, currentUser, preferences, userLocation, updateParticipantConstraints, updateTransportLeg, transportLegs } = useAppStore();
  const trip = trips.find(t => t.id === tripId);
  const participant = trip?.participants.find(p => p.id === participantId);

  const isMe = participant?.userId === currentUser?.id;
  const isOrganizer = trip?.organizerId === currentUser?.id;
  const canEdit = isMe || isOrganizer;
  const myLeg = (transportLegs[tripId] || []).find(l => l.participantId === participantId);

  // Pre-fill from existing data: participant record OR participant's user defaults OR (if me) my profile preferences
  const userDefaults = participant?.user;
  const initialOrigin = participant?.originLocation
    || userDefaults?.homeLocation
    || (isMe ? (preferences?.homeLocation || userLocation) : null);
  const initialLabel = participant?.originLabel
    || (isMe ? (preferences?.homeLabel || 'Home') : 'Home');

  const [originLabel, setOriginLabel] = useState(initialLabel);
  const [origin, setOrigin] = useState<GeoPoint | null>(initialOrigin || null);
  const [mode, setMode] = useState<TransportMode>(
    participant?.transportMode
    || userDefaults?.defaultTransportMode
    || (isMe ? preferences.defaultTransportMode : 'transit')
  );
  const [maxTime, setMaxTime] = useState(participant?.maxTime || 45);
  const [maxBudget, setMaxBudget] = useState(participant?.maxMoney || 15);
  const [weight, setWeight] = useState(
    participant?.timeWeight
    ?? userDefaults?.defaultTimeWeight
    ?? 0.5
  );
  const [reductionCard, setReductionCard] = useState<string | null>(myLeg?.reductionCard || null);
  const [reductionPct, setReductionPct] = useState<number>(myLeg?.reductionPct || 0);

  // Address autocomplete state
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState(!!initialOrigin);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search Nominatim as user types (debounced)
  const handleLabelChange = (value: string) => {
    setOriginLabel(value);
    setConfirmedAddress(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await geocode(value, 5);
      setSuggestions(results);
      setShowSuggestions(true);
      setSearching(false);
    }, 350);
  };

  const handlePickSuggestion = (s: NominatimResult) => {
    setOriginLabel(s.display_name);
    setOrigin({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setConfirmedAddress(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Reverse-geocode if origin lat/lng but no readable label
  useEffect(() => {
    if (origin && (!originLabel || originLabel === 'My location')) {
      reverseGeocode(origin).then(label => {
        if (label) setOriginLabel(label);
      });
    }
  }, [origin?.lat, origin?.lng]);

  if (!trip || !participant) return null;

  const handleUseCurrent = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setOrigin(loc);
          setConfirmedAddress(true);
          // Reverse-geocode to readable label
          const label = await reverseGeocode(loc);
          if (label) setOriginLabel(label);
          else setOriginLabel('Current location');
        },
        () => alert('Location permission denied')
      );
    }
  };

  const handleSave = () => {
    if (!canEdit) return;
    updateParticipantConstraints(tripId, participant.userId, {
      transportMode: mode,
      timeWeight: weight,
      moneyWeight: 1 - weight,
      maxTime,
      maxMoney: maxBudget,
      originLocation: origin,
      originLabel,
    });
    if (reductionCard !== null || reductionPct > 0) {
      updateTransportLeg(tripId, participantId, {
        reductionCard,
        reductionPct,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              {isMe ? 'Your setup' : `${participant.user?.firstName}'s setup`}
            </h2>
            {!isMe && isOrganizer && (
              <p className="text-[10px] text-slate-500">Pre-filling for {participant.user?.firstName}</p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Origin / starting point with Nominatim autocomplete */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Starting point</label>
            <div className="relative">
              <input
                type="text"
                value={originLabel}
                onChange={e => handleLabelChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type an address, city or place..."
                className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 pr-9"
                disabled={!canEdit}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-barry-blue rounded-full animate-spin" />
                </div>
              )}
              {confirmedAddress && !searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.lat}-${s.lon}-${i}`}
                      onClick={() => handlePickSuggestion(s)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" className="flex-shrink-0 mt-0.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-xs text-slate-700 leading-snug">{s.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {origin && confirmedAddress && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Verified · {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </p>
            )}
            {originLabel.length >= 3 && !confirmedAddress && !searching && (
              <p className="text-[11px] text-amber-600 mt-1.5">
                Pick from the list to confirm the address
              </p>
            )}

            {canEdit && (
              <button
                onClick={handleUseCurrent}
                className="text-[11px] text-barry-blue font-medium hover:underline mt-1.5"
              >
                Use current location
              </button>
            )}
          </div>

          {/* Transport mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transport</label>
            <div className="grid grid-cols-5 gap-1.5">
              {TRANSPORT_OPTIONS.map(opt => {
                const selected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => canEdit && setMode(opt.value)}
                    disabled={!canEdit}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${selected ? 'border-current' : 'border-slate-100 hover:border-slate-200'}`}
                    style={selected ? { borderColor: opt.color, backgroundColor: `${opt.color}10` } : {}}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selected ? opt.color : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {opt.icon}
                    </svg>
                    <span className="text-[10px] font-medium" style={{ color: selected ? opt.color : '#64748B' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reduction card (transit/train only) */}
          {(mode === 'transit' || mode === 'train') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Reduction card <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REDUCTION_OPTIONS.map(opt => {
                  const active = reductionCard === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => canEdit && (() => { setReductionCard(opt.value); setReductionPct(opt.pct); })()}
                      disabled={!canEdit}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}{opt.pct > 0 && ` -${opt.pct}%`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Max time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Max travel time</label>
              <span className="text-sm font-bold text-slate-900">{maxTime} min</span>
            </div>
            <input
              type="range" min={10} max={120} step={5}
              value={maxTime} onChange={e => setMaxTime(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full accent-barry-blue"
            />
          </div>

          {/* Max budget */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Max one-way budget</label>
              <span className="text-sm font-bold text-slate-900">{maxBudget} EUR</span>
            </div>
            <input
              type="range" min={0} max={50} step={1}
              value={maxBudget} onChange={e => setMaxBudget(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full accent-barry-blue"
            />
          </div>

          {/* Time vs money priority */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
              <span className="text-[11px] text-slate-500">
                {weight < 0.4 ? 'Save money' : weight > 0.6 ? 'Save time' : 'Balanced'}
              </span>
            </div>
            <input
              type="range" min={0} max={1} step={0.1}
              value={weight} onChange={e => setWeight(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full accent-barry-blue"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Money</span>
              <span>Time</span>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4">
            <button
              onClick={handleSave}
              disabled={!confirmedAddress}
              className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!confirmedAddress
                ? 'Confirm the address first'
                : isMe ? 'Save my setup' : `Save ${participant.user?.firstName}'s setup`}
            </button>
          </div>
        )}

        {!canEdit && (
          <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-100">
            Only {participant.user?.firstName} or the host can edit this setup.
          </div>
        )}
      </div>
    </div>
  );
}
