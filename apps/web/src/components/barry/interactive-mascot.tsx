'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarryMascot } from '@/components/barry/brand';
import type { BarryMood } from '@/components/barry/brand';
import { useAppStore } from '@/stores/app-store';

const BARRY_MESSAGES = [
  "Hey! I'm Barry.",
  "Tap me when you need a hand.",
  "Thinking about your next trip?",
  "Need a fair meeting spot? That's my speciality.",
  "Don't argue. Let me sort it.",
  "I love a well-planned weekend.",
  "Coffee or croissant first?",
  "Where shall we go next?",
  "Solo or with friends? Both work.",
  "Trip math is hard. I do it for you.",
  "Did you set up your home address?",
  "Sharing the bill nicely beats arguing.",
  "I never lose a friend's location.",
  "Pin somewhere. I'll do the rest.",
];

interface InteractiveMascotProps {
  size?: number;
  defaultMood?: BarryMood;
  /** Whether to allow click-to-speak; defaults true */
  interactive?: boolean;
  className?: string;
}

export function InteractiveMascot({
  size = 120,
  defaultMood = 'happy',
  interactive = true,
  className = '',
}: InteractiveMascotProps) {
  const mascotEnabled = useAppStore(s => s.preferences?.mascotEnabled !== false);
  const [mood, setMood] = useState<BarryMood>(defaultMood);
  const [message, setMessage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Professional mode: hide the floating interactive mascot entirely
  if (!mascotEnabled) return null;

  const handleClick = () => {
    if (!interactive) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Random message + jump
    const next = BARRY_MESSAGES[Math.floor(Math.random() * BARRY_MESSAGES.length)];
    setMessage(next);
    setIsAnimating(true);

    // Cycle mood for variety
    const moods: BarryMood[] = ['happy', 'celebrating', 'thinking', 'happy'];
    setMood(moods[Math.floor(Math.random() * moods.length)]);

    // Reset after delay
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => setMessage(null), 200);
    }, 2400);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`block transition-transform ${interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'} ${
          isAnimating ? 'barry-tamagotchi-bounce' : ''
        }`}
        aria-label="Barry"
      >
        <BarryMascot mood={mood} size={size} />
      </button>

      {/* Speech bubble */}
      {message && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full bg-white rounded-2xl px-3 py-2 shadow-lg border border-slate-100 whitespace-nowrap z-10 barry-bubble-pop"
          style={{ maxWidth: '240px', whiteSpace: 'normal' }}
        >
          <p className="text-xs font-medium text-slate-800 leading-snug">{message}</p>
          {/* Tail */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-slate-100 rotate-45"
          />
        </div>
      )}

      <style jsx global>{`
        @keyframes barry-tamagotchi-bounce {
          0% { transform: scale(1) translateY(0); }
          20% { transform: scale(1.1) translateY(-8px) rotate(-3deg); }
          40% { transform: scale(0.95) translateY(2px) rotate(2deg); }
          60% { transform: scale(1.05) translateY(-4px) rotate(-1deg); }
          80% { transform: scale(0.98) translateY(1px); }
          100% { transform: scale(1) translateY(0); }
        }
        .barry-tamagotchi-bounce {
          animation: barry-tamagotchi-bounce 0.7s ease-in-out;
        }
        @keyframes barry-bubble-pop {
          0% { opacity: 0; transform: translate(-50%, calc(-100% + 8px)) scale(0.85); }
          60% { opacity: 1; transform: translate(-50%, calc(-100% - 4px)) scale(1.04); }
          100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        .barry-bubble-pop {
          animation: barry-bubble-pop 0.3s ease-out;
          transform: translate(-50%, -100%);
        }
      `}</style>
    </div>
  );
}
