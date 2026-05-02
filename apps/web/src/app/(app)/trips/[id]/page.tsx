'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useDialog } from '@/components/ui/dialog';
import { downloadIcs, downloadPdf } from '@/lib/utils/trip-export';
import { BarryMap } from '@/components/map/barry-map';
import { SetupSheet } from '@/components/trip/setup-sheet';
import { ScrollCardList } from '@/components/trip/scroll-card-list';
import { DetailPopup } from '@/components/trip/detail-popup';
import { TripProgress, type TripStep } from '@/components/trip/trip-progress';
import { TodoSection } from '@/components/trip/todo-section';
import { MemoryGallery } from '@/components/trip/memory-gallery';
import { ActivitiesSection, CarRentalSection } from '@/components/trip/activities-and-cars';
import { activitiesForMode, CAR_RENTAL_CATALOG } from '@/lib/data/activities';
import { TopThreeComparison, type ComparisonColumn } from '@/components/trip/top-three-comparison';
import { TripComponentsToggle } from '@/components/trip/trip-components-toggle';
import { FiltersBar, ACTIVITY_FILTERS, CAR_FILTERS, VENUE_FILTERS, HOTEL_FILTERS } from '@/components/trip/filters-bar';
import { formatDateLong, formatDateShort, formatTimeShort } from '@/lib/utils/format-date';
import { computeBalances } from '@/lib/utils/expenses';
import { calculateEquity, participantsToApiFormat, isEquityEngineUp } from '@/lib/api/equity-engine';
import { computeSoloEdgeZones, shouldUseSoloEdgeMode } from '@/lib/utils/solo-zones';
import { VENUES_BY_ZONE, FALLBACK_VENUES, findVenueById, venueCostPerPerson, DEMO_ACCOMMODATIONS } from '@/lib/data/venues';
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
    pinVotes, voteForPin, closePinVote, unlockPickedZone, voteDatePoll,
    addParticipantByName, removeParticipant,
    updateTripStatus, setEquityZones, initTransportLegs,
    transportLegs, accommodations,
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
  const { confirm: showConfirm } = useDialog();

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
      // SOLO MODE: bypass equity-engine, compute edge zones from max travel time
      if (shouldUseSoloEdgeMode(trip.participants.length)) {
        const me = trip.participants[0];
        if (me?.originLocation && me?.maxTime && me?.transportMode) {
          const soloZones = computeSoloEdgeZones({
            origin: me.originLocation,
            maxTimeMin: me.maxTime,
            mode: me.transportMode as any,
          }).map(z => ({ ...z, tripId: trip.id }));
          if (cancelled) return;
          setZones(soloZones);
          setEquityZones(soloZones);
          setUsingDemo(false);
          setZoneLoading(false);
          return;
        }
      }

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

  // Compute progress steps for the KPI bar
  const progressSteps: TripStep[] = [
    {
      id: 'setup',
      label: 'Everyone setup',
      status: constraintsReady === totalMembers ? 'done' : (constraintsReady > 0 ? 'active' : 'pending'),
    },
    {
      id: 'zone',
      label: 'Zone picked',
      status: tripPickedZone ? 'done' : (zones.length > 0 ? 'active' : 'pending'),
    },
    {
      id: 'venue',
      label: 'Venue locked',
      status: tripPickedVenue ? 'done' : (tripPickedZone ? 'active' : 'pending'),
    },
    {
      id: 'booked',
      label: 'Booked',
      status: tripFunds?.status === 'complete' ? 'done' : (tripPickedVenue ? 'active' : 'pending'),
    },
  ];

  return (
    <div className="px-4 py-4 pb-24">
      {/* Guest banner */}
      <div className="mb-4">
        <GuestBanner />
      </div>

      {/* Top KPI: Progress bar across milestones - STICKY so visible on scroll (req 21: redundant recap section removed - title is in layout above) */}
      <div className="sticky top-14 z-20 mb-5 -mx-4 px-4 pb-1 pt-2 bg-gradient-to-b from-white via-white to-white/95 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950/95 backdrop-blur-md">
        <TripProgress steps={progressSteps} />
      </div>

      {/* CHRONO LINE WRAPPER — vertical line connecting sections */}
      <div className="relative">
        {/* Vertical line down the left margin */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-slate-100" />

        <div className="space-y-5">
          {/* SECTION 1: PARTICIPANTS + INVITE */}
          <ChronoSection phase="before" label="Setup">
            <ParticipantsSection
              trip={trip}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onSetup={(participantId) => setSetupForParticipantId(participantId)}
              onRemove={async (participantId) => {
                const ok = await showConfirm({
                  title: 'Remove this person?',
                  body: 'They will be taken out of the trip.',
                  variant: 'danger',
                  confirmLabel: 'Remove',
                });
                if (ok) removeParticipant(trip.id, participantId);
              }}
              showAddPerson={showAddPerson}
              setShowAddPerson={setShowAddPerson}
              newPersonName={newPersonName}
              setNewPersonName={setNewPersonName}
              handleAddPerson={handleAddPerson}
              copied={copied}
              onCopyInvite={handleCopyInvite}
            />
          </ChronoSection>

          {/* SECTION 2: PLAN - Date poll only. Chat moved to persistent sidebar (req 27) */}
          <ChronoSection phase="before" label="Let's find a date">
            <SectionHeader title="Let's find a date" />
            {(trip.mode === 'wanderlust' || !trip.mode) ? (
              <DatePollCard tripId={trip.id} poll={poll} totalMembers={totalMembers} isAdmin={isAdmin} currentUserId={currentUser?.id} isSolo={isSolo} tripMode={trip.mode} />
            ) : (
              <TripDatesLockedCard trip={trip} />
            )}
          </ChronoSection>

          {/* SECTION 3: TODO removed from here - now appears AFTER funding complete (req 28) */}

          {/* SECTION 4: BARRY'S MAP */}
          <ChronoSection phase="before" label="Map">
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
          </ChronoSection>

          {/* SECTION 5: PIN VOTE — when zones ready and not locked */}
          {allReady && zones.length > 0 && !tripPickedZone && (
            <ChronoSection phase="before" label="Pick zone">
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
            </ChronoSection>
          )}

          {/* SECTION 5.5: TRIP COMPONENTS PICKER — owner toggles which categories the trip needs */}
          {tripPickedZone && (
            <ChronoSection phase="before" label="Categories">
              <SectionHeader title="What does this Barry need?" />
              <TripComponentsToggle
                tripId={trip.id}
                isOwner={isAdmin}
                isMultiDay={trip.mode === 'trip'}
              />
            </ChronoSection>
          )}

          {/* SECTION 6: PICKS - only show categories the owner activated */}
          {tripPickedZone && (
            <ChronoSection phase="before" label="Picks">
              <div className="flex items-center justify-between mb-2 px-1">
                <SectionHeader title="Picks for your group" />
                {isAdmin && (
                  <button
                    onClick={async () => {
                      const ok = await showConfirm({
                        title: 'Unlock the location?',
                        body: 'The group will need to vote for a new zone. Picks below will reset.',
                        variant: 'warning',
                        confirmLabel: 'Yes, unlock',
                      });
                      if (ok) unlockPickedZone(trip.id);
                    }}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                    title="Unlock to let the group re-vote"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" />
                    </svg>
                    Unlock
                  </button>
                )}
              </div>
              <VenuesAndStaySection
                trip={trip}
                zoneId={tripPickedZone || winningZoneId || zones[0]?.id || 'demo-z1'}
              />
            </ChronoSection>
          )}

          {/* SECTION 7: ACTIVITIES (always shown when zone picked) */}
          {(tripPickedZone || (tripPinVotes && tripPinVotes.length > 0)) && (
            <ChronoSection phase="before" label="Activities">
              <ActivitiesAndCarsBlock trip={trip} />
            </ChronoSection>
          )}

          {/* SECTION 8+9: TRIP SUMMARY + FUND BARRY - shown side-by-side when validated (req 35) */}
          {transportLegs[trip.id]?.length > 0 && (
            <ChronoSection phase="before" label="Validate & fund">
              <SectionHeader title="Recap & funding" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">Trip summary</p>
                  <PreFundRecapCard trip={trip} transportLegs={transportLegs[trip.id] || []} accommodations={accommodations[trip.id] || []} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">Fund Barry</p>
                  <FundsCard tripId={trip.id} fundsRequest={tripFunds} />
                </div>
              </div>
            </ChronoSection>
          )}

          {/* === POST-FUNDING ZONE === Congrats + tile grid (req 36) */}
          {tripFunds && tripFunds.status === 'complete' && (
            <>
              {/* Congrats banner with sunglasses Barry */}
              <div className="bg-gradient-to-br from-emerald-50 via-blue-50 to-violet-50 dark:from-emerald-950/40 dark:via-blue-950/40 dark:to-violet-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-900 p-5 my-2 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-300/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-violet-300/30 rounded-full blur-3xl" />
                <div className="relative flex items-center gap-3">
                  {/* Sunglasses Barry: scaled mascot in 'celebrating' mood */}
                  <div className="flex-shrink-0">
                    <BarryMascot mood="celebrating" size={72} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-0.5">Barry is happy</p>
                    <p className="font-display font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                      Funding done. Now the fun part.
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                      Tasks to share, expenses to track, memories to save. Barry&rsquo;s got you covered.
                    </p>
                  </div>
                </div>
              </div>

              {/* TILES GRID — booked / to-do / expenses / memories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PostFundingTile
                  color="emerald"
                  icon={<><polyline points="20 6 9 17 4 12" /></>}
                  title="Booked"
                  desc={tripReservations.length > 0 ? `${tripReservations.length} reservation${tripReservations.length > 1 ? 's' : ''} confirmed` : 'Booking pending'}
                >
                  <BookingCard tripId={trip.id} reservations={tripReservations} />
                  {tripReservations.length > 0 && (
                    <div className="mt-3">
                      <PostBookingReport trip={trip} reservations={tripReservations} transportLegs={transportLegs[trip.id] || []} />
                    </div>
                  )}
                </PostFundingTile>

                <PostFundingTile
                  color="amber"
                  icon={<><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>}
                  title="TO-DO"
                  desc="Things to bring or do before"
                >
                  <TodoSection
                    tripId={trip.id}
                    participants={trip.participants}
                    currentUserId={currentUser?.id}
                  />
                </PostFundingTile>

                <PostFundingTile
                  color="violet"
                  icon={<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" /></>}
                  title="Expenses"
                  desc="Track who paid what"
                >
                  <ExpensesCard tripId={trip.id} expenses={tripExpenses} participants={trip.participants.map(p => p.user!).filter(Boolean)} currentUserId={currentUser?.id} />
                </PostFundingTile>

                <PostFundingTile
                  color="rose"
                  icon={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>}
                  title="Memories"
                  desc="Photos & moments"
                >
                  <MemoryGallery tripId={trip.id} />
                </PostFundingTile>
              </div>
            </>
          )}

          {/* Pre-funding fallback for the legacy sections */}
          {!(tripFunds && tripFunds.status === 'complete') && (
            <>
              <ChronoSection phase="during" label="Expenses">
                <SectionHeader title="Expenses (Tricount)" />
                <ExpensesCard tripId={trip.id} expenses={tripExpenses} participants={trip.participants.map(p => p.user!).filter(Boolean)} currentUserId={currentUser?.id} />
              </ChronoSection>
            </>
          )}
        </div>
      </div>

      {/* Setup sheet */}
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

/**
 * ChronoSection — wraps each section with a phase-coded marker on the vertical timeline.
 * Phases:
 *  - 'before'  blue  : setup, planning, picks
 *  - 'during'  amber : day-of activities, expenses, photos
 *  - 'after'   slate : memories, recap (final wrap-up)
 */
function ChronoSection({
  phase = 'before',
  label,
  children,
}: {
  phase?: 'before' | 'during' | 'after';
  label: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, { dot: string; ring: string; pill: string }> = {
    before: { dot: 'bg-blue-500', ring: 'ring-blue-100 dark:ring-blue-900/40', pill: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    during: { dot: 'bg-amber-500', ring: 'ring-amber-100 dark:ring-amber-900/40', pill: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    after: { dot: 'bg-slate-500', ring: 'ring-slate-200 dark:ring-slate-700', pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  };
  const s = styles[phase];
  return (
    <section className="relative pl-10">
      {/* Phase dot on the line */}
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${s.dot} text-white flex items-center justify-center shadow-md z-10 border-2 border-white dark:border-slate-950 ring-4 ${s.ring}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="4" />
        </svg>
      </div>
      {/* Phase pill above the section title */}
      <div className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${s.pill}`}>
        {phase} · {label}
      </div>
      {children}
    </section>
  );
}

/**
 * ActivitiesAndCarsBlock — renders activity scroll cards for both modes,
 * plus car rental for trip mode.
 */
function ActivitiesAndCarsBlock({ trip }: { trip: any }) {
  const isTrip = trip.mode === 'trip';
  const { tripComponents } = useAppStore();
  const components = tripComponents[trip.id] || {
    accommodation: isTrip,
    restaurant: true,
    activities: false,
    car: false,
  };
  const showActivities = components.activities;
  const showCar = components.car && isTrip;
  const [activityFilters, setActivityFilters] = useState<Record<string, string[]>>({});
  const [carFilters, setCarFilters] = useState<Record<string, string[]>>({});

  // If neither is enabled, render nothing (the parent ChronoSection still wraps)
  if (!showActivities && !showCar) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Activities and car rental are off for this Barry.
          {' '}
          <span className="text-slate-400">The owner can turn them on above.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showActivities && (
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">Activities</p>
        <FiltersBar
          filterGroups={ACTIVITY_FILTERS}
          selectedFilters={activityFilters}
          onChange={setActivityFilters}
          title="Filter activities"
        />
        <ActivitiesSection tripId={trip.id} mode={trip.mode || 'wanderlust'} />
      </div>
      )}

      {showCar && (
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">Car rental</p>
          <FiltersBar
            filterGroups={CAR_FILTERS}
            selectedFilters={carFilters}
            onChange={setCarFilters}
            title="Filter cars"
          />
          <CarRentalSection tripId={trip.id} />
        </div>
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

function GuestBanner() {
  const { isGuest } = useAppStore();
  if (!isGuest) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <BarryMascot mood="thinking" size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">You're a guest</p>
        <p className="text-[11px] text-slate-600 leading-snug">
          Create an account to save preferences, get email reports, and plan your own Barry.
        </p>
      </div>
      <Link
        href="/login"
        className="bg-barry-blue text-white text-[11px] font-bold rounded-lg px-3 py-2 flex-shrink-0 active:scale-95 transition-transform"
      >
        Sign up
      </Link>
    </div>
  );
}

function TripRecapCard({ trip }: { trip: any }) {
  const isWanderlust = trip.mode === 'wanderlust' || !trip.mode;

  let dateLine = '';
  let lengthLine = '';
  if (isWanderlust) {
    dateLine = trip.scheduledAt ? formatDateLong(trip.scheduledAt) : 'Date to be picked';
    lengthLine = 'One-day outing';
  } else if (trip.scheduledAt && trip.endDate) {
    const start = new Date(trip.scheduledAt);
    const end = new Date(trip.endDate);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    dateLine = `${formatDateLong(trip.scheduledAt)} → ${formatDateLong(trip.endDate)}`;
    lengthLine = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
  } else {
    dateLine = 'Dates to be set';
    lengthLine = 'Multi-day trip';
  }

  return (
    <div className={`rounded-2xl p-4 border-2 ${
      isWanderlust
        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
        : 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isWanderlust ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
        }`}>
          {isWanderlust ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 21h8M12 17v4M5 3h14l-2 11a4 4 0 01-4 3h-2a4 4 0 01-4-3L5 3z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isWanderlust ? 'text-blue-700' : 'text-violet-700'
            }`}>
              {isWanderlust ? 'One day' : 'Multi-day'}
            </span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[10px] font-medium text-slate-600">{lengthLine}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{dateLine}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {trip.participants.length} {trip.participants.length === 1 ? 'participant' : 'participants'}
          </p>
        </div>
      </div>
    </div>
  );
}

function TripDatesLockedCard({ trip }: { trip: any }) {
  const start = trip.scheduledAt ? new Date(trip.scheduledAt) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;
  const nights = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="font-display font-bold text-base text-slate-900">Trip dates</p>
        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
          Set
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {start && end ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From</p>
                <p className="text-sm font-bold text-slate-900">{formatDateShort(trip.scheduledAt)}</p>
                <p className="text-[10px] text-slate-500">{start.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To</p>
                <p className="text-sm font-bold text-slate-900">{formatDateShort(trip.endDate)}</p>
                <p className="text-[10px] text-slate-500">{end.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              </div>
            </div>
            <div className="bg-violet-50 rounded-xl p-2 text-center">
              <p className="text-xs font-bold text-violet-700">{nights} {nights === 1 ? 'night' : 'nights'}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">Dates not yet finalized.</p>
        )}
      </div>
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

  const handleWhatsAppShare = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/join/${trip.inviteToken}`;
    const text = `Hey! Join my Barry trip "${trip.name}" - we're planning together: ${url}`;
    // Use wa.me universal link (works on web, iOS, Android, native app if installed)
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight">
          Participants <span className="text-slate-400 dark:text-slate-500 font-medium text-base">({totalMembers})</span>
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{constraintsReady}/{totalMembers} ready</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {trip.participants.map((p: any) => {
          const isMe = p.userId === currentUser?.id;
          const isReady = p.status === 'constraints_set' || p.status === 'voted';
          const color = colorForUser(p.userId);
          // Only owner of the setup can edit it. Admin can pre-fill ONLY for guests
          // who haven't accepted yet (no userId on the participant record).
          const isUnclaimedGuest = !p.userId;
          const canEdit = isMe || (isAdmin && isUnclaimedGuest);
          return (
            <div key={p.id} className="px-3 py-3 flex items-center gap-3">
              <Avatar user={p.user} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {p.user?.firstName || p.guestName || '?'} {p.user?.lastName || ''}
                  </p>
                  {p.userId === trip.organizerId && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-1.5 py-0.5 rounded">Host</span>
                  )}
                  {isMe && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">You</span>
                  )}
                </div>
                <ParticipantStatusLine participant={p} />
              </div>
              {canEdit ? (
                <button
                  onClick={() => onSetup(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isReady
                      ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      : 'bg-barry-blue text-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {isReady ? 'Edit setup' : (isMe ? 'Set up' : 'Pre-fill')}
                </button>
              ) : !isMe ? (
                <span className="text-[10px] font-medium text-slate-400 px-2 italic">
                  Their setup
                </span>
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
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#1F8B4F] active:scale-[0.98] transition-all"
          >
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

function DatePollCard({ tripId, poll, totalMembers, isAdmin, currentUserId, isSolo, tripMode }: any) {
  const { voteDatePoll, addDateOption, closeDatePoll } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newDate, setNewDate] = useState('');

  const voted = poll ? new Set(poll.votes.map((v: any) => v.userId)).size : 0;
  const isClosed = poll?.status === 'closed';
  const isWanderlust = tripMode === 'wanderlust' || !tripMode;

  const myVoteFor = (optionId: string) => {
    if (!poll) return null;
    return poll.votes.find((v: any) => v.userId === currentUserId && v.optionId === optionId)?.response || null;
  };

  const tally = (option: any) => {
    if (!poll) return { yes: 0, maybe: 0, no: 0 };
    const optVotes = poll.votes.filter((v: any) => v.optionId === option.id);
    return {
      yes: optVotes.filter((v: any) => v.response === 'yes').length,
      maybe: optVotes.filter((v: any) => v.response === 'maybe').length,
      no: optVotes.filter((v: any) => v.response === 'no').length,
    };
  };

  const handleAddOption = () => {
    if (!newDate) return;
    addDateOption(tripId, new Date(newDate).toISOString());
    setNewDate('');
    setShowAdd(false);
  };

  const sortedOptions = poll
    ? [...poll.options].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  const topOptionId = poll && poll.options.length > 0
    ? [...poll.options].sort((a: any, b: any) => b.score - a.score)[0].id
    : null;
  const topScore = poll && poll.options.length > 0
    ? Math.max(...poll.options.map((o: any) => o.score))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900">
            {isSolo ? (isWanderlust ? "Pick a day" : "Pick dates") : "Dates"}
          </p>
        </div>
        {poll && (
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {isClosed ? 'Locked' : `${voted}/${totalMembers}`}
          </span>
        )}
      </div>

      {!poll || poll.options.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-xs text-slate-500 mb-2">No date proposed yet.</p>
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold active:scale-95 transition-all"
            >
              Propose a date
            </button>
          ) : (
            <div className="flex gap-1.5">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="flex-1 bg-slate-50 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200"
                autoFocus
              />
              <button onClick={handleAddOption} disabled={!newDate} className="px-3 py-2 bg-purple-500 text-white text-xs font-bold rounded-lg disabled:opacity-40">
                Add
              </button>
              <button onClick={() => { setShowAdd(false); setNewDate(''); }} className="px-2 py-2 text-slate-500 text-xs">
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-2">
            {sortedOptions.slice(0, 4).map((opt: any) => {
              const t = tally(opt);
              const myVote = myVoteFor(opt.id);
              const isTop = opt.id === topOptionId && topScore > 0;
              return (
                <div
                  key={opt.id}
                  className={`p-2.5 rounded-xl border-2 transition-all ${
                    opt.id === poll.selectedOptionId ? 'border-emerald-300 bg-emerald-50' :
                    isTop ? 'border-purple-200 bg-purple-50/50' :
                    'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-slate-900">{formatDateLong(opt.date)}</p>
                    <span className="text-[10px] font-bold text-slate-500">{opt.score} pts</span>
                  </div>
                  {!isClosed && (
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => voteDatePoll(tripId, opt.id, 'no')}
                        className={`py-1 rounded text-[10px] font-bold transition-all ${myVote === 'no' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                      >No {t.no > 0 && `(${t.no})`}</button>
                      <button
                        onClick={() => voteDatePoll(tripId, opt.id, 'maybe')}
                        className={`py-1 rounded text-[10px] font-bold transition-all ${myVote === 'maybe' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                      >Maybe {t.maybe > 0 && `(${t.maybe})`}</button>
                      <button
                        onClick={() => voteDatePoll(tripId, opt.id, 'yes')}
                        className={`py-1 rounded text-[10px] font-bold transition-all ${myVote === 'yes' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >Yes {t.yes > 0 && `(${t.yes})`}</button>
                    </div>
                  )}
                  {isAdmin && !isClosed && isTop && (
                    <button
                      onClick={() => closeDatePoll(tripId, opt.id)}
                      className="w-full mt-1.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold"
                    >
                      Lock this date
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!isClosed && !showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full text-[11px] text-purple-700 font-medium py-1.5 rounded-lg border-2 border-dashed border-purple-200 hover:bg-purple-50 transition-colors"
            >
              + Propose another date
            </button>
          )}
          {!isClosed && showAdd && (
            <div className="flex gap-1.5">
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="flex-1 bg-slate-50 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200"
                autoFocus
              />
              <button onClick={handleAddOption} disabled={!newDate} className="px-3 py-2 bg-purple-500 text-white text-xs font-bold rounded-lg disabled:opacity-40">
                Add
              </button>
              <button onClick={() => { setShowAdd(false); setNewDate(''); }} className="px-2 py-2 text-slate-500 text-xs">
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChatCard({ tripId, messages, currentUserId, input, setInput, onSend }: any) {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter messages by search (across full history) or fall back to last 8
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m: any) => m.content.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : messages.slice(-8);

  // Auto-scroll to bottom when messages change (only if not searching)
  React.useEffect(() => {
    if (scrollRef.current && !searchQuery) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, searchQuery]);

  // Format relative timestamp like "2 min ago", "Yesterday", "14:32"
  const formatTimestamp = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDay < 2) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDay < 7) return `${diffDay}d`;
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  // Highlight matching part of the search
  const highlightMatch = (content: string, query: string) => {
    if (!query.trim()) return content;
    const idx = content.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return content;
    const before = content.slice(0, idx);
    const match = content.slice(idx, idx + query.length);
    const after = content.slice(idx + query.length);
    return (
      <>
        {before}
        <mark className="bg-amber-200 dark:bg-amber-700 text-slate-900 dark:text-slate-100 rounded px-0.5">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900 dark:text-slate-100">Chat</p>
          {messages.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery(''); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              searchOpen ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            }`}
            aria-label="Search messages"
            title="Search messages"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button onClick={() => router.push(`/trips/${tripId}/chat` as any)} className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold hover:underline px-1">
            Open
          </button>
        </div>
      </div>

      {/* Search input - shows when searchOpen */}
      {searchOpen && (
        <div className="mb-2 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-white flex items-center justify-center hover:bg-slate-400 transition"
              aria-label="Clear search"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
          {searchQuery.trim() && (
            <p className="text-[10px] text-slate-500 mt-1">
              {filteredMessages.length} {filteredMessages.length === 1 ? 'match' : 'matches'}
            </p>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="space-y-2 mb-2 h-[280px] overflow-y-auto pr-1 barry-scroll"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Trip chat messages"
      >
        {filteredMessages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            {searchQuery.trim() ? 'No messages match your search.' : 'No messages yet'}
          </p>
        ) : (
          filteredMessages.map((m: any) => {
            const isMe = m.userId === currentUserId;
            const color = colorForUser(m.userId);
            return (
              <div key={m.id} className="flex items-start gap-2">
                <Avatar user={m.user} size={24} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-[10px] font-semibold leading-tight" style={{ color: isMe ? '#64748B' : color }}>
                      {isMe ? 'You' : m.user?.firstName}
                    </p>
                    <span className="text-[9px] text-slate-400" title={new Date(m.createdAt || Date.now()).toLocaleString()}>
                      {formatTimestamp(m.createdAt || new Date())}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug break-words">
                    {searchQuery.trim() ? highlightMatch(m.content, searchQuery) : m.content}
                  </p>
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
          className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200"
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
  const [viewport, setViewport] = useState<any>(null);
  // Compute center: average of participant origins or default to Paris
  const participantsWithOrigin = trip.participants.filter((p: any) => p.originLocation);
  const defaultCenter = { lat: 48.8589, lng: 2.3613 };
  const center = zones[0]?.center
    || (participantsWithOrigin.length > 0
        ? {
            lat: participantsWithOrigin.reduce((s: number, p: any) => s + p.originLocation.lat, 0) / participantsWithOrigin.length,
            lng: participantsWithOrigin.reduce((s: number, p: any) => s + p.originLocation.lng, 0) / participantsWithOrigin.length,
          }
        : defaultCenter);

  // Build markers - participants always shown when available, zones added when ready
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

  // No participants with origin yet -> only show waiting state
  if (participantsWithOrigin.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
        <BarryMascot mood="thinking" size={56} />
        <p className="font-display font-bold text-slate-900 mt-2">Set up to see the map</p>
        <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-snug">
          Once participants share their starting points, Barry shows them on the map and computes the fairest spots.
        </p>
      </div>
    );
  }

  // Compute bbox for fit (used as zoom hint)
  const lats = participantsWithOrigin.map((p: any) => p.originLocation.lat);
  const lngs = participantsWithOrigin.map((p: any) => p.originLocation.lng);
  const spread = Math.max(
    Math.max(...lats) - Math.min(...lats),
    Math.max(...lngs) - Math.min(...lngs),
  );
  // Tighter zoom when participants close together
  const zoom = spread < 0.01 ? 14 : spread < 0.05 ? 12 : spread < 0.2 ? 11 : 9;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="relative h-72">
        <BarryMap
          center={center}
          zoom={zoom}
          markers={markers}
          height="100%"
          onViewportChange={setViewport}
        />

        {/* Participant edge-arrows when zoomed in */}
        {viewport && (
          <ParticipantEdgeArrows participants={trip.participants} viewport={viewport} />
        )}

        {/* Mascot floating bottom-left */}
        <div className="absolute bottom-3 left-3 z-[1500] bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-lg flex items-center gap-2">
          <BarryMascot mood={zones.length > 0 ? 'happy' : 'thinking'} size={32} />
          <div>
            <p className="text-[10px] font-bold text-slate-900">
              {zones.length > 0
                ? `${zones.length} fair spots`
                : `${participantsWithOrigin.length}/${totalMembers} ready`}
            </p>
            <p className="text-[9px] text-slate-500">
              {zones.length > 0 ? (usingDemo ? 'Demo zones' : 'Live calc') : loading ? 'Computing...' : 'Need everyone'}
            </p>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute top-3 right-3 z-[1500] bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-barry-blue animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-700">Crunching...</span>
          </div>
        )}
      </div>

      {zones.length > 0 ? (
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
      ) : loading ? (
        <div className="p-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
              <Skeleton className="w-6 h-6 rounded-lg mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto mb-1" />
              <Skeleton className="h-2 w-12 mx-auto" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ParticipantEdgeArrows({ participants, viewport }: { participants: any[]; viewport: any }) {
  if (!viewport?.bounds) return null;
  const { bounds, center } = viewport;

  // Helper: compute great-circle distance in km
  const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // km
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };

  // Find off-screen participants
  const offscreen = participants
    .filter(p => p.originLocation)
    .map((p: any, i: number) => {
      const { lat, lng } = p.originLocation;
      const isOut = lat > bounds.north || lat < bounds.south || lng > bounds.east || lng < bounds.west;
      if (!isOut) return null;
      // dx > 0 = participant east of center; dy > 0 = participant north of center
      const dy = lat - center.lat;
      const dx = lng - center.lng;
      // Distance from VIEWPORT CENTER to participant (informative for hover)
      const dist = distanceKm(center.lat, center.lng, lat, lng);
      return { participant: p, index: i, dx, dy, dist };
    })
    .filter(Boolean) as { participant: any; index: number; dx: number; dy: number; dist: number }[];

  if (offscreen.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1400]">
      {offscreen.map(({ participant, index, dx, dy, dist }) => {
        // Screen-space direction: ax east-positive, ay south-positive (CSS y is flipped)
        const ax = dx;
        const ay = -dy;
        const m = Math.max(Math.abs(ax), Math.abs(ay));
        if (m === 0) return null;
        const nx = ax / m; // -1..1
        const ny = ay / m;
        // Position from center +/- 42% so badge stays inside container with margin
        const left = `${50 + nx * 42}%`;
        const top = `${50 + ny * 42}%`;
        const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
        // Arrow rotation: atan2(ny, nx) gives screen-space angle in radians.
        // 0deg = pointing right (east). Triangle is drawn pointing right naturally.
        const arrowRotateDeg = (Math.atan2(ny, nx) * 180) / Math.PI;
        // The participant is OFF-SCREEN in direction (nx, ny). The triangle must point
        // OUTWARD (toward the participant). We render it as a single block positioned
        // at the edge, rotated to face outward. The avatar sits "behind" the triangle
        // (toward the center).
        // Layout strategy: a wrapper rotated by arrowRotateDeg, with the avatar at translateX(-distance)
        // and the triangle at translateX(0). This way the avatar+triangle pair always points outward.
        return (
          <div
            key={participant.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group/arrow pointer-events-auto"
            style={{ left, top }}
          >
            {/* Outer wrapper rotated to face outward */}
            <div
              className="relative"
              style={{ transform: `rotate(${arrowRotateDeg}deg)`, width: 0, height: 0 }}
            >
              {/* Triangle at outer edge (pointing right in unrotated frame) */}
              <div
                className="absolute w-0 h-0"
                style={{
                  top: -6,
                  left: 14,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderLeft: `8px solid ${color}`,
                }}
              />
              {/* Avatar disc — counter-rotate so the initial reads upright */}
              <div
                className="absolute w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-[10px]"
                style={{
                  top: -14,
                  left: -14,
                  backgroundColor: color,
                  transform: `rotate(${-arrowRotateDeg}deg)`,
                }}
              >
                {participant.user?.firstName?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            {/* Hover tooltip — shows participant name + distance */}
            <div
              className="absolute opacity-0 group-hover/arrow:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-xl"
              style={{
                top: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              {participant.user?.firstName || 'Guest'} · {dist < 10 ? dist.toFixed(1) : Math.round(dist)} km
            </div>
          </div>
        );
      })}
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
  const {
    pickedVenue, venueVotes, voteForVenue, closeVenueVote,
    accommodations, addAccommodation, voteForAccommodation, selectAccommodation,
    currentUser, tripComponents,
  } = useAppStore();

  const venues = VENUES_BY_ZONE[zoneId] || FALLBACK_VENUES;
  const lockedVenueId = pickedVenue[trip.id];
  const isAdmin = trip.organizerId === currentUser?.id;
  const isSolo = trip.participants.length === 1;
  const isTrip = trip.mode === 'trip';
  const components = tripComponents[trip.id] || {
    accommodation: isTrip,
    restaurant: true,
    activities: false,
    car: false,
  };
  const showRestaurants = components.restaurant;
  const showAccommodation = components.accommodation && isTrip;
  const showActivities = components.activities;
  const showCar = components.car && isTrip;
  const [openVenueId, setOpenVenueId] = useState<string | null>(null);
  const [openAccId, setOpenAccId] = useState<string | null>(null);
  const [venueFilters, setVenueFilters] = useState<Record<string, string[]>>({});
  const [hotelFilters, setHotelFilters] = useState<Record<string, string[]>>({});

  // Seed accommodations once if none exist
  useEffect(() => {
    if ((accommodations[trip.id] || []).length === 0) {
      DEMO_ACCOMMODATIONS.forEach(a => {
        addAccommodation(trip.id, {
          tripId: trip.id,
          type: a.type,
          name: a.name,
          pricePerNight: a.pricePerNight,
          nights: 2,
          totalPrice: a.pricePerNight * 2,
          rooms: 1,
        });
      });
    }
  }, [trip.id]);

  // Build vote tallies for venues
  const venueTally = (venueId: string) => {
    const votes = (venueVotes[trip.id] || []).filter(v => v.venueId === venueId);
    return {
      love: votes.filter(v => v.response === 'love').length,
      meh: votes.filter(v => v.response === 'meh').length,
      no: votes.filter(v => v.response === 'no').length,
    };
  };
  const myVenueVote = (venueId: string) => {
    return (venueVotes[trip.id] || []).find(v => v.userId === currentUser?.id && v.venueId === venueId)?.response || null;
  };

  // Top venue based on score
  const topVenue = [...venues]
    .map(v => ({ ...v, score: venueTally(v.id).love * 2 + venueTally(v.id).meh }))
    .sort((a, b) => b.score - a.score)[0];

  const openedVenue = openVenueId ? venues.find(v => v.id === openVenueId) : null;
  const openedAccId = openAccId;
  const openedAcc = openedAccId ? DEMO_ACCOMMODATIONS.find(a => a.id === openedAccId) : null;

  // Accommodation votes (use venueVotes by reusing or a parallel mechanism)
  // For simplicity we reuse the same store's voteForAccommodation if accommodations exist
  const accs = accommodations[trip.id] || [];
  const findAccByMockId = (mockId: string) => accs.find(a => a.name === DEMO_ACCOMMODATIONS.find(x => x.id === mockId)?.name);

  const accTally = (mockId: string) => {
    const acc = findAccByMockId(mockId);
    if (!acc) return { love: 0, meh: 0, no: 0 };
    return {
      love: acc.votes.filter(v => v.response === 'love').length,
      meh: acc.votes.filter(v => v.response === 'meh').length,
      no: acc.votes.filter(v => v.response === 'no').length,
    };
  };
  const myAccVote = (mockId: string) => {
    const acc = findAccByMockId(mockId);
    if (!acc) return null;
    return acc.votes.find(v => v.userId === currentUser?.id)?.response || null;
  };
  const isAccPicked = (mockId: string) => {
    const acc = findAccByMockId(mockId);
    return acc?.selected || false;
  };

  return (
    <div className="space-y-4">
      {!showRestaurants && !showAccommodation && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No categories activated yet. The owner can pick what this Barry needs above.
          </p>
        </div>
      )}

      {/* req 31: 3-COLUMN PARALLEL COMPARISON - top picks per category for quick comparison */}
      {(showRestaurants || showAccommodation) && (() => {
        const allActivities = activitiesForMode(trip.mode || 'wanderlust');

        // Build columns based on mode
        const columns: ComparisonColumn[] = [];

        if (showRestaurants && venues.length > 0) {
          const sortedVenues = [...venues]
            .map(v => ({ ...v, score: venueTally(v.id).love * 2 + venueTally(v.id).meh }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          columns.push({
            title: 'Food',
            color: 'orange',
            icon: <><path d="M3 11h18M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4M7 21V11M17 21V11M7 16h10" /></>,
            items: sortedVenues.map(v => ({
              id: v.id,
              title: v.name,
              subtitle: `${v.category} - ${[1, 2, 3, 4].slice(0, v.price).map(() => 'EUR').join('')}`,
              metric: `~${v.price * 25} EUR/person`,
              rating: v.rating,
              locked: v.id === lockedVenueId,
              topPick: !lockedVenueId && v.id === topVenue?.id && topVenue.score > 0,
            })),
            onItemClick: setOpenVenueId,
          });
        }

        if (showAccommodation && isTrip) {
          const sortedAccs = [...DEMO_ACCOMMODATIONS]
            .sort((a, b) => {
              const aTally = accTally(a.id);
              const bTally = accTally(b.id);
              return (bTally.love * 2 + bTally.meh) - (aTally.love * 2 + aTally.meh);
            })
            .slice(0, 3);

          columns.push({
            title: 'Hotel',
            color: 'blue',
            icon: <><path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" /></>,
            items: sortedAccs.map(a => ({
              id: a.id,
              title: a.name,
              subtitle: a.type || 'Hotel',
              metric: `${a.pricePerNight} EUR/night`,
              rating: a.rating,
              locked: isAccPicked(a.id),
            })),
            onItemClick: setOpenAccId,
          });
        }

        if (showActivities && allActivities.length > 0) {
          columns.push({
            title: 'Activities',
            color: 'emerald',
            icon: <><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" /></>,
            items: allActivities.slice(0, 3).map(a => ({
              id: a.id,
              title: a.name,
              subtitle: `${a.category} - ${a.duration}`,
              metric: `${a.pricePerPerson} EUR/person`,
              rating: a.rating,
            })),
          });
        }

        if (showCar && isTrip) {
          columns.push({
            title: 'Car',
            color: 'violet',
            icon: <><circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /><path d="M2 16.5V13l2-5h13l3 5v3.5" /></>,
            items: CAR_RENTAL_CATALOG.slice(0, 3).map(c => ({
              id: c.id,
              title: `${c.brand} ${c.carModel}`,
              subtitle: `${c.category} - ${c.transmission}`,
              metric: `${c.pricePerDay} EUR/day`,
              rating: c.rating,
            })),
          });
        }

        // Only render if 2+ columns to make comparison meaningful
        return columns.length >= 2 ? (
          <TopThreeComparison
            columns={columns}
            label="Compare side-by-side"
          />
        ) : null;
      })()}

      {/* VENUES - horizontal scroll like TheFork (full list with filters) */}
      {showRestaurants && (
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {lockedVenueId ? 'Venue locked' : 'All bars & restaurants'}
          </p>
          {!lockedVenueId && isAdmin && topVenue && topVenue.score > 0 && (
            <button
              onClick={() => closeVenueVote(trip.id, topVenue.id)}
              className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
            >
              Lock {topVenue.name}
            </button>
          )}
        </div>
        <FiltersBar
          filterGroups={VENUE_FILTERS}
          selectedFilters={venueFilters}
          onChange={setVenueFilters}
          title="Filter venues"
        />
        {(() => {
          // req 32: Apply real filter impact on venues
          const cuisineFilters = venueFilters.cuisine || [];
          const vibeFilters = venueFilters.vibe || [];
          const budgetFilter = (venueFilters.budget || [])[0];

          const matchesFilters = (v: any) => {
            const tags = (v.tags || []).map((t: string) => t.toLowerCase());
            // Cuisine: at least one selected cuisine matches a tag
            if (cuisineFilters.length > 0) {
              const cuisineMatch = cuisineFilters.some((c: string) =>
                tags.includes(c.toLowerCase()) || (v.category || '').toLowerCase().includes(c.toLowerCase())
              );
              if (!cuisineMatch) return false;
            }
            // Vibe: at least one selected vibe matches
            if (vibeFilters.length > 0) {
              const vibeMatch = vibeFilters.some((vibe: string) => tags.includes(vibe.toLowerCase()));
              if (!vibeMatch) return false;
            }
            // Budget: low = price 1, mid = price 2-3, high = price 4
            if (budgetFilter) {
              if (budgetFilter === 'low' && v.price > 1) return false;
              if (budgetFilter === 'mid' && (v.price < 2 || v.price > 3)) return false;
              if (budgetFilter === 'high' && v.price < 4) return false;
            }
            return true;
          };

          const filteredVenues = venues.filter(matchesFilters);
          const filterCount = cuisineFilters.length + vibeFilters.length + (budgetFilter ? 1 : 0);

          return filteredVenues.length > 0 ? (
            <>
              {filterCount > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 px-1">
                  {filteredVenues.length} of {venues.length} venues match your filters.
                </p>
              )}
              <ScrollCardList
                items={filteredVenues.map(v => ({
                  id: v.id,
                  imageUrl: v.imageUrl,
                  title: v.name,
                  subtitle: `${v.category} - ${[1, 2, 3, 4].slice(0, v.price).map(() => 'EUR').join('')} - ${v.rating}`,
                  badge: v.id === lockedVenueId ? 'Picked' : v.id === topVenue?.id && topVenue.score > 0 ? 'Top' : undefined,
                  badgeColor: v.id === lockedVenueId ? '#10B981' : '#F97316',
                }))}
                onCardClick={setOpenVenueId}
                onLoveCount={(id) => venueTally(id).love}
                onMyVote={(id) => myVenueVote(id) as any}
                selectedId={lockedVenueId}
                cardWidth={200}
              />
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                No venues match your filters.
              </p>
              <button
                onClick={() => setVenueFilters({})}
                className="mt-2 text-xs text-barry-blue font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          );
        })()}
      </div>
      )}

      {/* ACCOMMODATIONS — horizontal scroll like Booking. Multi-day + activated only. */}
      {showAccommodation && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-sm font-semibold text-slate-700">Where to stay</p>
            <span className="text-[11px] text-slate-500">{DEMO_ACCOMMODATIONS.length} options</span>
          </div>
          <FiltersBar
            filterGroups={HOTEL_FILTERS}
            selectedFilters={hotelFilters}
            onChange={setHotelFilters}
            title="Filter stays"
          />
          <ScrollCardList
            items={DEMO_ACCOMMODATIONS.map(a => ({
              id: a.id,
              imageUrl: a.imageUrl,
              title: a.name,
              subtitle: `${a.type === 'hotel' ? 'Hotel' : a.type === 'bnb' ? 'BnB' : 'Airbnb'} · ${a.pricePerNight} EUR/night · ${a.rating}`,
              badge: isAccPicked(a.id) ? 'Picked' : undefined,
              badgeColor: '#8B5CF6',
            }))}
            onCardClick={setOpenAccId}
            onLoveCount={(id) => accTally(id).love}
            onMyVote={(id) => myAccVote(id) as any}
            cardWidth={220}
          />
        </div>
      )}

      {/* Venue popup */}
      {openedVenue && (
        <DetailPopup
          item={{ ...openedVenue, title: openedVenue.name } as any}
          isVenue={true}
          onClose={() => setOpenVenueId(null)}
          myVote={myVenueVote(openedVenue.id) as any}
          onVote={(r) => voteForVenue(trip.id, openedVenue.id, r)}
          loveCount={venueTally(openedVenue.id).love}
          mehCount={venueTally(openedVenue.id).meh}
          noCount={venueTally(openedVenue.id).no}
          isPicked={lockedVenueId === openedVenue.id}
          canPick={isAdmin && !lockedVenueId}
          onPick={() => { closeVenueVote(trip.id, openedVenue.id); setOpenVenueId(null); }}
        />
      )}

      {/* Accommodation popup */}
      {openedAcc && (
        <DetailPopup
          item={{ ...openedAcc, title: openedAcc.name } as any}
          isVenue={false}
          onClose={() => setOpenAccId(null)}
          myVote={myAccVote(openedAcc.id) as any}
          onVote={(r) => {
            const acc = findAccByMockId(openedAcc.id);
            if (acc) voteForAccommodation(trip.id, acc.id, r);
          }}
          loveCount={accTally(openedAcc.id).love}
          mehCount={accTally(openedAcc.id).meh}
          noCount={accTally(openedAcc.id).no}
          isPicked={isAccPicked(openedAcc.id)}
          canPick={isAdmin && !accs.find(a => a.selected)}
          onPick={() => {
            const acc = findAccByMockId(openedAcc.id);
            if (acc) selectAccommodation(trip.id, acc.id);
            setOpenAccId(null);
          }}
        />
      )}
    </div>
  );
}

function PreFundRecapCard({ trip, transportLegs, accommodations }: any) {
  const isWanderlust = trip.mode === 'wanderlust' || !trip.mode;
  const pickedAcc = accommodations.find((a: any) => a.selected);
  const isLoading = transportLegs.length === 0 && trip.participants.length > 0;

  // Compute per-participant transport row
  const TRANSPORT_LABEL: Record<string, string> = {
    walk: 'on foot', bike: 'by bike', transit: 'by transit',
    car: 'by car', train: 'by train', flight: 'by plane',
  };

  const total = (() => {
    const transportSum = transportLegs.reduce((s: number, l: any) => s + (l.cost || 0), 0);
    const accSum = pickedAcc ? pickedAcc.totalPrice : 0;
    const venueSum = trip.participants.length * 35; // estimated dinner
    return transportSum + accSum + venueSum;
  })();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-blue-100 p-4">
        <div className="flex items-start gap-2 mb-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          {trip.participants.slice(0, 3).map((_: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 text-center mt-3 font-medium">
          Barry's computing transport routes...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-blue-100 p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <BarryMascot mood="happy" size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{trip.name}</p>
          <p className="text-[11px] text-slate-600">
            {isWanderlust && trip.scheduledAt && formatDateLong(trip.scheduledAt)}
            {!isWanderlust && trip.scheduledAt && trip.endDate &&
              `${formatDateShort(trip.scheduledAt)} → ${formatDateShort(trip.endDate)}`
            }
            {' · '}{trip.participants.length} {trip.participants.length === 1 ? 'participant' : 'participants'}
          </p>
        </div>
      </div>

      {/* Per-participant transport */}
      {!isWanderlust && transportLegs.length > 0 && (
        <div className="bg-white rounded-xl p-3 mb-2 space-y-1.5">
          {trip.participants.map((p: any, i: number) => {
            const leg = transportLegs.find((l: any) => l.participantId === p.id);
            if (!leg) return null;
            const transportLabel = TRANSPORT_LABEL[leg.mode] || leg.mode;
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <Avatar user={p.user} size={20} />
                <p className="flex-1 min-w-0 truncate text-slate-700">
                  <span className="font-semibold text-slate-900">{p.user?.firstName}</span>
                  {' '}will travel {transportLabel}
                  {p.originLabel ? ` from ${p.originLabel.split(',')[0]}` : ''}
                  {leg.duration ? ` (${Math.round(leg.duration / 60)}min)` : ''}
                </p>
                {leg.cost > 0 && (
                  <span className="text-[11px] font-bold text-slate-700 flex-shrink-0">
                    {Math.round(leg.cost)} EUR
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stay */}
      {!isWanderlust && pickedAcc && (
        <div className="flex items-center gap-2 bg-white rounded-xl p-3 mb-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
              <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{pickedAcc.name}</p>
            <p className="text-[10px] text-slate-500">{pickedAcc.nights} {pickedAcc.nights === 1 ? 'night' : 'nights'} · {pickedAcc.rooms} {pickedAcc.rooms === 1 ? 'room' : 'rooms'}</p>
          </div>
          <span className="text-xs font-bold text-slate-900">{pickedAcc.totalPrice} EUR</span>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between bg-barry-blue rounded-xl px-4 py-2.5 text-white">
        <p className="text-xs font-semibold">Total estimated cost</p>
        <p className="text-base font-extrabold">{total.toFixed(0)} EUR</p>
      </div>
      <p className="text-[10px] text-slate-500 text-center mt-1.5">
        Each participant will be asked their fair share below.
      </p>
    </div>
  );
}

function PostBookingReport({ trip, reservations, transportLegs }: any) {
  const TRANSPORT_LABEL: Record<string, string> = {
    walk: 'Walk', bike: 'Bike', transit: 'Transit',
    car: 'Car', train: 'Train', flight: 'Flight',
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="font-display font-bold text-base text-slate-900">All booked!</p>
          <p className="text-[11px] text-slate-500">
            Detailed reports sent to {trip.participants.filter((p: any) => p.email).length}/{trip.participants.length} participants by email
          </p>
        </div>
      </div>

      {/* Per-participant report cards */}
      <div className="space-y-2">
        {trip.participants.map((p: any, i: number) => {
          const leg = transportLegs.find((l: any) => l.participantId === p.id);
          return (
            <div key={p.id} className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Avatar user={p.user} size={28} />
                <p className="text-sm font-bold text-slate-900">{p.user?.firstName} {p.user?.lastName}</p>
                {p.email && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5 font-bold">
                    Sent
                  </span>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                {leg && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">→</span>
                    <p>
                      <strong>{TRANSPORT_LABEL[leg.mode]}</strong>
                      {p.selfBook ? ' (self-booked)' : ' booked by Barry'}
                      {leg.boardingTime && ` · departure ${leg.boardingTime}`}
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-1.5">
                  <span className="text-slate-400 mt-0.5">→</span>
                  <p>Map and contact numbers in your email + this app</p>
                </div>
                {!p.email && (
                  <div className="flex items-start gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" className="flex-shrink-0 mt-1"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    <p className="text-amber-700">No email on file. Set one in their setup to send the report.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function FundsCard({ tripId, fundsRequest }: { tripId: string; fundsRequest: any }) {
  const { createFundsRequest, payFundsContribution, currentUser, inAppBalance, performBookings, trips } = useAppStore();
  const { push: pushToast } = useToast();
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  const lastMilestoneRef = React.useRef<number>(0);
  const lastBookedRef = React.useRef<boolean>(false);

  // Compute these every render (used by hooks below)
  const contribs = fundsRequest?.contributions || [];
  const paidContribs = contribs.filter((c: any) => c.status === 'paid');
  const paidCount = paidContribs.length;
  const totalCount = contribs.length;
  const paidAmount = paidContribs.reduce((s: number, c: any) => s + c.amount, 0);
  const totalAmount = fundsRequest?.totalAmount || 0;
  const pct = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const allDone = paidCount === totalCount && totalCount > 0;

  // ALL hooks must be declared before any conditional return (rules of hooks)
  useEffect(() => {
    if (!fundsRequest || fundsRequest.totalAmount === 0) {
      createFundsRequest(tripId);
    }
  }, [tripId]);

  // Auto-trigger booking when complete + fire booking confirmed toast
  useEffect(() => {
    if (allDone && fundsRequest && fundsRequest.status !== 'complete' && !lastBookedRef.current) {
      lastBookedRef.current = true;
      performBookings(tripId);
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        pushToast({
          id: `book-${Date.now()}`,
          type: 'booking_confirmed',
          title: `Booked! ${trip.name}`,
          body: 'Reservations confirmed. Check your report.',
          tripId,
          url: `/trips/${tripId}`,
          timestamp: Date.now(),
        });
      }
    }
  }, [allDone, fundsRequest?.status, tripId]);

  // Fire milestone toast when crossing 25/50/100%
  useEffect(() => {
    if (totalCount === 0) return;
    const milestones = [25, 50, 100];
    const last = lastMilestoneRef.current;
    const crossed = milestones.find(m => pct >= m && last < m);
    if (crossed) {
      lastMilestoneRef.current = crossed;
      const trip = trips.find(t => t.id === tripId);
      if (trip && crossed < 100) {
        pushToast({
          id: `fund-${Date.now()}`,
          type: 'funding_milestone',
          title: `${trip.name} ${crossed}% funded`,
          body: `${crossed}% of the funds are in.`,
          tripId,
          url: `/trips/${tripId}`,
          timestamp: Date.now(),
        });
      }
    }
  }, [pct, totalCount, tripId]);

  if (!fundsRequest || fundsRequest.totalAmount === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Set up everyone's transport in their profile to see the funds breakdown.</p>
        <p className="text-[11px] text-slate-400 mt-1">Hotels and venues add up automatically once picked.</p>
      </div>
    );
  }

  const myContrib = contribs.find((c: any) => c.userId === currentUser?.id);

  return (
    <div className="space-y-3">
      {/* HERO: total + progress */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Total to collect</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            allDone ? 'bg-emerald-400 text-emerald-900' : 'bg-white/20 text-white'
          }`}>
            {paidCount}/{totalCount} paid
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-display font-extrabold text-3xl">{totalAmount.toFixed(2)} EUR</p>
          {paidAmount > 0 && (
            <p className="text-xs text-pink-100">({paidAmount.toFixed(0)} collected)</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

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
      </div>

      {/* Per-participant payment list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Who's paying what</p>
        <div className="space-y-1.5">
          {contribs.map((c: any) => {
            const isMe = c.userId === currentUser?.id;
            const isPaid = c.status === 'paid';
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                  isPaid ? 'bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <Avatar user={c.user} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {isMe ? 'You' : (c.user?.firstName || c.userName || 'Guest')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {c.amount.toFixed(2)} EUR
                    {isPaid && c.paidAt && <> · paid {new Date(c.paidAt).toLocaleDateString()}</>}
                  </p>
                </div>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Paid
                  </span>
                ) : isMe ? (
                  <button
                    onClick={() => setConfirmPayId(c.id)}
                    className="px-3 py-1.5 bg-pink-500 text-white text-xs font-bold rounded-lg hover:bg-pink-600 active:scale-95 transition-all"
                  >
                    Pay {c.amount.toFixed(0)} EUR
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Awaiting...</span>
                )}
              </div>
            );
          })}
        </div>

        {!myContrib?.status || myContrib.status !== 'paid' ? (
          <p className="text-[10px] text-slate-400 mt-2 px-1">
            We'll only book once everyone has paid. Stripe-secured.
          </p>
        ) : (
          <p className="text-[10px] text-emerald-700 font-semibold mt-2 px-1">
            Your part is secured. Waiting on the others.
          </p>
        )}
      </div>

      {/* Pay confirm modal */}
      {confirmPayId && (
        <div
          className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmPayId(null)}
        >
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
            {(() => {
              const c = contribs.find((x: any) => x.id === confirmPayId);
              if (!c) return null;
              const canUseBalance = inAppBalance >= c.amount;
              return (
                <>
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white px-5 py-5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Your share</p>
                    <p className="font-display font-extrabold text-3xl mt-1">{c.amount.toFixed(2)} EUR</p>
                    <p className="text-xs text-pink-100 mt-1">Pick a payment method</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {canUseBalance && (
                      <button
                        onClick={() => { payFundsContribution(tripId, c.id, true); setConfirmPayId(null); }}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-left transition-colors"
                      >
                        <p className="text-sm font-bold text-emerald-900">Pay from in-app balance</p>
                        <p className="text-[11px] text-emerald-700">{inAppBalance.toFixed(2)} EUR available</p>
                      </button>
                    )}
                    <button
                      onClick={() => { payFundsContribution(tripId, c.id, false); setConfirmPayId(null); }}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 text-left transition-colors"
                    >
                      <p className="text-sm font-bold text-slate-900">Pay with card</p>
                      <p className="text-[11px] text-slate-500">Visa / Mastercard / Amex via Stripe</p>
                    </button>
                    <button
                      onClick={() => setConfirmPayId(null)}
                      className="w-full text-sm text-slate-500 font-medium py-2 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ tripId, reservations }: { tripId: string; reservations: any[] }) {
  const router = useRouter();
  const { trips } = useAppStore();
  const trip = trips.find(t => t.id === tripId);
  const { transportLegs } = useAppStore();

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
    <div className="space-y-3">
      <Link href={`/trips/${tripId}/booking` as any} className="block bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 p-4 active:scale-[0.99] transition-all">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="font-display font-bold text-slate-900 dark:text-slate-100">Trip booked</p>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">{reservations.length} confirmation{reservations.length === 1 ? '' : 's'} · tap to view codes</p>
      </Link>

      {/* Inline export buttons - takes user from "booked" to "saved on phone/calendar" */}
      {trip && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => downloadIcs({ trip })}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 hover:border-blue-300 hover:shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Calendar</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Add to your calendar</p>
            </div>
          </button>

          <button
            onClick={() => downloadPdf({
              trip,
              reservations,
              transportLegs: transportLegs[tripId] || [],
            })}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 hover:border-rose-300 hover:shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">PDF recap</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Save the full trip</p>
            </div>
          </button>
        </div>
      )}
    </div>
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

/**
 * PostFundingTile - one of 4 tiles shown after funding is complete (req 36).
 * Color-coded header with icon + title + descriptor. Body collapses/expands.
 */
function PostFundingTile({
  color, icon, title, desc, children,
}: {
  color: 'emerald' | 'amber' | 'violet' | 'rose';
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const styles: Record<string, { bg: string; text: string; iconColor: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', iconColor: '#10B981' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', iconColor: '#F59E0B' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', iconColor: '#8B5CF6' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', iconColor: '#F43F5E' },
  };
  const s = styles[color];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.text} flex items-center justify-center flex-shrink-0`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">{title}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
