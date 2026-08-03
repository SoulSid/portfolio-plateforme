import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SeriesForm, type SeriesFormValues } from '@/components/admin/SeriesForm';
import { LabReorder } from '@/components/admin/LabReorder';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deleteSeries } from '../actions';

export const dynamic = 'force-dynamic';

const EMPTY: SeriesFormValues = {
  id: null,
  title: '',
  slug: '',
  description: '',
  status: 'DRAFT',
};

export default async function SeriesEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === 'new') return <SeriesForm values={EMPTY} />;

  const series = await prisma.labSeries.findUnique({
    where: { id },
    include: {
      labs: {
        orderBy: [{ dayNumber: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, title: true, status: true },
      },
    },
  });
  if (!series) notFound();

  const values: SeriesFormValues = {
    id: series.id,
    title: series.title,
    slug: series.slug,
    description: series.description,
    status: series.status,
  };

  return (
    <>
      <SeriesForm values={values} />

      <section className="mt-12 max-w-2xl">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">
          Ordre des labs
        </h2>
        <p className="mt-2 mb-4 text-sm text-muted">
          Glissez-déposez pour réordonner, ou utilisez les flèches. Le numéro de jour est
          recalculé et enregistré immédiatement.
        </p>
        <LabReorder seriesId={series.id} labs={series.labs} />
      </section>

      <div className="border-line mt-10 max-w-2xl border-t pt-6">
        <DeleteButton
          action={async () => {
            'use server';
            await deleteSeries(series.id);
          }}
          label="Supprimer cette série"
          confirmLabel="Confirmer — les labs seront détachés, pas supprimés"
        />
      </div>
    </>
  );
}
