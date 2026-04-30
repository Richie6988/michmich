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

export function TripProgress({ steps, title }: TripProgressProps) {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const total = steps.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title || 'Trip progress'}
        </p>
        <p className="text-xs font-bold text-slate-900">
          <span className="text-barry-blue">{doneCount}</span>
          <span className="text-slate-400"> / {total}</span>
        </p>
      </div>

      <div className="flex gap-1.5 mb-3">
        {steps.map(step => (
          <div
            key={step.id}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              step.status === 'done' ? 'bg-emerald-500' :
              step.status === 'active' ? 'bg-amber-400' :
              'bg-slate-200'
            }`}
            title={`${step.label}: ${step.status}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
              step.status === 'done' ? 'bg-emerald-50' :
              step.status === 'active' ? 'bg-amber-50' :
              'bg-slate-50'
            }`}
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              step.status === 'done' ? 'bg-emerald-500 text-white' :
              step.status === 'active' ? 'bg-amber-500 text-white' :
              'bg-slate-300 text-white'
            }`}>
              {step.status === 'done' ? (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-[8px] font-extrabold">{i + 1}</span>
              )}
            </div>
            <p className={`text-[10px] font-semibold truncate ${
              step.status === 'done' ? 'text-emerald-700' :
              step.status === 'active' ? 'text-amber-800' :
              'text-slate-500'
            }`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
