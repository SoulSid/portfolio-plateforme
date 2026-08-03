import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { toggleProjectStatus } from './actions';
import { StatusBadge } from '@/components/admin/StatusBadge';

export const metadata = { title: 'Projets — Administration' };
export const dynamic = 'force-dynamic';

export default async function ProjectsListPage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      views: true,
      updatedAt: true,
      tags: { select: { id: true, name: true } },
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Projets</h1>
        <Link href="/admin/projets/new">
          <Button>Nouveau projet</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucun projet pour l&apos;instant.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="border-line flex flex-wrap items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/projets/${project.id}`}
                  className="font-medium hover:text-accent"
                >
                  {project.title}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  /{project.slug}
                  {project.featured && ' · en avant'}
                  {project.views > 0 && ` · ${project.views} vues`}
                  {project.tags.length > 0 && ` · ${project.tags.map((t) => t.name).join(', ')}`}
                </p>
              </div>

              <StatusBadge status={project.status} />

              <form
                action={async () => {
                  'use server';
                  await toggleProjectStatus(project.id);
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  {project.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
