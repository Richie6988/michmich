'use client';

import React from 'react';

// Stable color palette - matches AVATAR_COLORS used elsewhere in the app
const AVATAR_PALETTE = [
  '#2563EB', // blue
  '#F97316', // orange
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#EF4444', // rose
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F59E0B', // amber
];

/**
 * Hash a string deterministically to pick a stable color.
 * Same input always returns same color (so the same person is always the same color).
 */
function hashStringToIndex(s: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

export function colorForUser(userId?: string | null, fallbackName?: string | null): string {
  const seed = userId || fallbackName || 'unknown';
  return AVATAR_PALETTE[hashStringToIndex(seed, AVATAR_PALETTE.length)];
}

export interface AvatarProps {
  /** User to render avatar for */
  user?: { id?: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
  /** Fallback when user is not available */
  name?: string | null;
  /** Pixel size; default 32 */
  size?: number;
  /** Add white border ring (useful when stacking avatars) */
  ring?: boolean;
  /** Custom class for outer wrapper */
  className?: string;
  /** Click handler (becomes button if provided) */
  onClick?: () => void;
  /** Optional override of the seed used for color picking */
  colorSeed?: string;
}

/**
 * The single source of truth for showing a user's identity.
 *
 * Renders:
 * - profile picture if `user.avatarUrl` is set
 * - else initials on a colored disc, with color deterministically picked from user.id (or name)
 *
 * Use this EVERYWHERE you would otherwise put initials. The graphic DNA depends on it.
 */
export function Avatar({
  user, name, size = 32, ring = false, className = '', onClick, colorSeed,
}: AvatarProps) {
  const displayName = user?.firstName || name || '?';
  const initials = ((user?.firstName?.[0] || name?.[0] || '?') +
                    (user?.lastName?.[0] || '')).toUpperCase();
  const seed = colorSeed || user?.id || name || displayName;
  const color = colorForUser(seed, name);
  const fontSize = Math.max(9, Math.round(size * 0.36));
  const borderWidth = ring ? Math.max(1, Math.round(size * 0.06)) : 0;

  const Wrapper: any = onClick ? 'button' : 'div';

  if (user?.avatarUrl) {
    return (
      <Wrapper
        onClick={onClick}
        className={`inline-block flex-shrink-0 rounded-full overflow-hidden bg-slate-100 ${
          ring ? 'border-white' : ''
        } ${onClick ? 'hover:ring-2 hover:ring-blue-200 transition-all' : ''} ${className}`}
        style={{
          width: size,
          height: size,
          borderWidth: borderWidth || undefined,
          borderStyle: ring ? 'solid' : undefined,
        }}
        aria-label={displayName}
        title={displayName}
      >
        <img
          src={user.avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      onClick={onClick}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${
        ring ? 'border-white' : ''
      } ${onClick ? 'hover:ring-2 hover:ring-blue-200 transition-all' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize,
        borderWidth: borderWidth || undefined,
        borderStyle: ring ? 'solid' : undefined,
      }}
      aria-label={displayName}
      title={displayName}
    >
      {initials}
    </Wrapper>
  );
}

/**
 * Stack of avatars (overlapping). Used in trip header, list rows, etc.
 */
export function AvatarStack({
  users, max = 3, size = 28, className = '',
}: {
  users: ({ id?: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null | undefined)[];
  max?: number;
  size?: number;
  className?: string;
}) {
  const visible = users.filter(Boolean).slice(0, max) as NonNullable<(typeof users)[number]>[];
  const overflow = Math.max(0, users.length - max);
  return (
    <div className={`flex -space-x-1.5 ${className}`}>
      {visible.map((u, i) => (
        <Avatar
          key={u.id || i}
          user={u}
          size={size}
          ring={true}
          className="shadow-sm"
        />
      ))}
      {overflow > 0 && (
        <div
          className="inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold border-2 border-white shadow-sm flex-shrink-0"
          style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.34)) }}
          title={`+${overflow}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
