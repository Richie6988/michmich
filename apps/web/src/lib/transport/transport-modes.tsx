import React from 'react';
import type { TransportMode } from '@barry/shared-types';

/**
 * Single source of truth for transport mode options, labels, colors, and
 * SVG icons. Used by setup-sheet, profile defaults, zone comparison cards.
 *
 * Keep this file the only place where transport mode visuals live so the
 * app speaks one visual language.
 */
export const TRANSPORT_OPTIONS: { value: TransportMode; label: string; icon: JSX.Element; color: string }[] = [
  { value: 'walk', label: 'Walk', color: '#10B981',
    icon: <><circle cx="12" cy="3" r="2" /><path d="M9 21l1.5-6.5L8 12V8h1.5l3-2 2 4 2 1M14 21l-2-7" /></> },
  { value: 'bike', label: 'Bike', color: '#3B82F6',
    icon: <><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="18.5" cy="17.5" r="3.5" /><path d="M15 6h3l2 4M5 17l5-9 4 9M9 5h4l2 12" /></> },
  { value: 'transit', label: 'Transit', color: '#8B5CF6',
    icon: <><rect x="4" y="3" width="16" height="16" rx="2" /><path d="M4 11h16M8 19l-2 3M16 19l2 3M8 7h.01M16 7h.01" /></> },
  { value: 'car', label: 'Car', color: '#F97316',
    icon: <><path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" /><path d="M2 13l1.5-5A2 2 0 015.5 7h13a2 2 0 011.94 1.5L22 13M2 13h20" /></> },
  { value: 'train', label: 'Train', color: '#06B6D4',
    icon: <><rect x="4" y="4" width="16" height="14" rx="2" /><path d="M4 11h16M8 18l-2 3M16 18l2 3" /></> },
  { value: 'flight', label: 'Flight', color: '#EC4899',
    icon: <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 5 19.7 3.7c-1.3-1.3-2.3-1.3-3.8.2L12.4 7.4 4.2 5.6c-.5-.1-.9 0-1.2.3L2.4 6.5c-.4.3-.4.8-.1 1.1l5.7 3.5L4.5 14H3l-1 1 4 1 1 4 1-1v-1.5l3-3.4 3.5 5.7c.3.3.8.3 1.1-.1l.6-.6c.3-.3.4-.7.3-1.2z" /> },
];

/** Quick lookup for icon by mode */
export function transportIcon(mode: TransportMode | string | undefined): JSX.Element | null {
  return TRANSPORT_OPTIONS.find(o => o.value === mode)?.icon || null;
}

/** Quick lookup for color by mode */
export function transportColor(mode: TransportMode | string | undefined): string {
  return TRANSPORT_OPTIONS.find(o => o.value === mode)?.color || '#64748B';
}
