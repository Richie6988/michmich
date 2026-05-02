'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarryMark } from '@/components/barry/brand';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="-ml-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-700 dark:text-slate-200" aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
}
