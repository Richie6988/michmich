'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';

export default function KittyPage() {
  const { id } = useParams<{ id: string }>();
  const { cagnottes, payContribution, initKitty, activeTrip, currentUser, trips } = useAppStore();
  const [setupAmount, setSetupAmount] = useState(200);

  const trip = activeTrip || trips.find(t => t.id === id);
  const cagnotte = cagnottes[id as string];
  const isAdmin = trip?.organizerId === currentUser?.id;

  if (!cagnotte) {
    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <BarryMascot mood="default" size={80} />
          <h2 className="font-display font-bold text-xl text-barry-black mt-3">
            Start a kitty
          </h2>
          <p className="text-sm text-barry-grey mt-1.5 max-w-xs mx-auto">
            Everyone prepays their share. You book it all in one tap.
          </p>
        </div>

        {isAdmin ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <label className="block text-xs font-semibold text-barry-grey uppercase tracking-wider mb-2">
              Estimated total amount
            </label>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                value={setupAmount}
                onChange={e => setSetupAmount(Number(e.target.value))}
                className="flex-1 text-3xl font-display font-extrabold text-barry-black focus:outline-none bg-transparent"
              />
              <span className="text-2xl font-display font-bold text-barry-grey">EUR</span>
            </div>
            <p className="text-xs text-barry-grey mb-4">
              About {Math.ceil(setupAmount / Math.max(trip?.participants.length || 1, 1))} EUR per person
            </p>
            <button
              onClick={() => initKitty(id as string, setupAmount)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all"
            >
              Launch the kitty
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-amber-800">
              Only the host can start a kitty.
            </p>
          </div>
        )}
      </div>
    );
  }

  const myContribution = cagnotte.contributions.find(c => c.userId === currentUser?.id);
  const progress = (cagnotte.collected / cagnotte.totalTarget) * 100;
  const remaining = cagnotte.totalTarget - cagnotte.collected;
  const allPaid = cagnotte.contributions.every(c => c.status === 'paid');

  return (
    <div className="px-4 py-4">
      {/* Kitty hero */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-5 text-white mb-4 shadow-lg shadow-pink-500/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-pink-100">Kitty of the group</span>
          <BarryMascot mood="happy" size={48} />
        </div>

        <div className="mb-4">
          <p className="text-4xl font-display font-extrabold tracking-tight">
            {cagnotte.collected} <span className="text-2xl text-pink-200">/ {cagnotte.totalTarget} EUR</span>
          </p>
          <p className="text-xs text-pink-100 mt-1">
            {remaining > 0 ? `${remaining} EUR remaining` : 'Kitty complete !'}
          </p>
        </div>

        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* My contribution CTA */}
      {myContribution && myContribution.status === 'pending' && (
        <div className="bg-white rounded-2xl p-4 mb-4 border-2 border-barry-coral/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-barry-grey">Your share</p>
              <p className="text-2xl font-display font-bold text-barry-black">{myContribution.amount} EUR</p>
            </div>
            <div className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full uppercase">
              To pay
            </div>
          </div>
          <button
            onClick={() => payContribution(id as string, myContribution.id)}
            className="w-full bg-gradient-to-r from-barry-coral to-orange-600 text-white font-semibold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Pay my share
          </button>
          <p className="text-[11px] text-barry-grey text-center mt-2">
            Stripe Connect (demo mode) - no real charge
          </p>
        </div>
      )}

      {/* Contributions list */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <h3 className="font-semibold text-barry-black mb-3 flex items-center justify-between">
          <span>Contributions</span>
          <span className="text-xs text-barry-grey font-normal">
            {cagnotte.contributions.filter(c => c.status === 'paid').length}/{cagnotte.contributions.length} paid
          </span>
        </h3>
        <div className="space-y-2">
          {cagnotte.contributions.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}
                >
                  {c.user?.firstName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-barry-black">{c.user?.firstName}</p>
                  <p className="text-[11px] text-barry-grey">{c.amount} EUR</p>
                </div>
              </div>
              {c.status === 'paid' ? (
                <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase">Paid</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  Waiting
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin: One-click booking */}
      {isAdmin && (
        <div className={`rounded-2xl p-4 border-2 transition-all ${
          allPaid
            ? 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-300'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              allPaid ? 'bg-emerald-500' : 'bg-gray-300'
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-barry-black">One-tap booking</p>
              <p className="text-xs text-barry-grey mt-0.5">
                {allPaid
                  ? 'Tout est paid ! You can book transport + venue + activity in one tap.'
                  : 'Disponible une fois que tout le monde a paid.'}
              </p>
            </div>
          </div>
          <button
            disabled={!allPaid}
            className={`w-full font-semibold py-3 rounded-xl transition-all ${
              allPaid
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Book everything now
          </button>
        </div>
      )}
    </div>
  );
}
