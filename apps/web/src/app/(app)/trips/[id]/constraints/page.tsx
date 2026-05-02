'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { reverseGeocode } from '@/lib/api/nominatim';
import type { TransportMode } from '@barry/shared-types';

const MODES: { value: TransportMode; label: string; color: string; icon: JSX.Element }[] = [
  { value: 'walk', label: 'Walk', color: '#10B981', icon: <><circle cx="12" cy="3" r="2" /><path d="M9 21l1.5-6.5L8 12V8h1.5l3-2 2 4 2 1M14 21l-2-7" /></> },
  { value: 'bike', label: 'Bike', color: '#3B82F6', icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'transit', label: 'Transit', color: '#8B5CF6', icon: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19l-2 3M16 19l2 3M8 7h.01M16 7h.01" /></> },
  { value: 'car', label: 'Car', color: '#F97316', icon: <><path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path d="M2 13l1.5-5A2 2 0 015.5 7h13a2 2 0 011.94 1.5L22 13M2 13h20" /></> },
  { value: 'train', label: 'Train', color: '#06B6D4', icon: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></> },
];

export default function ConstraintsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, updateTripStatus, updateParticipantConstraints, currentUser, userLocation, preferences } = useAppStore();

  const [originLabel, setOriginLabel] = useState(currentUser?.homeLocation ? 'Home' : 'My location');
  const [mode, setMode] = useState<TransportMode>(preferences?.defaultTransportMode || 'transit');
  const [maxTime, setMaxTime] = useState(45);
  const [maxBudget, setMaxBudget] = useState(15);
  const [weight, setWeight] = useState(0.5);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (id && !activeTrip) setActiveTrip(id as string);
  }, [id, activeTrip, setActiveTrip]);

  // Reverse-geocode origin label
  useEffect(() => {
    const loc = preferences?.homeLocation || currentUser?.homeLocation || userLocation;
    if (!loc) return;
    reverseGeocode(loc).then(label => {
      if (label) setOriginLabel(label);
    });
  }, [preferences?.homeLocation, currentUser?.homeLocation, userLocation]);

  const handleSubmit = () => {
    if (!currentUser) return;
    setSubmitted(true);

    // Persist this user's preferences as their participant record
    const origin = preferences?.homeLocation || currentUser.homeLocation || userLocation || null;
    updateParticipantConstraints(id as string, currentUser.id, {
      transportMode: mode,
      timeWeight: weight,
      moneyWeight: 1 - weight,
      maxTime,
      maxMoney: maxBudget,
      originLocation: origin,
      originLabel,
    });

    setTimeout(() => {
      updateTripStatus(id as string, 'calculating');
      router.push(`/trips/${id}/map` as any);
    }, 1500);
  };

  // Loader screen during calculation
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <BarryMascot mood="celebrating" size={120} />
        <h2 className="font-display font-bold text-2xl mt-6 text-slate-900">Preferences locked in</h2>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          Barry's running the math. Crunching routes, scoring fairness...
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-barry-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const totalMembers = activeTrip?.participants.length || 1;
  const ready = activeTrip?.participants.filter(p =>
    p.status === 'constraints_set' || p.status === 'voted'
  ).length || 0;

  return (
    <div className="px-4 py-4 pb-32">
      <div className="text-center mb-5">
        <BarryMascot mood="thinking" size={68} />
        <h1 className="font-display font-extrabold text-xl text-slate-900 mt-2 tracking-tight">
          Your preferences
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
          Tell Barry your limits. He'll find the fair spot.
        </p>
      </div>

      {/* Origin */}
      <Card>
        <Label icon="pin">Starting from</Label>
        <p className="text-base font-semibold text-slate-900 truncate">{originLabel}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Drag pin or change in profile to update</p>
      </Card>

      {/* Transport */}
      <Card>
        <Label icon="route">How will you travel</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {MODES.map(m => {
            const selected = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all ${
                  selected ? 'border-current' : 'border-slate-100 hover:border-slate-200'
                }`}
                style={selected ? { borderColor: m.color, backgroundColor: `${m.color}10` } : {}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selected ? m.color : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {m.icon}
                </svg>
                <span className={`text-[10px] font-semibold`} style={{ color: selected ? m.color : '#64748B' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Max time */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <Label icon="clock" inline>Max travel time</Label>
          <span className="font-display font-extrabold text-2xl text-barry-blue">
            {maxTime < 60 ? `${maxTime} min` : `${(maxTime / 60).toFixed(maxTime % 60 === 0 ? 0 : 1)}h`}
          </span>
        </div>
        <input
          type="range" min={5} max={180} step={5} value={maxTime}
          onChange={e => setMaxTime(Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-barry-blue"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
          <span>5 min</span><span>30 min</span><span>1h</span><span>2h</span><span>3h</span>
        </div>
      </Card>

      {/* Max budget */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <Label icon="wallet" inline>Max transport budget</Label>
          <span className="font-display font-extrabold text-2xl text-barry-coral">
            {maxBudget === 0 ? 'Free' : `${maxBudget} EUR`}
          </span>
        </div>
        <input
          type="range" min={0} max={100} step={5} value={maxBudget}
          onChange={e => setMaxBudget(Number(e.target.value))}
          className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-barry-coral"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
          <span>Free</span><span>50 EUR</span><span>100 EUR</span>
        </div>
      </Card>

      {/* Priority */}
      <Card>
        <Label icon="balance">What matters most</Label>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${weight < 0.4 ? 'text-barry-blue' : 'text-slate-400'}`}>
            Time
          </span>
          <div className="flex-1 relative">
            <input
              type="range" min={0} max={1} step={0.05} value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-barry-blue to-barry-coral rounded-full appearance-none cursor-pointer"
              style={{ background: 'linear-gradient(to right, #2563EB, #F97316)' }}
            />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${weight > 0.6 ? 'text-barry-coral' : 'text-slate-400'}`}>
            Budget
          </span>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px] text-slate-500">
            {weight < 0.35 ? 'Speed over savings' :
             weight > 0.65 ? 'Save money over time' :
             'Balanced fair to all'}
          </span>
        </div>
      </Card>

      {/* Group status (only for groups) */}
      {activeTrip && totalMembers > 1 && (
        <div className="mt-4 mb-6">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Group progress · {ready}/{totalMembers}
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
            {activeTrip.participants.map((p, i) => {
              const isReady = p.status === 'constraints_set' || p.status === 'voted';
              return (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px]"
                      style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}
                    >
                      {p.user?.firstName?.[0]}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{p.user?.firstName}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isReady ? 'bg-emerald-50 text-emerald-700' :
                    p.status === 'accepted' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {isReady ? 'Ready' : p.status === 'accepted' ? 'Waiting' : 'Invited'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
      >
        {totalMembers > 1 ? 'Send my preferences' : 'Find my spot'}
      </button>

      {totalMembers > 1 && ready < totalMembers - 1 && (
        <p className="text-center text-[11px] text-slate-400 mt-3 leading-snug">
          Barry will start calculating once everyone has set their preferences.
        </p>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
      {children}
    </div>
  );
}

function Label({ children, icon, inline }: { children: React.ReactNode; icon?: string; inline?: boolean }) {
  const icons: Record<string, JSX.Element> = {
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
    route: <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h8a3 3 0 003-3 3 3 0 00-3-3H7a3 3 0 01-3-3 3 3 0 013-3h8" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    wallet: <><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" /><circle cx="16" cy="14" r="1.5" /></>,
    balance: <><path d="M16 14l3-7h-3M16 14l-3-7M5 14l3-7H5M5 14l-3-7" /><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="21" x2="21" y2="21" /></>,
  };
  return (
    <label className={`flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${inline ? '' : 'mb-2'}`}>
      {icon && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icons[icon]}
        </svg>
      )}
      {children}
    </label>
  );
}
