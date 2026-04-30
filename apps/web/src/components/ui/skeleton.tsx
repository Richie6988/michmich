import React from 'react';

/**
 * Single skeleton block — apply your own width/height via className/style.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`barry-skeleton ${className}`} style={style} />;
}

/**
 * Skeleton card matching ScrollCardList card dimensions
 * Used while venues/activities/cars load.
 */
export function SkeletonScrollCard({ width = 200 }: { width?: number }) {
  return (
    <div
      className="flex-shrink-0 rounded-2xl border border-slate-100 overflow-hidden bg-white"
      style={{ width }}
    >
      <Skeleton className="w-full h-32" style={{ borderRadius: 0 }} />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Row of skeleton scroll cards.
 */
export function SkeletonScrollCardList({ count = 3, width = 200 }: { count?: number; width?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonScrollCard key={i} width={width} />
      ))}
    </div>
  );
}

/**
 * Generic block skeleton for sections that have a title + lines.
 */
export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: `${60 + Math.random() * 35}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for the equity zones map — simulates pin chips loading.
 */
export function SkeletonZones() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="w-full h-48" />
      <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
        Barry's crunching the numbers...
      </p>
    </div>
  );
}
