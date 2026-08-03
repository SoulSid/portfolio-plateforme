import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, localePath, pick, pickNullable, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getLabBySlug, incrementViews } from '@/lib/queries';
import { refCode } from '@/components/public/Cards';
import { ymd } from '@/lib/dates';

import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const lab = await getLabBySlug(slug);
  if (!lab) return {};
  return buildMetadata({
    locale: loc,
    path: `/labs/${lab.slug}`,
    title: pick(loc, lab.title, lab.titleEn),
    description: pick(loc, lab.objective, lab.summaryEn),
    meta: lab.dayNumber ? `JOUR ${lab.dayNumber}` : 'LAB',
    type: 'article',
  });
}

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function LabPage({ params, searchParams }: Props) {
  const [{ locale: raw, slug }, { preview }] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  /* Le brouillon n'est visible qu'avec le jeton exact — jamais deviné. */
  const token = process.env.PREVIEW_TOKEN;
  const isPreview = Boolean(token && preview && preview === token);

  const lab = await getLabBySlug(slug, isPreview);
  if (!lab) notFound();

  if (!isPreview) await incrementViews('lab', lab.id);

  const siblings = lab.series?.labs ?? [];
  const index = siblings.findIndex((s) => s.slug === lab.slug);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const takeaway = pickNullable(locale, lab.takeaway, lab.takeawayEn);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {isPreview && (
        <p
          className="mono-label mb-6 rounded px-3 py-2"
          style={{ background: 'var(--s-accent)', color: 'var(--s-accent-ink)' }}
        >
          {t(locale, 'previewBanner')}
        </p>
      )}

      <p className="mono-label flex flex-wrap gap-x-3">
        <span className="hex-index">{refCode('R', lab.id)}</span>
        {lab.publishedAt && (
          <span>
            {t(locale, 'publishedOn')}{' '}
            {ymd(lab.publishedAt)}
          </span>
        )}
        {lab.dayNumber !== null && (
          <span>
            {t(locale, 'day')} {lab.dayNumber}
          </span>
        )}
        {lab.durationHours !== null && (
          <span>
            {lab.durationHours} {t(locale, 'hours')}
          </span>
        )}
        {lab.difficulty !== null && (
          <span>
            {t(locale, 'difficulty')} {lab.difficulty}/5
          </span>
        )}
      </p>

      <h1 className="font-display mt-3 max-w-[22ch] text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
        {pick(locale, lab.title, lab.titleEn)}
      </h1>

      {lab.series && (
        <p className="mono-label mt-3">
          {t(locale, 'inSeries')} ·{' '}
          <Link
            href={localePath(locale, `/series/${lab.series.slug}`)}
            className="hover:text-[var(--s-accent)]"
            style={{ color: 'var(--s-accent)' }}
          >
            {pick(locale, lab.series.title, lab.series.titleEn)}
          </Link>
        </p>
      )}

      <div className="panel mt-6 p-4">
        <p className="mono-label mb-1">{t(locale, 'objective')}</p>
        <p className="text-[0.9375rem]">{pick(locale, lab.objective, lab.summaryEn)}</p>
      </div>

      <div
        className="article-body mt-10"
        dangerouslySetInnerHTML={{ __html: pick(locale, lab.content, lab.contentEn) }}
      />

      {takeaway && (
        <aside
          className="mt-10 max-w-[68ch] rounded-lg p-5"
          style={{ background: 'var(--s-panel-2)', borderLeft: '3px solid var(--s-accent)' }}
        >
          <p className="mono-label mb-2">{t(locale, 'takeaway')}</p>
          <p className="text-[0.9375rem]">{takeaway}</p>
        </aside>
      )}

      {lab.tags.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2">
          {lab.tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={localePath(locale, `/tags/${tag.slug}`)}
                className="mono-label rounded-full px-3 py-1"
                style={{ border: '1px solid var(--s-line)' }}
              >
                {pick(locale, tag.name, tag.nameEn)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(previous || next) && (
        <nav
          className="mt-12 flex flex-wrap justify-between gap-4 pt-6"
          style={{ borderTop: '1px solid var(--s-line)' }}
          aria-label={t(locale, 'inSeries')}
        >
          {previous ? (
            <Link href={localePath(locale, `/labs/${previous.slug}`)} className="max-w-[45%]">
              <span className="mono-label block">← {t(locale, 'previousLab')}</span>
              <span className="text-sm hover:text-[var(--s-accent)]">
                {pick(locale, previous.title, previous.titleEn)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={localePath(locale, `/labs/${next.slug}`)}
              className="max-w-[45%] text-right"
            >
              <span className="mono-label block">{t(locale, 'nextLab')} →</span>
              <span className="text-sm hover:text-[var(--s-accent)]">
                {pick(locale, next.title, next.titleEn)}
              </span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
