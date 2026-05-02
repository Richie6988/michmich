'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Mounts in the root layout. Watches preferences.theme + reduceMotion and
 * toggles classes on <html>:
 *   - .dark for dark theme
 *   - .barry-reduce-motion for force-disabled animations
 *
 * Theme:
 *   - 'light' -> never dark
 *   - 'dark'  -> always dark
 *   - 'auto'  -> follows OS prefers-color-scheme, reactively
 *
 * Reduce motion:
 *   - The CSS `@media (prefers-reduced-motion: reduce)` already disables
 *     animations when the OS setting is on. The .barry-reduce-motion class
 *     lets users opt-in EVEN IF their OS doesn't have the setting on.
 */
export function ThemeManager() {
  const theme = useAppStore(s => s.preferences.theme || 'auto');
  const reduceMotion = useAppStore(s => !!s.preferences.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'auto' &&
         typeof window !== 'undefined' &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
    };
    apply();

    if (theme === 'auto' && typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      if (mql.addEventListener) mql.addEventListener('change', handler);
      else (mql as any).addListener(handler);
      return () => {
        if (mql.removeEventListener) mql.removeEventListener('change', handler);
        else (mql as any).removeListener(handler);
      };
    }
  }, [theme]);

  // Reduce motion class
  useEffect(() => {
    document.documentElement.classList.toggle('barry-reduce-motion', reduceMotion);
  }, [reduceMotion]);

  return null;
}
