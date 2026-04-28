'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

export default function NewBarryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="-ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <BarryMark size={22} />
            <span className="font-display font-bold text-barry-blue">Barry</span>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto pb-20">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BarryMascot mood="default" size={110} animate />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-barry-black tracking-tight">
            Comment je peux t'aider ?
          </h1>
          <p className="text-barry-grey text-sm mt-2 max-w-xs mx-auto">
            Decouvre ce qu'il y a autour, ou trouve le point de rencontre parfait pour ton groupe.
          </p>
        </div>

        {/* Mode cards */}
        <div className="space-y-4">
          {/* SOLO */}
          <Link href="/solo/new" className="block group">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 hover:border-barry-coral/40 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-bold text-lg text-barry-black">Pour moi</h2>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Solo</span>
                  </div>
                  <p className="text-sm text-barry-grey leading-snug">
                    Decouvre les meilleurs spots a proximite selon ton temps, ton budget et tes modes de transport.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <SoloFeatureChip icon="map" label="Multi-spots" />
                    <SoloFeatureChip icon="compare" label="Comparer" />
                    <SoloFeatureChip icon="book" label="Reserver" />
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="mt-1 group-hover:translate-x-1 group-hover:stroke-barry-coral transition-all">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* GROUP */}
          <Link href="/trips/new" className="block group">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 hover:border-barry-blue/40 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-barry-blue to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-bold text-lg text-barry-black">Avec mes amis</h2>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Groupe</span>
                  </div>
                  <p className="text-sm text-barry-grey leading-snug">
                    Invite tes amis, chacun definit ses contraintes et Barry trouve le lieu le plus equitable. Vote, chat, cagnotte inclus.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <SoloFeatureChip icon="users" label="Equite" />
                    <SoloFeatureChip icon="chat" label="Chat" />
                    <SoloFeatureChip icon="kitty" label="Cagnotte" />
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="mt-1 group-hover:translate-x-1 group-hover:stroke-barry-blue transition-all">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-barry-grey">
            Tu peux toujours changer plus tard.
          </p>
        </div>
      </main>
    </div>
  );
}

function SoloFeatureChip({ icon, label }: { icon: string; label: string }) {
  const icons: Record<string, JSX.Element> = {
    map: <path d="M9 11.5l6 0M9 16l6 0M9 7l6 0M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16l-4-2-4 2-4-2-4 2z" />,
    compare: <><path d="M9 5l7 7-7 7M3 5l7 7-7 7" /></>,
    book: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
    kitty: <><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" /><line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" /></>,
  };

  return (
    <div className="flex items-center gap-1 text-xs text-barry-grey">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icons[icon]}
      </svg>
      <span>{label}</span>
    </div>
  );
}
