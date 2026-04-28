'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { BarryMark, BarryLoader } from '@/components/barry/brand';

const MOCK_ITINERARY = {
  venue: {
    name: 'Chez Janou', category: 'Restaurant', address: '2 Rue Roger Verlomme, 75003',
    rating: 4.4, priceLevel: 2,
  },
  equityScore: 94.2,
  zone: 'Le Marais',
  date: 'Vendredi 2 mai, 20h00',
  participants: [
    { name: 'Chloe', mode: 'Metro', duration: 22, distance: 3.8, cost: 2.15, from: 'Montmartre', color: '#2563EB' },
    { name: 'Tom', mode: 'Metro', duration: 25, distance: 4.2, cost: 2.15, from: 'Clignancourt', color: '#F97316' },
    { name: 'Marc', mode: 'Velo', duration: 8, distance: 2.1, cost: 0, from: 'Republique', color: '#10B981' },
    { name: 'Sarah', mode: 'Metro', duration: 12, distance: 1.4, cost: 2.15, from: 'Bastille', color: '#8B5CF6' },
  ],
};

export default function ItineraryPage() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://barry.app/join/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCost = MOCK_ITINERARY.participants.reduce((s, p) => s + p.cost, 0);
  const avgDuration = Math.round(
    MOCK_ITINERARY.participants.reduce((s, p) => s + p.duration, 0) / MOCK_ITINERARY.participants.length
  );

  return (
    <div className="px-4 py-6">
      {/* Celebration header */}
      <div className="text-center mb-6">
        <BarryMark size={40} />
        <h1 className="font-display font-bold text-2xl text-barry-black mt-3">
          C'est parti !
        </h1>
        <p className="text-barry-grey text-sm mt-1">
          Tout est cale. Barry s'est occupe de tout.
        </p>
      </div>

      {/* Equity score banner */}
      <div className="barry-card bg-gradient-to-r from-barry-blue to-barry-green text-white mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Score d'equite du groupe</p>
            <p className="font-display font-bold text-3xl">{MOCK_ITINERARY.equityScore}%</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Venue card */}
      <div className="barry-card mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-barry-coral/10 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-barry-black">{MOCK_ITINERARY.venue.name}</h3>
            <p className="text-sm text-barry-grey">{MOCK_ITINERARY.venue.address}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                </svg>
                <span className="text-xs font-medium text-amber-700">{MOCK_ITINERARY.venue.rating}</span>
              </div>
              <span className="text-xs text-barry-grey">{'EUR'.repeat(MOCK_ITINERARY.venue.priceLevel)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-barry-grey">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{MOCK_ITINERARY.date}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="barry-card text-center py-3">
          <p className="text-xl font-bold text-barry-blue">{avgDuration}</p>
          <p className="text-[10px] text-barry-grey mt-0.5">min en moyenne</p>
        </div>
        <div className="barry-card text-center py-3">
          <p className="text-xl font-bold text-barry-coral">{totalCost.toFixed(0)} EUR</p>
          <p className="text-[10px] text-barry-grey mt-0.5">cout total</p>
        </div>
        <div className="barry-card text-center py-3">
          <p className="text-xl font-bold text-barry-green">{MOCK_ITINERARY.zone}</p>
          <p className="text-[10px] text-barry-grey mt-0.5">quartier</p>
        </div>
      </div>

      {/* Per-person routes */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-barry-grey uppercase tracking-wider mb-3 px-1">
          Itineraire par personne
        </h3>
        <div className="space-y-2">
          {MOCK_ITINERARY.participants.map(p => (
            <div key={p.name} className="barry-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-barry-black">{p.name}</p>
                    <p className="text-[11px] text-barry-grey">{p.from} -- {p.mode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-barry-black">{p.duration} min</p>
                  <p className="text-[11px] text-barry-grey">
                    {p.distance} km {p.cost > 0 ? `-- ${p.cost} EUR` : '-- Gratuit'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <button className="btn-primary w-full flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
          </svg>
          Ajouter au calendrier
        </button>

        <button
          onClick={handleCopyLink}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {copied ? 'Lien copie !' : 'Partager l\'itineraire'}
        </button>

        <button className="btn-coral w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Reserver (bientot disponible)
        </button>
      </div>
    </div>
  );
}
