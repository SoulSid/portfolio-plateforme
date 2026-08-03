import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata = { title: 'Séries — Administration' };
export const dynamic = 'force-dynamic';

export default async function SeriesListPage() {
  const series = await prisma.labSeries.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      _count: { select: { labs: true } },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Séries</h1>
        <Link href="/admin/series/new">
          <Button>Nouvelle série</Button>
        </Link>
      </div>

      {series.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucune série pour l&apos;instant.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {series.map((s) => (
            <li
              key={s.id}
              className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/admin/series/${s.id}`} className="font-medium hover:text-accent">
                  {s.title}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  /{s.slug} · {s._count.labs} lab{s._count.labs > 1 ? 's' : ''}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
