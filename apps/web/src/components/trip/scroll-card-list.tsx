'use client';

import React, { useState } from 'react';

export interface ScrollCardItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string; // e.g. "Restaurant · 2 EUR · 4.4"
  badge?: string; // e.g. "Top vote" or "Picked"
  badgeColor?: string;
}

export interface ScrollCardListProps {
  items: ScrollCardItem[];
  onCardClick: (id: string) => void;
  onLoveCount?: (id: string) => number; // returns vote count
  onMyVote?: (id: string) => 'love' | 'meh' | 'no' | null;
  selectedId?: string | null;
  cardWidth?: number; // px
}

/** Horizontal-scroll card list — reused for venues and accommodations */
export function ScrollCardList({
  items, onCardClick, onLoveCount, onMyVote, selectedId, cardWidth = 200,
}: ScrollCardListProps) {
  return (
    <div className="-mx-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth">
      <div className="flex gap-3 px-4 pb-2">
        {items.map(item => {
          const loves = onLoveCount?.(item.id) ?? 0;
          const myVote = onMyVote?.(item.id);
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onCardClick(item.id)}
              className={`flex-shrink-0 snap-start text-left bg-white rounded-2xl border-2 overflow-hidden hover:shadow-lg active:scale-[0.98] transition-all ${
                isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' :
                myVote === 'love' ? 'border-emerald-200' :
                'border-slate-100'
              }`}
              style={{ width: `${cardWidth}px` }}
            >
              <div
                className="relative h-32 bg-slate-100 bg-cover bg-center"
                style={{ backgroundImage: `url('${item.imageUrl}')` }}
              >
                {/* Badges */}
                {item.badge && (
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: item.badgeColor || '#10B981' }}
                  >
                    {item.badge}
                  </span>
                )}
                {/* Vote indicator */}
                {myVote && (
                  <span
                    className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                      myVote === 'love' ? 'bg-emerald-500' :
                      myVote === 'meh' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                  >
                    {myVote === 'love' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    )}
                    {myVote === 'meh' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                    {myVote === 'no' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                )}
                {/* Loves at bottom */}
                {loves > 0 && (
                  <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#EF4444">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-900">{loves}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-bold text-slate-900 truncate leading-tight">{item.title}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
