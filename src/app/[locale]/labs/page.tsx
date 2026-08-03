import { notFound } from 'next/navigation';
import { isLocale, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getPublishedLabs, getPublishedSeries } from '@/lib/queries';
import { LabCard } from '@/components/public/Cards';
import { TagFilter } from '@/components/public/TagFilter';
import Link from 'next/link';
import { localePath } from '@/i18n/config';

export default async function LabsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const [labs, series] = await Promise.all([getPublishedLabs(), getPublishedSeries()]);

  const usedTags = [...new Map(labs.flatMap((l) => l.tags).map((tag) => [tag.slug, tag])).values()];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x10</span>
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(locale, 'navLabs')}
      </h1>

      {series.length > 0 && (
        <div className="mt-8">
          <h2 className="mono-label mb-3">{t(locale, 'inSeries')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <li key={s.id} className="panel p-4">
                <Link
                  href={localePath(locale, `/series/${s.slug}`)}
                  className="font-display font-bold hover:text-[var(--s-accent)]"
                >
                  {pick(locale, s.title, s.titleEn)}
                </Link>
                <p className="mono-label mt-1">
                  {s.labs.length} · {t(locale, 'statLabs')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {usedTags.length > 0 && (
        <div className="mt-10">
          <TagFilter
            tags={usedTags.map((tag) => ({ slug: tag.slug, name: pick(locale, tag.name, tag.nameEn) }))}
            allLabel={t(locale, 'allTags')}
            groupLabel={t(locale, 'filterByTag')}
            emptyLabel={t(locale, 'noResult')}
          />
        </div>
      )}

      {labs.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--s-muted)' }}>
          {t(locale, 'noLabs')}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <div key={lab.id} data-tags={lab.tags.map((x) => x.slug).join(',')} className="contents">
              <LabCard lab={lab} locale={locale} />
            </div>
          ))}
        </ul>
      )}
    </section>
  );
}
