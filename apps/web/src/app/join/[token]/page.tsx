'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';
import { AvatarStack } from '@/components/ui/avatar';
import { formatDateLong } from '@/lib/utils/format-date';

export default function JoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { trips, isAuthenticated, setGuestMode } = useAppStore();
  const [guestName, setGuestName] = useState('');
  const [showSignupCard, setShowSignupCard] = useState(false);

  const trip = trips.find(t => t.inviteToken === token);

  // If already authenticated, redirect immediately
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

  const handleJoinAsGuest = () => {
    if (!guestName.trim()) return;
    setGuestMode(guestName.trim());
    router.replace(`/trips/${trip.id}` as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Background trip preview (blurred behind the modal) */}
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <BarryMark size={28} />
          <span className="font-display font-extrabold text-xl text-barry-blue">Barry</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 blur-sm pointer-events-none select-none" aria-hidden="true">
        <div className="bg-white rounded-3xl border border-slate-100 p-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">You're invited to</p>
          <h1 className="font-display font-extrabold text-3xl text-slate-900 tracking-tight mb-2">{trip.name}</h1>
          <p className="text-sm text-slate-600 mb-4">
            Organized by <span className="font-semibold text-slate-900">{trip.organizer?.firstName || 'someone'}</span>
            {trip.scheduledAt && <> · {formatDateLong(trip.scheduledAt)}</>}
          </p>
          <AvatarStack users={trip.participants.map(p => p.user)} max={6} size={36} />
        </div>
      </main>

      {/* Forced 'Who are you?' modal — first thing they see */}
      <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-barry-blue to-blue-700 text-white px-5 py-5 text-center">
            <BarryMascot mood="happy" size={64} />
            <h2 className="font-display font-extrabold text-xl tracking-tight mt-2">Who are you?</h2>
            <p className="text-xs text-blue-100 mt-1 leading-snug">
              You're joining <strong>{trip.name}</strong>. The group needs a name to put on your card.
            </p>
          </div>

          <div className="p-5">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Your first name
            </label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinAsGuest()}
              placeholder="e.g. Marie"
              className="w-full bg-slate-50 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
              maxLength={30}
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              No account needed. {trip.organizer?.firstName || 'The organizer'} will see "{guestName.trim() || '...'}" as your display name.
            </p>

            <button
              onClick={handleJoinAsGuest}
              disabled={!guestName.trim()}
              className="w-full mt-4 bg-gradient-to-r from-barry-blue to-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Join {trip.name}
            </button>

            {/* Sign up upsell - collapsed */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              {showSignupCard ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-slate-700 mb-2 leading-snug">
                    With an account, your home address, transport mode, and loyalty cards
                    auto-fill on every future Barry. You'll save 5 minutes per trip.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/trips/${trip.id}`)}` as any}
                      className="flex-1 text-center bg-barry-blue text-white font-semibold rounded-lg px-3 py-2 text-xs"
                    >
                      Sign up or sign in
                    </Link>
                    <button
                      onClick={() => setShowSignupCard(false)}
                      className="text-xs text-slate-500 font-medium hover:text-slate-700 px-2"
                    >
                      Later
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSignupCard(true)}
                  className="w-full text-center text-xs text-barry-blue font-semibold hover:underline py-1"
                >
                  Got an account? Sign in instead.
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              By joining you agree to Barry's <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
