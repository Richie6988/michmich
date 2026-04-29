'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { formatDateLong } from '@/lib/utils/format-date';
import { computeBalances } from '@/lib/utils/expenses';

export default function TripOverviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, trips, currentUser, cagnottes, chats, datePolls, expenses } = useAppStore();
  const [copied, setCopied] = useState(false);

  const trip = activeTrip || trips.find(t => t.id === id);
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  const cagnotte = cagnottes[trip.id];
  const messages = chats[trip.id] || [];
  const poll = datePolls[trip.id];
  const tripExpenses = expenses[trip.id] || [];
  const isAdmin = trip.organizerId === currentUser?.id;
  const constraintsReady = trip.participants.filter(p => p.status === 'constraints_set' || p.status === 'voted').length;
  const totalMembers = trip.participants.length;

  const myBalance = useMemo(() => {
    const users = trip.participants.map(p => p.user!).filter(Boolean);
    const balances = computeBalances(tripExpenses, users);
    return balances.find(b => b.userId === currentUser?.id);
  }, [tripExpenses, trip.participants, currentUser?.id]);

  const handleCopyInvite = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`https://barry.app/join/${trip.inviteToken}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine the journey stage to suggest the next action
  const nextStep = (() => {
    if (trip.status === 'completed' || tripExpenses.length > 0) {
      return { label: 'Track expenses', href: `/trips/${trip.id}/expenses`, color: 'emerald', desc: 'Split fairly with everyone' };
    }
    if (!poll || poll.status === 'open') {
      return { label: 'Pick a date', href: `/trips/${trip.id}/dates`, color: 'purple', desc: 'Find a date that works for all' };
    }
    if (constraintsReady < totalMembers) {
      return { label: 'Set my preferences', href: `/trips/${trip.id}/constraints`, color: 'amber', desc: 'Time, budget, transport' };
    }
    return { label: 'See the map', href: `/trips/${trip.id}/map`, color: 'blue', desc: 'Discover the fairest spot' };
  })();

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Smart next-action card */}
      <NextStepCard {...nextStep} />

      {/* Members */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-sm">
            Members <span className="text-slate-400 font-normal">({totalMembers})</span>
          </h3>
          <span className="text-xs text-slate-500">
            {constraintsReady} ready
          </span>
        </div>
        <div className="space-y-2.5 mb-4">
          {trip.participants.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}
                >
                  {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.user?.firstName} {p.user?.lastName}
                    {p.userId === trip.organizerId && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">Host</span>
                    )}
                  </p>
                  {p.originLabel && (
                    <p className="text-[11px] text-slate-500">From {p.originLabel}</p>
                  )}
                </div>
              </div>
              <ParticipantStatusBadge status={p.status} />
            </div>
          ))}
        </div>

        {/* Invite */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex gap-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1F8B4F] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
              </svg>
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Live activity grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Dates poll widget */}
        {poll ? (
          <Link href={`/trips/${trip.id}/dates`} className="block">
            <div className="bg-white rounded-2xl border border-slate-100 p-3.5 hover:shadow-md transition-all h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Dates</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {poll.status === 'closed' ? 'Locked in' : `${poll.options.length} options`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {new Set(poll.votes.map(v => v.userId)).size} of {totalMembers} voted
              </p>
            </div>
          </Link>
        ) : (
          <Link href={`/trips/${trip.id}/dates`} className="block">
            <div className="bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200 p-3.5 hover:bg-purple-100 transition-colors h-full">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-purple-900 leading-tight">Pick a date</p>
              <p className="text-[11px] text-purple-700 mt-0.5">Doodle-style poll</p>
            </div>
          </Link>
        )}

        {/* Chat */}
        <Link href={`/trips/${trip.id}/chat`} className="block">
          <div className="bg-white rounded-2xl border border-slate-100 p-3.5 hover:shadow-md transition-all h-full relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Chat</span>
              {messages.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {messages.length > 0 ? `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}` : 'Start chatting'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {messages.length > 0 ? messages[messages.length - 1].content.slice(0, 40) : 'Discuss with the group'}
            </p>
          </div>
        </Link>
      </div>

      {/* Cagnotte highlight when active */}
      {cagnotte && cagnotte.status === 'open' && (
        <Link href={`/trips/${trip.id}/cagnotte`} className="block">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/15 active:scale-[0.98] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-100">Pre-trip kitty</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-70">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display font-extrabold text-2xl">{cagnotte.collected} EUR</span>
              <span className="text-pink-100 text-sm">/ {cagnotte.totalTarget} EUR</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min((cagnotte.collected / cagnotte.totalTarget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-pink-100 mt-2">
              {cagnotte.contributions.filter(c => c.status === 'paid').length}/{cagnotte.contributions.length} contributions paid
            </p>
          </div>
        </Link>
      )}

      {/* Expenses summary when there's data */}
      {tripExpenses.length > 0 && (
        <Link href={`/trips/${trip.id}/expenses`} className="block">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                  </svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Post-trip expenses</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-70">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <p className="font-display font-extrabold text-2xl mb-1">
              {tripExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} EUR
            </p>
            <p className="text-[11px] text-slate-300">
              {tripExpenses.length} {tripExpenses.length === 1 ? 'expense' : 'expenses'} -
              <span className={`ml-1 font-semibold ${myBalance && myBalance.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {myBalance && myBalance.net >= 0 ? `you're owed ${myBalance.net.toFixed(2)} EUR` : myBalance ? `you owe ${(-myBalance.net).toFixed(2)} EUR` : 'tap to settle'}
              </span>
            </p>
          </div>
        </Link>
      )}

      {/* Helpful next-step hint when in waiting state */}
      {trip.status === 'inviting' && constraintsReady < totalMembers && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-xs">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Waiting on others</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {totalMembers - constraintsReady} {totalMembers - constraintsReady === 1 ? 'person needs' : 'people need'} to set their preferences before Barry can find the spot.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NextStepCard({ label, desc, href, color }: {
  label: string; desc: string; href: string; color: 'purple' | 'amber' | 'blue' | 'emerald';
}) {
  const palette = {
    purple: { bg: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-500/20' },
    amber: { bg: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    blue: { bg: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/20' },
    emerald: { bg: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-500/20' },
  }[color];

  return (
    <Link href={href as any} className="block group">
      <div className={`relative overflow-hidden bg-gradient-to-br ${palette.bg} rounded-3xl p-5 text-white shadow-lg ${palette.shadow} active:scale-[0.99] transition-all`}>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">Next step</p>
            <h2 className="font-display font-extrabold text-xl tracking-tight">{label}</h2>
            <p className="text-xs text-white/85 mt-1">{desc}</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function ParticipantStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    constraints_set: { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Ready' },
    voted: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'Voted' },
    accepted: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Pending' },
    invited: { color: 'text-slate-600', bg: 'bg-slate-100', label: 'Invited' },
    declined: { color: 'text-rose-700', bg: 'bg-rose-50', label: 'Declined' },
  };
  const c = config[status] || config.invited;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}
