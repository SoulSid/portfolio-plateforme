import type { Metadata } from 'next';
import { LOCALES, localePath, pick, type Locale } from '@/i18n/config';
import { absolute } from '@/lib/site-url';

/**
 * Fabrique les métadonnées d'une page publique : canonique, alternates
 * hreflang réciproques, Open Graph et Twitter Card avec image générée.
 */
export function buildMetadata({
  locale,
  path,
  title,
  description,
  meta,
  type = 'website',
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  meta?: string;
  type?: 'website' | 'article';
}): Metadata {
  const canonical = absolute(localePath(locale, path));

  const languages: Record<string, string> = {};
  for (const code of LOCALES) languages[code] = absolute(localePath(code, path));
  languages['x-default'] = absolute(localePath('fr', path));

  const ogImage = absolute(
    `/og?title=${encodeURIComponent(title)}&meta=${encodeURIComponent(meta ?? '')}`,
  );

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type,
      title,
      description,
      url: canonical,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export { pick };
