/**
 * Formatage de dates tolérant au passage par le cache.
 *
 * `unstable_cache` sérialise ce qu'il stocke : une colonne DateTime revient
 * sous forme de chaîne ISO, pas d'objet Date — alors que le type Prisma
 * annonce toujours `Date`. Appeler `.toISOString()` dessus lève une erreur en
 * production sans que TypeScript n'ait rien signalé. Ces fonctions acceptent
 * donc les deux formes.
 */
export type DateLike = Date | string | null | undefined;

export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 2026.08.03 — format court, aligné sur la maquette. */
export function ymd(value: DateLike): string {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10).replace(/-/g, '.') : '';
}

/** 2026-08-03 — format ISO, pour les attributs datetime et les sitemaps. */
export function iso(value: DateLike): string {
  const date = toDate(value);
  return date ? date.toISOString() : '';
}

export function year(value: DateLike): string {
  const date = toDate(value);
  return date ? String(date.getUTCFullYear()) : '';
}

/**
 * « Septembre 2026 » / « September 2026 » — format des expériences, comme
 * sur le CV. Calculé en UTC : les dates sont saisies au premier du mois.
 */
export function monthYear(value: DateLike, locale: 'fr' | 'en'): string {
  const date = toDate(value);
  if (!date) return '';
  const text = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
