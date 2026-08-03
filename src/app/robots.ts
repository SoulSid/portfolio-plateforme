import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* L'administration et les aperçus de brouillon ne s'indexent pas. */
      disallow: ['/admin', '/api'],
    },
    sitemap: absolute('/sitemap.xml'),
  };
}
