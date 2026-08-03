/**
 * Slug d'URL : minuscules, sans accent, tirets.
 * Utilisé côté client (génération automatique depuis le titre) et côté serveur
 * (normalisation avant écriture) — d'où l'absence de dépendance.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Rend un slug unique en suffixant -2, -3… si nécessaire.
 * `taken` contient les slugs déjà utilisés par d'autres entrées.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const slug = slugify(base) || 'sans-titre';
  if (!taken.has(slug)) return slug;

  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}
