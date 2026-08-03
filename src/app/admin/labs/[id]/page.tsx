import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { LabForm, type LabFormValues } from '@/components/admin/LabForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deleteLab } from '../actions';

export const dynamic = 'force-dynamic';

const EMPTY: LabFormValues = {
  id: null,
  title: '',
  slug: '',
  objective: '',
  content: '',
  takeaway: '',
  seriesId: '',
  dayNumber: '',
  durationHours: '',
  difficulty: '',
  repoUrl: '',
  status: 'DRAFT',
  tagIds: [],
};

export default async function LabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';

  const [allTags, allSeries] = await Promise.all([
    prisma.tag.findMany({
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, kind: true },
    }),
    prisma.labSeries.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ]);

  if (isNew) {
    return <LabForm values={EMPTY} allTags={allTags} allSeries={allSeries} previewUrl={null} />;
  }

  const lab = await prisma.lab.findUnique({
    where: { id },
    include: { tags: { select: { id: true } } },
  });
  if (!lab) notFound();

  const values: LabFormValues = {
    id: lab.id,
    title: lab.title,
    slug: lab.slug,
    objective: lab.objective,
    content: lab.content,
    takeaway: lab.takeaway ?? '',
    seriesId: lab.seriesId ?? '',
    dayNumber: lab.dayNumber?.toString() ?? '',
    durationHours: lab.durationHours?.toString() ?? '',
    difficulty: lab.difficulty?.toString() ?? '',
    repoUrl: lab.repoUrl ?? '',
    status: lab.status,
    tagIds: lab.tags.map((t) => t.id),
  };

  /* Le jeton d'aperçu rend le brouillon visible sans le publier. */
  const token = process.env.PREVIEW_TOKEN;
  const previewUrl = token ? `/labs/${lab.slug}?preview=${token}` : null;

  return (
    <>
      <LabForm
        values={values}
        allTags={allTags}
        allSeries={allSeries}
        previewUrl={previewUrl}
      />
      <div className="border-line mt-10 max-w-3xl border-t pt-6">
        <DeleteButton
          action={async () => {
            'use server';
            await deleteLab(lab.id);
          }}
          label="Supprimer ce lab"
          confirmLabel="Confirmer la suppression"
        />
      </div>
    </>
  );
}
