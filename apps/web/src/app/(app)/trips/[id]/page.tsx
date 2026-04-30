'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { SetupSheet } from '@/components/trip/setup-sheet';
import { formatDateLong, formatDateShort, formatTimeShort } from '@/lib/utils/format-date';
import { computeBalances } from '@/lib/utils/expenses';
import { calculateEquity, participantsToApiFormat, isEquityEngineUp } from '@/lib/api/equity-engine';
import { VENUES_BY_ZONE, FALLBACK_VENUES, findVenueById, venueCostPerPerson } from '@/lib/data/venues';
import type { EquityZone, MapMarker, VenueVoteResponse } from '@barry/shared-types';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#F59E0B'];
const ZONE_COLORS = ['#10B981', '#F59E0B', '#94A3B8'];

const DEMO_ZONES: EquityZone[] = [
  { id: 'demo-z1', tripId: '', label: 'Marais', rank: 1,
    center: { lat: 48.8589, lng: 2.3613 },
    equityScore: 92, maxBurden: 18.4, meanBurden: 15.7, stdDevBurden: 2.1,
    burdens: { u1: 14.2, u2: 18.4, u3: 16.1, u4: 14.0 } },
  { id: 'demo-z2', tripId: '', label: 'Republique', rank: 2,
    center: { lat: 48.8676, lng: 2.3631 },
    equityScore: 84, maxBurden: 22.1, meanBurden: 17.8, stdDevBurden: 3.4,
    burdens: { u1: 12.8, u2: 22.1, u3: 18.5, u4: 17.7 } },
  { id: 'demo-z3', tripId: '', label: 'Bastille', rank: 3,
    center: { lat: 48.8531, lng: 2.3692 },
    equityScore: 78, maxBurden: 25.3, meanBurden: 19.2, stdDevBurden: 4.8,
    burdens: { u1: 16.4, u2: 25.3, u3: 19.0, u4: 16.0 } },
];

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
    chats, datePolls, expenses, sendMessage,
    pickedZone, pickedVenue, fundsRequests, reservations,
    pinVotes, voteForPin, closePinVote, voteDatePoll,
    addParticipantByName, removeParticipant,
    updateTripStatus, setEquityZones, initTransportLegs,
    transportLegs,
  } = useAppStore();

  const [setupForParticipantId, setSetupForParticipantId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [zones, setZones] = useState<EquityZone[]>([]);
  const [zoneLoading, setZoneLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  const trip = activeTrip || trips.find(t => t.id === id);
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  const isAdmin = trip.organizerId === currentUser?.id;
  const totalMembers = trip.participants.length;
  const constraintsReady = trip.participants.filter(p => p.status === 'constraints_set' || p.status === 'voted').length;
  const allReady = constraintsReady >= totalMembers;
  const isSolo = totalMembers === 1;

  const messages = chats[trip.id] || [];
  const poll = datePolls[trip.id];
  const tripExpenses = expenses[trip.id] || [];
  const tripPickedZone = pickedZone[trip.id];
  const tripPickedVenue = pickedVenue[trip.id];
  const tripFunds = fundsRequests[trip.id];
  const tripReservations = reservations[trip.id] || [];

  // Compute zones inline once participants are ready
  useEffect(() => {
    if (!allReady || zones.length > 0 || zoneLoading) return;
    let cancelled = false;
    setZoneLoading(true);
    (async () => {
      const up = await isEquityEngineUp();
      if (cancelled) return;
      const participants = participantsToApiFormat(trip.participants);
      if (!up || participants.length < 2) {
        const demo = DEMO_ZONES.map(z => ({ ...z, tripId: trip.id }));
        setZones(demo);
        setEquityZones(demo);
        setUsingDemo(true);
        setZoneLoading(false);
        return;
      }
      try {
        const result = await calculateEquity({
          tripId: trip.id, participants, searchRadiusKm: 12, gridResolution: 12,
        });
        if (cancelled) return;
        setZones(result.zones);
        setEquityZones(result.zones);
        setUsingDemo(false);
      } catch {
        if (cancelled) return;
        const demo = DEMO_ZONES.map(z => ({ ...z, tripId: trip.id }));
        setZones(demo);
        setEquityZones(demo);
        setUsingDemo(true);
      } finally {
        if (!cancelled) setZoneLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [allReady, trip.id]);

  const handleCopyInvite = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      navigator.clipboard.writeText(`${origin}/join/${trip.inviteToken}`);
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

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendMessage(trip.id, chatInput.trim());
    setChatInput('');
  };

  const tripPinVotes = pinVotes[trip.id] || [];
  const myPinVote = tripPinVotes.find(v => v.userId === currentUser?.id);
  const totalPinVoted = new Set(tripPinVotes.map(v => v.userId)).size;
  const allPinVoted = totalPinVoted >= totalMembers;
  const zoneTally = zones.map(z => ({ zoneId: z.id, count: tripPinVotes.filter(v => v.zoneId === z.id).length }));
  const winningZoneId = zoneTally.reduce((max, z) => z.count > max.count ? z : max, zoneTally[0])?.zoneId;

  const handleLockZone = (zoneId: string) => {
    closePinVote(trip.id, zoneId);
    updateTripStatus(trip.id, 'voting');
    initTransportLegs(trip.id);
  };

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* SECTION 1: PARTICIPANTS + INVITE */}
      <ParticipantsSection
        trip={trip}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onSetup={(participantId) => setSetupForParticipantId(participantId)}
        onRemove={(participantId) => {
          if (confirm('Remove this person from the trip?')) removeParticipant(trip.id, participantId);
        }}
        showAddPerson={showAddPerson}
        setShowAddPerson={setShowAddPerson}
        newPersonName={newPersonName}
        setNewPersonName={setNewPersonName}
        handleAddPerson={handleAddPerson}
        copied={copied}
        onCopyInvite={handleCopyInvite}
      />

      {/* SECTION 2: PLAN — Date poll + Chat side-by-side (or stacked on mobile) */}
      {!isSolo && (
        <section>
          <SectionHeader title="Plan" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <DatePollCard tripId={trip.id} poll={poll} totalMembers={totalMembers} isAdmin={isAdmin} currentUserId={currentUser?.id} />
            <ChatCard tripId={trip.id} messages={messages} currentUserId={currentUser?.id} input={chatInput} setInput={setChatInput} onSend={handleSendChat} />
          </div>
        </section>
      )}

      {/* SECTION 3: BARRY'S MAP — show pins only when participants ready */}
      <section>
        <SectionHeader title={allReady ? "Barry's spots" : 'Map (pending setup)'} />
        <MapEmbed
          trip={trip}
          zones={zones}
          allReady={allReady}
          loading={zoneLoading}
          usingDemo={usingDemo}
          constraintsReady={constraintsReady}
          totalMembers={totalMembers}
        />
      </section>

      {/* SECTION 4: PIN VOTE — only when zones ready and not yet locked */}
      {allReady && zones.length > 0 && !tripPickedZone && (
        <section>
          <SectionHeader title={isSolo ? "Pick your zone" : "Vote for the zone"} />
          <PinVoteCard
            trip={trip}
            zones={zones}
            tripPinVotes={tripPinVotes}
            myPinVote={myPinVote}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
            isSolo={isSolo}
            allPinVoted={allPinVoted}
            totalPinVoted={totalPinVoted}
            totalMembers={totalMembers}
            winningZoneId={winningZoneId}
            onVote={(zoneId) => voteForPin(trip.id, zoneId)}
            onLock={handleLockZone}
          />
        </section>
      )}

      {/* SECTION 5: VENUES + ACCOMMODATION — once zone is locked */}
      {tripPickedZone && (
        <section>
          <SectionHeader title="Where you'll go" />
          <VenuesAndStaySection trip={trip} zoneId={tripPickedZone} />
        </section>
      )}

      {/* SECTION 6: FUND BARRY — once venue or transport configured */}
      {tripPickedVenue && (
        <section>
          <SectionHeader title="Fund Barry & he'll take care of everything" />
          <FundsCard tripId={trip.id} fundsRequest={tripFunds} />
        </section>
      )}

      {/* SECTION 7: BOOKING STATUS — once everything paid */}
      {tripFunds && tripFunds.status === 'complete' && (
        <section>
          <BookingCard tripId={trip.id} reservations={tripReservations} />
        </section>
      )}

      {/* SECTION 8: EXPENSES + MEDIA — anytime, but emphasized after trip */}
      <section>
        <SectionHeader title="Expenses & memories" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ExpensesCard tripId={trip.id} expenses={tripExpenses} participants={trip.participants.map(p => p.user!).filter(Boolean)} currentUserId={currentUser?.id} />
          <MediaCard tripId={trip.id} />
        </div>
      </section>

      {/* Setup sheet (per-participant) */}
      {setupForParticipantId && (
        <SetupSheet
          tripId={trip.id}
          participantId={setupForParticipantId}
          onClose={() => setSetupForParticipantId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {action}
    </div>
  );
}

function ParticipantsSection({
  trip, currentUser, isAdmin, onSetup, onRemove,
  showAddPerson, setShowAddPerson, newPersonName, setNewPersonName, handleAddPerson,
  copied, onCopyInvite,
}: any) {
  const totalMembers = trip.participants.length;
  const constraintsReady = trip.participants.filter((p: any) => p.status === 'constraints_set' || p.status === 'voted').length;

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Participants <span className="text-slate-400 font-normal">({totalMembers})</span>
        </h2>
        <span className="text-[11px] text-slate-500">{constraintsReady}/{totalMembers} ready</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
        {trip.participants.map((p: any) => {
          const isMe = p.userId === currentUser?.id;
          const isReady = p.status === 'constraints_set' || p.status === 'voted';
          const color = colorForUser(p.userId);
          const canEdit = isMe || isAdmin;
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
                <ParticipantStatusLine participant={p} />
              </div>
              {canEdit ? (
                <button
                  onClick={() => onSetup(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isReady
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-barry-blue text-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {isReady ? 'Edit setup' : (isMe ? 'Set up' : 'Pre-fill')}
                </button>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 px-2">Locked</span>
              )}
              {isAdmin && !isMe && (
                <button
                  onClick={() => onRemove(p.id)}
                  className="w-7 h-7 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
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
                placeholder="First name"
                className="flex-1 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoFocus
              />
              <button onClick={handleAddPerson} disabled={!newPersonName.trim()} className="px-4 py-2 bg-barry-blue text-white text-sm font-semibold rounded-xl disabled:opacity-40">
                Add
              </button>
              <button onClick={() => { setShowAddPerson(false); setNewPersonName(''); }} className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl">
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
            onClick={onCopyInvite}
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
  );
}

function ParticipantStatusLine({ participant }: { participant: any }) {
  const status = participant.status;
  const config: Record<string, { color: string; label: string; dot: string }> = {
    constraints_set: { color: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Setup done' },
    voted: { color: 'text-blue-600', dot: 'bg-blue-500', label: 'Voted' },
    accepted: { color: 'text-amber-600', dot: 'bg-amber-500', label: 'Pending setup' },
    invited: { color: 'text-slate-500', dot: 'bg-slate-400', label: 'Not joined yet' },
    declined: { color: 'text-rose-600', dot: 'bg-rose-500', label: 'Declined' },
  };
  const c = config[status] || config.invited;
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] ${c.color}`}>{c.label}</span>
      {participant.originLabel && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500 truncate">{participant.originLabel}</span>
        </>
      )}
      {participant.maxTime && (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500">{participant.maxTime}min, {participant.transportMode}</span>
        </>
      )}
    </div>
  );
}

function DatePollCard({ tripId, poll, totalMembers, isAdmin, currentUserId }: any) {
  const router = useRouter();
  const voted = poll ? new Set(poll.votes.map((v: any) => v.userId)).size : 0;

  if (!poll) {
    return (
      <Link href={`/trips/${tripId}/dates` as any} className="bg-purple-50 rounded-2xl p-4 hover:bg-purple-100 transition-colors active:scale-[0.99] block">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-purple-900">Pick a date</p>
        </div>
        <p className="text-xs text-purple-800">Doodle-style poll. Find a date that works for everyone.</p>
      </Link>
    );
  }

  const sorted = [...poll.options].sort((a: any, b: any) => b.score - a.score);
  const top = sorted[0];

  return (
    <Link href={`/trips/${tripId}/dates` as any} className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-purple-200 transition-all active:scale-[0.99] block">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900">Dates</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
          {voted}/{totalMembers}
        </span>
      </div>
      {top && (
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{formatDateLong(top.date)}</span>
          {' '}leading with {top.score} points
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-1">Tap to vote or add an option</p>
    </Link>
  );
}

function ChatCard({ tripId, messages, currentUserId, input, setInput, onSend }: any) {
  const router = useRouter();
  const lastFew = messages.slice(-3);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900">Chat</p>
        </div>
        <button onClick={() => router.push(`/trips/${tripId}/chat` as any)} className="text-[11px] text-cyan-700 font-semibold hover:underline">
          Open
        </button>
      </div>

      <div className="space-y-1.5 mb-2 min-h-[80px] max-h-[140px] overflow-y-auto">
        {lastFew.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No messages yet</p>
        ) : (
          lastFew.map((m: any) => {
            const isMe = m.userId === currentUserId;
            const color = colorForUser(m.userId);
            return (
              <div key={m.id} className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {m.user?.firstName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold" style={{ color: isMe ? '#64748B' : color }}>
                    {isMe ? 'You' : m.user?.firstName}
                  </p>
                  <p className="text-xs text-slate-700 leading-snug truncate">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Quick message..."
          className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
        <button
          onClick={onSend}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MapEmbed({ trip, zones, allReady, loading, usingDemo, constraintsReady, totalMembers }: any) {
  const center = zones[0]?.center || { lat: 48.8589, lng: 2.3613 };

  // Build markers
  const markers: MapMarker[] = [];
  trip.participants.forEach((p: any, i: number) => {
    if (p.originLocation) {
      markers.push({
        id: `origin-${p.id}`,
        position: p.originLocation,
        type: 'origin',
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        label: p.user?.firstName?.[0] || '?',
      });
    }
  });
  zones.forEach((z: any, i: number) => {
    markers.push({
      id: z.id,
      position: z.center,
      type: 'pin',
      color: ZONE_COLORS[i] || '#94A3B8',
      rank: z.rank,
    });
  });

  if (!allReady) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
        <BarryMascot mood="thinking" size={56} />
        <p className="font-display font-bold text-slate-900 mt-2">Waiting for everyone</p>
        <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-snug">
          {constraintsReady} of {totalMembers} have set up. Once everyone's ready, Barry computes the fairest spots.
        </p>
      </div>
    );
  }

  if (loading || zones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center text-center">
        <BarryMascot mood="searching" size={64} />
        <p className="text-sm text-slate-600 mt-3">Crunching the math...</p>
        <div className="mt-3 flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-barry-blue animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="relative h-64">
        <BarryMap center={center} zoom={12} markers={markers} height="100%" />
        {/* Mascot floating bottom-left */}
        <div className="absolute bottom-3 left-3 z-[1500] bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-lg flex items-center gap-2">
          <BarryMascot mood="happy" size={32} />
          <div>
            <p className="text-[10px] font-bold text-slate-900">{zones.length} fair spots</p>
            <p className="text-[9px] text-slate-500">{usingDemo ? 'Demo zones' : 'Live calc'}</p>
          </div>
        </div>
      </div>
      <div className="p-3 grid grid-cols-3 gap-2">
        {zones.slice(0, 3).map((z: any, i: number) => (
          <div key={z.id} className="bg-slate-50 rounded-xl p-2 text-center">
            <div className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center font-bold text-white text-[10px]" style={{ backgroundColor: ZONE_COLORS[i] || '#94A3B8' }}>
              {z.rank}
            </div>
            <p className="text-[11px] font-bold text-slate-900 truncate">{z.label || `Zone ${z.rank}`}</p>
            <p className="text-[10px] text-slate-500">{z.equityScore}% fair</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PinVoteCard({ trip, zones, tripPinVotes, myPinVote, currentUserId, isAdmin, isSolo, allPinVoted, totalPinVoted, totalMembers, winningZoneId, onVote, onLock }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">{isSolo ? 'Pick one to continue' : `${totalPinVoted}/${totalMembers} voted`}</p>
        {!isSolo && allPinVoted && isAdmin && winningZoneId && (
          <button
            onClick={() => onLock(winningZoneId)}
            className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
          >
            Lock {zones.find((z: any) => z.id === winningZoneId)?.label || 'top zone'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {zones.map((z: any, i: number) => {
          const myVoteHere = myPinVote?.zoneId === z.id;
          const tally = tripPinVotes.filter((v: any) => v.zoneId === z.id).length;
          const tallyPct = totalMembers ? (tally / totalMembers) * 100 : 0;
          const isWinning = winningZoneId === z.id && tally > 0;
          return (
            <button
              key={z.id}
              onClick={() => isSolo ? onLock(z.id) : onVote(z.id)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                myVoteHere ? 'border-barry-blue bg-blue-50' :
                isWinning ? 'border-emerald-200 bg-emerald-50/50' :
                'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: ZONE_COLORS[i] || '#94A3B8' }}
                  >
                    {z.rank}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{z.label || `Zone ${z.rank}`}</p>
                    <p className="text-[10px] text-slate-500">{z.equityScore}% fair · max effort {z.maxBurden.toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {myVoteHere && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {!isSolo && <span className="text-xs font-bold text-slate-700">{tally}</span>}
                </div>
              </div>
              {!isSolo && (
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-barry-blue rounded-full transition-all duration-500" style={{ width: `${tallyPct}%` }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VenuesAndStaySection({ trip, zoneId }: { trip: any; zoneId: string }) {
  const router = useRouter();
  const { pickedVenue, accommodations, venueVotes, voteForVenue, closeVenueVote, currentUser } = useAppStore();

  const venues = VENUES_BY_ZONE[zoneId] || FALLBACK_VENUES;
  const lockedVenueId = pickedVenue[trip.id];
  const lockedVenue = lockedVenueId ? findVenueById(lockedVenueId) : null;
  const myVotes = (venueVotes[trip.id] || []).filter(v => v.userId === currentUser?.id);
  const isAdmin = trip.organizerId === currentUser?.id;

  // Tally
  const tallies = venues.map(v => {
    const votes = (venueVotes[trip.id] || []).filter(vv => vv.venueId === v.id);
    return {
      ...v,
      love: votes.filter(vv => vv.response === 'love').length,
      meh: votes.filter(vv => vv.response === 'meh').length,
      no: votes.filter(vv => vv.response === 'no').length,
      score: votes.filter(vv => vv.response === 'love').length * 2 + votes.filter(vv => vv.response === 'meh').length,
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {/* Venue picker */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-900">
            {lockedVenue ? `Picked: ${lockedVenue.name}` : 'Vote for the venue'}
          </p>
          <button onClick={() => router.push(`/trips/${trip.id}/venues` as any)} className="text-[11px] text-rose-700 font-semibold hover:underline">
            Open
          </button>
        </div>
        {lockedVenue ? (
          <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-900">{lockedVenue.name}</p>
              <p className="text-[11px] text-emerald-700">{lockedVenue.category} · {lockedVenue.address}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tallies.slice(0, 3).map((v, i) => {
              const myVote = myVotes.find(mv => mv.venueId === v.id);
              return (
                <div key={v.id} className="bg-slate-50 rounded-xl p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{v.name}</p>
                      <p className="text-[10px] text-slate-500">{v.category} · {[1,2,3,4].slice(0, v.price).map(() => 'EUR').join('')}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {v.love > 0 && <span className="text-emerald-600">{v.love} love</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => voteForVenue(trip.id, v.id, 'no')}
                      className={`py-1 rounded text-[10px] font-bold ${myVote?.response === 'no' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700'}`}
                    >No</button>
                    <button
                      onClick={() => voteForVenue(trip.id, v.id, 'meh')}
                      className={`py-1 rounded text-[10px] font-bold ${myVote?.response === 'meh' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'}`}
                    >Meh</button>
                    <button
                      onClick={() => voteForVenue(trip.id, v.id, 'love')}
                      className={`py-1 rounded text-[10px] font-bold ${myVote?.response === 'love' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'}`}
                    >Love</button>
                  </div>
                </div>
              );
            })}
            {isAdmin && tallies[0] && tallies[0].score > 0 && (
              <button
                onClick={() => closeVenueVote(trip.id, tallies[0].id)}
                className="w-full mt-2 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
              >
                Lock in {tallies[0].name}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Accommodation shortcut */}
      <Link href={`/trips/${trip.id}/accommodation` as any} className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 hover:border-violet-200 transition-colors active:scale-[0.99]">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Accommodation</p>
          <p className="text-[11px] text-slate-500">Hotels, BnB, Airbnb · skip if same-day</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
      </Link>
    </div>
  );
}

function FundsCard({ tripId, fundsRequest }: { tripId: string; fundsRequest: any }) {
  const router = useRouter();
  const { createFundsRequest } = useAppStore();

  useEffect(() => {
    if (!fundsRequest || fundsRequest.totalAmount === 0) {
      createFundsRequest(tripId);
    }
  }, [tripId]);

  if (!fundsRequest || fundsRequest.totalAmount === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
        <p className="text-sm text-slate-500">Configure transport to see the funds breakdown.</p>
        <Link href={`/trips/${tripId}/transport` as any} className="inline-block mt-2 px-4 py-2 bg-barry-blue text-white text-xs font-bold rounded-xl">
          Configure transport
        </Link>
      </div>
    );
  }

  const paid = fundsRequest.contributions.filter((c: any) => c.status === 'paid').length;
  const total = fundsRequest.contributions.length;

  return (
    <Link href={`/trips/${tripId}/funds` as any} className="block bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/15 active:scale-[0.99] transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Total to collect</span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
          {paid}/{total} paid
        </span>
      </div>
      <p className="font-display font-extrabold text-3xl mt-1">{fundsRequest.totalAmount.toFixed(2)} EUR</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <p className="text-pink-100">Venues</p>
          <p className="font-bold">{fundsRequest.breakdown.venues.toFixed(0)} EUR</p>
        </div>
        <div>
          <p className="text-pink-100">Stay</p>
          <p className="font-bold">{fundsRequest.breakdown.accommodation.toFixed(0)} EUR</p>
        </div>
        <div>
          <p className="text-pink-100">Transport</p>
          <p className="font-bold">{fundsRequest.breakdown.transport.toFixed(0)} EUR</p>
        </div>
      </div>
      <p className="text-[11px] text-pink-100 mt-3 font-medium">Tap to fund Barry</p>
    </Link>
  );
}

function BookingCard({ tripId, reservations }: { tripId: string; reservations: any[] }) {
  const router = useRouter();
  if (reservations.length === 0) {
    return (
      <Link href={`/trips/${tripId}/booking` as any} className="block bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/15 active:scale-[0.99] transition-all">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Ready to book</p>
        <p className="font-display font-extrabold text-xl mt-1">Funds collected · let Barry book</p>
        <p className="text-[11px] text-emerald-100 mt-2">Tap to confirm reservations</p>
      </Link>
    );
  }
  return (
    <Link href={`/trips/${tripId}/booking` as any} className="block bg-white rounded-2xl border border-emerald-200 p-4 active:scale-[0.99] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-display font-bold text-slate-900">Trip booked</p>
      </div>
      <p className="text-xs text-slate-600">{reservations.length} confirmation{reservations.length === 1 ? '' : 's'} · tap to view codes</p>
    </Link>
  );
}

function ExpensesCard({ tripId, expenses, participants, currentUserId }: any) {
  const router = useRouter();
  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const balances = useMemo(() => computeBalances(expenses, participants), [expenses, participants]);
  const myBalance = balances.find(b => b.userId === currentUserId);

  return (
    <Link href={`/trips/${tripId}/expenses` as any} className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition-colors active:scale-[0.99] block">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z" />
            <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        </div>
        <p className="font-display font-bold text-slate-900">Expenses</p>
      </div>
      {expenses.length === 0 ? (
        <p className="text-xs text-slate-500">No expenses yet. Track during/after the trip.</p>
      ) : (
        <>
          <p className="font-display font-bold text-lg text-slate-900">{total.toFixed(2)} EUR</p>
          <p className="text-[11px] text-slate-500">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</p>
          {myBalance && Math.abs(myBalance.net) > 0.01 && (
            <p className={`text-[11px] mt-1 font-semibold ${myBalance.net >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {myBalance.net >= 0 ? `You're owed ${myBalance.net.toFixed(2)} EUR` : `You owe ${(-myBalance.net).toFixed(2)} EUR`}
            </p>
          )}
        </>
      )}
    </Link>
  );
}

function MediaCard({ tripId }: { tripId: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="font-display font-bold text-slate-900">Memories</p>
      </div>
      <p className="text-xs text-slate-500 mb-3">Share photos and videos from the trip.</p>
      <button
        disabled
        className="w-full py-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium cursor-not-allowed"
      >
        Coming soon
      </button>
    </div>
  );
}
