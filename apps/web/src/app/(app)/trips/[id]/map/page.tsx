'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { calculateEquity, participantsToApiFormat, isEquityEngineUp } from '@/lib/api/equity-engine';
import type { EquityZone, MapMarker } from '@barry/shared-types';

const ZONE_COLORS = ['#10B981', '#F59E0B', '#94A3B8'];
const ORIGIN_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

// Demo zones used as fallback when the Python equity engine is offline
const DEMO_ZONES: EquityZone[] = [
  {
    id: 'demo-z1', tripId: '', label: 'Marais',
    rank: 1,
    center: { lat: 48.8589, lng: 2.3613 },
    equityScore: 92, maxBurden: 18.4, meanBurden: 15.7, stdDevBurden: 2.1,
    burdens: { u1: 14.2, u2: 18.4, u3: 16.1, u4: 14.0 },
  },
  {
    id: 'demo-z2', tripId: '', label: 'Republique',
    rank: 2,
    center: { lat: 48.8676, lng: 2.3631 },
    equityScore: 84, maxBurden: 22.1, meanBurden: 17.8, stdDevBurden: 3.4,
    burdens: { u1: 12.8, u2: 22.1, u3: 18.5, u4: 17.7 },
  },
  {
    id: 'demo-z3', tripId: '', label: 'Bastille',
    rank: 3,
    center: { lat: 48.8531, lng: 2.3692 },
    equityScore: 78, maxBurden: 25.3, meanBurden: 19.2, stdDevBurden: 4.8,
    burdens: { u1: 16.4, u2: 25.3, u3: 19.0, u4: 16.0 },
  },
];

export default function EquityMapPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    activeTrip, trips, currentUser,
    pinVotes, voteForPin, closePinVote, pickedZone,
    updateTripStatus,
  } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);

  const [zones, setZones] = useState<EquityZone[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [engineUp, setEngineUp] = useState<boolean | null>(null);
  const [calcTime, setCalcTime] = useState(0);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const start = Date.now();

    (async () => {
      const up = await isEquityEngineUp();
      if (cancelled) return;
      setEngineUp(up);

      const participants = participantsToApiFormat(trip.participants);

      if (!up || participants.length < 2) {
        // Use demo zones to keep the demo flow alive
        setZones(DEMO_ZONES.map(z => ({ ...z, tripId: trip.id })));
        setCalcTime(420);
        setUsingDemo(true);
        setLoading(false);
        return;
      }

      try {
        const result = await calculateEquity({
          tripId: trip.id,
          participants,
          searchRadiusKm: 12,
          gridResolution: 12,
        });
        if (cancelled) return;
        setZones(result.zones);
        setCalcTime(Date.now() - start);
        setUsingDemo(false);
      } catch (err: any) {
        if (cancelled) return;
        // Fall back to demo on error too
        setZones(DEMO_ZONES.map(z => ({ ...z, tripId: trip.id })));
        setCalcTime(420);
        setUsingDemo(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trip?.id]);

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-extrabold text-2xl mt-6 text-slate-900 tracking-tight">
          Crunching the math
        </h2>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          Scoring hundreds of points + real OSRM routes for each member
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-barry-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center text-center">
        <BarryMascot mood="thinking" size={120} />
        <h2 className="font-display font-bold text-xl mt-4">No fair spot found</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs leading-snug">
          Constraints are too tight. Try increasing time or budget per participant.
        </p>
        <button
          onClick={() => router.push(`/trips/${id}/constraints` as any)}
          className="mt-6 px-5 py-2.5 bg-barry-blue text-white font-semibold rounded-xl text-sm"
        >
          Adjust preferences
        </button>
      </div>
    );
  }

  const selected = zones[selectedIdx];
  const tripPinVotes = pinVotes[trip.id] || [];
  const totalMembers = trip.participants.length;
  const totalVoted = new Set(tripPinVotes.map(v => v.userId)).size;
  const myVote = tripPinVotes.find(v => v.userId === currentUser?.id);
  const isSolo = totalMembers === 1;

  // Tally
  const zoneTally = zones.map(z => {
    const count = tripPinVotes.filter(v => v.zoneId === z.id).length;
    return { zoneId: z.id, count };
  });
  const winningZoneId = zoneTally.reduce((max, z) => z.count > max.count ? z : max, zoneTally[0])?.zoneId;
  const allVoted = totalVoted >= totalMembers;
  const isAdmin = trip.organizerId === currentUser?.id;
  const lockedZone = pickedZone[trip.id];

  // Build markers
  const markers: MapMarker[] = [];
  trip.participants.forEach((p, i) => {
    if (p.originLocation) {
      markers.push({
        id: `origin-${p.id}`,
        position: p.originLocation,
        type: 'origin',
        color: ORIGIN_COLORS[i % ORIGIN_COLORS.length],
        label: p.user?.firstName?.[0] || '?',
      });
    }
  });
  zones.forEach((z, i) => {
    markers.push({
      id: z.id,
      position: z.center,
      type: 'pin',
      color: ZONE_COLORS[i] || '#94A3B8',
      rank: z.rank,
      onClick: () => setSelectedIdx(i),
    });
  });

  const handleConfirm = () => {
    if (lockedZone) {
      // Already locked, go to venue selection
      router.push(`/trips/${trip.id}/venues` as any);
      return;
    }
    // Lock in winning zone
    if (winningZoneId && allVoted) {
      closePinVote(trip.id, winningZoneId);
      updateTripStatus(trip.id, 'voting');
      setTimeout(() => router.push(`/trips/${trip.id}/venues` as any), 300);
    }
  };

  return (
    <div className="pb-32">
      {/* Hero map */}
      <div className="relative h-72 mx-4 mt-4 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <BarryMap
          center={selected.center}
          zoom={12}
          markers={markers}
          selectedMarkerId={selected.id}
          height="100%"
        />
        {/* Live calc badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${usingDemo ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-[11px] font-semibold text-slate-700">
            {usingDemo ? 'Demo zones' : `Live · ${(calcTime / 1000).toFixed(1)}s`}
          </span>
        </div>
      </div>

      {usingDemo && engineUp === false && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          <p className="text-xs font-semibold text-amber-900">Equity engine offline</p>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
            Showing demo zones for a Paris meet-up. Start the Python service for real calculations.
          </p>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="text-center mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {lockedZone ? 'Picked zone' : 'Vote on the spot'}
          </p>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5 tracking-tight">
            {selected.label || `Zone ${selected.rank}`}
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-1">
            <span className={`text-xl font-display font-extrabold ${
              selected.equityScore >= 90 ? 'text-emerald-600' :
              selected.equityScore >= 75 ? 'text-amber-600' :
              'text-rose-500'
            }`}>
              {selected.equityScore}%
            </span>
            <span className="text-xs text-slate-500">fair to all</span>
          </div>
        </div>

        {/* Burden breakdown for selected */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Effort per member
          </h3>
          <div className="space-y-2.5">
            {Object.entries(selected.burdens).map(([userId, burden]) => {
              const p = trip.participants.find(p => p.userId === userId);
              const i = trip.participants.findIndex(p => p.userId === userId);
              if (!p) return null;
              const burdenPct = Math.min((burden / selected.maxBurden) * 100, 100);
              return (
                <div key={userId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: ORIGIN_COLORS[i % ORIGIN_COLORS.length] }}
                      >
                        {p.user?.firstName?.[0]}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{p.user?.firstName}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{burden.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-9">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${burdenPct}%`,
                        backgroundColor: ORIGIN_COLORS[i % ORIGIN_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pin voting (group only) */}
        {!lockedZone && !isSolo && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Group vote
              </h3>
              <span className="text-[11px] text-slate-500">
                {totalVoted}/{totalMembers} voted
              </span>
            </div>
            <div className="space-y-2 mb-3">
              {zones.map((z, i) => {
                const myVoteHere = myVote?.zoneId === z.id;
                const tally = zoneTally.find(t => t.zoneId === z.id)?.count || 0;
                const tallyPct = totalMembers ? (tally / totalMembers) * 100 : 0;
                const isWinning = winningZoneId === z.id && tally > 0;
                return (
                  <button
                    key={z.id}
                    onClick={() => { voteForPin(trip.id, z.id); setSelectedIdx(i); }}
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
                          <p className="text-[10px] text-slate-500">{z.equityScore}% fair</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {myVoteHere && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className="text-xs font-bold text-slate-700">{tally}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-barry-blue rounded-full transition-all duration-500"
                        style={{ width: `${tallyPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Tap a zone to vote. {isAdmin ? 'Lock in once everyone has voted.' : "Wait for the host to lock once everyone's in."}
            </p>
          </div>
        )}

        {lockedZone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-900">
                Zone locked. Now pick the venues.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {lockedZone ? (
            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Pick venues in this zone
            </button>
          ) : isSolo ? (
            <button
              onClick={() => {
                closePinVote(trip.id, selected.id);
                setTimeout(() => router.push(`/trips/${trip.id}/venues` as any), 300);
              }}
              className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Pick {selected.label || `Zone ${selected.rank}`} and continue
            </button>
          ) : isAdmin && allVoted ? (
            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              Lock in {zones.find(z => z.id === winningZoneId)?.label || 'top zone'}
            </button>
          ) : (
            <div className="text-center py-3 px-4 bg-slate-50 rounded-2xl">
              <p className="text-sm font-medium text-slate-600">
                {!myVote ? 'Tap a zone above to cast your vote' :
                 !allVoted ? `Waiting for ${totalMembers - totalVoted} more vote${totalMembers - totalVoted === 1 ? '' : 's'}` :
                 'Waiting for host to lock in'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
