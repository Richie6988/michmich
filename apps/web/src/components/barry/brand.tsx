'use client';

import React from 'react';

/* ================================================================
   Barry Brand System — Clean, professional, geometric.
   No cartoon mascot. Inspired by Citymapper, Trainline, Uber.
   ================================================================ */

/**
 * Barry Brand Mark — Clean geometric location pin.
 * For headers, nav bars, small UI elements.
 */
export function BarryMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mark-g" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M20 2C12.82 2 7 7.82 7 15c0 9.94 13 23 13 23s13-13.06 13-23c0-7.18-5.82-13-13-13z"
        fill="url(#mark-g)"
      />
      <circle cx="20" cy="15" r="5" fill="white" />
    </svg>
  );
}

/**
 * Barry Logo — Brand mark + wordmark.
 */
export function BarryLogo({
  size = 28,
  showText = true,
  className = '',
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BarryMark size={size} />
      {showText && (
        <span
          className="font-display font-extrabold tracking-tight text-barry-blue"
          style={{ fontSize: size * 0.75 }}
        >
          Barry
        </span>
      )}
    </div>
  );
}

/**
 * Barry Loader — Pulsing pin with optional label.
 */
export function BarryLoader({
  size = 48,
  label,
  className = '',
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <BarryMark size={size} className="animate-pulse" />
        <div
          className="absolute rounded-full border-2 border-barry-blue/20 animate-ping"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
      {label && <p className="text-sm text-barry-grey animate-pulse">{label}</p>}
    </div>
  );
}

/**
 * Equity indicator dot.
 */
export function EquityDot({ score, size = 8 }: { score: number; size?: number }) {
  const color = score >= 90 ? '#10B981' : score >= 75 ? '#F59E0B' : '#EF4444';
  return (
    <span
      className="inline-block rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

/**
 * Status icon.
 */
export function StatusIcon({
  status,
  size = 16,
}: {
  status: 'ready' | 'waiting' | 'active' | 'done' | 'error';
  size?: number;
}) {
  const configs = {
    ready: { color: '#10B981', path: 'M20 6L9 17l-5-5' },
    waiting: { color: '#F59E0B', path: 'M12 6v6l4 2' },
    active: { color: '#2563EB', path: 'M12 6v6l4 2' },
    done: { color: '#10B981', path: 'M20 6L9 17l-5-5' },
    error: { color: '#EF4444', path: 'M18 6L6 18M6 6l12 12' },
  };
  const c = configs[status];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={c.path} />
    </svg>
  );
}
