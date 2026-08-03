import Link from 'next/link';
import { localePath, pick, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { ymd } from '@/lib/dates';

/** Identifiant court et stable, façon référence de dossier : R-4F2A. */
export function refCode(prefix: string, id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${prefix}-${hash.toString(16).toUpperCase().padStart(4, '0').slice(0, 4)}`;
}

export interface LabCardData {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  objective: string;
  summaryEn: string | null;
  dayNumber: number | null;
  durationHours: number | null;
  difficulty: number | null;
  publishedAt: Date | string | null;
  tags: { id: string; name: string; nameEn: string | null }[];
}

export function LabCard({ lab, locale }: { lab: LabCardData; locale: Locale }) {
  return (
    <li className="panel flex flex-col gap-3 p-4 transition-colors hover:border-[var(--s-accent)]">
      <div className="flex items-center justify-between gap-3">
        <span className="hex-index text-[0.625rem] tracking-[0.14em]">
          {refCode('R', lab.id)}
        </span>
        <span className="mono-label">{ymd(lab.publishedAt)}</span>
      </div>

      <h3 className="font-display text-lg leading-snug font-bold">
        <Link href={localePath(locale, `/labs/${lab.slug}`)} className="hover:text-[var(--s-accent)]">
          {pick(locale, lab.title, lab.titleEn)}
        </Link>
      </h3>

      <p className="line-clamp-3 text-sm" style={{ color: 'var(--s-muted)' }}>
        {pick(locale, lab.objective, lab.summaryEn)}
      </p>

      <p className="mono-label mt-auto flex flex-wrap gap-x-3">
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
        {lab.difficulty !== null && <span>{lab.difficulty}/5</span>}
      </p>
    </li>
  );
}

export interface ProjectCardData {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  summary: string;
  summaryEn: string | null;
  client: string | null;
  publishedAt: Date | string | null;
  tags: { id: string; name: string; nameEn: string | null }[];
}

export function ProjectCard({ project, locale }: { project: ProjectCardData; locale: Locale }) {
  return (
    <li className="panel flex flex-col gap-3 p-4 transition-colors hover:border-[var(--s-accent)]">
      <div className="flex items-center justify-between gap-3">
        <span className="hex-index text-[0.625rem] tracking-[0.14em]">
          {refCode('P', project.id)}
        </span>
        <span className="mono-label">{ymd(project.publishedAt)}</span>
      </div>

      <h3 className="font-display text-lg leading-snug font-bold">
        <Link
          href={localePath(locale, `/projets/${project.slug}`)}
          className="hover:text-[var(--s-accent)]"
        >
          {pick(locale, project.title, project.titleEn)}
        </Link>
      </h3>

      <p className="line-clamp-3 text-sm" style={{ color: 'var(--s-muted)' }}>
        {pick(locale, project.summary, project.summaryEn)}
      </p>

      {project.tags.length > 0 && (
        <p className="mono-label mt-auto flex flex-wrap gap-x-2">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag.id}>{pick(locale, tag.name, tag.nameEn)}</span>
          ))}
        </p>
      )}
    </li>
  );
}
