export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Le français n'est pas préfixé (`/labs`), l'anglais l'est (`/en/labs`).
 * Cette fonction est la seule source de vérité pour construire une URL publique.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/en${clean === '/' ? '' : clean}`;
}

/**
 * Repli : si la traduction anglaise est vide, on affiche le français plutôt
 * qu'un blanc. Un contenu partiellement traduit reste lisible.
 */
export function pick(locale: Locale, fr: string, en: string | null | undefined): string {
  if (locale === 'en' && en && en.trim() !== '') return en;
  return fr;
}

export function pickNullable(
  locale: Locale,
  fr: string | null,
  en: string | null | undefined,
): string | null {
  if (locale === 'en' && en && en.trim() !== '') return en;
  return fr;
}
