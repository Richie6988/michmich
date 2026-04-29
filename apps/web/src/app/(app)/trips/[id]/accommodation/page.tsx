'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import type { Accommodation, AccommodationType } from '@barry/shared-types';

const DEMO_ACCS: Omit<Accommodation, 'id' | 'votes' | 'selected' | 'tripId'>[] = [
  { type: 'hotel', name: 'Hotel du Petit Moulin', pricePerNight: 285, nights: 2, totalPrice: 570, rooms: 2 },
  { type: 'airbnb', name: 'Marais loft (Airbnb)', pricePerNight: 195, nights: 2, totalPrice: 390, rooms: 1 },
  { type: 'bnb', name: 'BnB Le Pavillon', pricePerNight: 145, nights: 2, totalPrice: 290, rooms: 2 },
];

const TYPE_LABEL: Record<AccommodationType, string> = {
  hotel: 'Hotel', bnb: 'BnB', airbnb: 'Airbnb', hostel: 'Hostel', other: 'Other',
};

const TYPE_COLOR: Record<AccommodationType, string> = {
  hotel: '#8B5CF6', bnb: '#10B981', airbnb: '#EF4444', hostel: '#F59E0B', other: '#64748B',
};

export default function AccommodationPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const {
    accommodations, addAccommodation, voteForAccommodation, selectAccommodation,
    activeTrip, trips, currentUser,
  } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);
  const accs = accommodations[id as string] || [];
  const [skipped, setSkipped] = useState(false);

  // Seed demo accommodations once
  useEffect(() => {
    if (!trip) return;
    if (accs.length === 0 && !skipped) {
      DEMO_ACCS.forEach(a => addAccommodation(id as string, { ...a, tripId: id as string }));
    }
  }, [trip?.id]);

  if (!trip) return null;
  const isAdmin = trip.organizerId === currentUser?.id;
  const totalMembers = trip.participants.length;
  const selectedAcc = accs.find(a => a.selected);

  const handleSkip = () => {
    setSkipped(true);
    router.push(`/trips/${id}/transport` as any);
  };

  return (
    <div className="px-4 py-4 pb-32">
      <div className="text-center mb-5">
        <BarryMascot mood="default" size={72} />
        <h1 className="font-display font-extrabold text-xl text-slate-900 mt-2 tracking-tight">
          Where will you stay?
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
          Skip this if it's a same-day meet-up.
        </p>
      </div>

      {accs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <p className="text-sm text-slate-500">Loading options...</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {accs.map((a, i) => {
            const myVote = a.votes.find(v => v.userId === currentUser?.id);
            const loves = a.votes.filter(v => v.response === 'love').length;
            const isWinner = !selectedAcc && a.votes.length > 0 &&
              a.votes.filter(v => v.response === 'love').length === Math.max(...accs.map(x => x.votes.filter(v => v.response === 'love').length));
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border p-3.5 transition-all ${
                  a.selected ? 'border-emerald-500 ring-2 ring-emerald-100' :
                  isWinner ? 'border-purple-200' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${TYPE_COLOR[a.type]}15` }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TYPE_COLOR[a.type]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21V8l9-4 9 4v13M9 21v-8h6v8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">{a.name}</h3>
                      {a.selected && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Picked</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {TYPE_LABEL[a.type]} · {a.nights} nights · {a.rooms} room{a.rooms > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-900">{a.totalPrice} EUR</p>
                    <p className="text-[10px] text-slate-500">{a.pricePerNight} / night</p>
                  </div>
                </div>

                {!selectedAcc && (
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <button
                      onClick={() => voteForAccommodation(id as string, a.id, 'no')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        myVote?.response === 'no' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => voteForAccommodation(id as string, a.id, 'meh')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        myVote?.response === 'meh' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      Meh
                    </button>
                    <button
                      onClick={() => voteForAccommodation(id as string, a.id, 'love')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        myVote?.response === 'love' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      Love
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span><strong className="text-emerald-600">{loves}</strong> love</span>
                  <span><strong className="text-amber-600">{a.votes.filter(v => v.response === 'meh').length}</strong> meh</span>
                  <span><strong className="text-rose-500">{a.votes.filter(v => v.response === 'no').length}</strong> no</span>
                  <span className="text-slate-400">· ~{Math.ceil(a.totalPrice / totalMembers)} EUR / person</span>
                </div>

                {isAdmin && !selectedAcc && a.votes.length > 0 && (
                  <button
                    onClick={() => selectAccommodation(id as string, a.id)}
                    className="w-full mt-2 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all"
                  >
                    Pick this one
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAcc ? (
        <button
          onClick={() => router.push(`/trips/${id}/transport` as any)}
          className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
        >
          Continue to transport
        </button>
      ) : (
        <button
          onClick={handleSkip}
          className="w-full bg-white border-2 border-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all"
        >
          Skip - same-day meet-up
        </button>
      )}
    </div>
  );
}
