import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, localePath, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import {
  getProfile,
  getPublishedLabs,
  getPublishedProjects,
  getPublishedSeries,
  getSettings,
} from '@/lib/queries';
import { LabCard, ProjectCard } from '@/components/public/Cards';
import { ymd } from '@/lib/dates';

import { buildMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const loc = locale === 'en' ? 'en' : 'fr';
  const settings = await getSettings();
  return buildMetadata({
    locale: loc,
    path: '/',
    title: settings?.seoTitle || settings?.fullName || 'Portfolio',
    description: (loc === 'en' ? settings?.seoDescEn : settings?.seoDesc) || settings?.tagline || '',
    meta: settings?.location ?? '',
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const [settings, labs, projects, series, profile] = await Promise.all([
    getSettings(),
    getPublishedLabs(),
    getPublishedProjects(),
    getPublishedSeries(),
    getProfile(),
  ]);

  const latestLabs = labs.slice(0, 4);
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const shown = featured.length > 0 ? featured : projects.slice(0, 3);

  /* Les compteurs viennent de la base : jamais de chiffre écrit en dur. */
  const stats = [
    { value: labs.length, label: t(locale, 'statLabs') },
    { value: projects.length, label: t(locale, 'statProjects') },
    { value: series.length, label: t(locale, 'statSeries') },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <p className="mono-label">
          <span className="hex-index">0x00</span> · {settings?.location ?? ''}
        </p>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div>
            <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {pick(locale, settings?.tagline ?? '', settings?.taglineEn)}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={localePath(locale, '/labs')} className="accent-btn">
                {t(locale, 'heroCtaLabs')}
              </Link>
              <Link href={localePath(locale, '/projets')} className="ghost-btn">
                {t(locale, 'heroCtaProjects')}
              </Link>
            </div>
          </div>

          {latestLabs.length > 0 && (
            <aside className="panel p-4">
              <h2 className="mono-label mb-3">{t(locale, 'latestLabs')}</h2>
              <ul className="space-y-3">
                {latestLabs.slice(0, 3).map((lab) => (
                  <li key={lab.id} style={{ borderLeft: '2px solid var(--s-accent)' }}>
                    <Link
                      href={localePath(locale, `/labs/${lab.slug}`)}
                      className="block pl-3 hover:text-[var(--s-accent)]"
                    >
                      <span className="mono-label block">
                        {ymd(lab.publishedAt)}
                      </span>
                      <span className="text-sm font-medium">
                        {pick(locale, lab.title, lab.titleEn)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>

      {/* ── Compteurs ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <ul className="grid grid-cols-2 gap-px sm:grid-cols-3" style={{ background: 'var(--s-line)' }}>
          {stats.map((stat) => (
            <li key={stat.label} className="p-5" style={{ background: 'var(--s-bg)' }}>
              <p className="font-display text-3xl font-extrabold sm:text-4xl">
                {String(stat.value).padStart(2, '0')}
              </p>
              <p className="mono-label mt-1">{stat.label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Derniers labs ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x01</span>
            {t(locale, 'latestLabs')}
          </h2>
          <Link href={localePath(locale, '/labs')} className="mono-label hover:text-[var(--s-text)]">
            {t(locale, 'seeAll')} →
          </Link>
        </div>

        {latestLabs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--s-muted)' }}>
            {t(locale, 'noLabs')}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} locale={locale} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Réalisations ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x02</span>
            {t(locale, 'featuredProjects')}
          </h2>
          <Link
            href={localePath(locale, '/projets')}
            className="mono-label hover:text-[var(--s-text)]"
          >
            {t(locale, 'seeAll')} →
          </Link>
        </div>

        {shown.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--s-muted)' }}>
            {t(locale, 'noProjects')}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((project) => (
              <ProjectCard key={project.id} project={project} locale={locale} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Compétences ──────────────────────────────────────────────── */}
      {profile.skills.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
          <h2 className="font-display mb-5 text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x03</span>
            {t(locale, 'skills')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 28).map((skill) => (
              <li
                key={skill.id}
                className="mono-label rounded px-2.5 py-1"
                style={{ border: '1px solid var(--s-line)' }}
              >
                {skill.name}
              </li>
            ))}
          </ul>
          <p className="mt-5">
            <Link href={localePath(locale, '/a-propos')} className="ghost-btn">
              {t(locale, 'navAbout')}
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
