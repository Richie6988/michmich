'use client';

import React from 'react';

export interface ComparisonItem {
  id: string;
  imageUrl?: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  /** Optional metric line, e.g. "32 EUR/person" or "180 EUR / 2 nights" */
  metric?: string;
  /** Optional rating 1-5 */
  rating?: number;
  /** Selected/locked state */
  locked?: boolean;
  /** Top pick (highest score) */
  topPick?: boolean;
}

export interface ComparisonColumn {
  /** Category title shown above the 3 cards (e.g. "Restaurants", "Activities") */
  title: string;
  /** 1-3 character emoji-free icon (uses inline SVG) */
  icon: React.ReactNode;
  /** Color theme for the column */
  color: 'orange' | 'blue' | 'emerald' | 'violet';
  /** Top 3 items to display */
  items: ComparisonItem[];
  /** Click handler for an item */
  onItemClick?: (id: string) => void;
}

interface TopThreeComparisonProps {
  /** 2 or 3 columns to display side-by-side */
  columns: ComparisonColumn[];
  /** Optional label above the comparison grid */
  label?: string;
}

const COLOR_STYLES: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-900', hex: '#F97316' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-900', hex: '#2563EB' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900', hex: '#10B981' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-900', hex: '#8B5CF6' },
};

/**
 * 3-column parallel comparison layout for trip picks.
 *
 * Per req 31: shows top 3 picks side-by-side per category so users can
 * compare BEFORE making a final choice. Each column is independent.
 *
 * Layout:
 *   - 1 column on small phones (< 640px) - stacks vertically
 *   - 2 columns on tablets (640-1024px) when there are 2-3 items
 *   - 3 columns on desktop (1024px+)
 */
export function TopThreeComparison({ columns, label }: TopThreeComparisonProps) {
  const colCount = columns.length;
  const gridCols = colCount === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : colCount === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1';

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center gap-2 px-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <span className="text-[10px] text-slate-400">Top 3 picks per category</span>
        </div>
      )}
      <div className={`grid ${gridCols} gap-3`}>
        {columns.map((col, idx) => (
          <ComparisonColumnCard key={idx} column={col} />
        ))}
      </div>
    </div>
  );
}

function ComparisonColumnCard({ column }: { column: ComparisonColumn }) {
  const styles = COLOR_STYLES[column.color];
  const items = column.items.slice(0, 3);
  const padded = [...items, ...Array(Math.max(0, 3 - items.length)).fill(null)];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${styles.border} overflow-hidden flex flex-col`}>
      {/* Column header with icon + title */}
      <div className={`${styles.bg} ${styles.text} px-3 py-2 flex items-center gap-2 border-b ${styles.border}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={styles.hex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {column.icon}
        </svg>
        <p className="text-xs font-extrabold tracking-tight">{column.title}</p>
        <span className="ml-auto text-[10px] font-medium opacity-70">{items.length}</span>
      </div>

      {/* Cards stacked vertically inside the column */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
        {padded.map((item: ComparisonItem | null, i) => (
          item ? (
            <ComparisonCard
              key={item.id}
              item={item}
              rank={i + 1}
              onClick={column.onItemClick}
            />
          ) : (
            <div key={`empty-${i}`} className="px-3 py-3 flex items-center gap-2 opacity-30">
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
              </div>
              <p className="text-[11px] text-slate-400 italic">No more options</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function ComparisonCard({
  item, rank, onClick,
}: {
  item: ComparisonItem;
  rank: number;
  onClick?: (id: string) => void;
}) {
  const rankStyles: Record<number, { bg: string; text: string }> = {
    1: { bg: 'bg-amber-400', text: 'text-amber-900' },
    2: { bg: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-700 dark:text-slate-200' },
    3: { bg: 'bg-orange-300', text: 'text-orange-900' },
  };
  const r = rankStyles[rank] || rankStyles[3];

  return (
    <button
      onClick={() => onClick?.(item.id)}
      className="w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-2.5"
    >
      {/* Rank badge */}
      <div className={`w-6 h-6 rounded-full ${r.bg} ${r.text} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
        <span className="text-[10px] font-extrabold">#{rank}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">{item.title}</p>
          {item.locked && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded flex-shrink-0">Picked</span>
          )}
          {item.topPick && !item.locked && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded flex-shrink-0">Top</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug truncate">{item.subtitle}</p>
        {item.metric && (
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">{item.metric}</p>
        )}
        {item.rating !== undefined && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <svg
                key={i} width="9" height="9" viewBox="0 0 24 24"
                fill={i <= Math.round(item.rating!) ? '#F59E0B' : 'none'}
                stroke="#F59E0B" strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-0.5">{item.rating}</span>
          </div>
        )}
      </div>
    </button>
  );
}
