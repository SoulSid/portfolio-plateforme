import { notFound } from 'next/navigation';
import { isLocale, pick, pickNullable, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getProfile, getSettings } from '@/lib/queries';
import { year } from '@/lib/dates';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);

  const byCategory = new Map<string, typeof profile.skills>();
  for (const skill of profile.skills) {
    const key = locale === 'en' && skill.categoryEn ? skill.categoryEn : skill.category;
    byCategory.set(key, [...(byCategory.get(key) ?? []), skill]);
  }

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
          <a href={settings.cvUrl} target="_blank" rel="noreferrer noopener" className="accent-btn">
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
                    {year(exp.startDate)}
                    {exp.endDate ? ` — ${year(exp.endDate)}` : ' —'}
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

      {byCategory.size > 0 && (
        <>
          <h2 className="font-display mt-14 mb-5 text-xl font-extrabold tracking-tight">
            <span className="hex-index mr-2 text-base">0x13</span>
            {t(locale, 'skills')}
          </h2>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[...byCategory.entries()].map(([category, skills]) => (
              <div key={category}>
                <dt className="mono-label mb-2">{category}</dt>
                <dd className="m-0 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="mono-label rounded px-2.5 py-1"
                      style={{ border: '1px solid var(--s-line)' }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
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
