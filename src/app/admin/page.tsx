import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Tableau de bord — Administration' };

/* Le tableau de bord lit toujours l'état réel de la base. */
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [
    projectsPublished,
    projectsDraft,
    labsPublished,
    labsDraft,
    series,
    unreadMessages,
    mostViewed,
    drafts,
  ] = await Promise.all([
    prisma.project.count({ where: { status: 'PUBLISHED' } }),
    prisma.project.count({ where: { status: 'DRAFT' } }),
    prisma.lab.count({ where: { status: 'PUBLISHED' } }),
    prisma.lab.count({ where: { status: 'DRAFT' } }),
    prisma.labSeries.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.lab.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, views: true },
    }),
    prisma.lab.findMany({
      where: { status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, updatedAt: true },
    }),
  ]);

  const counters = [
    { label: 'Projets publiés', value: projectsPublished },
    { label: 'Projets en brouillon', value: projectsDraft },
    { label: 'Labs publiés', value: labsPublished },
    { label: 'Labs en brouillon', value: labsDraft },
    { label: 'Séries', value: series },
    { label: 'Messages non lus', value: unreadMessages },
  ];

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Tableau de bord</h1>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((counter) => (
          <li key={counter.label} className="border-line rounded-lg border p-4">
            <p className="font-mono text-2xl">{counter.value}</p>
            <p className="mt-1 text-xs text-muted">{counter.label}</p>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">
          Brouillons en attente
        </h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun brouillon.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {drafts.map((lab) => (
              <li key={lab.id}>
                <Link href={`/admin/labs/${lab.id}`} className="text-accent text-sm hover:underline">
                  {lab.title}
                </Link>
                <span className="ml-2 font-mono text-xs text-muted">
                  {lab.updatedAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Contenu le plus vu</h2>
        {mostViewed.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun lab publié pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {mostViewed.map((lab) => (
              <li key={lab.id} className="text-sm">
                <span className="font-mono text-xs text-muted">{lab.views} vues</span>
                <span className="ml-2">{lab.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
