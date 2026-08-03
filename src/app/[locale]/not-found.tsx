import Link from 'next/link';

/* 404 du front public. Le libellé reste en français : Next.js rend ce fichier
   sans paramètre de locale, on ne peut donc pas savoir la langue demandée. */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <p className="mono-label">
        <span className="hex-index">0x404</span>
      </p>
      <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight">
        Page introuvable
      </h1>
      <p className="mt-4" style={{ color: 'var(--s-muted)' }}>
        Cette adresse ne correspond à aucun contenu publié.
      </p>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="accent-btn">
          Accueil
        </Link>
        <Link href="/labs" className="ghost-btn">
          Atelier
        </Link>
      </p>
    </section>
  );
}
