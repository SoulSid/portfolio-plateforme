import { notFound } from 'next/navigation';
import { isLocale, pick, pickNullable, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getProfile, getSettings } from '@/lib/queries';
import { monthYear, year } from '@/lib/dates';
import { SkillExplorer } from '@/components/public/SkillExplorer';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);

  const skills = profile.skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    category: pick(locale, skill.category, skill.categoryEn),
    description: pickNullable(locale, skill.description, skill.descriptionEn),
  }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x11</span> · {settings?.location ?? ''}
      </p>
      <h1 className="font-display mt-2 max-w-[20ch] text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        {pick(locale, settings?.tagline ?? '', settings?.taglineEn)}
      </h1>

      {settings?.bio && (
        <div
          className="article-body mt-8"
          dangerouslySetInnerHTML={{ __html: pick(locale, settings.bio, settings.bioEn) }}
        />
      )}

      {settings?.cvUrl && (
        <p className="mt-6">
          <a href={settings.cvUrl} download className="accent-btn">
            {t(locale, 'downloadCv')}
          </a>
        </p>
      )}

      {profile.experiences.length > 0 && (
        <>
          <h2 className="font-display mt-14 mb-5 text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x12</span>
            {t(locale, 'experience')}
          </h2>
          <ol className="space-y-4">
            {profile.experiences.map((exp) => (
              <li key={exp.id} className="panel grid gap-2 p-4 sm:grid-cols-[12rem_1fr] sm:gap-5">
                <div>
                  <p className="mono-label">{exp.company}</p>
                  <p className="mono-label">
                    {monthYear(exp.startDate, locale)} —{' '}
                    {exp.endDate ? monthYear(exp.endDate, locale) : t(locale, 'present')}
                  </p>
                  {exp.location && <p className="mono-label">{exp.location}</p>}
                </div>
                <div>
                  <h3 className="font-display font-bold">
                    {pick(locale, exp.role, exp.roleEn)}
                  </h3>
                  <p className="mt-1 text-sm whitespace-pre-line" style={{ color: 'var(--s-muted)' }}>
                    {pick(locale, exp.description, exp.descriptionEn)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {skills.length > 0 && (
        <>
          <h2 className="font-display mt-14 mb-5 text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x13</span>
            {t(locale, 'skills')}
          </h2>
          <SkillExplorer
            grouped
            skills={skills}
            labels={{
              hint: t(locale, 'skillHint'),
              close: t(locale, 'skillClose'),
              noDescription: t(locale, 'skillNoDescription'),
            }}
          />
        </>
      )}

      {profile.education.length > 0 && (
        <>
          <h2 className="font-display mt-14 mb-5 text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x14</span>
            {t(locale, 'education')}
          </h2>
          <ol className="space-y-4">
            {profile.education.map((edu) => (
              <li key={edu.id} className="panel p-4">
                <h3 className="font-display font-bold">{pick(locale, edu.degree, edu.degreeEn)}</h3>
                {pickNullable(locale, edu.field, edu.fieldEn) && (
                  <p className="text-sm" style={{ color: 'var(--s-muted)' }}>
                    {pickNullable(locale, edu.field, edu.fieldEn)}
                  </p>
                )}
                <p className="mono-label mt-1">
                  {edu.school}
                  {edu.endDate ? ` · ${year(edu.endDate)}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
