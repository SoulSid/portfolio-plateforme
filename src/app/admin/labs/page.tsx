import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { toggleLabStatus } from './actions';

export const metadata = { title: 'Labs — Administration' };
export const dynamic = 'force-dynamic';

export default async function LabsListPage() {
  const labs = await prisma.lab.findMany({
    orderBy: [{ seriesId: 'asc' }, { dayNumber: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      views: true,
      dayNumber: true,
      durationHours: true,
      difficulty: true,
      series: { select: { title: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Labs</h1>
        <Link href="/admin/labs/new">
          <Button>Nouveau lab</Button>
        </Link>
      </div>

      {labs.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucun lab pour l&apos;instant.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {labs.map((lab) => (
            <li
              key={lab.id}
              className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/admin/labs/${lab.id}`} className="font-medium hover:text-accent">
                  {lab.title}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  /{lab.slug}
                  {lab.series && ` · ${lab.series.title}`}
                  {lab.dayNumber !== null && ` · jour ${lab.dayNumber}`}
                  {lab.durationHours !== null && ` · ${lab.durationHours} h`}
                  {lab.difficulty !== null && ` · ${lab.difficulty}/5`}
                  {lab.views > 0 && ` · ${lab.views} vues`}
                </p>
              </div>

              <StatusBadge status={lab.status} />

              <form
                action={async () => {
                  'use server';
                  await toggleLabStatus(lab.id);
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  {lab.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
