'use client';

import React from 'react';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark, BarryLoader } from '@/components/barry/brand';

export default function ProfilePage() {
  const { currentUser } = useAppStore();
  if (!currentUser) return null;

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-barry-blue mx-auto flex items-center justify-center mb-3">
          <span className="text-white font-bold text-2xl">
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </span>
        </div>
        <h1 className="font-display font-bold text-xl text-barry-black">
          {currentUser.firstName} {currentUser.lastName}
        </h1>
        <p className="text-barry-grey text-sm">{currentUser.email}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-barry-blue text-xs font-semibold rounded-full">
          Barry Free
        </span>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Preferences de transport', value: 'Metro', icon: 'M4 11V6a4 4 0 014-4h8a4 4 0 014 4v5' },
          { label: 'Langue', value: 'Francais', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
          { label: 'Adresse par defaut', value: currentUser.homeLocation ? 'Configuree' : 'Non configuree', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' },
        ].map(item => (
          <button key={item.label} className="barry-card w-full flex items-center justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-barry-blue/5 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round">
                  <path d={item.icon} />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-barry-black">{item.label}</p>
                <p className="text-xs text-barry-grey">{item.value}</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <BarryMark size={40} />
        <p className="text-xs text-barry-grey mt-2">Barry v0.1.0 - Prototype</p>
      </div>
    </div>
  );
}
