import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/public-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import './globals.css';

/* Métadonnées provisoires : à partir de la Phase 5, elles viendront de SiteSettings. */
export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Plateforme éditoriale — projets et labs.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* La locale vient du middleware : l'attribut lang est correct sans JavaScript. */
  const headerList = await headers();
  const lang = headerList.get('x-locale') === 'en' ? 'en' : 'fr';

  return (
    <html lang={lang}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
