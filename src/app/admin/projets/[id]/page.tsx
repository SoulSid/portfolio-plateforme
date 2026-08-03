import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectForm, type ProjectFormValues } from '@/components/admin/ProjectForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deleteProject } from '../actions';

export const dynamic = 'force-dynamic';

const EMPTY: ProjectFormValues = {
  id: null,
  title: '',
  slug: '',
  summary: '',
  content: '',
  client: '',
  role: '',
  repoUrl: '',
  demoUrl: '',
  startedAt: '',
  finishedAt: '',
  status: 'DRAFT',
  featured: false,
  order: 0,
  tagIds: [],
};

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';

  const allTags = await prisma.tag.findMany({
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, kind: true },
  });

  if (isNew) {
    return <ProjectForm values={EMPTY} allTags={allTags} />;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { tags: { select: { id: true } } },
  });
  if (!project) notFound();

  const values: ProjectFormValues = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    content: project.content,
    client: project.client ?? '',
    role: project.role ?? '',
    repoUrl: project.repoUrl ?? '',
    demoUrl: project.demoUrl ?? '',
    startedAt: isoDay(project.startedAt),
    finishedAt: isoDay(project.finishedAt),
    status: project.status,
    featured: project.featured,
    order: project.order,
    tagIds: project.tags.map((t) => t.id),
  };

  return (
    <>
      <ProjectForm values={values} allTags={allTags} />
      <div className="border-line mt-10 max-w-3xl border-t pt-6">
        <DeleteButton
          action={async () => {
            'use server';
            await deleteProject(project.id);
          }}
          label="Supprimer ce projet"
          confirmLabel="Confirmer la suppression"
        />
      </div>
    </>
  );
}
