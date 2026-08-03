import { notFound } from 'next/navigation';
import { isLocale, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getPublishedProjects } from '@/lib/queries';
import { ProjectCard } from '@/components/public/Cards';
import { TagFilter } from '@/components/public/TagFilter';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const projects = await getPublishedProjects();
  const usedTags = [
    ...new Map(projects.flatMap((p) => p.tags).map((tag) => [tag.slug, tag])).values(),
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x01</span>
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(locale, 'navProjects')}
      </h1>

      {usedTags.length > 0 && (
        <div className="mt-8">
          <TagFilter
            tags={usedTags.map((tag) => ({ slug: tag.slug, name: pick(locale, tag.name, tag.nameEn) }))}
            allLabel={t(locale, 'allTags')}
            groupLabel={t(locale, 'filterByTag')}
            emptyLabel={t(locale, 'noResult')}
          />
        </div>
      )}

      {projects.length === 0 ? (
        <p className="mt-8 text-sm" style={{ color: 'var(--s-muted)' }}>
          {t(locale, 'noProjects')}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              data-tags={project.tags.map((x) => x.slug).join(',')}
              className="contents"
            >
              <ProjectCard project={project} locale={locale} />
            </div>
          ))}
        </ul>
      )}
    </section>
  );
}
