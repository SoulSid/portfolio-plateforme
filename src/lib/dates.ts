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
