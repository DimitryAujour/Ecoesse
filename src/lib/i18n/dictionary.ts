// EN/FR dictionary pipeline — Task M-04 (Quebec Bill 96).
//
// How it works, and what it deliberately does not do:
// - Dictionaries live as JSON in src/lib/i18n/locales/ so they can be
//   read by both the app and scripts/i18n-check.mjs, which fails the
//   build-time check if en and fr keys drift apart.
// - This is a cookie-based locale, not a /[locale] route move. Moving
//   every route under [locale] would have conflicted with the open
//   M-03 impact-page PR and forced a full routing refactor; the
//   dictionary + locale plumbing here is the foundation that a later
//   [locale] routing change can reuse without re-translating strings.
// - Product titles and descriptions are DATA (seed / Firestore), not
//   UI strings, so they are not translated here. Translating product
//   data is a separate data-model task.
// - Missing French keys fall back to English at runtime so the UI never
//   renders a blank string — but the parity script treats a missing key
//   as a failure, so a fallback should never ship silently.

import en from './locales/en.json';
import fr from './locales/fr.json';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = 'ecoesse-locale';

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, fr };

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fr';
}

/** Resolve a locale from a cookie value, then Accept-Language. */
export function resolveLocale(cookieValue: unknown, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if (acceptLanguage) {
    // Prefer French if it appears before English in the header, or if
    // English is absent entirely — e.g. "fr-CA,fr;q=0.9,en;q=0.8".
    const lower = acceptLanguage.toLowerCase();
    const frIndex = lower.indexOf('fr');
    const enIndex = lower.indexOf('en');
    if (frIndex !== -1 && (enIndex === -1 || frIndex < enIndex)) return 'fr';
  }
  return 'en';
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

/** Look up a dotted key ("header.cart") with English fallback. */
export function t(dict: Dictionary, path: string): string {
  const walk = (obj: unknown, key: string): unknown =>
    obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined;
  let current: unknown = dict;
  for (const part of path.split('.')) current = walk(current, part);
  if (typeof current === 'string') return current;
  let fallback: unknown = en;
  for (const part of path.split('.')) fallback = walk(fallback, part);
  return typeof fallback === 'string' ? fallback : path;
}
