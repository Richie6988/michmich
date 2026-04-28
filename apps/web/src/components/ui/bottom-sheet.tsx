'use client';

import React, { useState, useRef } from 'react';

export interface BottomSheetProps {
  children: React.ReactNode;
  /** Snap points as percentages of screen height: [collapsed, mid, expanded] */
  snapPoints?: [number, number, number];
  initialSnap?: 0 | 1 | 2;
  className?: string;
}

export function BottomSheet({
  children,
  snapPoints = [0.18, 0.55, 0.92],
  initialSnap = 1,
  className = '',
}: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState<number>(initialSnap);
  const dragStart = useRef<number | null>(null);
  const dragOffset = useRef(0);
  const [, force] = useState(0);

  const heightPct = snapPoints[snapIndex] * 100;

  const handleStart = (clientY: number) => {
    dragStart.current = clientY;
  };

  const handleMove = (clientY: number) => {
    if (dragStart.current === null) return;
    dragOffset.current = clientY - dragStart.current;
    force(n => n + 1);
  };

  const handleEnd = () => {
    if (dragStart.current === null) return;
    const offset = dragOffset.current;
    // Threshold: ~50px to switch snap
    if (offset < -40 && snapIndex < 2) setSnapIndex(snapIndex + 1);
    else if (offset > 40 && snapIndex > 0) setSnapIndex(snapIndex - 1);
    dragStart.current = null;
    dragOffset.current = 0;
    force(n => n + 1);
  };

  const visualOffset = dragStart.current !== null ? dragOffset.current : 0;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${className}`}
      style={{
        height: `${heightPct}%`,
        transform: `translateY(${visualOffset}px)`,
        transition: dragStart.current !== null ? 'none' : 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        maxWidth: '32rem',
        margin: '0 auto',
      }}
    >
      {/* Drag handle */}
      <div
        className="w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => dragStart.current !== null && handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={() => dragStart.current !== null && handleEnd()}
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-full pb-24 px-4">
        {children}
      </div>
    </div>
  );
}
