'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { formatDateLong } from '@/lib/utils/format-date';
import { computeBalances } from '@/lib/utils/expenses';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function TripOverviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    activeTrip, trips, currentUser,
    cagnottes, chats, datePolls, expenses,
    pickedZone, pickedVenue, fundsRequests, reservations,
    addParticipantByName, removeParticipant,
  } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

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

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;
    addParticipantByName(trip.id, newPersonName);
    setNewPersonName('');
    setShowAddPerson(false);
  };

  const tripPickedZone = trip ? pickedZone[trip.id] : null;
  const tripPickedVenue = trip ? pickedVenue[trip.id] : null;
  const tripFunds = trip ? fundsRequests[trip.id] : null;
  const tripReservations = trip ? (reservations[trip.id] || []) : [];
  const isSolo = totalMembers === 1;

  // Smart next-step (journey-aware, solo-friendly)
  const nextStep = (() => {
    // After-trip
    if (tripExpenses.length > 0) {
      return { label: 'Track expenses', href: `/trips/${trip.id}/expenses`, color: 'emerald' as const, desc: 'Split fairly with everyone' };
    }
    // Booked - go enjoy
    if (tripReservations.length > 0 || trip.status === 'booked') {
      return { label: 'Trip is booked', href: `/trips/${trip.id}/booking`, color: 'emerald' as const, desc: 'View confirmation codes' };
    }
    // Funds collected - book
    if (tripFunds && tripFunds.status === 'complete') {
      return { label: 'Book everything', href: `/trips/${trip.id}/booking`, color: 'emerald' as const, desc: 'Final reservation step' };
    }
    // Funds pending payment
    if (tripFunds && tripFunds.totalAmount > 0) {
      return { label: 'Pay your share', href: `/trips/${trip.id}/funds`, color: 'amber' as const, desc: 'Funds to collect before booking' };
    }
    // Venue picked - go to accommodation
    if (tripPickedVenue) {
      return { label: 'Pick a stay', href: `/trips/${trip.id}/accommodation`, color: 'purple' as const, desc: 'Hotel, BnB, or skip' };
    }
    // Zone picked - go to venues
    if (tripPickedZone) {
      return { label: 'Pick venues', href: `/trips/${trip.id}/venues`, color: 'rose' as const, desc: 'Bars, restaurants in your zone' };
    }
    // Solo: skip dates, go straight to map
    if (isSolo) {
      if (constraintsReady < 1) {
        return { label: 'Set up your trip', href: `/trips/${trip.id}/constraints`, color: 'amber' as const, desc: 'Time, budget, transport' };
      }
      return { label: 'See the map', href: `/trips/${trip.id}/map`, color: 'blue' as const, desc: 'Discover the fairest spot' };
    }
    // Group: dates first if needed
    if (totalMembers > 1 && (!poll || poll.status === 'open')) {
      return { label: 'Pick a date', href: `/trips/${trip.id}/dates`, color: 'purple' as const, desc: 'Find a date that works for all' };
    }
    if (constraintsReady < totalMembers) {
      return { label: 'Set up participants', href: `/trips/${trip.id}/constraints`, color: 'amber' as const, desc: 'Time, budget, transport per person' };
    }
    return { label: 'See the map', href: `/trips/${trip.id}/map`, color: 'blue' as const, desc: 'Discover the fairest spot' };
  })();

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Hero next-step */}
      <NextStepCard {...nextStep} />

      {/* PARTICIPANTS section */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Participants <span className="text-slate-400 font-normal">({totalMembers})</span>
          </h2>
          <span className="text-[11px] text-slate-500">{constraintsReady} ready</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {trip.participants.map(p => {
            const isMe = p.userId === currentUser?.id;
            const isReady = p.status === 'constraints_set' || p.status === 'voted';
            const color = colorForUser(p.userId);
            return (
              <div key={p.id} className="px-3 py-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {p.user?.firstName?.[0]?.toUpperCase()}{p.user?.lastName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {p.user?.firstName} {p.user?.lastName}
                    </p>
                    {p.userId === trip.organizerId && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">Host</span>
                    )}
                    {isMe && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <ParticipantStatus participant={p} />
                </div>
                {/* Per-person setup or status */}
                {isMe ? (
                  <Link
                    href={`/trips/${trip.id}/constraints` as any}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                      isReady
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-barry-blue text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isReady ? 'Edit setup' : 'Set up'}
                  </Link>
                ) : (
                  <>
                    {isAdmin && (
                      <button
                        onClick={() => { if (confirm(`Remove ${p.user?.firstName} from the trip?`)) removeParticipant(trip.id, p.id); }}
                        className="w-8 h-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors flex-shrink-0"
                        aria-label="Remove"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Add person row */}
          {isAdmin && !showAddPerson && (
            <button
              onClick={() => setShowAddPerson(true)}
              className="w-full px-3 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-barry-blue">Add a person</span>
            </button>
          )}

          {showAddPerson && (
            <div className="p-3 bg-blue-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={e => setNewPersonName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddPerson()}
                  placeholder="First name (or full name)"
                  className="flex-1 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoFocus
                />
                <button
                  onClick={handleAddPerson}
                  disabled={!newPersonName.trim()}
                  className="px-4 py-2 bg-barry-blue text-white text-sm font-semibold rounded-xl disabled:opacity-40"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddPerson(false); setNewPersonName(''); }}
                  className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invite link */}
        {totalMembers > 1 && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCopyInvite}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
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
        )}
      </section>

      {/* TILES section - journey-ordered */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
          Plan
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Tile
            href={`/trips/${trip.id}/dates`}
            icon="calendar"
            label="Dates"
            color="purple"
            badge={poll ? `${new Set(poll.votes.map(v => v.userId)).size}/${totalMembers}` : 'Start'}
            sub={poll ? (poll.status === 'closed' ? 'Locked' : `${poll.options.length} options`) : 'Doodle-style poll'}
          />
          <Tile
            href={`/trips/${trip.id}/map`}
            icon="map"
            label="Map"
            color="blue"
            badge={constraintsReady < totalMembers ? 'Pending' : 'Ready'}
            sub="Find the fair zone"
          />
          <Tile
            href={`/trips/${trip.id}/venues`}
            icon="utensils"
            label="Venues"
            color="rose"
            badge={trip.status === 'voting' || trip.status === 'booked' ? 'Open' : 'Locked'}
            sub="Bars, restaurants"
          />
          <Tile
            href={`/trips/${trip.id}/accommodation`}
            icon="bed"
            label="Stay"
            color="violet"
            badge="Optional"
            sub="Hotels, BnB, Airbnb"
          />
          <Tile
            href={`/trips/${trip.id}/transport`}
            icon="route"
            label="Transport"
            color="blue"
            badge="Per person"
            sub="Configure each leg"
          />
          <Tile
            href={`/trips/${trip.id}/funds`}
            icon="wallet"
            label="Funds"
            color="pink"
            badge="Pre-pay"
            sub="Collect before booking"
          />
        </div>

        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1 mt-4">
          Live & after
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Tile
            href={`/trips/${trip.id}/chat`}
            icon="chat"
            label="Chat"
            color="cyan"
            badge={messages.length ? String(messages.length) : 'New'}
            sub={messages.length ? messages[messages.length - 1].content.slice(0, 24) : 'Discuss with the group'}
          />
          <Tile
            href={`/trips/${trip.id}/expenses`}
            icon="receipt"
            label="Expenses"
            color="emerald"
            badge={tripExpenses.length ? String(tripExpenses.length) : 'New'}
            sub={tripExpenses.length ? `${tripExpenses.reduce((s, e) => s + e.amount, 0).toFixed(0)} EUR spent` : 'Split costs after'}
          />
        </div>
      </section>

      {/* Money widgets */}
      {(cagnotte && cagnotte.status === 'open') && (
        <Link href={`/trips/${trip.id}/cagnotte` as any} className="block">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/15 active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-100">Pre-trip kitty</span>
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
          </div>
        </Link>
      )}

      {tripExpenses.length > 0 && (
        <Link href={`/trips/${trip.id}/expenses` as any} className="block">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg shadow-slate-900/10 active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Post-trip expenses</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="opacity-70">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <p className="font-display font-extrabold text-2xl mb-1">
              {tripExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)} EUR
            </p>
            <p className="text-[11px] text-slate-300">
              {tripExpenses.length} {tripExpenses.length === 1 ? 'expense' : 'expenses'} ·
              <span className={`ml-1 font-semibold ${myBalance && myBalance.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {myBalance && myBalance.net >= 0
                  ? `you're owed ${myBalance.net.toFixed(2)} EUR`
                  : myBalance ? `you owe ${(-myBalance.net).toFixed(2)} EUR` : 'tap to settle'}
              </span>
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

function Tile({ href, icon, label, color, badge, sub }: {
  href: string;
  icon: string;
  label: string;
  color: 'purple' | 'blue' | 'rose' | 'cyan' | 'pink' | 'emerald' | 'amber' | 'violet';
  badge?: string;
  sub: string;
}) {
  const palette: Record<string, { bg: string; text: string; iconBg: string; iconStroke: string; badge: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-900', iconBg: 'bg-purple-100', iconStroke: '#8B5CF6', badge: 'bg-purple-100 text-purple-700' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-900', iconBg: 'bg-violet-100', iconStroke: '#7C3AED', badge: 'bg-violet-100 text-violet-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', iconBg: 'bg-blue-100', iconStroke: '#2563EB', badge: 'bg-blue-100 text-blue-700' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-900', iconBg: 'bg-rose-100', iconStroke: '#F43F5E', badge: 'bg-rose-100 text-rose-700' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-900', iconBg: 'bg-cyan-100', iconStroke: '#06B6D4', badge: 'bg-cyan-100 text-cyan-700' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-900', iconBg: 'bg-pink-100', iconStroke: '#EC4899', badge: 'bg-pink-100 text-pink-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-900', iconBg: 'bg-emerald-100', iconStroke: '#10B981', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', iconBg: 'bg-amber-100', iconStroke: '#F59E0B', badge: 'bg-amber-100 text-amber-700' },
  };
  const p = palette[color];

  const icons: Record<string, JSX.Element> = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    map: <><path d="M9 11.5l6 0M9 16l6 0M9 7l6 0M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16l-4-2-4 2-4-2-4 2z" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
    wallet: <><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" /><circle cx="16" cy="14" r="1.5" /></>,
    receipt: <><path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></>,
    utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h2v9M21 6h-3v3a3 3 0 003 3v9M11 7H7M11 11H7M11 15H7" /></>,
    bed: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
    route: <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h8a3 3 0 003-3 3 3 0 00-3-3H7a3 3 0 01-3-3 3 3 0 013-3h8" /></>,
  };

  return (
    <Link href={href as any} className="block group">
      <div className={`${p.bg} rounded-2xl p-3.5 hover:shadow-md active:scale-[0.98] transition-all h-full border border-transparent hover:border-current/10`}>
        <div className="flex items-start justify-between mb-2">
          <div className={`w-9 h-9 rounded-xl ${p.iconBg} flex items-center justify-center`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {icons[icon]}
            </svg>
          </div>
          {badge && (
            <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${p.badge}`}>
              {badge}
            </span>
          )}
        </div>
        <p className={`font-display font-bold text-base ${p.text}`}>{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</p>
      </div>
    </Link>
  );
}

function NextStepCard({ label, desc, href, color }: {
  label: string; desc: string; href: string;
  color: 'purple' | 'amber' | 'blue' | 'emerald';
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

function ParticipantStatus({ participant }: { participant: any }) {
  const status = participant.status;
  const config: Record<string, { color: string; label: string; dot: string }> = {
    constraints_set: { color: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Setup done' },
    voted: { color: 'text-blue-600', dot: 'bg-blue-500', label: 'Voted' },
    accepted: { color: 'text-amber-600', dot: 'bg-amber-500', label: 'Pending setup' },
    invited: { color: 'text-slate-500', dot: 'bg-slate-400', label: 'Not joined yet' },
    declined: { color: 'text-rose-600', dot: 'bg-rose-500', label: 'Declined' },
  };
  const c = config[status] || config.invited;
  const transport = participant.transportMode;
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] ${c.color}`}>{c.label}</span>
      {participant.maxTime && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500">{participant.maxTime}min · {transport}</span>
        </>
      )}
    </div>
  );
}
