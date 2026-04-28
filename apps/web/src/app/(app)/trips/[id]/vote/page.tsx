'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/barry-mascot';

const MOCK_VENUES = [
  {
    id: 'v1', name: 'Chez Janou', category: 'Restaurant', price: 2,
    rating: 4.4, description: 'Bistrot mythique du Marais. Mousse au chocolat legendaire.',
    address: '2 Rue Roger Verlomme, 75003', photo: null,
    tags: ['Francais', 'Terrasse', 'Brunch'],
  },
  {
    id: 'v2', name: 'Le Perchoir Marais', category: 'Bar', price: 3,
    rating: 4.1, description: 'Rooftop avec vue sur les toits de Paris. Cocktails signatures.',
    address: '33 Rue de la Verrerie, 75004', photo: null,
    tags: ['Rooftop', 'Cocktails', 'Vue'],
  },
  {
    id: 'v3', name: 'Breizh Cafe', category: 'Restaurant', price: 2,
    rating: 4.3, description: 'Les meilleures crepes de Paris. Cidre breton artisanal.',
    address: '109 Rue Vieille du Temple, 75003', photo: null,
    tags: ['Crepes', 'Bio', 'Cosy'],
  },
  {
    id: 'v4', name: 'Candelaria', category: 'Bar', price: 2,
    rating: 4.5, description: 'Speakeasy cache derriere une taqueria. Mezcal et tacos.',
    address: '52 Rue de Saintonge, 75003', photo: null,
    tags: ['Speakeasy', 'Mexicain', 'Cocktails'],
  },
];

const VENUE_COLORS = ['#DBEAFE', '#FEF3C7', '#D1FAE5', '#FCE7F3', '#E0E7FF'];

function VenueCard({ venue, style, onSwipe }: {
  venue: typeof MOCK_VENUES[0];
  style?: React.CSSProperties;
  onSwipe: (direction: 'left' | 'right') => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = React.useRef(0);

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    setDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!dragging) return;
    setDragX(clientX - startX.current);
  };

  const handleEnd = () => {
    setDragging(false);
    if (Math.abs(dragX) > 100) {
      onSwipe(dragX > 0 ? 'right' : 'left');
    }
    setDragX(0);
  };

  const rotation = dragX * 0.1;
  const opacity = 1 - Math.abs(dragX) / 400;

  return (
    <div
      className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
      style={{
        ...style,
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        opacity,
        transition: dragging ? 'none' : 'all 0.3s ease',
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (dragging) handleEnd(); }}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div className="barry-card h-full flex flex-col">
        {/* Venue image placeholder */}
        <div
          className="w-full h-44 rounded-xl mb-4 flex items-center justify-center"
          style={{ backgroundColor: VENUE_COLORS[Math.random() * 5 | 0] }}
        >
          <div className="text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="mx-auto mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs text-barry-grey">{venue.category}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display font-bold text-lg text-barry-black">{venue.name}</h3>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-bold text-amber-700">{venue.rating}</span>
            </div>
          </div>

          <p className="text-sm text-barry-grey mb-3">{venue.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {venue.tags.map(tag => (
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-barry-grey rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-barry-grey">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{venue.address}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-barry-grey mt-1">
            {'EUR'.repeat(venue.price).split('').map((_, i) => (
              <span key={i} className="font-bold text-barry-black">EUR</span>
            ))}
            {'EUR'.repeat(4 - venue.price).split('').map((_, i) => (
              <span key={i + venue.price} className="text-gray-300">EUR</span>
            ))}
          </div>
        </div>

        {/* Swipe hint overlay */}
        {dragX > 50 && (
          <div className="absolute top-4 left-4 bg-barry-green text-white font-bold text-lg px-4 py-1 rounded-full rotate-[-15deg]">
            J'adore
          </div>
        )}
        {dragX < -50 && (
          <div className="absolute top-4 right-4 bg-barry-red text-white font-bold text-lg px-4 py-1 rounded-full rotate-[15deg]">
            Suivant
          </div>
        )}
      </div>
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
      // All voted
      setTimeout(() => setShowResult(true), 500);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    updateTripStatus(id as string, 'booked');
    router.push(`/trips/${id}/itinerary`);
  };

  if (showResult) {
    const approved = Object.entries(votes).filter(([_, v]) => v);
    const winner = MOCK_VENUES.find(v => v.id === approved[0]?.[0]) || MOCK_VENUES[0];

    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <BarryMascot pose="celebrating" size={120} />
          <h1 className="font-display font-bold text-2xl text-barry-black mt-4">
            Le groupe a choisi !
          </h1>
        </div>

        <div className="barry-card mb-6">
          <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="font-display font-bold text-xl text-barry-black mb-1">{winner.name}</h2>
          <p className="text-sm text-barry-grey mb-2">{winner.description}</p>
          <p className="text-xs text-barry-grey">{winner.address}</p>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-barry-green">{approved.length}</p>
                <p className="text-[11px] text-barry-grey">J'adore</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-barry-grey">{Object.keys(votes).length - approved.length}</p>
                <p className="text-[11px] text-barry-grey">Suivant</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-barry-blue">{Math.round(approved.length / Math.max(Object.keys(votes).length, 1) * 100)}%</p>
                <p className="text-[11px] text-barry-grey">Approbation</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleFinish} className="btn-primary w-full">
          Voir l'itineraire
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-4">
        <h1 className="font-display font-bold text-xl text-barry-black">Votez en groupe</h1>
        <p className="text-barry-grey text-sm mt-1">
          Swipez a droite pour valider, a gauche pour passer
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {MOCK_VENUES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentIndex ? 'bg-barry-green' :
              i === currentIndex ? 'bg-barry-blue' :
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Card stack */}
      <div className="relative w-full h-[480px] mb-6">
        {MOCK_VENUES.map((venue, i) => {
          if (i < currentIndex) return null;
          const isTop = i === currentIndex;
          return (
            <VenueCard
              key={venue.id}
              venue={venue}
              style={{
                zIndex: MOCK_VENUES.length - i,
                transform: isTop ? undefined : `scale(${1 - (i - currentIndex) * 0.05}) translateY(${(i - currentIndex) * 8}px)`,
                opacity: isTop ? 1 : Math.max(0.5, 1 - (i - currentIndex) * 0.3),
              }}
              onSwipe={isTop ? handleSwipe : () => {}}
            />
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-20 h-20 rounded-full bg-barry-green border-2 border-emerald-300 flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
