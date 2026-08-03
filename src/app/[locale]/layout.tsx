import { notFound } from 'next/navigation';
import { LOCALES, isLocale } from '@/i18n/config';
import { t } from '@/i18n/dictionary';
import { getSettings } from '@/lib/queries';
import { Header, Footer } from '@/components/public/Chrome';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const settings = await getSettings();
  const name = settings?.fullName ?? '';

  return (
    <div className="site flex min-h-svh flex-col">
      {/* Applique l'habillage mémorisé avant le premier rendu : pas de clignotement. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(()=>{try{var s=localStorage.getItem('skin');if(s==='bitfield'||s==='octet'){document.documentElement.dataset.skin=s;return}}catch(e){}document.documentElement.dataset.skin='octet'})()`,
        }}
      />

      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-[var(--s-panel)] focus:px-3 focus:py-2 focus:font-mono focus:text-xs"
      >
        {t(locale, 'skipToContent')}
      </a>

      <Header locale={locale} name={name} />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} name={name} />
    </div>
  );
}
