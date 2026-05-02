'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { reverseGeocode, geocode, type NominatimResult } from '@/lib/api/nominatim';
import { CARD_PROVIDERS, getCardLabel, getCardDefaultReduction, groupProvidersByType } from '@/lib/data/reduction-cards';
import type { TransportMode, GeoPoint, ReductionCard } from '@barry/shared-types';

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
  { value: 'flight', label: 'Flight', color: '#EC4899',
    icon: <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 5 19.7 3.7c-1.3-1.3-2.3-1.3-3.8.2L12.4 7.4 4.2 5.6c-.5-.1-.9 0-1.2.3L2.4 6.5c-.4.3-.4.8-.1 1.1l5.7 3.5L4.5 14H3l-1 1 4 1 1 4 1-1v-1.5l3-3.4 3.5 5.7c.3.3.8.3 1.1-.1l.6-.6c.3-.3.4-.7.3-1.2z" /> },
];

const COMMON_CURRENCIES = [
  { code: 'EUR' as const, symbol: '€' },
  { code: 'USD' as const, symbol: '$' },
  { code: 'GBP' as const, symbol: '£' },
  { code: 'CHF' as const, symbol: 'CHF' },
];

export function SetupSheet({ tripId, participantId, onClose }: {
  tripId: string;
  participantId: string;
  onClose: () => void;
}) {
  const { trips, currentUser, preferences, userLocation, updateParticipantConstraints, updateTransportLeg, transportLegs, isAuthenticated, isGuest } = useAppStore();
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

  // Time and budget — input with unit/currency selector
  const [maxTime, setMaxTime] = useState(
    participant?.maxTime
    || (isMe ? preferences.defaultMaxTime : null)
    || 45
  );
  const [maxTimeUnit, setMaxTimeUnit] = useState<'min' | 'h'>(
    participant?.maxTimeUnit
    || (isMe ? preferences.defaultMaxTimeUnit : null)
    || 'min'
  );
  const [maxBudget, setMaxBudget] = useState(
    participant?.maxMoney
    || (isMe ? preferences.defaultMaxBudget : null)
    || 15
  );
  const [maxBudgetCurrency, setMaxBudgetCurrency] = useState<'EUR' | 'USD' | 'GBP' | 'CHF'>(
    participant?.maxMoneyCurrency
    || (isMe ? preferences.defaultMaxBudgetCurrency : null)
    || 'EUR'
  );

  // Email for booking reports
  const [email, setEmail] = useState(
    participant?.email
    || (isMe ? (preferences.defaultEmail || currentUser?.email) : '')
    || ''
  );

  // Self-book toggle
  const [selfBook, setSelfBook] = useState(
    participant?.selfBook
    ?? (isMe ? preferences.defaultSelfBook : null)
    ?? false
  );

  // Reduction cards (multiple)
  const [reductionCards, setReductionCards] = useState<ReductionCard[]>(
    participant?.reductionCards
    || (isMe ? (preferences.defaultReductionCards || []) : [])
  );
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardProvider, setNewCardProvider] = useState<string>('');
  const [newCardNumber, setNewCardNumber] = useState('');

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
    // Convert maxTime to minutes for the underlying engine
    const maxTimeMin = maxTimeUnit === 'h' ? maxTime * 60 : maxTime;
    updateParticipantConstraints(tripId, participant.userId, {
      transportMode: mode,
      // Keep weights as 0.5/0.5 since the priority slider was removed
      timeWeight: 0.5,
      moneyWeight: 0.5,
      maxTime: maxTimeMin,
      maxTimeUnit,
      maxMoney: maxBudget,
      maxMoneyCurrency: maxBudgetCurrency,
      email,
      selfBook,
      reductionCards,
      originLocation: origin,
      originLabel,
    });
    onClose();
  };

  const handleAddReductionCard = () => {
    if (!newCardProvider) return;
    const provider = CARD_PROVIDERS.find(p => p.id === newCardProvider);
    if (!provider) return;
    const card: ReductionCard = {
      id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      provider: newCardProvider,
      label: provider.label,
      cardNumber: newCardNumber,
      reductionPct: provider.defaultReduction || 0,
    };
    setReductionCards(prev => [...prev, card]);
    setNewCardProvider('');
    setNewCardNumber('');
    setShowAddCard(false);
  };

  const handleRemoveCard = (id: string) => {
    setReductionCards(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-2xl rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll">
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
          {/* Banner encouraging guests to register so their setup persists */}
          {(isGuest || !isAuthenticated) && isMe && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-barry-blue text-white flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">Save your setup forever</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                  Create a free account in 30 seconds. Barry will remember your home address, transport, and budget for every future trip.
                </p>
                <a
                  href={`/login?redirect=/trips/${tripId}`}
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-barry-blue hover:underline"
                >
                  Create my account
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              </div>
            </div>
          )}

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
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 pr-9"
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
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.lat}-${s.lon}-${i}`}
                      onMouseDown={(e) => { e.preventDefault(); handlePickSuggestion(s); }}
                      onTouchStart={(e) => { e.preventDefault(); handlePickSuggestion(s); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-1">
              {TRANSPORT_OPTIONS.map(opt => {
                const selected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => canEdit && setMode(opt.value)}
                    disabled={!canEdit}
                    className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border-2 transition-all ${selected ? 'border-current' : 'border-slate-100 hover:border-slate-200'}`}
                    style={selected ? { borderColor: opt.color, backgroundColor: `${opt.color}10` } : {}}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selected ? opt.color : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {opt.icon}
                    </svg>
                    <span className="text-[9px] font-medium leading-none" style={{ color: selected ? opt.color : '#64748B' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Self-book toggle */}
          <div>
            <button
              onClick={() => canEdit && setSelfBook(!selfBook)}
              disabled={!canEdit}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 rounded-xl p-3 transition-colors"
            >
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">I'll book my transport myself</p>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  Barry skips ticketing for you. You'll only need to share boarding times with the group.
                </p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${selfBook ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${selfBook ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </div>
            </button>
          </div>

          {/* Email for booking reports */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email <span className="text-slate-400 font-normal">(for booking reports)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!canEdit}
              placeholder="name@example.com"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Where Barry sends your tickets, boarding times, maps and contact numbers.
            </p>
          </div>

          {/* Reduction / loyalty cards (only if not self-booking) */}
          {!selfBook && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Reduction & loyalty cards <span className="text-slate-400 font-normal">({reductionCards.length})</span>
                </label>
                {canEdit && !showAddCard && (
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="text-[11px] text-barry-blue font-bold hover:underline"
                  >
                    + Add a card
                  </button>
                )}
              </div>

              {/* Existing cards list */}
              {reductionCards.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {reductionCards.map(card => (
                    <div key={card.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{card.label}</p>
                        <p className="text-[10px] text-slate-600 truncate">
                          {card.cardNumber || 'No number'}
                          {card.reductionPct ? ` · -${card.reductionPct}%` : ''}
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveCard(card.id)}
                          className="w-7 h-7 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0"
                          aria-label="Remove"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add card form */}
              {showAddCard && canEdit && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <select
                    value={newCardProvider}
                    onChange={e => setNewCardProvider(e.target.value)}
                    className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Pick a card provider...</option>
                    <optgroup label="Rail (France)">
                      {CARD_PROVIDERS.filter(p => p.type === 'rail' && p.countries?.includes('FR')).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Rail (Other Europe)">
                      {CARD_PROVIDERS.filter(p => p.type === 'rail' && !p.countries?.includes('FR')).map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Airlines">
                      {CARD_PROVIDERS.filter(p => p.type === 'air').map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Bus">
                      {CARD_PROVIDERS.filter(p => p.type === 'bus').map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <input
                    type="text"
                    value={newCardNumber}
                    onChange={e => setNewCardNumber(e.target.value)}
                    placeholder="Card / member number"
                    className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddReductionCard}
                      disabled={!newCardProvider}
                      className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 active:scale-95 transition-all"
                    >
                      Add card
                    </button>
                    <button
                      onClick={() => { setShowAddCard(false); setNewCardProvider(''); setNewCardNumber(''); }}
                      className="px-3 py-2 text-slate-600 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {reductionCards.length === 0 && !showAddCard && (
                <p className="text-[11px] text-slate-500">
                  None yet. Add SNCF, KLM, Lufthansa, etc. to unlock loyalty pricing.
                </p>
              )}
            </div>
          )}

          {/* Max one-way travel duration — input field with unit */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max one-way travel duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={maxTime}
                onChange={e => setMaxTime(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={!canEdit}
                min={0}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              />
              <select
                value={maxTimeUnit}
                onChange={e => setMaxTimeUnit(e.target.value as 'min' | 'h')}
                disabled={!canEdit}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              >
                <option value="min">min</option>
                <option value="h">hours</option>
              </select>
            </div>
          </div>

          {/* Max budget — input field with currency */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Total maximum budget</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={maxBudget}
                onChange={e => setMaxBudget(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={!canEdit}
                min={0}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              />
              <select
                value={maxBudgetCurrency}
                onChange={e => setMaxBudgetCurrency(e.target.value as 'EUR' | 'USD' | 'GBP' | 'CHF')}
                disabled={!canEdit}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
              >
                {COMMON_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
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
