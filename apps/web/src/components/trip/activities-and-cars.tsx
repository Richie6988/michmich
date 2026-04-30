'use client';

import React, { useState } from 'react';
import { ScrollCardList } from './scroll-card-list';
import { activitiesForMode, findActivityById, CAR_RENTAL_CATALOG, findCarRentalById, type ActivityOpt, type CarRentalOpt } from '@/lib/data/activities';

// ============================================================
// ACTIVITIES horizontal scroll - for both wanderlust and trip
// ============================================================
interface ActivitiesSectionProps {
  tripId: string;
  mode: 'wanderlust' | 'trip';
}

export function ActivitiesSection({ tripId, mode }: ActivitiesSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const activities = activitiesForMode(mode);
  const opened = openId ? findActivityById(openId) : null;

  return (
    <>
      <ScrollCardList
        items={activities.map(a => ({
          id: a.id,
          imageUrl: a.imageUrl,
          title: a.name,
          subtitle: `${a.category} · ${a.duration} · ${a.pricePerPerson}EUR · ${a.rating}`,
        }))}
        onCardClick={setOpenId}
        cardWidth={210}
      />

      {/* Activity detail popup */}
      {opened && (
        <ActivityPopup activity={opened} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function ActivityPopup({ activity, onClose }: { activity: ActivityOpt; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll"
      >
        <div
          className="relative h-56 bg-slate-200 bg-cover bg-center"
          style={{ backgroundImage: `url('${activity.imageUrl}')` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">{activity.name}</h2>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#F59E0B">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-bold text-amber-700">{activity.rating.toFixed(1)}</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-3 capitalize">
            {activity.category} · {activity.duration} · {activity.pricePerPerson} EUR/person
          </p>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">{activity.description}</p>
          <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" className="flex-shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p className="text-xs text-slate-700">{activity.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CAR RENTAL horizontal scroll - trip mode only
// ============================================================
interface CarRentalSectionProps {
  tripId: string;
}

export function CarRentalSection({ tripId }: CarRentalSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = openId ? findCarRentalById(openId) : null;

  return (
    <>
      <ScrollCardList
        items={CAR_RENTAL_CATALOG.map(c => ({
          id: c.id,
          imageUrl: c.imageUrl,
          title: `${c.brand} ${c.carModel}`,
          subtitle: `${c.category} · ${c.seats} seats · ${c.pricePerDay}EUR/day · ${c.rating}`,
        }))}
        onCardClick={setOpenId}
        cardWidth={220}
      />

      {opened && (
        <CarRentalPopup car={opened} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function CarRentalPopup({ car, onClose }: { car: CarRentalOpt; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl max-h-[92vh] overflow-y-auto barry-scroll"
      >
        <div
          className="relative h-52 bg-slate-200 bg-cover bg-center"
          style={{ backgroundImage: `url('${car.imageUrl}')` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{car.brand}</p>
          <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight mb-2">{car.carModel}</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">{car.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Spec label="Seats" value={`${car.seats}`} />
            <Spec label="Transmission" value={car.transmission} />
            <Spec label="Fuel" value={car.fuel} />
            <Spec label="Category" value={car.category} />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" className="flex-shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pickup</p>
              <p className="text-xs text-slate-700">{car.pickupLocation}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-barry-blue rounded-xl px-4 py-3 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">From</p>
              <p className="text-xl font-extrabold">{car.pricePerDay} EUR<span className="text-xs font-medium opacity-80">/day</span></p>
            </div>
            <div className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-sm font-bold">{car.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 capitalize">{value}</p>
    </div>
  );
}
