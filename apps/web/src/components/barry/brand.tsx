'use client';

import React from 'react';

/* ================================================================
   Barry Brand System
   Polished mascot + brand marks, inspired by Waze & Duolingo.
   Clean geometry, subtle gradients, minimal expressions.
   ================================================================ */

export type BarryMood = 'default' | 'happy' | 'thinking' | 'celebrating' | 'idle';

/**
 * Barry Mascot — Polished location-pin character.
 * Uses gradient fills, subtle shadows, and minimal expression.
 */
export function BarryMascot({
  mood = 'default',
  size = 120,
  className = '',
}: {
  mood?: BarryMood;
  size?: number;
  className?: string;
}) {
  const bounce = mood === 'idle' || mood === 'default' ? 'animate-barry-bounce' : '';

  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${bounce} ${className}`}
      role="img"
      aria-label="Barry"
    >
      <defs>
        {/* Body gradient */}
        <linearGradient id="barry-body" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        {/* Subtle highlight */}
        <radialGradient id="barry-highlight" cx="0.35" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
        {/* Shadow */}
        <radialGradient id="barry-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#1E293B" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
        </radialGradient>
        {/* Cheek glow */}
        <radialGradient id="cheek-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="210" rx="40" ry="8" fill="url(#barry-shadow)" />

      {/* Body — smooth teardrop pin */}
      <path
        d="M100 195 C100 195 68 140 58 110 C48 80 48 55 100 30 C152 55 152 80 142 110 C132 140 100 195 100 195Z"
        fill="url(#barry-body)"
      />
      {/* Highlight overlay */}
      <path
        d="M100 195 C100 195 68 140 58 110 C48 80 48 55 100 30 C152 55 152 80 142 110 C132 140 100 195 100 195Z"
        fill="url(#barry-highlight)"
      />

      {/* Face circle */}
      <circle cx="100" cy="85" r="38" fill="white" />
      <circle cx="100" cy="85" r="37" fill="white" stroke="#E2E8F0" strokeWidth="0.5" />

      {/* Eyes */}
      {mood === 'thinking' ? (
        <>
          <ellipse cx="86" cy="80" rx="4.5" ry="1.5" fill="#1E293B" />
          <ellipse cx="114" cy="80" rx="4.5" ry="1.5" fill="#1E293B" />
        </>
      ) : mood === 'celebrating' || mood === 'happy' ? (
        <>
          <path d="M81 79 Q86 73 91 79" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M109 79 Q114 73 119 79" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="86" cy="79" r="4.5" fill="#1E293B" />
          <circle cx="114" cy="79" r="4.5" fill="#1E293B" />
          {/* Eye highlights */}
          <circle cx="88" cy="77.5" r="1.5" fill="white" />
          <circle cx="116" cy="77.5" r="1.5" fill="white" />
        </>
      )}

      {/* Mouth */}
      {mood === 'celebrating' || mood === 'happy' ? (
        <path d="M89 93 Q100 105 111 93" stroke="#1E293B" strokeWidth="2" fill="#FCA5A5" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        <circle cx="105" cy="95" r="3" fill="#1E293B" opacity="0.6" />
      ) : (
        <path d="M90 93 Q100 101 110 93" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* Cheek glows */}
      <circle cx="70" cy="90" r="10" fill="url(#cheek-glow)" />
      <circle cx="130" cy="90" r="10" fill="url(#cheek-glow)" />

      {/* Arms — small, rounded, coral accent */}
      {mood === 'celebrating' ? (
        <>
          <path d="M58 110 Q45 80 40 70" stroke="#F97316" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="38" cy="68" r="5" fill="#F97316" />
          <path d="M142 110 Q155 80 160 70" stroke="#F97316" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="162" cy="68" r="5" fill="#F97316" />
        </>
      ) : (
        <>
          <path d="M60 115 Q48 105 42 100" stroke="#F97316" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="98" r="5" fill="#F97316" />
          <path d="M140 115 Q152 105 158 100" stroke="#F97316" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="160" cy="98" r="5" fill="#F97316" />
        </>
      )}

      {/* Thinking dots */}
      {mood === 'thinking' && (
        <g opacity="0.5">
          <circle cx="150" cy="55" r="4" fill="#94A3B8" className="animate-pulse" />
          <circle cx="162" cy="44" r="5.5" fill="#94A3B8" className="animate-pulse" />
          <circle cx="176" cy="32" r="7" fill="#94A3B8" className="animate-pulse" />
        </g>
      )}
    </svg>
  );
}

/**
 * Barry Brand Mark — Clean geometric location pin (no face).
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
      <circle cx="20" cy="15" r="5.5" fill="white" />
      <circle cx="18.5" cy="14.2" r="1.2" fill="#1E293B" />
      <circle cx="21.5" cy="14.2" r="1.2" fill="#1E293B" />
      <path d="M18 17.5 Q20 19.5 22 17.5" stroke="#1E293B" strokeWidth="1" fill="none" strokeLinecap="round" />
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
 * Barry Loader — Pulsing pin with label for loading states.
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
