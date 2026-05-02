'use client';

import React from 'react';

/* ================================================================
   Barry Brand System
   Premium mascot + brand marks.
   Inspired by Waze (friendly guide), Headspace (calm polish),
   and Duolingo (memorable character marketing).

   Barry is a sentient location pin — smart, warm, trustworthy.
   Design: smooth gradients, minimal expressive eyes, clean geometry.
   ================================================================ */

export type BarryMood = 'default' | 'happy' | 'thinking' | 'celebrating' | 'searching';

/**
 * Barry Mascot — Premium location-pin character.
 * Professional quality: layered gradients, soft shadows, refined expressions.
 *
 * Barry is core to the brand identity. Always visible.
 */
export function BarryMascot({
  mood = 'default',
  size = 120,
  className = '',
  animate = false,
}: {
  mood?: BarryMood;
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const uid = React.useId().replace(/:/g, '');
  const anim = animate ? 'animate-barry-bounce' : '';

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 120 138"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${anim} ${className}`}
      role="img"
      aria-label="Barry"
    >
      <defs>
        {/* Primary body gradient — rich blue depth */}
        <linearGradient id={`bg-${uid}`} x1="60" y1="8" x2="60" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F8EF7" />
          <stop offset="0.45" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1849B4" />
        </linearGradient>
        {/* Specular highlight on left shoulder */}
        <radialGradient id={`hl-${uid}`} cx="42" cy="38" r="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93BBFD" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
        {/* Soft ground shadow */}
        <radialGradient id={`sh-${uid}`} cx="60" cy="132" r="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" stopOpacity="0.1" />
          <stop offset="1" stopColor="#1E293B" stopOpacity="0" />
        </radialGradient>
        {/* Warm cheek glow */}
        <radialGradient id={`ck-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#FB923C" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FB923C" stopOpacity="0" />
        </radialGradient>
        {/* Face inner shadow for depth */}
        <radialGradient id={`fs-${uid}`} cx="60" cy="48" r="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.85" stopColor="#F8FAFC" />
          <stop offset="1" stopColor="#F1F5F9" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="132" rx="28" ry="5" fill={`url(#sh-${uid})`} />

      {/* === BODY — smooth teardrop pin === */}
      <path
        d="M60 118 C60 118 26 78 22 58 C18 38 28 14 60 14 C92 14 102 38 98 58 C94 78 60 118 60 118Z"
        fill={`url(#bg-${uid})`}
      />
      {/* Specular highlight layer */}
      <path
        d="M60 118 C60 118 26 78 22 58 C18 38 28 14 60 14 C92 14 102 38 98 58 C94 78 60 118 60 118Z"
        fill={`url(#hl-${uid})`}
      />
      {/* Subtle rim light on right edge */}
      <path
        d="M88 30 C96 42 98 56 94 74"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.15"
      />

      {/* === FACE AREA === */}
      <circle cx="60" cy="50" r="26" fill={`url(#fs-${uid})`} />
      <circle cx="60" cy="50" r="25.5" stroke="#E2E8F0" strokeWidth="0.5" fill="none" />

      {/* === EYES === */}
      {mood === 'thinking' ? (
        /* Thinking: one eye squinted, one open — asymmetric curiosity */
        <>
          <ellipse cx="50" cy="47" rx="3.2" ry="1.8" fill="#1E293B" />
          <circle cx="70" cy="46.5" r="3.2" fill="#1E293B" />
          <circle cx="71.2" cy="45.5" r="1" fill="white" opacity="0.9" />
        </>
      ) : mood === 'celebrating' || mood === 'happy' ? (
        /* Happy/Celebrating: arc eyes — genuine smile feel */
        <>
          <path d="M46 46.5 Q50 42 54 46.5" stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M66 46.5 Q70 42 74 46.5" stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'searching' ? (
        /* Searching: slightly narrowed, focused, looking to the right */
        <>
          <ellipse cx="51" cy="46.5" rx="3" ry="3.2" fill="#1E293B" />
          <circle cx="52.2" cy="45.5" r="1.1" fill="white" opacity="0.9" />
          <ellipse cx="71" cy="46.5" rx="3" ry="3.2" fill="#1E293B" />
          <circle cx="72.2" cy="45.5" r="1.1" fill="white" opacity="0.9" />
        </>
      ) : (
        /* Default: warm, approachable, slightly upward gaze */
        <>
          <circle cx="50" cy="46.5" r="3.2" fill="#1E293B" />
          <circle cx="51.3" cy="45.3" r="1.2" fill="white" opacity="0.95" />
          <circle cx="70" cy="46.5" r="3.2" fill="#1E293B" />
          <circle cx="71.3" cy="45.3" r="1.2" fill="white" opacity="0.95" />
        </>
      )}

      {/* Subtle eyebrow hints for thinking */}
      {mood === 'thinking' && (
        <>
          <path d="M46 40 Q50 38 54 40" stroke="#334155" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
          <path d="M66 41 Q70 39 74 41.5" stroke="#334155" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.4" />
        </>
      )}

      {/* === MOUTH === */}
      {mood === 'celebrating' ? (
        /* Wide open smile */
        <path d="M52 56 Q60 64 68 56" stroke="#1E293B" strokeWidth="1.8" fill="#FEE2E2" strokeLinecap="round" />
      ) : mood === 'happy' ? (
        /* Gentle satisfied smile */
        <path d="M53 55.5 Q60 61 67 55.5" stroke="#1E293B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : mood === 'thinking' ? (
        /* Small pursed thought */
        <ellipse cx="62" cy="57" rx="2.5" ry="2" fill="#CBD5E1" />
      ) : mood === 'searching' ? (
        /* Slightly open, focused */
        <path d="M55 56 Q60 58.5 65 56" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        /* Default: friendly, approachable curve */
        <path d="M53 55 Q60 60.5 67 55" stroke="#1E293B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}

      {/* === CHEEK WARMTH === */}
      <circle cx="39" cy="54" r="7" fill={`url(#ck-${uid})`} />
      <circle cx="81" cy="54" r="7" fill={`url(#ck-${uid})`} />

      {/* === THINKING INDICATOR — floating dots === */}
      {mood === 'thinking' && (
        <g opacity="0.45">
          <circle cx="90" cy="28" r="2.5" fill="#64748B">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="97" cy="20" r="3.5" fill="#64748B">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="106" cy="12" r="4.5" fill="#64748B">
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* === CELEBRATION — subtle confetti sparks === */}
      {mood === 'celebrating' && (
        <g>
          <circle cx="30" cy="18" r="2" fill="#F97316" opacity="0.7">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="92" cy="12" r="1.8" fill="#10B981" opacity="0.7">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
          </circle>
          <rect x="18" y="28" width="3" height="3" rx="0.5" fill="#F59E0B" opacity="0.6" transform="rotate(25 19.5 29.5)">
            <animate attributeName="opacity" values="0;0.7;0" dur="1.4s" begin="0.4s" repeatCount="indefinite" />
          </rect>
          <rect x="100" y="24" width="3" height="3" rx="0.5" fill="#8B5CF6" opacity="0.6" transform="rotate(-20 101.5 25.5)">
            <animate attributeName="opacity" values="0;0.7;0" dur="1.4s" begin="0.6s" repeatCount="indefinite" />
          </rect>
          <circle cx="24" cy="8" r="1.5" fill="#2563EB" opacity="0.5">
            <animate attributeName="opacity" values="0;0.6;0" dur="1s" begin="0.1s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* === SEARCH PULSE — radar ring === */}
      {mood === 'searching' && (
        <circle cx="60" cy="50" r="30" stroke="#2563EB" strokeWidth="1.5" fill="none" opacity="0.2">
          <animate attributeName="r" values="28;42;28" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

/**
 * Barry Brand Mark — Minimal pin icon for headers, favicons, small UI.
 * Clean silhouette with subtle inner circle. No face at small sizes.
 */
export function BarryMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`bm-${uid}`} x1="16" y1="1" x2="16" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <path
        d="M16 1C10.2 1 5.5 5.7 5.5 11.5c0 7.95 10.5 19.5 10.5 19.5s10.5-11.55 10.5-19.5C26.5 5.7 21.8 1 16 1z"
        fill={`url(#bm-${uid})`}
      />
      <circle cx="16" cy="11.5" r="4.5" fill="white" opacity="0.95" />
    </svg>
  );
}

/**
 * Barry Logo — Mark + wordmark combo.
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
          style={{ fontSize: size * 0.78 }}
        >
          Barry
        </span>
      )}
    </div>
  );
}

/**
 * Barry Loader — Searching-mood pin with pulsing ring + label.
 */
export function BarryLoader({
  size = 56,
  label,
  className = '',
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <BarryMascot mood="searching" size={size} />
      {label && <p className="text-sm font-medium text-barry-grey">{label}</p>}
    </div>
  );
}

/**
 * Equity score dot — color-coded indicator.
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
 * Status icon — checkmark, clock, or error.
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
