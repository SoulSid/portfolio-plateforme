'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { seriesSchema } from '@/lib/validations/content';
import { slugify, uniqueSlug } from '@/lib/slug';

export type FormState = { error: string | null; fieldErrors?: Record<string, string[]> };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

function revalidateSeries() {
  revalidateTag('series');
  revalidateTag('labs');
  revalidatePath('/');
  revalidatePath('/labs');
}

async function ensureUniqueSlug(desired: string, currentId?: string) {
  const others = await prisma.labSeries.findMany({
    where: currentId ? { NOT: { id: currentId } } : undefined,
    select: { slug: true },
  });
  return uniqueSlug(desired, new Set(others.map((s) => s.slug)));
}

export async function saveSeries(
  id: string | null,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = seriesSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    coverId: formData.get('coverId') ?? '',
    status: formData.get('status'),
  });

  if (!parsed.success) {
    return {
      error: 'Certains champs sont invalides.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const slug = await ensureUniqueSlug(data.slug || slugify(data.title), id ?? undefined);

  const saved = id
    ? await prisma.labSeries.update({ where: { id }, data: { ...data, slug } })
    : await prisma.labSeries.create({ data: { ...data, slug } });

  revalidateSeries();
  revalidatePath(`/series/${saved.slug}`);

  if (!id) redirect(`/admin/series/${saved.id}`);
  return { error: null };
}

/**
 * Réordonnancement par glisser-déposer : `orderedLabIds` est la nouvelle
 * séquence complète. On réécrit dayNumber en une transaction pour éviter tout
 * état intermédiaire incohérent.
 */
export async function reorderLabs(seriesId: string, orderedLabIds: string[]) {
  await requireAdmin();

  await prisma.$transaction(
    orderedLabIds.map((labId, index) =>
      prisma.lab.update({ where: { id: labId }, data: { dayNumber: index + 1 } }),
    ),
  );

  const series = await prisma.labSeries.findUnique({
    where: { id: seriesId },
    select: { slug: true },
  });

  revalidateSeries();
  if (series) revalidatePath(`/series/${series.slug}`);
  revalidatePath(`/admin/series/${seriesId}`);
}

export async function deleteSeries(id: string) {
  await requireAdmin();
  /* onDelete: SetNull détache les labs : ils survivent, sans série. */
  const series = await prisma.labSeries.delete({ where: { id }, select: { slug: true } });
  revalidateSeries();
  revalidatePath(`/series/${series.slug}`);
  redirect('/admin/series');
}
