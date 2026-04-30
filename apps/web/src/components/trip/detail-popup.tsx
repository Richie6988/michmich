'use client';

import React from 'react';
import type { VenueOpt, AccommodationOpt } from '@/lib/data/venues';
import type { VenueVoteResponse } from '@barry/shared-types';

interface DetailPopupProps {
  item: VenueOpt | AccommodationOpt;
  onClose: () => void;
  myVote: VenueVoteResponse | null;
  onVote: (response: VenueVoteResponse) => void;
  loveCount: number;
  mehCount: number;
  noCount: number;
  isPicked?: boolean;
  canPick?: boolean;
  onPick?: () => void;
  isVenue: boolean; // true = venue, false = accommodation
}

export function DetailPopup({
  item, onClose, myVote, onVote,
  loveCount, mehCount, noCount,
  isPicked, canPick, onPick, isVenue,
}: DetailPopupProps) {
  // Type narrowing helpers
  const v = isVenue ? (item as VenueOpt) : null;
  const a = !isVenue ? (item as AccommodationOpt) : null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"
      >
        {/* Hero image */}
        <div
          className="relative h-56 bg-slate-200 bg-cover bg-center"
          style={{ backgroundImage: `url('${item.imageUrl}')` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {isPicked && (
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-md">
              Group's pick
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">{item.title || (item as any).name}</h2>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-bold text-amber-700">
                {(v?.rating || a?.rating || 0).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Subtitle: category for venue, type+price for accommodation */}
          <p className="text-sm text-slate-500 mb-3">
            {v ? (
              <>
                {v.category} · {[1, 2, 3, 4].slice(0, v.price).map(() => 'EUR').join('')}
              </>
            ) : a ? (
              <>
                {a.type === 'hotel' ? 'Hotel' : a.type === 'bnb' ? 'BnB' : a.type === 'airbnb' ? 'Airbnb' : 'Stay'}
                {' · '}
                <span className="font-bold text-slate-900">{a.pricePerNight} EUR</span>
                <span className="text-slate-500"> / night</span>
              </>
            ) : null}
          </p>

          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {(item as any).description}
          </p>

          {/* Tags / amenities */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(v?.tags || a?.amenities || []).map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Address */}
          <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" className="flex-shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-xs text-slate-700">{(v?.address || a?.address)}</p>
          </div>

          {/* Vote tally */}
          <div className="flex items-center gap-3 mb-4 text-xs">
            <span><strong className="text-emerald-600">{loveCount}</strong> <span className="text-slate-500">love</span></span>
            <span className="text-slate-300">·</span>
            <span><strong className="text-amber-600">{mehCount}</strong> <span className="text-slate-500">meh</span></span>
            <span className="text-slate-300">·</span>
            <span><strong className="text-rose-500">{noCount}</strong> <span className="text-slate-500">no</span></span>
          </div>
        </div>

        {/* Sticky footer with vote buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Your vote</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onVote('no')}
              className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 ${
                myVote === 'no'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14.39 11H17a4 4 0 014 4v0a4 4 0 01-4 4h-3.61L9 23l-1-1V11l4-7c1.93 0 3.5 1.57 3.5 3.5L14.39 11z" transform="rotate(180 12 12)" />
              </svg>
              Pass
            </button>
            <button
              onClick={() => onVote('meh')}
              className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 ${
                myVote === 'meh'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Meh
            </button>
            <button
              onClick={() => onVote('love')}
              className={`py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex flex-col items-center gap-1 ${
                myVote === 'love'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
              </svg>
              Love
            </button>
          </div>
          {canPick && onPick && !isPicked && (
            <button
              onClick={onPick}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Pick this for the group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
