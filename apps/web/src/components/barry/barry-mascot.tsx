'use client';

import React from 'react';

export type BarryPose =
  | 'friendly'
  | 'thinking'
  | 'celebrating'
  | 'pointing'
  | 'confused'
  | 'shrug';

interface BarryMascotProps {
  pose?: BarryPose;
  size?: number;
  className?: string;
  animate?: boolean;
}

export function BarryMascot({
  pose = 'friendly',
  size = 120,
  className = '',
  animate = true,
}: BarryMascotProps) {
  const animClass = animate ? 'animate-barry-bounce' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animClass} ${className}`}
      role="img"
      aria-label="Barry mascot"
    >
      {/* Shadow */}
      <ellipse cx="100" cy="185" rx="35" ry="8" fill="#E2E8F0" opacity="0.6" />

      {/* Body — location pin shape */}
      <path
        d="M100 170 L75 120 Q50 80 50 60 Q50 25 100 25 Q150 25 150 60 Q150 80 125 120 Z"
        fill="#2563EB"
        stroke="#1D4ED8"
        strokeWidth="2"
      />

      {/* Inner circle (face area) */}
      <circle cx="100" cy="70" r="35" fill="white" />

      {/* Eyes */}
      {pose === 'thinking' ? (
        <>
          <line x1="82" y1="65" x2="92" y2="65" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <line x1="108" y1="65" x2="118" y2="65" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : pose === 'celebrating' ? (
        <>
          <path d="M82 62 Q87 56 92 62" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M108 62 Q113 56 118 62" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="87" cy="63" r="5" fill="#1E293B" />
          <circle cx="113" cy="63" r="5" fill="#1E293B" />
          <circle cx="89" cy="61" r="1.5" fill="white" />
          <circle cx="115" cy="61" r="1.5" fill="white" />
        </>
      )}

      {/* Mouth */}
      {pose === 'celebrating' ? (
        <path d="M88 78 Q100 92 112 78" stroke="#1E293B" strokeWidth="2.5" fill="#FCA5A5" strokeLinecap="round" />
      ) : pose === 'confused' ? (
        <path d="M90 82 Q100 78 110 82" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M88 78 Q100 88 112 78" stroke="#1E293B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Cheeks */}
      <circle cx="75" cy="75" r="6" fill="#FECACA" opacity="0.5" />
      <circle cx="125" cy="75" r="6" fill="#FECACA" opacity="0.5" />

      {/* Arms */}
      {pose === 'celebrating' ? (
        <>
          <path d="M55 95 L35 55" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="33" cy="52" r="7" fill="#F97316" />
          <path d="M145 95 L165 55" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="167" cy="52" r="7" fill="#F97316" />
        </>
      ) : pose === 'pointing' ? (
        <>
          <path d="M55 95 L35 85" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="33" cy="83" r="7" fill="#F97316" />
          <path d="M145 95 L175 75" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="178" cy="73" r="7" fill="#F97316" />
          {/* Pointing finger */}
          <line x1="178" y1="73" x2="192" y2="65" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : pose === 'shrug' ? (
        <>
          <path d="M55 95 L40 75" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="38" cy="72" r="7" fill="#F97316" />
          <path d="M145 95 L160 75" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="162" cy="72" r="7" fill="#F97316" />
        </>
      ) : (
        <>
          <path d="M55 95 L38 85" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="36" cy="83" r="7" fill="#F97316" />
          <path d="M145 95 L162 85" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
          <circle cx="164" cy="83" r="7" fill="#F97316" />
        </>
      )}

      {/* Confetti for celebrating */}
      {pose === 'celebrating' && (
        <g className="animate-pulse">
          <circle cx="25" cy="40" r="3" fill="#F97316" />
          <circle cx="175" cy="35" r="3" fill="#10B981" />
          <rect x="40" y="25" width="4" height="4" fill="#F59E0B" transform="rotate(30 42 27)" />
          <rect x="155" y="30" width="4" height="4" fill="#2563EB" transform="rotate(-20 157 32)" />
          <circle cx="60" cy="20" r="2" fill="#EF4444" />
          <circle cx="140" cy="22" r="2" fill="#8B5CF6" />
        </g>
      )}

      {/* Question mark for confused */}
      {pose === 'confused' && (
        <text x="155" y="50" fontSize="24" fontWeight="bold" fill="#F97316">?</text>
      )}

      {/* Thinking dots */}
      {pose === 'thinking' && (
        <g>
          <circle cx="140" cy="45" r="3" fill="#94A3B8" className="animate-pulse" />
          <circle cx="152" cy="37" r="4" fill="#94A3B8" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <circle cx="166" cy="28" r="5" fill="#94A3B8" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
        </g>
      )}
    </svg>
  );
}

export function BarryLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M24 44 L14 28 Q4 16 4 10 Q4 0 24 0 Q44 0 44 10 Q44 16 34 28 Z"
        fill="#2563EB"
      />
      <circle cx="24" cy="14" r="8" fill="white" />
      <circle cx="21" cy="13" r="2" fill="#1E293B" />
      <circle cx="27" cy="13" r="2" fill="#1E293B" />
      <path d="M20 18 Q24 22 28 18" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
