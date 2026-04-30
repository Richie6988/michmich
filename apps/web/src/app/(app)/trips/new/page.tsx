'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'];

type Mode = 'wanderlust' | 'trip';

export default function CreateTripPage() {
  const router = useRouter();
  const { createGroupTrip, isAuthenticated, isGuest } = useAppStore();
  const [mode, setMode] = useState<Mode>('wanderlust');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invites, setInvites] = useState<string[]>([]);
  const [draftFriend, setDraftFriend] = useState('');

  // Auth guard: redirect to login if not authenticated (guests can't create)
  useEffect(() => {
    if (!isAuthenticated || isGuest) {
      router.replace(`/login?redirect=${encodeURIComponent('/trips/new')}` as any);
    }
  }, [isAuthenticated, isGuest, router]);

  if (!isAuthenticated || isGuest) {
    return null; // wait for redirect
  }

  const canCreate = name.trim().length >= 2 && (mode === 'wanderlust' ? true : (date && endDate));
  const friendCount = invites.filter(n => n.trim()).length;

  const handleAddDraft = () => {
    const trimmed = draftFriend.trim();
    if (!trimmed) return;
    setInvites(prev => [...prev, trimmed]);
    setDraftFriend('');
  };

  const handleRemove = (index: number) => {
    setInvites(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const friendNames = invites.filter(n => n.trim());
    const startDate = date ? new Date(date).toISOString() : new Date(Date.now() + 3 * 86400000).toISOString();
    const endDateIso = mode === 'trip' && endDate ? new Date(endDate).toISOString() : undefined;
    const trip = createGroupTrip(
      name,
      'custom',
      startDate,
      friendNames.length > 0 ? friendNames : undefined,
      mode,
      endDateIso,
    );
    router.push(`/trips/${trip.id}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-32">
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
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
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <BarryMascot mood="happy" size={88} />
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
            What's the plan?
          </h1>
          <p className="text-sm text-slate-500 mt-1">Solo or with friends. Doesn't matter.</p>
        </div>

        {/* Mode toggle */}
        <div className="bg-white rounded-2xl p-3 border border-slate-100 mb-3">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('wanderlust')}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                mode === 'wanderlust'
                  ? 'border-barry-blue bg-blue-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🍷</span>
                <span className={`font-bold text-sm ${mode === 'wanderlust' ? 'text-barry-blue' : 'text-slate-700'}`}>
                  Wanderlust
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                One-day outing. Pick a date, a venue, share the bill.
              </p>
            </button>
            <button
              onClick={() => setMode('trip')}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                mode === 'trip'
                  ? 'border-barry-blue bg-blue-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🏨</span>
                <span className={`font-bold text-sm ${mode === 'trip' ? 'text-barry-blue' : 'text-slate-700'}`}>
                  Trip
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Multi-day. Hotels, transport, the whole thing.
              </p>
            </button>
          </div>
        </div>

        {/* Name */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Name your Barry
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={mode === 'wanderlust' ? 'Friday dinner, Sunday hike...' : 'Weekend in Barcelona, Anna\'s wedding...'}
            className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
          />
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
          {mode === 'wanderlust' ? (
            <>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                min={new Date().toISOString().slice(0, 10)}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Leave empty to settle the date with the group later.
              </p>
            </>
          ) : (
            <>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Trip dates
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">From</p>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">To</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
                    min={date || new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
              {date && endDate && (
                <p className="text-[11px] text-slate-500 mt-2">
                  {Math.max(1, Math.round((new Date(endDate).getTime() - new Date(date).getTime()) / 86400000))} {Math.max(1, Math.round((new Date(endDate).getTime() - new Date(date).getTime()) / 86400000)) === 1 ? 'night' : 'nights'}
                </p>
              )}
            </>
          )}
        </div>

        {/* Friends */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Friends <span className="text-slate-400 font-normal">(optional · {friendCount})</span>
          </label>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={draftFriend}
              onChange={e => setDraftFriend(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDraft()}
              placeholder="First name..."
              className="flex-1 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={handleAddDraft}
              disabled={!draftFriend.trim()}
              className="px-4 py-2.5 bg-barry-blue text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-all"
            >
              Add
            </button>
          </div>

          {invites.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {invites.map((nameVal, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-blue-50 rounded-full pl-1 pr-2 py-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px]"
                    style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {nameVal[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700">{nameVal}</span>
                  <button onClick={() => handleRemove(i)} className="text-slate-400 hover:text-rose-500 transition-colors" aria-label="Remove">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500 mt-3 leading-snug">
            Skip this and Barry just plans for you. You can always add friends later.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {friendCount > 0 ? `Create Barry with ${friendCount} ${friendCount === 1 ? 'friend' : 'friends'}` : 'Create my Barry'}
          </button>
        </div>
      </div>
    </div>
  );
}
