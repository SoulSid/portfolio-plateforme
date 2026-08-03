import { notFound } from 'next/navigation';
import { isLocale, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getSeriesBySlug } from '@/lib/queries';
import { LabCard } from '@/components/public/Cards';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const series = await getSeriesBySlug(slug);
  if (!series) notFound();

  const total = series.labs.length;
  const withDay = series.labs.filter((l) => l.dayNumber !== null).length;
  const pct = total === 0 ? 0 : Math.round((withDay / total) * 100);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x11</span> · {t(locale, 'inSeries')}
      </p>
      <h1 className="font-display mt-2 max-w-[24ch] text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {pick(locale, series.title, series.titleEn)}
      </h1>
      <p className="mt-4 max-w-[62ch]" style={{ color: 'var(--s-muted)' }}>
        {pick(locale, series.description, series.descriptionEn)}
      </p>

      <div className="mt-8">
        <p className="mono-label mb-2">
          {t(locale, 'progress')} · {total} {t(locale, 'statLabs')}
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded"
          style={{ background: 'var(--s-line)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--s-accent)' }} />
        </div>
      </div>

      {total === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--s-muted)' }}>
          {t(locale, 'noLabs')}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.labs.map((lab) => (
            <LabCard key={lab.id} lab={lab} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  );
}
