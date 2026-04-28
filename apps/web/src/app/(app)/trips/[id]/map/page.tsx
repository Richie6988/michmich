'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { calculateEquity, participantsToApiFormat, isEquityEngineUp } from '@/lib/api/equity-engine';
import type { EquityZone, MapMarker } from '@barry/shared-types';

const COLORS = ['#10B981', '#F59E0B', '#94A3B8'];

export default function EquityMapPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, trips, updateTripStatus } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);

  const [zones, setZones] = useState<EquityZone[]>([]);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engineUp, setEngineUp] = useState<boolean | null>(null);
  const [calcTime, setCalcTime] = useState<number>(0);

  useEffect(() => {
    if (!trip) return;

    let cancelled = false;
    const start = Date.now();

    (async () => {
      // 1. Check if Equity Engine is reachable
      const up = await isEquityEngineUp();
      if (cancelled) return;
      setEngineUp(up);

      // 2. Build participants from trip
      const participants = participantsToApiFormat(trip.participants);

      if (participants.length < 2) {
        setError('At least 2 members must set their preferences.');
        setLoading(false);
        return;
      }

      if (!up) {
        setError('Le moteur d\'equite n\'est pas accessible (port 8000). Launch the Python service for real calculations OSRM.');
        setLoading(false);
        return;
      }

      // 3. Call real Equity Engine
      try {
        const result = await calculateEquity({
          tripId: trip.id,
          participants,
          searchRadiusKm: 12,
          gridResolution: 12,
        });
        if (cancelled) return;
        setZones(result.zones);
        setCalcTime(Date.now() - start);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Erreur de calcul');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trip?.id]);

  const handleConfirm = () => {
    if (!trip) return;
    updateTripStatus(trip.id, 'voting');
    router.push(`/trips/${trip.id}/vote`);
  };

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-barry-grey mt-4">Trip not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-bold text-xl mt-6 text-barry-black">
          Barry's calculating en temps reel...
        </h2>
        <p className="text-barry-grey text-sm mt-2 text-center max-w-xs">
          Analyzing hundreds of points + OSRM routes for each member
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-barry-blue animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="mt-6 text-[10px] text-barry-grey font-mono">
          Python · FastAPI · OSRM
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="text-center mb-6">
          <BarryMascot mood="thinking" size={100} />
          <h2 className="font-display font-bold text-xl mt-4 text-barry-black">
            Calculation failed
          </h2>
          <p className="text-sm text-barry-grey mt-2 max-w-sm mx-auto">{error}</p>
        </div>

        {engineUp === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-900 mb-2">How to launch the engine ?</p>
            <pre className="text-[10px] text-amber-800 font-mono leading-relaxed bg-white/50 p-2 rounded">
{`cd services\\equity-engine
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --port 8000`}
            </pre>
            <p className="text-[10px] text-amber-700 mt-2">
              Ou utilise <code>.\\start-barry.ps1</code>
            </p>
          </div>
        )}

        <button onClick={() => window.location.reload()} className="w-full bg-barry-blue text-white font-semibold py-3 rounded-xl">
          Retry
        </button>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center text-center">
        <BarryMascot mood="thinking" size={120} />
        <h2 className="font-display font-bold text-xl mt-4">No zones found</h2>
        <p className="text-sm text-barry-grey mt-2 max-w-xs">
          Les contraintes of the group sont peut-etre trop restrictives. Try increasing les budgets temps/argent.
        </p>
      </div>
    );
  }

  const selectedZone = zones[selectedZoneIdx];

  // Build markers
  const markers: MapMarker[] = [];
  // Participant origins
  trip.participants.forEach((p, i) => {
    if (p.originLocation) {
      markers.push({
        id: `origin-${p.id}`,
        position: p.originLocation,
        type: 'origin',
        color: ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5],
        label: p.user?.firstName?.[0] || '?',
      });
    }
  });
  // Equity zones
  zones.forEach((z, i) => {
    markers.push({
      id: z.id,
      position: z.center,
      type: 'pin',
      color: COLORS[i] || '#94A3B8',
      rank: z.rank,
      onClick: () => setSelectedZoneIdx(i),
    });
  });

  // Center on first zone
  const center = zones[0].center;

  return (
    <div className="px-4 py-4">
      {/* Map */}
      <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100" style={{ height: 280 }}>
        <BarryMap
          center={center}
          zoom={12}
          markers={markers}
          selectedMarkerId={selectedZone?.id}
          height="100%"
        />
      </div>

      {/* Calc info */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-800">
            Calculated in {(calcTime / 1000).toFixed(1)}s
          </span>
        </div>
        <span className="text-[10px] text-emerald-600 font-mono">OSRM · Minimax</span>
      </div>

      {/* Zone cards */}
      <div className="space-y-2 mb-4">
        {zones.map((zone, i) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            participantsMap={trip.participants}
            color={COLORS[i] || '#94A3B8'}
            selected={selectedZoneIdx === i}
            onSelect={() => setSelectedZoneIdx(i)}
          />
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
      >
        Start voting dans la zone {selectedZone?.label || zones[selectedZoneIdx].rank}
      </button>
    </div>
  );
}

function ZoneCard({
  zone, participantsMap, color, selected, onSelect,
}: {
  zone: EquityZone;
  participantsMap: any[];
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const equityColor =
    zone.equityScore >= 90 ? 'text-emerald-600 bg-emerald-50' :
    zone.equityScore >= 75 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white rounded-2xl p-3.5 border transition-all ${
        selected ? 'border-barry-blue shadow-md ring-2 ring-blue-200/50' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
            style={{ backgroundColor: color }}
          >
            {zone.rank}
          </div>
          <div>
            <h3 className="font-semibold text-barry-black">{zone.label || `Zone ${zone.rank}`}</h3>
            <p className="text-[11px] text-barry-grey font-mono">
              {zone.center.lat.toFixed(4)}, {zone.center.lng.toFixed(4)}
            </p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full ${equityColor}`}>
          <span className="text-xs font-bold">{zone.equityScore}%</span>
        </div>
      </div>

      <div className="space-y-1">
        {Object.entries(zone.burdens).map(([userId, burden]) => {
          const participant = participantsMap.find((p: any) => p.userId === userId);
          if (!participant) return null;
          return (
            <div key={userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-barry-blue/10 flex items-center justify-center text-[9px] font-bold text-barry-blue">
                  {participant.user?.firstName?.[0]}
                </div>
                <span className="text-xs text-barry-black">{participant.user?.firstName}</span>
              </div>
              <span className="text-[11px] font-semibold text-barry-grey">
                Effort: {burden.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-bold text-barry-black">{zone.maxBurden.toFixed(1)}</p>
          <p className="text-[9px] text-barry-grey uppercase">Max</p>
        </div>
        <div>
          <p className="text-sm font-bold text-barry-black">{zone.meanBurden.toFixed(1)}</p>
          <p className="text-[9px] text-barry-grey uppercase">Moyenne</p>
        </div>
        <div>
          <p className="text-sm font-bold text-barry-black">{zone.stdDevBurden.toFixed(1)}</p>
          <p className="text-[9px] text-barry-grey uppercase">Variation</p>
        </div>
      </div>
    </button>
  );
}
