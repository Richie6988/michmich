'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, EquityDot } from '@/components/barry/brand';

export default function TripOverviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, trips, currentUser, cagnottes, chats } = useAppStore();
  const [copied, setCopied] = useState(false);

  const trip = activeTrip || trips.find(t => t.id === id);
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-barry-grey mt-4">Trip not found</p>
      </div>
    );
  }

  const cagnotte = cagnottes[trip.id];
  const message = chats[trip.id] || [];
  const isAdmin = trip.organizerId === currentUser?.id;
  const constraintsReady = trip.participants.filter(p => p.status === 'constraints_set' || p.status === 'voted').length;
  const totalMembers = trip.participants.length;
  const progress = (constraintsReady / Math.max(totalMembers, 1)) * 100;

  const handleCopyInvited = () => {
    navigator.clipboard?.writeText(`https://barry.app/join/${trip.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-4">
      {/* Status hero */}
      <div className="bg-gradient-to-br from-barry-blue to-blue-700 rounded-3xl p-5 mb-4 text-white shadow-lg shadow-blue-500/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold mb-1">
              {isAdmin ? 'You're hosting' : 'Hosted by ' + trip.organizer?.firstName}
            </p>
            <h2 className="font-display font-extrabold text-2xl">{trip.name}</h2>
          </div>
          <BarryMascot mood="default" size={56} />
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-100">Group progress</span>
            <span className="text-xs font-bold">{constraintsReady}/{totalMembers} ready</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ActionCard
          href={`/trips/${trip.id}/constraints`}
          icon="settings"
          color="#F97316"
          label="My setup"
          hint={trip.participants.find(p => p.userId === currentUser?.id)?.status === 'constraints_set' ? 'Done' : 'To do'}
        />
        <ActionCard
          href={`/trips/${trip.id}/chat`}
          icon="chat"
          color="#8B5CF6"
          label="Chat"
          hint={`${message.length} message${message.length > 1 ? 's' : ''}`}
          badge={message.length}
        />
        <ActionCard
          href={`/trips/${trip.id}/map`}
          icon="map"
          color="#10B981"
          label="See map"
          hint={trip.status === 'voting' || trip.status === 'booked' ? 'Zones found' : 'Waiting'}
          disabled={['draft', 'inviting', 'constraints'].includes(trip.status)}
        />
        <ActionCard
          href={`/trips/${trip.id}/cagnotte`}
          icon="wallet"
          color="#EC4899"
          label="Kitty"
          hint={cagnotte ? `${cagnotte.collected}/${cagnotte.totalTarget} EUR` : 'Not yet'}
        />
      </div>

      {/* Kitty highlight (when active) */}
      {cagnotte && cagnotte.status === 'open' && (
        <a
          href={`/trips/${trip.id}/cagnotte`}
          className="block bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-pink-500/15 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" /><circle cx="16" cy="14" r="1.5" />
                </svg>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-pink-100">Kitty of the group</span>
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
            {cagnotte.contributions.filter(c => c.status === 'paid').length}/{cagnotte.contributions.length} contributions paides
          </p>
        </a>
      )}

      {/* Invited section */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-barry-black">Invited friends</h3>
          <span className="text-xs text-barry-grey">{totalMembers} pers.</span>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <span className="text-xs text-barry-grey font-mono truncate">
              barry.app/join/{trip.inviteToken.slice(0, 8)}
            </span>
          </div>
          <button onClick={handleCopyInvited} className="bg-barry-blue text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
            {copied ? 'Copied !' : 'Copy'}
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 text-[#1F8B4F] font-semibold text-sm hover:bg-[#25D366]/20 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#1F8B4F">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
          </svg>
          Share on WhatsApp
        </button>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
        <h3 className="font-semibold text-barry-black mb-3">Members</h3>
        <div className="space-y-2.5">
          {trip.participants.map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][trip.participants.indexOf(p) % 5] }}
                >
                  {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-barry-black">
                    {p.user?.firstName} {p.user?.lastName}
                    {p.userId === trip.organizerId && (
                      <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">Admin</span>
                    )}
                  </p>
                  {p.originLabel && (
                    <p className="text-[11px] text-barry-grey">Depuis {p.originLabel}</p>
                  )}
                </div>
              </div>
              <ParticipantStatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Help / next step */}
      {trip.status === 'inviting' && constraintsReady < totalMembers && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-xs">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Waiting</p>
              <p className="text-xs text-amber-800 mt-0.5">
                {totalMembers - constraintsReady} people still need to set their preferences before Barry can calculate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({
  href, icon, color, label, hint, badge, disabled,
}: {
  href: string; icon: string; color: string; label: string; hint: string;
  badge?: number; disabled?: boolean;
}) {
  const Component = disabled ? 'div' : 'a';
  const icons: Record<string, JSX.Element> = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
    map: <><path d="M9 11.5l6 0M9 16l6 0M9 7l6 0M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16l-4-2-4 2-4-2-4 2z" /></>,
    wallet: <><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" /><circle cx="16" cy="14" r="1.5" /></>,
  };

  return (
    <Component
      href={disabled ? undefined : href}
      className={`relative bg-white rounded-2xl p-3.5 border border-gray-100 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-gray-200 active:scale-[0.98]'} transition-all`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {icons[icon]}
          </svg>
        </div>
        {badge && badge > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-barry-coral text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badge}
          </span>
        )}
      </div>
      <p className="font-semibold text-sm text-barry-black">{label}</p>
      <p className="text-[11px] text-barry-grey mt-0.5">{hint}</p>
    </Component>
  );
}

function ParticipantStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    constraints_set: { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Ready' },
    voted: { color: 'text-blue-700', bg: 'bg-blue-50', label: 'Voted' },
    accepted: { color: 'text-amber-700', bg: 'bg-amber-50', label: 'Waiting' },
    invited: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Invited' },
    declined: { color: 'text-red-700', bg: 'bg-red-50', label: 'Declined' },
  };
  const c = config[status] || config.invited;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}>
      {c.label}
    </span>
  );
}
