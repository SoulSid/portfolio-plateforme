import type { MetadataRoute } from 'next';
import { getPublishedLabs, getPublishedProjects, getPublishedSeries, getTags } from '@/lib/queries';
import { LOCALES, localePath } from '@/i18n/config';
import { absolute } from '@/lib/site-url';
import { toDate } from '@/lib/dates';

/** Sitemap généré depuis la base : il ne peut pas contenir de page fantôme. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [labs, projects, series, tags] = await Promise.all([
    getPublishedLabs(),
    getPublishedProjects(),
    getPublishedSeries(),
    getTags(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  const push = (path: string, lastModified?: Date | null, priority = 0.6) => {
    for (const locale of LOCALES) {
      entries.push({
        url: absolute(localePath(locale, path)),
        lastModified: lastModified ?? undefined,
        priority,
      });
    }
  };

  push('/', undefined, 1);
  push('/labs', undefined, 0.9);
  push('/projets', undefined, 0.9);
  push('/a-propos', undefined, 0.7);
  push('/contact', undefined, 0.5);

  for (const lab of labs) push(`/labs/${lab.slug}`, toDate(lab.updatedAt), 0.8);
  for (const project of projects) push(`/projets/${project.slug}`, toDate(project.updatedAt), 0.8);
  for (const s of series) push(`/series/${s.slug}`, undefined, 0.7);

  /* Seuls les tags réellement portés par du contenu publié. */
  const used = new Set([
    ...labs.flatMap((l) => l.tags.map((x) => x.slug)),
    ...projects.flatMap((p) => p.tags.map((x) => x.slug)),
  ]);
  for (const tag of tags.filter((x) => used.has(x.slug))) push(`/tags/${tag.slug}`, undefined, 0.4);

  return entries;
}
