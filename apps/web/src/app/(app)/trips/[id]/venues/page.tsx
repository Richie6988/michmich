'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import type { VenueVoteResponse } from '@barry/shared-types';

interface VenueOpt {
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

const VENUES_BY_ZONE: Record<string, VenueOpt[]> = {
  'demo-z1': [ // Marais
    { id: 'mar-1', name: 'Chez Janou', category: 'Restaurant', price: 2, rating: 4.4,
      description: 'Iconic Marais bistro. Legendary chocolate mousse.',
      address: '2 Rue Roger Verlomme, 75003', tags: ['French', 'Terrace'], bgIndex: 0 },
    { id: 'mar-2', name: 'Le Perchoir Marais', category: 'Bar', price: 3, rating: 4.1,
      description: 'Rooftop with a view over the Paris skyline.',
      address: '33 Rue de la Verrerie, 75004', tags: ['Rooftop', 'Cocktails'], bgIndex: 1 },
    { id: 'mar-3', name: 'Breizh Cafe', category: 'Restaurant', price: 2, rating: 4.3,
      description: 'Best crepes in Paris. Artisanal Breton cider.',
      address: '109 Rue Vieille du Temple, 75003', tags: ['Crepes', 'Organic'], bgIndex: 2 },
    { id: 'mar-4', name: 'Candelaria', category: 'Bar', price: 2, rating: 4.5,
      description: 'Speakeasy hidden behind a taqueria.',
      address: '52 Rue de Saintonge, 75003', tags: ['Speakeasy', 'Mexican'], bgIndex: 3 },
  ],
  'demo-z2': [ // Republique
    { id: 'rep-1', name: 'Holybelly 5', category: 'Brunch', price: 2, rating: 4.5,
      description: 'Cult brunch spot. Pancakes worth the wait.',
      address: '5 Rue Lucien Sampaix, 75010', tags: ['Brunch', 'Coffee'], bgIndex: 0 },
    { id: 'rep-2', name: 'Le Mary Celeste', category: 'Bar', price: 3, rating: 4.4,
      description: 'Natural wine and seasonal cocktails.',
      address: '1 Rue Commines, 75003', tags: ['Wine', 'Tapas'], bgIndex: 1 },
    { id: 'rep-3', name: 'Du Pain et des Idees', category: 'Bakery', price: 1, rating: 4.7,
      description: 'Artisan bakery. Get there before noon.',
      address: '34 Rue Yves Toudic, 75010', tags: ['Bakery', 'Pastry'], bgIndex: 2 },
    { id: 'rep-4', name: 'Le Comptoir General', category: 'Bar', price: 2, rating: 4.0,
      description: 'Hidden along Canal Saint-Martin. Quirky vibe.',
      address: '80 Quai de Jemmapes, 75010', tags: ['Hidden', 'Eclectic'], bgIndex: 3 },
  ],
  'demo-z3': [ // Bastille
    { id: 'bas-1', name: 'Septime', category: 'Restaurant', price: 4, rating: 4.6,
      description: 'Michelin-starred. Modern French. Reserve weeks ahead.',
      address: '80 Rue de Charonne, 75011', tags: ['Michelin', 'Modern'], bgIndex: 0 },
    { id: 'bas-2', name: 'Le Servan', category: 'Restaurant', price: 3, rating: 4.4,
      description: 'Asian-French fusion. Seasonal and sharp.',
      address: '32 Rue Saint-Maur, 75011', tags: ['Fusion', 'Wine'], bgIndex: 1 },
    { id: 'bas-3', name: 'Aux Deux Amis', category: 'Bar', price: 2, rating: 4.3,
      description: 'Tiny natural wine bar. Always packed for a reason.',
      address: '45 Rue Oberkampf, 75011', tags: ['Wine', 'Small plates'], bgIndex: 2 },
    { id: 'bas-4', name: 'Bistrot Paul Bert', category: 'Restaurant', price: 3, rating: 4.5,
      description: 'Old-school bistro. Steak frites done right.',
      address: '18 Rue Paul Bert, 75011', tags: ['French', 'Classic'], bgIndex: 3 },
  ],
};

const FALLBACK_VENUES: VenueOpt[] = VENUES_BY_ZONE['demo-z1'];

const VENUE_BG = [
  'from-orange-100 via-amber-50 to-rose-50',
  'from-blue-100 via-indigo-50 to-purple-50',
  'from-emerald-100 via-teal-50 to-cyan-50',
  'from-rose-100 via-pink-50 to-fuchsia-50',
];

export default function VenuesPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    currentUser, activeTrip, trips,
    venueVotes, voteForVenue, closeVenueVote, pickedVenue, pickedZone,
  } = useAppStore();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const trip = activeTrip || trips.find(t => t.id === id);
  const zoneId = trip ? pickedZone[trip.id] : null;
  const venues = zoneId && VENUES_BY_ZONE[zoneId] ? VENUES_BY_ZONE[zoneId] : FALLBACK_VENUES;
  const myVotes = (venueVotes[id as string] || []).filter(v => v.userId === currentUser?.id);

  useEffect(() => {
    // Skip already voted venues
    while (currentIdx < venues.length && myVotes.find(v => v.venueId === venues[currentIdx].id)) {
      setCurrentIdx(i => i + 1);
      return;
    }
    if (currentIdx >= venues.length) setShowResults(true);
  }, [currentIdx, myVotes.length, venues.length]);

  if (!trip) return null;

  // Empty-state guard: no zone picked yet
  if (!zoneId && !pickedVenue[trip.id]) {
    return (
      <div className="px-4 py-12 text-center">
        <BarryMascot mood="thinking" size={100} />
        <h1 className="font-display font-bold text-xl text-slate-900 mt-3">Pick a zone first</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-snug">
          Barry needs the group to agree on a zone before you vote on the venues inside it.
        </p>
        <button
          onClick={() => router.push(`/trips/${id}/map` as any)}
          className="mt-5 px-5 py-2.5 bg-barry-blue text-white font-semibold rounded-xl text-sm"
        >
          Go to map
        </button>
      </div>
    );
  }

  const lockedVenue = pickedVenue[trip.id];
  const isAdmin = trip.organizerId === currentUser?.id;
  const totalMembers = trip.participants.length;

  const handleVote = (response: VenueVoteResponse) => {
    const venue = venues[currentIdx];
    voteForVenue(id as string, venue.id, response);
    if (currentIdx + 1 >= venues.length) {
      setTimeout(() => setShowResults(true), 300);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  // Compute tally per venue
  const tallies = venues.map(v => {
    const votes = (venueVotes[id as string] || []).filter(vv => vv.venueId === v.id);
    const love = votes.filter(vv => vv.response === 'love').length;
    const meh = votes.filter(vv => vv.response === 'meh').length;
    const no = votes.filter(vv => vv.response === 'no').length;
    return { ...v, love, meh, no, score: love * 2 + meh };
  }).sort((a, b) => b.score - a.score);

  const winner = tallies[0];

  // Locked-in screen
  if (lockedVenue) {
    const w = venues.find(v => v.id === lockedVenue);
    if (!w) return null;
    return (
      <div className="px-4 py-6 pb-32">
        <div className="text-center mb-6">
          <BarryMascot mood="celebrating" size={100} />
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-3 tracking-tight">
            Venue locked
          </h1>
          <p className="text-sm text-slate-500 mt-1">The group has agreed.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mb-4">
          <div className={`h-32 bg-gradient-to-br ${VENUE_BG[w.bgIndex % VENUE_BG.length]} relative flex items-end p-4`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mr-3 shadow-md">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Picked</p>
              <p className="font-display font-bold text-2xl">{w.name}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-600 mb-2">{w.description}</p>
            <p className="text-xs text-slate-500">{w.address}</p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/trips/${id}/accommodation` as any)}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          Continue to stay
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-3">
          Next: pick a hotel, BnB, or Airbnb if you need to stay overnight.
        </p>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const allVoted = venues.every(v => myVotes.find(mv => mv.venueId === v.id));
    return (
      <div className="px-4 py-6 pb-32">
        <div className="text-center mb-5">
          <BarryMascot mood="happy" size={84} />
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-2 tracking-tight">
            {allVoted ? 'Tally' : 'In progress'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{allVoted ? 'Where the group leans' : 'Keep voting to see the full picture'}</p>
        </div>

        <div className="space-y-2 mb-4">
          {tallies.map((v, i) => (
            <div
              key={v.id}
              className={`bg-white rounded-2xl border p-3.5 ${i === 0 ? 'border-emerald-200' : 'border-slate-100'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: ['#10B981', '#F59E0B', '#94A3B8', '#94A3B8'][i] || '#94A3B8' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{v.name}</p>
                    <p className="text-[11px] text-slate-500">{v.category} · {v.address.split(',')[0]}</p>
                  </div>
                </div>
                {i === 0 && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Top</span>}
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-600 font-bold">{v.love} love</span>
                <span className="text-amber-600">{v.meh} meh</span>
                <span className="text-rose-500">{v.no} no</span>
              </div>
            </div>
          ))}
        </div>

        {isAdmin && winner && winner.score > 0 && (
          <button
            onClick={() => closeVenueVote(id as string, winner.id)}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all mb-2"
          >
            Lock in {winner.name}
          </button>
        )}
        <button
          onClick={() => { setCurrentIdx(0); setShowResults(false); }}
          className="w-full text-sm text-slate-600 font-medium py-2 hover:underline"
        >
          Re-vote
        </button>
      </div>
    );
  }

  // Voting screen
  const v = venues[currentIdx];
  return (
    <div className="px-4 py-4 pb-32">
      <div className="flex gap-1 mb-4 px-2">
        {venues.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              myVotes.find(mv => mv.venueId === venues[i].id) ? 'bg-emerald-500' :
              i === currentIdx ? 'bg-barry-blue' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-md">
        <div className={`relative h-44 bg-gradient-to-br ${VENUE_BG[v.bgIndex % VENUE_BG.length]} flex items-center justify-center`}>
          <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-white/80 px-2 py-1 rounded-full text-slate-700">
            {v.category}
          </span>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 rounded-full px-2 py-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-xs font-bold text-amber-700">{v.rating}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">{v.name}</h3>
            <div className="flex items-center gap-0.5 text-xs">
              {[1, 2, 3, 4].map(i => (
                <span key={i} className={`font-bold ${i <= v.price ? 'text-slate-900' : 'text-slate-300'}`}>EUR</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3 leading-snug">{v.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {v.tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {v.address}
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-3 mb-4">
        {currentIdx + 1} of {venues.length}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleVote('no')}
          className="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-all active:scale-95"
        >
          Pass
        </button>
        <button
          onClick={() => handleVote('meh')}
          className="py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition-all active:scale-95"
        >
          Meh
        </button>
        <button
          onClick={() => handleVote('love')}
          className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95"
        >
          Love
        </button>
      </div>
    </div>
  );
}
