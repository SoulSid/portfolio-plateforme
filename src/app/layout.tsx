import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
