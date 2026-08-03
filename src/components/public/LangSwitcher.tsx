'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, type Locale } from '@/i18n/config';

/**
 * Sélecteur de langue : conserve la page courante quand c'est possible.
 * `/labs/mon-lab` ↔ `/en/labs/mon-lab`.
 */
export function LangSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || '/';
  const bare = pathname.startsWith('/en') ? pathname.slice(3) || '/' : pathname;

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {LOCALES.map((code) => {
        const active = code === locale;
        const href = code === 'fr' ? bare : `/en${bare === '/' ? '' : bare}`;
        return (
          <Link
            key={code}
            href={href}
            hrefLang={code}
            aria-current={active ? 'true' : undefined}
            className="rounded px-2 py-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors"
            style={
              active
                ? { background: 'var(--s-accent)', color: 'var(--s-accent-ink)' }
                : { color: 'var(--s-muted)', border: '1px solid var(--s-line)' }
            }
          >
            {code}
          </Link>
        );
      })}
    </div>
  );
}
