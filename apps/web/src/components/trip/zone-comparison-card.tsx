'use client';

import React from 'react';
import { estimateZoneTransport, totalTransportCost, type TransportEstimate } from '@/lib/transport/zone-cost-estimator';
import type { EquityZone, Participant } from '@barry/shared-types';

const ZONE_COLORS = ['#10B981', '#F97316', '#8B5CF6'];

const TRANSPORT_LABEL: Record<string, string> = {
  walk: 'Walk',
  bike: 'Bike',
  transit: 'Transit',
  car: 'Car',
  train: 'Train',
  flight: 'Flight',
};

interface ZoneComparisonCardProps {
  zones: EquityZone[];
  participants: Participant[];
  /** Current logged-in user id - their row gets highlighted as "my budget" */
  currentUserId?: string;
  /** Voting state per zone */
  votes?: Array<{ zoneId: string; userId: string }>;
  /** Click handler when a zone is voted/picked */
  onPickZone?: (zoneId: string) => void;
  /** When this id matches a zone, show a "Picked" badge (winner) */
  pickedZoneId?: string;
}

/**
 * Top 3 zones shown side-by-side with FULL TRANSPORT COST INFORMATION
 * baked in so users can compare apples-to-apples before voting.
 *
 * Each card shows:
 *   - Rank badge + zone label + equity score
 *   - GROUP TOTAL: sum of round-trip transport costs for everyone
 *   - YOUR BUDGET: just the current user's round-trip cost (highlighted)
 *   - Each participant's mode, duration, and round-trip cost (table)
 *   - Vote button or "Picked" badge
 *
 * Layout responsive:
 *   - Mobile (<sm): one column, vertical stack
 *   - Tablet+ (sm:): three columns side-by-side
 */
export function ZoneComparisonCard({
  zones, participants, currentUserId, votes = [], onPickZone, pickedZoneId,
}: ZoneComparisonCardProps) {
  const top3 = zones.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((zone, idx) => {
          const estimates = estimateZoneTransport(zone.center, participants);
          const groupTotal = totalTransportCost(estimates);
          const myEstimate = estimates.find(e => e.userId === currentUserId);
          const voteCount = votes.filter(v => v.zoneId === zone.id).length;
          const isPicked = pickedZoneId === zone.id;
          const color = ZONE_COLORS[idx] || '#94A3B8';

          return (
            <div
              key={zone.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all overflow-hidden ${
                isPicked ? 'border-emerald-400 shadow-lg' : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              {/* Header bar with rank + label */}
              <div
                className="px-3 py-2 text-white flex items-center justify-between"
                style={{ backgroundColor: color }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center font-extrabold text-xs">
                    {zone.rank}
                  </div>
                  <p className="font-display font-bold text-sm truncate">
                    {zone.label || `Zone ${zone.rank}`}
                  </p>
                </div>
                {isPicked && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/30 px-1.5 py-0.5 rounded">
                    Picked
                  </span>
                )}
              </div>

              <div className="p-3 space-y-2.5">
                {/* Equity score */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Fairness</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{zone.equityScore}%</span>
                </div>

                {/* Group total transport */}
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Group transport</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{groupTotal} EUR</span>
                </div>

                {/* MY budget for this zone - highlighted */}
                {myEstimate && (
                  <div
                    className="flex items-center justify-between text-xs rounded-lg px-2.5 py-2 border-2"
                    style={{ borderColor: color, backgroundColor: `${color}10` }}
                  >
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
                        My budget
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {TRANSPORT_LABEL[myEstimate.mode]} - {myEstimate.durationMin} min - round trip
                      </p>
                    </div>
                    <span className="font-extrabold text-base" style={{ color }}>
                      {myEstimate.costRoundTripEur} EUR
                    </span>
                  </div>
                )}

                {/* All participants quick table */}
                <details className="group">
                  <summary className="cursor-pointer list-none flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    <span>Everyone&rsquo;s travel ({estimates.length})</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="transition-transform group-open:rotate-180">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="mt-1.5 space-y-1">
                    {estimates.map(e => (
                      <div key={e.participantId} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-medium truncate ${e.userId === currentUserId ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                            {e.firstName}
                          </span>
                          <span className="text-[9px] text-slate-400">{TRANSPORT_LABEL[e.mode]}</span>
                          <span className="text-[9px] text-slate-400">{e.durationMin}min</span>
                        </div>
                        <span className={`tabular-nums ${e.userId === currentUserId ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {e.costRoundTripEur} EUR
                        </span>
                      </div>
                    ))}
                  </div>
                </details>

                {/* Vote button */}
                {onPickZone && !isPicked && (
                  <button
                    onClick={() => onPickZone(zone.id)}
                    className="w-full py-2 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md transition-all active:scale-95"
                    style={{ backgroundColor: color }}
                  >
                    Vote for this zone
                    {voteCount > 0 && <span className="ml-1.5 opacity-80">({voteCount})</span>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
