import { prisma } from '@/lib/prisma';
import { TagManager, type TagRow } from '@/components/admin/TagManager';

export const metadata = { title: 'Tags — Administration' };
export const dynamic = 'force-dynamic';

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      kind: true,
      color: true,
      _count: { select: { projects: true, labs: true } },
    },
  });

  const rows: TagRow[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    kind: t.kind,
    color: t.color,
    usage: t._count.projects + t._count.labs,
  }));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Tags</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        <strong>Technique</strong> pour les technologies, <strong>Domaine</strong> pour les champs
        d&apos;expertise. Supprimer un tag ne supprime aucun contenu.
      </p>
      <TagManager rows={rows} />
    </>
  );
}
