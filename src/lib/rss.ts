import { getPublishedLabs, getPublishedProjects, getSettings } from '@/lib/queries';
import { localePath, pick, type Locale } from '@/i18n/config';
import { absolute } from '@/lib/site-url';
import { toDate } from '@/lib/dates';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Flux RSS d'une locale : labs et projets publiés, du plus récent au plus ancien. */
export async function buildFeed(locale: Locale): Promise<string> {
  const [settings, labs, projects] = await Promise.all([
    getSettings(),
    getPublishedLabs(),
    getPublishedProjects(),
  ]);

  const items = [
    ...labs.map((l) => ({
      title: pick(locale, l.title, l.titleEn),
      description: pick(locale, l.objective, l.summaryEn),
      link: absolute(localePath(locale, `/labs/${l.slug}`)),
      date: toDate(l.publishedAt),
    })),
    ...projects.map((p) => ({
      title: pick(locale, p.title, p.titleEn),
      description: pick(locale, p.summary, p.summaryEn),
      link: absolute(localePath(locale, `/projets/${p.slug}`)),
      date: toDate(p.publishedAt),
    })),
  ]
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
    .slice(0, 50);

  const title = escape(settings?.fullName ?? 'Portfolio');
  const description = escape(pick(locale, settings?.tagline ?? '', settings?.taglineEn));

  const body = items
    .map(
      (item) => `    <item>
      <title>${escape(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${escape(item.description)}</description>${
        item.date ? `\n      <pubDate>${item.date.toUTCString()}</pubDate>` : ''
      }
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${title}</title>
    <link>${absolute(localePath(locale, '/'))}</link>
    <description>${description}</description>
    <language>${locale}</language>
${body}
  </channel>
</rss>`;
}
