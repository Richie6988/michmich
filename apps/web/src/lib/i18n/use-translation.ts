'use client';

import { useAppStore } from '@/stores/app-store';
import { resources, defaultLocale, type SupportedLocale } from '@barry/i18n';

/**
 * Light client-side i18n hook (CRITICAL_REVIEW B.3 - Real i18n).
 *
 * Reads preferences.language from the store, falls back to defaultLocale ('en').
 * Returns a t(key) function that resolves dot-paths against the loaded JSON
 * catalogs, falls back to the key itself if not found.
 *
 * Usage:
 *   const { t, locale } = useTranslation();
 *   <h1>{t('auth.login')}</h1>
 *
 * Supported locales: 'en', 'fr'. The 20-language selector in profile stores
 * the preference, but only en/fr have catalogs - others fall back to en.
 */

type Catalog = typeof resources['en']['translation'];

function getNested(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function useTranslation() {
  // Subscribe to language changes - re-renders when user picks a new locale
  const language = useAppStore(s => s.preferences?.language || 'en');

  // Map the 20-language selector to our 2 actual catalogs
  const supportedLocale: SupportedLocale = (() => {
    if (language === 'fr') return 'fr';
    return 'en'; // default for everything else (es, de, it, pt, etc fall back)
  })();

  const catalog = (resources[supportedLocale]?.translation || resources[defaultLocale].translation) as Catalog;
  const fallback = resources[defaultLocale].translation as Catalog;

  /**
   * Translate a dot-path key. Falls through:
   *   1. Current locale catalog
   *   2. Default locale (en) catalog
   *   3. The key itself (so missing strings are obvious)
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = getNested(catalog, key) || getNested(fallback, key) || key;
    // Interpolation: support both {var} and {{var}} (i18next compat)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value
          .replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
          .replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return value;
  };

  return { t, locale: supportedLocale, language };
}
