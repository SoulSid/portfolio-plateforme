/** URL canonique du site. Configurée par NEXT_PUBLIC_SITE_URL, sans barre finale. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function absolute(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
