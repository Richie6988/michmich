'use client';

import React from 'react';

export interface TripStep {
  id: string;
  label: string;
  /** 'done' | 'active' | 'pending' */
  status: 'done' | 'active' | 'pending';
}

interface TripProgressProps {
  steps: TripStep[];
  /** Optional title shown above */
  title?: string;
}

/**
 * Visual trip progress bar.
 * - Big percent indicator on the left
 * - Segmented progress bar in the middle (one segment per step)
 * - Active/next step label
 * - Mobile-first responsive: stacks neatly on phones, expands on tablets+
 */
export function TripProgress({ steps, title }: TripProgressProps) {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const activeStep = steps.find(s => s.status === 'active');
  const total = steps.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isComplete = doneCount === total;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Big percent disc */}
        <div className="relative flex-shrink-0">
          <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke={isComplete ? '#10B981' : '#2563EB'}
              strokeWidth="4"
              strokeDasharray={`${(percent / 100) * 113.1} 113.1`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-[11px] font-extrabold ${isComplete ? 'text-emerald-600' : 'text-barry-blue'}`}>
              {percent}%
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title || (isComplete ? 'All set!' : 'Trip progress')}
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {isComplete ? (
              <span className="text-emerald-600">Ready to go</span>
            ) : activeStep ? (
              <>Next: <span className="text-barry-blue">{activeStep.label}</span></>
            ) : (
              <span className="text-slate-500">Getting started</span>
            )}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {doneCount} of {total} done
          </p>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="flex gap-1 mt-3">
        {steps.map(step => (
          <div
            key={step.id}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              step.status === 'done' ? 'bg-emerald-500' :
              step.status === 'active' ? 'bg-amber-400 barry-pulse' :
              'bg-slate-200 dark:bg-slate-700'
            }`}
            title={`${step.label}: ${step.status}`}
          />
        ))}
      </div>
    </div>
  );
}
