'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { BarryMark, BarryLoader } from '@/components/barry/brand';
import type { Trip } from '@barry/shared-types';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  draft: { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Brouillon' },
  inviting: { color: 'text-barry-blue', bg: 'bg-blue-50', label: 'Invitations' },
  constraints: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Contraintes' },
  calculating: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Calcul...' },
  voting: { color: 'text-barry-coral', bg: 'bg-orange-50', label: 'Vote en cours' },
  booked: { color: 'text-barry-green', bg: 'bg-emerald-50', label: 'Reserve' },
  completed: { color: 'text-gray-500', bg: 'bg-gray-50', label: 'Termine' },
  cancelled: { color: 'text-red-500', bg: 'bg-red-50', label: 'Annule' },
};

const TYPE_ICONS: Record<string, string> = {
  dinner: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  weekend: 'M21 10H3M16 2v4M8 2v4M3 6h18v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
  evg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  family: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
  corporate: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  custom: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
};

function TripCard({ trip }: { trip: Trip }) {
  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;
  const participantCount = trip.participants.length;
  const constraintsSet = trip.participants.filter(p => p.status === 'constraints_set' || p.status === 'voted').length;
  const scheduledDate = trip.scheduledAt
    ? new Date(trip.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  // Determine where to link based on trip status
  const getHref = () => {
    switch (trip.status) {
      case 'draft':
      case 'inviting': return `/trips/${trip.id}`;
      case 'constraints': return `/trips/${trip.id}/constraints`;
      case 'calculating': return `/trips/${trip.id}/map`;
      case 'voting': return `/trips/${trip.id}/vote`;
      case 'booked':
      case 'completed': return `/trips/${trip.id}/itinerary`;
      default: return `/trips/${trip.id}`;
    }
  };

  return (
    <Link href={getHref()} className="block">
      <div className="barry-card hover:shadow-md transition-all duration-200 active:scale-[0.98]">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className="w-12 h-12 rounded-2xl bg-barry-blue/5 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5">
              <path d={TYPE_ICONS[trip.tripType] || TYPE_ICONS.custom} />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-barry-black truncate">{trip.name}</h3>
              <span className={`${status.bg} ${status.color} text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap`}>
                {status.label}
              </span>
            </div>

            {scheduledDate && (
              <p className="text-sm text-barry-grey mb-2">{scheduledDate}</p>
            )}

            {/* Participant avatars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {trip.participants.slice(0, 5).map((p, i) => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5],
                        zIndex: 5 - i,
                      }}
                    >
                      {p.user?.firstName?.[0] || '?'}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-barry-grey ml-2">
                  {participantCount} participant{participantCount > 1 ? 's' : ''}
                </span>
              </div>

              {trip.status === 'constraints' && (
                <span className="text-[11px] text-amber-600">
                  {constraintsSet}/{participantCount} prets
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stealth badge */}
        {trip.stealthMode && (
          <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-xs text-purple-700 font-medium">Mode surprise active</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <BarryMark size={40} />
      <h3 className="font-display font-bold text-xl text-barry-black mt-6 mb-2">
        Aucune sortie en cours
      </h3>
      <p className="text-barry-grey text-sm mb-8 max-w-xs">
        Cree ta premiere sortie et Barry trouvera le point de rencontre le plus equitable pour ton groupe !
      </p>
      <Link href="/trips/new" className="btn-primary flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
          <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Creer un Barry
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { trips, currentUser } = useAppStore();

  const activeTrips = trips.filter(t => !['completed', 'cancelled'].includes(t.status));
  const pastTrips = trips.filter(t => ['completed', 'cancelled'].includes(t.status));

  return (
    <div className="px-4 py-6">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-barry-black">
            Salut {currentUser?.firstName} !
          </h1>
          <p className="text-barry-grey text-sm mt-0.5">
            {activeTrips.length > 0
              ? `${activeTrips.length} sortie${activeTrips.length > 1 ? 's' : ''} en cours`
              : 'Pret pour une nouvelle aventure ?'
            }
          </p>
        </div>
        <div className="w-11 h-11 rounded-full bg-barry-blue flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
          </span>
        </div>
      </div>

      {/* Active trips */}
      {activeTrips.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-barry-grey uppercase tracking-wider px-1">
            Sorties en cours
          </h2>
          {activeTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Past trips */}
      {pastTrips.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-xs font-semibold text-barry-grey uppercase tracking-wider px-1">
            Sorties passees
          </h2>
          {pastTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* FAB — New Trip */}
      {activeTrips.length > 0 && (
        <Link
          href="/trips/new"
          className="fixed bottom-20 right-4 w-14 h-14 bg-barry-coral rounded-2xl shadow-lg flex items-center justify-center active:scale-90 transition-transform z-40 hover:shadow-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
