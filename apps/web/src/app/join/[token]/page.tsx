'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';

export default function JoinPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { trips } = useAppStore();

  useEffect(() => {
    const trip = trips.find(t => t.inviteToken === token);
    if (trip) {
      router.replace(`/trips/${trip.id}` as any);
    }
  }, [token, trips, router]);

  const trip = trips.find(t => t.inviteToken === token);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <BarryMascot mood="celebrating" size={120} />
      <p className="text-sm text-slate-500 mt-4">Joining trip...</p>
    </div>
  );
}
