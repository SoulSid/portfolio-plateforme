import { notFound } from 'next/navigation';
import { isLocale, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getPublishedLabs, getPublishedProjects, getTags } from '@/lib/queries';
import { LabCard, ProjectCard } from '@/components/public/Cards';

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const [tags, labs, projects] = await Promise.all([
    getTags(),
    getPublishedLabs(),
    getPublishedProjects(),
  ]);

  const tag = tags.find((x) => x.slug === slug);
  if (!tag) notFound();

  const taggedLabs = labs.filter((l) => l.tags.some((x) => x.slug === slug));
  const taggedProjects = projects.filter((p) => p.tags.some((x) => x.slug === slug));

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">#</span>
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {pick(locale, tag.name, tag.nameEn)}
      </h1>

      {taggedProjects.length > 0 && (
        <>
          <h2 className="mono-label mt-10 mb-4">{t(locale, 'navProjects')}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {taggedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} locale={locale} />
            ))}
          </ul>
        </>
      )}

      {taggedLabs.length > 0 && (
        <>
          <h2 className="mono-label mt-10 mb-4">{t(locale, 'navLabs')}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {taggedLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} locale={locale} />
            ))}
          </ul>
        </>
      )}

      {taggedLabs.length === 0 && taggedProjects.length === 0 && (
        <p className="mt-8 text-sm" style={{ color: 'var(--s-muted)' }}>
          {t(locale, 'noResult')}
        </p>
      )}
    </section>
  );
}
