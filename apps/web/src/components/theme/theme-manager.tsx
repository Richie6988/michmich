'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Mounts in the root layout. Watches preferences.theme and toggles
 * `.dark` class on <html>.
 *
 *   - 'light' -> never dark
 *   - 'dark'  -> always dark
 *   - 'auto'  -> follows OS prefers-color-scheme, reactively
 *
 * (Reduce-motion preference removed in Wave 25; we honor the OS-level
 *  prefers-reduced-motion media query via CSS only.)
 */
export function ThemeManager() {
  const theme = useAppStore(s => s.preferences.theme || 'auto');

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

  return null;
}
