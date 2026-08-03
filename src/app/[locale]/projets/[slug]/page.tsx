import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, localePath, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getProjectBySlug, incrementViews } from '@/lib/queries';
import { refCode } from '@/components/public/Cards';
import { ymd } from '@/lib/dates';

import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    locale: loc,
    path: `/projets/${project.slug}`,
    title: pick(loc, project.title, project.titleEn),
    description: pick(loc, project.summary, project.summaryEn),
    meta: project.client ?? 'PROJET',
    type: 'article',
  });
}

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const [{ locale: raw, slug }, { preview }] = await Promise.all([params, searchParams]);
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const token = process.env.PREVIEW_TOKEN;
  const isPreview = Boolean(token && preview && preview === token);

  const project = await getProjectBySlug(slug, isPreview);
  if (!project) notFound();

  if (!isPreview) await incrementViews('project', project.id);

  const period = [ymd(project.startedAt), ymd(project.finishedAt)].filter(Boolean).join(' → ');

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
        <span className="hex-index">{refCode('P', project.id)}</span>
        {project.publishedAt && (
          <span>
            {t(locale, 'publishedOn')} {ymd(project.publishedAt)}
          </span>
        )}
      </p>

      <h1 className="font-display mt-3 max-w-[22ch] text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
        {pick(locale, project.title, project.titleEn)}
      </h1>

      <p className="mt-4 max-w-[60ch] text-lg" style={{ color: 'var(--s-muted)' }}>
        {pick(locale, project.summary, project.summaryEn)}
      </p>

      <dl className="mt-8 grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: 'var(--s-line)' }}>
        {project.client && (
          <div className="p-4" style={{ background: 'var(--s-bg)' }}>
            <dt className="mono-label">{t(locale, 'client')}</dt>
            <dd className="mt-1 text-sm">{project.client}</dd>
          </div>
        )}
        {project.role && (
          <div className="p-4" style={{ background: 'var(--s-bg)' }}>
            <dt className="mono-label">{t(locale, 'role')}</dt>
            <dd className="mt-1 text-sm">{project.role}</dd>
          </div>
        )}
        {period && (
          <div className="p-4" style={{ background: 'var(--s-bg)' }}>
            <dt className="mono-label">{t(locale, 'period')}</dt>
            <dd className="mt-1 font-mono text-sm">{period}</dd>
          </div>
        )}
        {(project.repoUrl || project.demoUrl) && (
          <div className="p-4" style={{ background: 'var(--s-bg)' }}>
            <dt className="mono-label">{t(locale, 'repo')}</dt>
            <dd className="mt-1 flex flex-col gap-1 text-sm">
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--s-accent)' }}>
                  {t(locale, 'repo')} ↗
                </a>
              )}
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--s-accent)' }}>
                  {t(locale, 'demo')} ↗
                </a>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div
        className="article-body mt-10"
        dangerouslySetInnerHTML={{ __html: pick(locale, project.content, project.contentEn) }}
      />

      {project.tags.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
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
    </article>
  );
}
