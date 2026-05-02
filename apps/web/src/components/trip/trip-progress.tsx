'use client';

import React from 'react';

export interface TripStep {
  id: string;
  label: string;
  /** 'done' | 'active' | 'pending' */
  status: 'done' | 'active' | 'pending';
  /** Optional scroll target id - clicking the step scrolls there */
  targetId?: string;
}

interface TripProgressProps {
  steps: TripStep[];
  /** Optional title shown above */
  title?: string;
}

/**
 * Visual trip progress bar - sticky and always visible at top of trip page.
 * Each step is clickable and scrolls to its target section.
 *
 * - Big percent indicator on the left
 * - Step labels in the middle (each is a scroll-link)
 * - Segmented progress bar at bottom (each segment also a scroll-link)
 */
export function TripProgress({ steps, title }: TripProgressProps) {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const activeStep = steps.find(s => s.status === 'active');
  const total = steps.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isComplete = doneCount === total;

  const scrollTo = (targetId?: string) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Big percent disc - clicks to top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="relative flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Scroll to top"
        >
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
        </button>

        {/* Status text + scroll-to-active CTA */}
        <button
          onClick={() => scrollTo(activeStep?.targetId)}
          disabled={!activeStep?.targetId}
          className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity disabled:cursor-default"
        >
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
            {doneCount} of {total} done - tap a step to jump
          </p>
        </button>
      </div>

      {/* Segmented progress bar - each segment clickable */}
      <div className="flex gap-1 mt-3">
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => scrollTo(step.targetId)}
            disabled={!step.targetId}
            title={`${step.label}: ${step.status}${step.targetId ? ' - click to jump' : ''}`}
            className={`flex-1 h-2 rounded-full transition-all hover:h-2.5 disabled:cursor-default ${
              step.status === 'done' ? 'bg-emerald-500 hover:bg-emerald-600' :
              step.status === 'active' ? 'bg-amber-400 hover:bg-amber-500 barry-pulse' :
              'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Step name labels under each segment - mobile-friendly clickable */}
      <div className="flex gap-1 mt-1.5">
        {steps.map(step => (
          <button
            key={`label-${step.id}`}
            onClick={() => scrollTo(step.targetId)}
            disabled={!step.targetId}
            className={`flex-1 text-[9px] font-semibold truncate text-center hover:underline disabled:cursor-default ${
              step.status === 'done' ? 'text-emerald-700 dark:text-emerald-400' :
              step.status === 'active' ? 'text-amber-700 dark:text-amber-400' :
              'text-slate-400 dark:text-slate-500'
            }`}
            title={step.label}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
