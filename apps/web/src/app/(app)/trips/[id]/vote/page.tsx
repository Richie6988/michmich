'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';

interface MockVenue {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
  address: string;
  tags: string[];
  bgIndex: number;
}

const MOCK_VENUES: MockVenue[] = [
  { id: 'v1', name: 'Chez Janou', category: 'Restaurant', price: 2, rating: 4.4,
    description: 'Iconic Marais bistro. Legendary chocolate mousse.',
    address: '2 Rue Roger Verlomme, 75003', tags: ['French', 'Terrace', 'Brunch'], bgIndex: 0 },
  { id: 'v2', name: 'Le Perchoir Marais', category: 'Bar', price: 3, rating: 4.1,
    description: 'Rooftop with a view over the Paris skyline. Signature cocktails.',
    address: '33 Rue de la Verrerie, 75004', tags: ['Rooftop', 'Cocktails', 'View'], bgIndex: 1 },
  { id: 'v3', name: 'Breizh Cafe', category: 'Restaurant', price: 2, rating: 4.3,
    description: 'Best crepes in Paris. Artisanal Breton cider.',
    address: '109 Rue Vieille du Temple, 75003', tags: ['Crepes', 'Organic', 'Cosy'], bgIndex: 2 },
  { id: 'v4', name: 'Candelaria', category: 'Bar', price: 2, rating: 4.5,
    description: 'Speakeasy hidden behind a taqueria. Mezcal and tacos.',
    address: '52 Rue de Saintonge, 75003', tags: ['Speakeasy', 'Mexican', 'Cocktails'], bgIndex: 3 },
];

const VENUE_BG = [
  'from-orange-100 via-amber-50 to-rose-50',
  'from-blue-100 via-indigo-50 to-purple-50',
  'from-emerald-100 via-teal-50 to-cyan-50',
  'from-rose-100 via-pink-50 to-fuchsia-50',
];

const CATEGORY_ICON: Record<string, JSX.Element> = {
  Restaurant: <><path d="M7 2v20M21 15V2L17 6v9c0 1.1.9 2 2 2s2-.9 2-2zM7 7c0-2.5 5-2.5 5 0L11 14H7V7z" /></>,
  Bar: <><path d="M3 5h18l-9 9-9-9zm9 9v6m-4 0h8" /></>,
};

function VenueCard({ venue, style, isTop, onSwipe, onSwipeProgress }: {
  venue: MockVenue;
  style?: React.CSSProperties;
  isTop: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
  onSwipeProgress?: (dx: number) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);

  const handleStart = (clientX: number) => {
    if (!isTop) return;
    startX.current = clientX;
    dragging.current = true;
  };

  const handleMove = (clientX: number) => {
    if (!dragging.current) return;
    const dx = clientX - startX.current;
    setDragX(dx);
    onSwipeProgress?.(dx);
  };

  const handleEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(dragX) > 100) {
      onSwipe(dragX > 0 ? 'right' : 'left');
    }
    setDragX(0);
    onSwipeProgress?.(0);
  };

  const rotation = dragX * 0.08;

  return (
    <div
      className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        ...style,
        transform: `translateX(${dragX}px) rotate(${rotation}deg) ${style?.transform || ''}`,
        transition: dragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        touchAction: 'pan-y',
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (dragging.current) handleEnd(); }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div className="w-full h-full bg-white rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col border border-slate-100">
        {/* Hero zone (deterministic by venue.bgIndex) */}
        <div className={`relative h-48 bg-gradient-to-br ${VENUE_BG[venue.bgIndex % VENUE_BG.length]} flex items-center justify-center`}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {CATEGORY_ICON[venue.category] || <circle cx="12" cy="12" r="9" />}
          </svg>
          <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-slate-700">
            {venue.category}
          </span>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-xs font-bold text-amber-700">{venue.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">{venue.name}</h3>
            <PriceLevel level={venue.price} />
          </div>

          <p className="text-sm text-slate-600 mb-3 leading-snug">{venue.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-1.5 text-xs text-slate-500">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{venue.address}</span>
          </div>
        </div>

        {/* Swipe overlay */}
        {dragX > 50 && isTop && (
          <div
            className="absolute top-6 left-6 px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-display font-extrabold text-lg rotate-[-15deg] shadow-lg pointer-events-none"
            style={{ opacity: Math.min(dragX / 150, 1) }}
          >
            LIKE
          </div>
        )}
        {dragX < -50 && isTop && (
          <div
            className="absolute top-6 right-6 px-4 py-1.5 rounded-xl bg-rose-500 text-white font-display font-extrabold text-lg rotate-[15deg] shadow-lg pointer-events-none"
            style={{ opacity: Math.min(-dragX / 150, 1) }}
          >
            PASS
          </div>
        )}
      </div>
    </div>
  );
}

function PriceLevel({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5 text-xs">
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={`font-bold ${i <= level ? 'text-slate-900' : 'text-slate-300'}`}>EUR</span>
      ))}
    </div>
  );
}

export default function VotePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { updateTripStatus } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    const venue = MOCK_VENUES[currentIndex];
    setVotes(prev => ({ ...prev, [venue.id]: direction === 'right' }));
    if (currentIndex >= MOCK_VENUES.length - 1) {
      setTimeout(() => setShowResult(true), 400);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    updateTripStatus(id as string, 'booked');
    router.push(`/trips/${id}/itinerary` as any);
  };

  if (showResult) {
    const approved = Object.entries(votes).filter(([_, v]) => v);
    const winner = MOCK_VENUES.find(v => v.id === approved[0]?.[0]) || MOCK_VENUES[0];
    const approval = Math.round(approved.length / Math.max(Object.keys(votes).length, 1) * 100);

    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <BarryMascot mood="celebrating" size={100} />
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
            The group picked
          </h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mb-4">
          <div className={`h-32 bg-gradient-to-br ${VENUE_BG[winner.bgIndex % VENUE_BG.length]} relative flex items-end p-4`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mr-3 shadow-md">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Winner</p>
              <p className="font-display font-bold text-2xl">{winner.name}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-600 mb-2">{winner.description}</p>
            <p className="text-xs text-slate-500 mb-3">{winner.address}</p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
              <Stat label="Likes" value={String(approved.length)} color="text-emerald-600" />
              <Stat label="Skips" value={String(Object.keys(votes).length - approved.length)} color="text-slate-400" />
              <Stat label="Approval" value={`${approval}%`} color="text-barry-blue" />
            </div>
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          See directions
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="text-center mb-3">
        <h1 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">Group vote</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Swipe right to like · left to skip
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mb-4 px-2">
        {MOCK_VENUES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < currentIndex ? 'bg-emerald-500' :
              i === currentIndex ? 'bg-barry-blue' :
              'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Card stack */}
      <div className="relative w-full h-[420px] mb-6">
        {MOCK_VENUES.map((venue, i) => {
          if (i < currentIndex) return null;
          const isTop = i === currentIndex;
          const offset = i - currentIndex;
          return (
            <VenueCard
              key={venue.id}
              venue={venue}
              isTop={isTop}
              style={{
                zIndex: MOCK_VENUES.length - i,
                transform: isTop ? '' : `scale(${1 - offset * 0.04}) translateY(${offset * 6}px)`,
                opacity: isTop ? 1 : Math.max(0.55, 1 - offset * 0.25),
              }}
              onSwipe={handleSwipe}
            />
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm hover:border-rose-300 active:scale-90 transition-all"
          aria-label="Pass"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 hover:bg-emerald-600 transition-all"
          aria-label="Like"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-4">
        {currentIndex + 1} of {MOCK_VENUES.length}
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className={`text-xl font-display font-extrabold ${color}`}>{value}</p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
