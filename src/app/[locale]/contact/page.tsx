import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getSettings } from '@/lib/queries';
import { ContactForm } from '@/components/public/ContactForm';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const settings = await getSettings();
  const socials = (settings?.socials ?? {}) as Record<string, string>;
  const links = Object.entries(socials).filter(([, url]) => typeof url === 'string' && url !== '');

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x20</span>
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t(locale, 'contactTitle')}
      </h1>

      {settings?.email && (
        <p className="mono-label mt-4">
          <a href={`mailto:${settings.email}`} style={{ color: 'var(--s-accent)' }}>
            {settings.email}
          </a>
        </p>
      )}

      {links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {links.map(([key, url]) => (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                className="mono-label hover:text-[var(--s-text)]"
              >
                {key} ↗
              </a>
            </li>
          ))}
        </ul>
      )}

      <ContactForm locale={locale} />
    </section>
  );
}
