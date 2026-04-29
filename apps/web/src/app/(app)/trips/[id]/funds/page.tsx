'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'];

export default function FundsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    fundsRequests, createFundsRequest, payFundsContribution,
    activeTrip, trips, currentUser, inAppBalance, paymentMethods,
  } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);
  const fr = fundsRequests[id as string];

  useEffect(() => {
    if (trip && !fr) createFundsRequest(id as string);
  }, [trip?.id]);

  if (!trip || !fr) {
    return (
      <div className="px-4 py-12 text-center">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Preparing funds request...</p>
      </div>
    );
  }

  const myContribution = fr.contributions.find(c => c.userId === currentUser?.id);
  const isAdmin = trip.organizerId === currentUser?.id;
  const allPaid = fr.status === 'complete';

  return (
    <div className="px-4 py-4 pb-32">
      <div className="text-center mb-5">
        <BarryMascot mood="happy" size={72} />
        <h1 className="font-display font-extrabold text-xl text-slate-900 mt-2 tracking-tight">
          Time to fund the trip
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Once everyone pays, Barry books it all in one shot.
        </p>
      </div>

      {/* Total card */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/15 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Total to collect</p>
        <p className="font-display font-extrabold text-3xl mt-1">{fr.totalAmount.toFixed(2)} EUR</p>
        <p className="text-[11px] text-pink-100 mt-1">
          {fr.contributions.filter(c => c.status === 'paid').length}/{fr.contributions.length} paid
        </p>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Breakdown</h3>
        <div className="space-y-2">
          <BreakdownRow icon="utensils" label="Venues" amount={fr.breakdown.venues} color="#F97316" />
          <BreakdownRow icon="bed" label="Stay" amount={fr.breakdown.accommodation} color="#8B5CF6" />
          <BreakdownRow icon="route" label="Transport" amount={fr.breakdown.transport} color="#2563EB" />
        </div>
      </div>

      {/* My contribution */}
      {myContribution && (
        <div className={`rounded-2xl p-4 mb-3 border ${
          myContribution.status === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your share</h3>
            {myContribution.status === 'paid' && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Paid</span>
            )}
          </div>
          <p className="font-display font-extrabold text-2xl text-slate-900 mb-3">
            {myContribution.amount.toFixed(2)} EUR
          </p>

          {myContribution.status === 'paid' ? (
            <p className="text-xs text-emerald-800 leading-snug">
              Thanks. {myContribution.paidFromBalance > 0 && `${myContribution.paidFromBalance.toFixed(2)} EUR from balance, `}
              {myContribution.paidFromCard > 0 && `${myContribution.paidFromCard.toFixed(2)} EUR from card.`}
            </p>
          ) : (
            <>
              <PayButton
                contribution={myContribution}
                inAppBalance={inAppBalance}
                hasCard={paymentMethods.length > 0}
                onPay={(useBalance) => payFundsContribution(id as string, myContribution.id, useBalance)}
                onAddCard={() => router.push('/profile')}
              />
            </>
          )}
        </div>
      )}

      {/* All contributions list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Group contributions</h3>
        <div className="space-y-2.5">
          {fr.contributions.map((c, i) => {
            const isMe = c.userId === currentUser?.id;
            return (
              <div key={c.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {c.user?.firstName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {c.user?.firstName} {isMe && <span className="text-[10px] text-slate-400">(you)</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700">{c.amount.toFixed(2)} EUR</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  c.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {c.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isAdmin && allPaid && (
        <button
          onClick={() => router.push(`/trips/${id}/booking` as any)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          Everyone paid - book everything now
        </button>
      )}

      {!allPaid && (
        <div className="text-center py-3 px-4 bg-slate-50 rounded-2xl">
          <p className="text-sm font-medium text-slate-600">
            Waiting for {fr.contributions.filter(c => c.status !== 'paid').length} more
            {fr.contributions.filter(c => c.status !== 'paid').length === 1 ? ' payment' : ' payments'}
          </p>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({ icon, label, amount, color }: { icon: string; label: string; amount: number; color: string }) {
  const icons: Record<string, JSX.Element> = {
    utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h2v9M21 6h-3v3a3 3 0 003 3v9M11 7H7M11 11H7M11 15H7" /></>,
    bed: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
    route: <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h8a3 3 0 003-3 3 3 0 00-3-3H7a3 3 0 01-3-3 3 3 0 013-3h8" /></>,
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icons[icon]}
        </svg>
      </div>
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{amount.toFixed(2)} EUR</span>
    </div>
  );
}

function PayButton({ contribution, inAppBalance, hasCard, onPay, onAddCard }: {
  contribution: any;
  inAppBalance: number;
  hasCard: boolean;
  onPay: (useBalance: boolean) => void;
  onAddCard: () => void;
}) {
  const canCoverFromBalance = inAppBalance >= contribution.amount;
  const partialFromBalance = inAppBalance > 0 && inAppBalance < contribution.amount;

  if (!hasCard && !canCoverFromBalance) {
    return (
      <button
        onClick={onAddCard}
        className="w-full bg-amber-100 text-amber-900 font-semibold py-3 rounded-xl active:scale-[0.98] transition-all text-sm"
      >
        Add a payment method first
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {(canCoverFromBalance || partialFromBalance) && (
        <button
          onClick={() => onPay(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition-all text-sm"
        >
          {canCoverFromBalance
            ? `Pay from balance (${inAppBalance.toFixed(2)} EUR available)`
            : `Use ${inAppBalance.toFixed(2)} EUR balance + card for the rest`}
        </button>
      )}
      {hasCard && (
        <button
          onClick={() => onPay(false)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition-all text-sm"
        >
          Pay with card · {contribution.amount.toFixed(2)} EUR
        </button>
      )}
    </div>
  );
}
