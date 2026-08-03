import Link from 'next/link';
import { localePath, type Locale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { SkinSwitcher } from './SkinSwitcher';
import { LangSwitcher } from './LangSwitcher';

/* Trame binaire décorative : « FICHIER VIVANT » puis des octets, en boucle. */
const TAPE = `01000110 01001001 01000011 01001000 01001001 01000101 01010010 00100000 2F 2F 20 43 4F 4E 54 49 4E 55 4F 55 53 20 50 55 42 4C 49 53 48 49 4E 47 20 2F 2F 20 `;

export function Header({ locale, name }: { locale: Locale; name: string }) {
  const nav = [
    { href: localePath(locale, '/'), label: t(locale, 'navHome'), code: '00' },
    { href: localePath(locale, '/projets'), label: t(locale, 'navProjects'), code: '01' },
    { href: localePath(locale, '/labs'), label: t(locale, 'navLabs'), code: '10' },
    { href: localePath(locale, '/a-propos'), label: t(locale, 'navAbout'), code: '11' },
    { href: localePath(locale, '/contact'), label: t(locale, 'navContact'), code: '12' },
  ];

  return (
    <header style={{ borderBottom: '1px solid var(--s-line)' }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link
          href={localePath(locale, '/')}
          className="font-display text-sm font-extrabold tracking-tight uppercase"
        >
          {name}
        </Link>

        <nav
          aria-label={t(locale, 'navHome')}
          className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1"
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="mono-label hover:text-[var(--s-text)]"
                  style={{ fontSize: '0.625rem' }}
                >
                  <span className="hex-index mr-1">{item.code}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <SkinSwitcher label={t(locale, 'themeLabel')} />
          <LangSwitcher locale={locale} label={t(locale, 'langLabel')} />
        </div>
      </div>

      <div className="tape" aria-hidden="true">
        <span className="tape-inner">{TAPE.repeat(6)}</span>
      </div>
    </header>
  );
}

export function Footer({ locale, name }: { locale: Locale; name: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20" style={{ borderTop: '1px solid var(--s-line)' }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
        <p className="mono-label">
          © {year} — {name}
        </p>
        <p className="mono-label">
          <Link href={localePath(locale, '/contact')} className="hover:text-[var(--s-text)]">
            {t(locale, 'contactCta')}
          </Link>
        </p>
      </div>
    </footer>
  );
}
