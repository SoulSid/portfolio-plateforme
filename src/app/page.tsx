import Link from 'next/link';

/**
 * Page d'accueil provisoire — Phase 0.
 * Elle sert uniquement à valider le socle (Next, Tailwind v4, tokens, polices).
 * Le contenu réel viendra de la base de données à partir de la Phase 4 :
 * aucun texte éditorial ne doit rester en dur ici.
 */
export default function Home() {
  const tokens = [
    { name: 'encre', hex: '#14181F' },
    { name: 'papier', hex: '#ECEDE8' },
    { name: 'cobalt', hex: '#1F3FBF' },
    { name: 'phosphore', hex: '#2F7A4E' },
    { name: 'graphite', hex: '#5C6470' },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">phase 0 · socle</p>
      <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">
        Le socle technique répond.
      </h1>
      <p className="mt-4 max-w-prose text-muted">
        Next.js 15, TypeScript strict, Tailwind v4, Prisma et les trois familles de polices sont
        en place. Cette page disparaît dès que le front public lit la base.
      </p>

      <section className="mt-12">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Palette</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tokens.map((token) => (
            <li key={token.name} className="rounded-md border border-line p-3">
              <span className="block h-10 rounded" style={{ background: token.hex }} />
              <span className="mt-2 block font-mono text-xs">{token.name}</span>
              <span className="block font-mono text-xs text-muted">{token.hex}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Typographie</h2>
        <p className="font-display mt-3 text-2xl font-bold">Bricolage Grotesque — display</p>
        <p className="mt-1 text-lg">Public Sans — corps de texte et interface.</p>
        <p className="mt-1 font-mono text-sm">IBM Plex Mono — Jour 12 · 4,5 h · 3/5</p>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Accents</h2>
        <p className="mt-3">
          <Link href="/" className="text-accent underline underline-offset-4">
            Un lien en cobalt
          </Link>
          <span className="ml-4 rounded-full bg-success/10 px-3 py-1 font-mono text-xs text-success">
            en production
          </span>
        </p>
      </section>
    </main>
  );
}
