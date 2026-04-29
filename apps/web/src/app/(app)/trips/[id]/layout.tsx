'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { formatDateLong } from '@/lib/utils/format-date';

interface Tab {
  href: string;
  label: string;
  icon: string;
  /** Phase: planning (before trip), live (during trip), after (post trip) */
  phase: 'planning' | 'live' | 'after';
}

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, trips } = useAppStore();

  useEffect(() => {
    if (id) setActiveTrip(id as string);
  }, [id, setActiveTrip]);

  const trip = activeTrip || trips.find(t => t.id === id);
  const basePath = `/trips/${id}`;

  // 8 tabs grouped by phase, in logical journey order
  const tabs: Tab[] = [
    { href: `${basePath}`, label: 'Overview', icon: 'overview', phase: 'planning' },
    { href: `${basePath}/dates`, label: 'Dates', icon: 'calendar', phase: 'planning' },
    { href: `${basePath}/constraints`, label: 'My setup', icon: 'sliders', phase: 'planning' },
    { href: `${basePath}/map`, label: 'Map', icon: 'map', phase: 'planning' },
    { href: `${basePath}/vote`, label: 'Vote', icon: 'vote', phase: 'planning' },
    { href: `${basePath}/chat`, label: 'Chat', icon: 'chat', phase: 'live' },
    { href: `${basePath}/cagnotte`, label: 'Kitty', icon: 'wallet', phase: 'live' },
    { href: `${basePath}/expenses`, label: 'Expenses', icon: 'receipt', phase: 'after' },
  ];

  // Determine current tab
  let currentTabIdx = 0;
  let bestMatchLength = 0;
  tabs.forEach((tab, i) => {
    if (tab.href === pathname) {
      currentTabIdx = i;
      bestMatchLength = tab.href.length;
    } else if (pathname.startsWith(tab.href + '/') && tab.href.length > bestMatchLength) {
      currentTabIdx = i;
      bestMatchLength = tab.href.length;
    }
  });
  // Special case: exact match for /trips/[id] (Overview)
  if (pathname === basePath) currentTabIdx = 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="px-4 py-3 max-w-lg mx-auto">
          {/* Top row: back, title, avatars */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push('/')}
              className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-base text-slate-900 truncate">
                {trip?.name || 'Trip'}
              </h1>
              {trip?.scheduledAt && (
                <p className="text-[11px] text-slate-500">
                  {formatDateLong(trip.scheduledAt)}
                </p>
              )}
            </div>
            {trip && (
              <div className="flex -space-x-1.5">
                {trip.participants.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: ['#2563EB', '#F97316', '#10B981'][i % 3], zIndex: 3 - i }}
                  >
                    {p.user?.firstName?.[0] || '?'}
                  </div>
                ))}
                {trip.participants.length > 3 && (
                  <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                    +{trip.participants.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 scrollbar-hide">
            {tabs.map((tab, i) => {
              const isActive = i === currentTabIdx;
              return (
                <Link
                  key={tab.href}
                  href={tab.href as any}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon name={tab.icon} active={isActive} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {children}
      </main>
    </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? 'white' : '#64748B';
  const paths: Record<string, JSX.Element> = {
    overview: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
    map: <><path d="M9 11.5l6 0M9 16l6 0M9 7l6 0M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16l-4-2-4 2-4-2-4 2z" /></>,
    vote: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
    wallet: <><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" /><circle cx="16" cy="14" r="1.5" /></>,
    receipt: <><path d="M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V8z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></>,
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
