'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import type { TransportLeg } from '@barry/shared-types';

const REDUCTION_OPTIONS = [
  { value: null, label: 'None', pct: 0 },
  { value: 'jeune', label: 'Youth (12-25)', pct: 30 },
  { value: 'senior', label: 'Senior (60+)', pct: 30 },
  { value: 'student', label: 'Student', pct: 25 },
  { value: 'disability', label: 'Disability', pct: 50 },
  { value: 'large_family', label: 'Large family', pct: 30 },
];

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'];

export default function TransportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    transportLegs, initTransportLegs, updateTransportLeg,
    activeTrip, trips, currentUser,
  } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);
  const legs = transportLegs[id as string] || [];

  useEffect(() => {
    if (trip && legs.length === 0) initTransportLegs(id as string);
  }, [trip?.id]);

  if (!trip) return null;
  const isAdmin = trip.organizerId === currentUser?.id;
  const totalCost = legs.filter(l => !l.selfBooked).reduce((sum, l) => sum + l.finalCost, 0);
  const allConfigured = legs.every(l => l.status === 'configured' || l.selfBooked);

  return (
    <div className="px-4 py-4 pb-32">
      <div className="text-center mb-5">
        <BarryMascot mood="thinking" size={72} />
        <h1 className="font-display font-extrabold text-xl text-slate-900 mt-2 tracking-tight">
          Transport per person
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Add reduction cards or opt out to book yourself.
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {legs.map((leg, i) => {
          const participant = trip.participants.find(p => p.id === leg.participantId);
          const isMe = participant?.userId === currentUser?.id;
          return (
            <div
              key={leg.participantId}
              className={`bg-white rounded-2xl border p-3.5 ${
                leg.status === 'configured' || leg.selfBooked ? 'border-emerald-200' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {leg.participantName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-slate-900">{leg.participantName}</p>
                    {isMe && <span className="text-[9px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">You</span>}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {leg.mode} · {leg.estimatedCost} EUR estimated
                  </p>
                </div>
                <div className="text-right">
                  {leg.selfBooked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Self</span>
                  ) : (
                    <p className="font-bold text-slate-900">
                      {leg.finalCost} EUR
                      {leg.reductionPct > 0 && (
                        <span className="ml-1 text-[10px] text-emerald-600 font-medium">-{leg.reductionPct}%</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {(isMe || isAdmin) && !leg.selfBooked && (
                <>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Reduction card
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {REDUCTION_OPTIONS.map(opt => {
                      const active = leg.reductionCard === opt.value;
                      return (
                        <button
                          key={String(opt.value)}
                          onClick={() => updateTransportLeg(id as string, leg.participantId, {
                            reductionCard: opt.value,
                            reductionPct: opt.pct,
                            status: 'configured',
                          })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}{opt.pct > 0 && ` (-${opt.pct}%)`}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {(isMe || isAdmin) && (
                <button
                  onClick={() => updateTransportLeg(id as string, leg.participantId, {
                    selfBooked: !leg.selfBooked,
                    status: !leg.selfBooked ? 'configured' : 'pending',
                  })}
                  className={`w-full mt-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    leg.selfBooked ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {leg.selfBooked ? "I'll let Barry book it" : "I'll book this myself"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 text-white mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total transport</span>
          <span className="font-display font-extrabold text-2xl">{totalCost.toFixed(2)} EUR</span>
        </div>
        <p className="text-[11px] text-slate-400">
          For {legs.filter(l => !l.selfBooked).length} of {legs.length} participants. Others book themselves.
        </p>
      </div>

      <button
        onClick={() => router.push(`/trips/${id}/funds` as any)}
        disabled={!allConfigured}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {allConfigured ? 'Continue to funding' : 'Configure each participant first'}
      </button>
    </div>
  );
}
