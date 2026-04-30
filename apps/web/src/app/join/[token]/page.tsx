'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

export default function JoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { trips, isAuthenticated, setGuestMode } = useAppStore();
  const [guestName, setGuestName] = useState('');

  const trip = trips.find(t => t.inviteToken === token);

  // If already authenticated, just redirect immediately
  useEffect(() => {
    if (isAuthenticated && trip) {
      router.replace(`/trips/${trip.id}` as any);
    }
  }, [isAuthenticated, trip, router]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <BarryMascot mood="thinking" size={120} />
        <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-4">
          Invite not found
        </h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">
          This invite link is invalid or the trip has been deleted.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-5 py-2.5 bg-barry-blue text-white font-semibold rounded-xl text-sm"
        >
          Back to Barry
        </button>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <BarryMascot mood="celebrating" size={120} />
        <p className="text-sm text-slate-500 mt-4">Joining trip...</p>
      </div>
    );
  }

  // Not authenticated → show join-as-guest screen
  const handleJoinAsGuest = () => {
    if (!guestName.trim()) return;
    setGuestMode(guestName.trim());
    router.replace(`/trips/${trip.id}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <BarryMark size={28} />
          <span className="font-display font-extrabold text-xl text-barry-blue">Barry</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <BarryMascot mood="happy" size={96} />
            <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
              You're invited to{' '}
              <span className="text-barry-blue">{trip.name}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Organized by {trip.organizer?.firstName || 'someone'}
              {trip.participants.length > 1 && ` · ${trip.participants.length} participants`}
            </p>
          </div>

          {/* Quick join as guest */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-3">
            <p className="font-display font-bold text-base text-slate-900 mb-1">Join as a guest</p>
            <p className="text-xs text-slate-500 mb-3">
              No account needed. We just need your first name so the group knows it's you.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinAsGuest()}
                placeholder="Your first name..."
                className="flex-1 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
              <button
                onClick={handleJoinAsGuest}
                disabled={!guestName.trim()}
                className="px-4 py-2.5 bg-barry-blue text-white font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-all text-sm"
              >
                Join
              </button>
            </div>
          </div>

          {/* OR sign up */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-5 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <BarryMascot mood="thinking" size={28} />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-base text-slate-900">Better with an account</p>
                <p className="text-xs text-slate-600 mb-3 leading-snug">
                  Save your preferences (home address, transport mode, loyalty cards) once,
                  reuse them for every Barry. Plus, create your own.
                </p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/trips/${trip.id}`)}` as any}
                  className="inline-block bg-barry-blue text-white font-semibold rounded-xl px-4 py-2 text-xs"
                >
                  Sign up or sign in
                </Link>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            By joining you agree to Barry's <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
