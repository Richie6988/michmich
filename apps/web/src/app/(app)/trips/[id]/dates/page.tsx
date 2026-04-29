'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { formatDateLong, formatDateShort } from '@/lib/utils/format-date';
import type { DateVoteResponse } from '@barry/shared-types';

export default function DatesPollPage() {
  const { id } = useParams<{ id: string }>();
  const { datePolls, voteDatePoll, closeDatePoll, createDatePoll, currentUser, activeTrip, trips } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);
  const poll = datePolls[id as string];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDates, setNewDates] = useState<string[]>(['', '']);

  if (!trip) {
    return (
      <div className="px-4 py-12 text-center">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  // No poll yet -> empty state with create
  if (!poll) {
    if (!showAddForm) {
      return (
        <div className="px-4 py-8">
          <div className="text-center mb-6">
            <BarryMascot mood="default" size={84} />
            <h2 className="font-display font-bold text-xl text-slate-900 mt-3">When's good?</h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto">
              Propose a few dates. Everyone votes Yes / Maybe / No. Pick the winner.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
          >
            Propose dates
          </button>
        </div>
      );
    }

    return <CreatePollForm
      tripId={id as string}
      onCreate={(dates) => {
        const opts = dates.filter(d => d).map(d => ({ date: d }));
        if (opts.length === 0) return;
        createDatePoll(id as string, opts);
        setShowAddForm(false);
      }}
      onCancel={() => setShowAddForm(false)}
    />;
  }

  // Render poll
  const totalVoters = new Set(poll.votes.map(v => v.userId)).size;
  const totalParticipants = trip.participants.length;
  const isAdmin = trip.organizerId === currentUser?.id;
  const isClosed = poll.status === 'closed';

  // Compute score per option for ranking
  const optionScores = poll.options.map(opt => {
    const votes = poll.votes.filter(v => v.optionId === opt.id);
    const yes = votes.filter(v => v.response === 'yes').length;
    const maybe = votes.filter(v => v.response === 'maybe').length;
    const no = votes.filter(v => v.response === 'no').length;
    const score = yes * 2 + maybe;
    return { ...opt, votes, yes, maybe, no, score };
  });

  const bestScore = Math.max(...optionScores.map(o => o.score));
  const sorted = [...optionScores].sort((a, b) => b.score - a.score);

  return (
    <div className="px-4 py-4 pb-8">
      {/* Status banner */}
      <div className={`rounded-2xl p-4 mb-4 ${isClosed ? 'bg-emerald-50 border border-emerald-100' : 'bg-purple-50 border border-purple-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClosed ? 'bg-emerald-500' : 'bg-purple-500'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              {isClosed
                ? <polyline points="20 6 9 17 4 12" />
                : <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>}
            </svg>
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${isClosed ? 'text-emerald-900' : 'text-purple-900'}`}>
              {isClosed ? 'Date locked in' : 'Vote in progress'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {isClosed
                ? 'The group has chosen a date.'
                : `${totalVoters} of ${totalParticipants} ${totalVoters === 1 ? 'person' : 'people'} voted`}
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {sorted.map((opt, i) => {
          const myVote = poll.votes.find(v => v.userId === currentUser?.id && v.optionId === opt.id)?.response;
          const isWinner = !isClosed && opt.score === bestScore && opt.score > 0;
          const isSelected = poll.selectedOptionId === opt.id;

          return (
            <div
              key={opt.id}
              className={`bg-white rounded-2xl border transition-all ${
                isSelected ? 'border-emerald-500 ring-2 ring-emerald-100' :
                isWinner ? 'border-purple-300 shadow-sm' :
                'border-slate-100'
              }`}
            >
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-900 text-[15px] truncate">
                        {formatDateLong(opt.date)}
                      </h3>
                      {isWinner && !isClosed && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Top</span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Picked</span>
                      )}
                    </div>
                    {opt.label && <p className="text-xs text-slate-500">{opt.label}</p>}
                  </div>
                </div>

                {/* Vote bars */}
                <div className="flex items-center gap-1 mb-3">
                  <VoteSegment count={opt.yes} total={totalParticipants} color="bg-emerald-500" />
                  <VoteSegment count={opt.maybe} total={totalParticipants} color="bg-amber-400" />
                  <VoteSegment count={opt.no} total={totalParticipants} color="bg-rose-400" />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                  <span><span className="font-bold text-emerald-600">{opt.yes}</span> yes</span>
                  <span><span className="font-bold text-amber-600">{opt.maybe}</span> maybe</span>
                  <span><span className="font-bold text-rose-500">{opt.no}</span> no</span>
                </div>

                {/* My vote */}
                {!isClosed && (
                  <div className="grid grid-cols-3 gap-1.5">
                    <VoteButton
                      response="yes"
                      label="Yes"
                      active={myVote === 'yes'}
                      onClick={() => voteDatePoll(id as string, opt.id, 'yes')}
                    />
                    <VoteButton
                      response="maybe"
                      label="Maybe"
                      active={myVote === 'maybe'}
                      onClick={() => voteDatePoll(id as string, opt.id, 'maybe')}
                    />
                    <VoteButton
                      response="no"
                      label="No"
                      active={myVote === 'no'}
                      onClick={() => voteDatePoll(id as string, opt.id, 'no')}
                    />
                  </div>
                )}

                {/* Pick winner button (admin only) */}
                {!isClosed && isAdmin && i === 0 && opt.score > 0 && (
                  <button
                    onClick={() => closeDatePoll(id as string, opt.id)}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
                  >
                    Lock this date in
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isClosed && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full text-sm text-purple-700 font-medium py-2.5 rounded-xl border-2 border-dashed border-purple-200 hover:bg-purple-50 transition-colors"
        >
          + Add another option
        </button>
      )}

      {showAddForm && (
        <CreatePollForm
          tripId={id as string}
          onCreate={(dates) => {
            const opts = dates.filter(d => d).map(d => ({ date: d }));
            if (opts.length === 0) return;
            // Append to existing poll
            const existing = poll.options;
            const newOpts = opts.map((o, i) => ({
              id: `opt${Date.now()}-${i}`, date: o.date,
            }));
            useAppStore.setState(s => ({
              datePolls: {
                ...s.datePolls,
                [id as string]: { ...poll, options: [...existing, ...newOpts] },
              },
            }));
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
          embedded
        />
      )}
    </div>
  );
}

function VoteSegment({ count, total, color }: { count: number; total: number; color: string }) {
  if (total === 0) return null;
  return (
    <div className="flex-1 flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full ${i < count ? color : 'bg-slate-100'}`}
        />
      ))}
    </div>
  );
}

function VoteButton({ response, label, active, onClick }: {
  response: DateVoteResponse;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const palette = {
    yes: { active: 'bg-emerald-500 text-white shadow-md', inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    maybe: { active: 'bg-amber-500 text-white shadow-md', inactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
    no: { active: 'bg-rose-500 text-white shadow-md', inactive: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
  }[response];

  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${active ? palette.active : palette.inactive}`}
    >
      {label}
    </button>
  );
}

function CreatePollForm({ tripId, onCreate, onCancel, embedded }: {
  tripId: string;
  onCreate: (dates: string[]) => void;
  onCancel: () => void;
  embedded?: boolean;
}) {
  const [dates, setDates] = useState<string[]>(['', '']);

  const updateDate = (i: number, val: string) => {
    setDates(prev => {
      const copy = [...prev];
      copy[i] = val;
      return copy;
    });
  };

  const addRow = () => setDates(prev => [...prev, '']);
  const removeRow = (i: number) => setDates(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className={embedded ? 'mt-4' : 'px-4 py-6 max-w-lg mx-auto'}>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Propose dates</h3>
        <div className="space-y-2 mb-3">
          {dates.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={d}
                onChange={e => updateDate(i, e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {dates.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center"
                  aria-label="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className="text-xs text-purple-600 font-medium hover:underline"
        >
          + Add another date
        </button>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(dates)}
            disabled={dates.filter(d => d).length === 0}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
          >
            {embedded ? 'Add' : 'Start poll'}
          </button>
        </div>
      </div>
    </div>
  );
}
