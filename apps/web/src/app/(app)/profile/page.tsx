'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark } from '@/components/barry/brand';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser } = useAppStore();
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-barry-canvas">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <button onClick={() => router.push('/')} className="-ml-2 p-2 hover:bg-gray-100 rounded-full">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round">
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

      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-barry-blue to-blue-700 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-2xl">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </span>
          </div>
          <h1 className="font-display font-bold text-xl text-barry-black">
            {currentUser.firstName} {currentUser.lastName}
          </h1>
          <p className="text-barry-grey text-sm">{currentUser.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-barry-blue text-xs font-semibold rounded-full">
            Free plan
          </span>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Default transport', value: 'Public transit' },
            { label: 'Language', value: 'English' },
            { label: 'Home address', value: currentUser.homeLocation ? 'Set' : 'Not set' },
            { label: 'Notifications', value: 'On' },
          ].map(item => (
            <button key={item.label} className="bg-white rounded-2xl p-4 border border-gray-100 w-full flex items-center justify-between hover:shadow-sm transition-shadow">
              <div className="text-left">
                <p className="text-sm font-medium text-barry-black">{item.label}</p>
                <p className="text-xs text-barry-grey">{item.value}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-br from-barry-blue to-blue-700 rounded-2xl p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100 mb-1">Coming soon</p>
          <p className="font-display font-bold text-lg mb-1">Barry Pro</p>
          <p className="text-xs text-blue-100 leading-snug">
            Unlimited groups, premium booking integrations, group expense tracking. EUR 4.99 / month.
          </p>
        </div>

        <div className="mt-6 text-center">
          <BarryMascot mood="default" size={56} />
          <p className="text-[10px] text-barry-grey mt-2">Barry v0.1 - prototype</p>
        </div>
      </main>
    </div>
  );
}
