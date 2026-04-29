'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

type Mode = 'alone' | 'friends';

export default function CreateTripPage() {
  const router = useRouter();
  const createGroupTrip = useAppStore(s => s.createGroupTrip);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode | null>(null);
  const [date, setDate] = useState('');
  const [invites, setInvites] = useState<string[]>(['']);

  const canNext = name.trim().length >= 2 && mode !== null;

  const handleCreate = () => {
    if (!name.trim() || !mode) return;
    const friendNames = mode === 'friends' ? invites.filter(n => n.trim()) : undefined;
    const trip = createGroupTrip(
      name,
      'custom',
      date ? new Date(date).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(),
      friendNames,
    );
    router.push(`/trips/${trip.id}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-32">
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button
            onClick={() => step === 2 ? setStep(1) : router.back()}
            className="-ml-2 p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <BarryMark size={22} />
            <span className="font-display font-bold text-barry-blue">Barry</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">{step}/2</div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-barry-blue to-blue-600 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </header>

      {step === 1 ? (
        <Step1
          name={name} setName={setName}
          mode={mode} setMode={setMode}
          canNext={canNext}
          onNext={() => setStep(2)}
        />
      ) : (
        <Step2
          name={name}
          mode={mode!}
          date={date} setDate={setDate}
          invites={invites} setInvites={setInvites}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

function Step1({ name, setName, mode, setMode, canNext, onNext }: {
  name: string; setName: (v: string) => void;
  mode: Mode | null; setMode: (m: Mode) => void;
  canNext: boolean; onNext: () => void;
}) {
  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <BarryMascot mood="default" size={80} />
        <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
          New Barry
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
          What's the trip about?
        </p>
      </div>

      {/* Name */}
      <div className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Name your trip
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Friday dinner, weekend in Lyon..."
          className="w-full text-lg font-display font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:outline-none"
          autoFocus
        />
      </div>

      {/* Mode select - alone or with friends */}
      <div className="mb-6">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
          With anyone?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            value="alone"
            selected={mode === 'alone'}
            onClick={() => setMode('alone')}
            icon={<><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></>}
            title="Just me"
            desc="Find a spot for myself"
          />
          <ModeCard
            value="friends"
            selected={mode === 'friends'}
            onClick={() => setMode('friends')}
            icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>}
            title="With friends"
            desc="Invite a group"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </main>
  );
}

function ModeCard({ value, selected, onClick, icon, title, desc }: {
  value: Mode;
  selected: boolean;
  onClick: () => void;
  icon: JSX.Element;
  title: string;
  desc: string;
}) {
  const palette = value === 'alone'
    ? { bg: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20', light: 'bg-orange-50 border-orange-100' }
    : { bg: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/20', light: 'bg-blue-50 border-blue-100' };

  if (selected) {
    return (
      <button
        onClick={onClick}
        className={`relative overflow-hidden bg-gradient-to-br ${palette.bg} text-white rounded-2xl p-4 shadow-lg ${palette.shadow} active:scale-[0.97] transition-all`}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/15 rounded-full blur-xl" />
        <div className="relative text-left">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
          </div>
          <p className="font-display font-bold text-base">{title}</p>
          <p className="text-[11px] text-white/80 mt-0.5">{desc}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border-2 border-slate-100 hover:border-slate-200 active:scale-[0.97] transition-all text-left`}
    >
      <div className={`w-9 h-9 rounded-xl ${palette.light} flex items-center justify-center mb-2 border`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={value === 'alone' ? '#F97316' : '#2563EB'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <p className="font-display font-bold text-base text-slate-900">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
    </button>
  );
}

function Step2({ name, mode, date, setDate, invites, setInvites, onCreate }: {
  name: string;
  mode: Mode;
  date: string; setDate: (v: string) => void;
  invites: string[]; setInvites: (v: string[]) => void;
  onCreate: () => void;
}) {
  const updateInvite = (i: number, val: string) => {
    setInvites(invites.map((x, idx) => idx === i ? val : x));
  };
  const addInvite = () => setInvites([...invites, '']);
  const removeInvite = (i: number) => {
    if (invites.length === 1) return;
    setInvites(invites.filter((_, idx) => idx !== i));
  };

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <BarryMascot mood="happy" size={80} />
        <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
          Almost done
        </h1>
        <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto">
          {mode === 'friends' ? 'Add details and invite friends. Both optional.' : 'Add a date if you have one. Optional.'}
        </p>
      </div>

      {/* Trip summary chip */}
      <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 mb-4 border border-slate-100 w-fit mx-auto">
        <span className={`w-1.5 h-1.5 rounded-full ${mode === 'alone' ? 'bg-orange-500' : 'bg-blue-500'}`} />
        <span className="text-xs font-medium text-slate-700">{name}</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-500">{mode === 'alone' ? 'Solo' : 'Group'}</span>
      </div>

      {/* Date */}
      <div className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          When (optional)
        </label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full text-base font-medium text-slate-900 focus:outline-none"
        />
        {mode === 'friends' && (
          <p className="text-[11px] text-slate-500 mt-2">
            Skip this and let the group vote on a date later (Doodle-style poll).
          </p>
        )}
      </div>

      {/* Invites - friends only */}
      {mode === 'friends' && (
        <div className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Add friends ({invites.filter(n => n.trim()).length})
          </label>
          <div className="space-y-2 mb-2">
            {invites.map((nameVal, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
                  style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}
                >
                  {nameVal.trim()[0]?.toUpperCase() || '?'}
                </div>
                <input
                  type="text"
                  value={nameVal}
                  onChange={e => updateInvite(i, e.target.value)}
                  placeholder="First name (or full name)"
                  className="flex-1 px-3 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {invites.length > 1 && (
                  <button
                    onClick={() => removeInvite(i)}
                    className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center"
                    aria-label="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addInvite}
            className="text-xs text-barry-blue font-medium hover:underline"
          >
            + Add another friend
          </button>
          <p className="text-[11px] text-slate-500 mt-3 leading-snug">
            Just names work. You can share an invite link from the trip page later if you want them to join in-app.
          </p>
        </div>
      )}

      <button
        onClick={onCreate}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
      >
        {mode === 'alone' ? 'Find my spot' : 'Create my Barry'}
      </button>

      <p className="text-center text-[11px] text-slate-400 mt-4">
        {mode === 'alone'
          ? 'Next: tell Barry your preferences, get spots on the map.'
          : 'Next: set preferences, vote on dates, get the fairest spot.'}
      </p>
    </main>
  );
}
