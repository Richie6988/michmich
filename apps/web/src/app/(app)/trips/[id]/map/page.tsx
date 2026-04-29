'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot } from '@/components/barry/brand';
import { BarryMap } from '@/components/map/barry-map';
import { calculateEquity, participantsToApiFormat, isEquityEngineUp } from '@/lib/api/equity-engine';
import type { EquityZone, MapMarker } from '@barry/shared-types';

const ZONE_COLORS = ['#10B981', '#F59E0B', '#94A3B8'];
const ORIGIN_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function EquityMapPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, trips, updateTripStatus } = useAppStore();
  const trip = activeTrip || trips.find(t => t.id === id);

  const [zones, setZones] = useState<EquityZone[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engineUp, setEngineUp] = useState<boolean | null>(null);
  const [calcTime, setCalcTime] = useState<number>(0);

  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const start = Date.now();

    (async () => {
      const up = await isEquityEngineUp();
      if (cancelled) return;
      setEngineUp(up);

      const participants = participantsToApiFormat(trip.participants);

      if (participants.length < 2) {
        setError('At least 2 members must set their preferences before Barry can calculate.');
        setLoading(false);
        return;
      }

      if (!up) {
        setError("Barry's calculation engine is offline.");
        setLoading(false);
        return;
      }

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
        setError(err?.message || 'Calculation error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [trip?.id]);

  const handleConfirm = () => {
    if (!trip) return;
    updateTripStatus(trip.id, 'voting');
    router.push(`/trips/${trip.id}/vote` as any);
  };

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <BarryMascot mood="thinking" size={100} />
        <p className="text-slate-500 mt-4">Trip not found</p>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <BarryMascot mood="searching" size={140} />
        <h2 className="font-display font-extrabold text-2xl mt-6 text-slate-900 tracking-tight">
          Crunching the math
        </h2>
        <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
          Scoring hundreds of points + real OSRM routes for each member
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
        <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          OSRM · Minimax · Live
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="text-center mb-5">
          <BarryMascot mood="thinking" size={100} />
          <h2 className="font-display font-bold text-xl mt-4 text-slate-900">
            Couldn't calculate
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-snug">{error}</p>
        </div>

        {engineUp === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-900 mb-2">Start the engine locally:</p>
            <pre className="text-[10px] text-amber-800 font-mono leading-relaxed bg-white/60 p-2.5 rounded overflow-x-auto">
{`cd services\\equity-engine
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --port 8000`}
            </pre>
            <p className="text-[10px] text-amber-700 mt-2">
              Or just run <code className="bg-white/80 px-1 rounded">.\start-barry.ps1</code>
            </p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-barry-blue text-white font-semibold py-3 rounded-2xl active:scale-[0.98] transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // No zones
  if (zones.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center text-center">
        <BarryMascot mood="thinking" size={120} />
        <h2 className="font-display font-bold text-xl mt-4">No fair spot found</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs leading-snug">
          The group's constraints might be too tight. Try increasing time or budget limits.
        </p>
        <button
          onClick={() => router.push(`/trips/${id}/constraints` as any)}
          className="mt-6 px-5 py-2.5 bg-barry-blue text-white font-semibold rounded-xl text-sm"
        >
          Adjust preferences
        </button>
      </div>
    );
  }

  const selected = zones[selectedIdx];

  // Build markers
  const markers: MapMarker[] = [];
  trip.participants.forEach((p, i) => {
    if (p.originLocation) {
      markers.push({
        id: `origin-${p.id}`,
        position: p.originLocation,
        type: 'origin',
        color: ORIGIN_COLORS[i % ORIGIN_COLORS.length],
        label: p.user?.firstName?.[0] || '?',
      });
    }
  });
  zones.forEach((z, i) => {
    markers.push({
      id: z.id,
      position: z.center,
      type: 'pin',
      color: ZONE_COLORS[i] || '#94A3B8',
      rank: z.rank,
      onClick: () => setSelectedIdx(i),
    });
  });

  return (
    <div className="pb-32">
      {/* Hero map */}
      <div className="relative h-72 mx-4 mt-4 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <BarryMap
          center={selected.center}
          zoom={12}
          markers={markers}
          selectedMarkerId={selected.id}
          height="100%"
        />
        {/* Live calc badge floating on map */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-700">
            Live · {(calcTime / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Result hero */}
      <div className="px-4 mt-4">
        <div className="text-center mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Barry's pick</p>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-0.5 tracking-tight">
            {selected.label || `Zone ${selected.rank}`}
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-2">
            <span className={`text-2xl font-display font-extrabold ${
              selected.equityScore >= 90 ? 'text-emerald-600' :
              selected.equityScore >= 75 ? 'text-amber-600' :
              'text-rose-500'
            }`}>
              {selected.equityScore}%
            </span>
            <span className="text-xs text-slate-500">fair to all</span>
          </div>
        </div>

        {/* Burden breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
            Effort per member
          </h3>
          <div className="space-y-2.5">
            {Object.entries(selected.burdens).map(([userId, burden]) => {
              const p = trip.participants.find(p => p.userId === userId);
              const i = trip.participants.findIndex(p => p.userId === userId);
              if (!p) return null;
              const burdenPct = Math.min((burden / selected.maxBurden) * 100, 100);
              return (
                <div key={userId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                        style={{ backgroundColor: ORIGIN_COLORS[i % ORIGIN_COLORS.length] }}
                      >
                        {p.user?.firstName?.[0]}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{p.user?.firstName}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{burden.toFixed(1)} effort</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-9">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${burdenPct}%`,
                        backgroundColor: ORIGIN_COLORS[i % ORIGIN_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
            <Stat label="Worst case" value={selected.maxBurden.toFixed(1)} />
            <Stat label="Average" value={selected.meanBurden.toFixed(1)} />
            <Stat label="Spread" value={selected.stdDevBurden.toFixed(1)} />
          </div>
        </div>

        {/* Other zones */}
        {zones.length > 1 && (
          <>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
              Alternatives
            </h3>
            <div className="space-y-2 mb-4">
              {zones.map((zone, i) => {
                if (i === selectedIdx) return null;
                return (
                  <ZoneRow
                    key={zone.id}
                    zone={zone}
                    color={ZONE_COLORS[i] || '#94A3B8'}
                    onSelect={() => setSelectedIdx(i)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-barry-blue to-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            Pick venues in {selected.label || `Zone ${selected.rank}`}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Next: vote on bars, restaurants, or activities in this zone
          </p>
        </div>
      </div>
    </div>
  );
}

function ZoneRow({ zone, color, onSelect }: { zone: EquityZone; color: string; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-3.5 active:scale-[0.99] transition-all"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
          style={{ backgroundColor: color }}
        >
          {zone.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{zone.label || `Zone ${zone.rank}`}</h4>
          <p className="text-[11px] text-slate-500">
            {zone.equityScore}% fair · max effort {zone.maxBurden.toFixed(1)}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
