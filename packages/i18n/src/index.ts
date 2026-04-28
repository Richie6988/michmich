import fr from './locales/fr.json';
import en from './locales/en.json';

export const resources = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

export const defaultLocale = 'fr';
export const supportedLocales = ['fr', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export { fr, en };
