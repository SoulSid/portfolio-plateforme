'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { labSchema } from '@/lib/validations/content';
import { slugify, uniqueSlug } from '@/lib/slug';

export type FormState = { error: string | null; fieldErrors?: Record<string, string[]> };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

function revalidateLabs() {
  revalidateTag('labs');
  revalidatePath('/');
  revalidatePath('/labs');
}

/** Champ numérique facultatif : la chaîne vide du formulaire devient null. */
const num = (v: FormDataEntryValue | null) => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};

function parseForm(formData: FormData) {
  return labSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    objective: formData.get('objective'),
    content: formData.get('content') ?? '',
    takeaway: formData.get('takeaway') ?? '',
    seriesId: formData.get('seriesId') ?? '',
    dayNumber: num(formData.get('dayNumber')),
    durationHours: num(formData.get('durationHours')),
    difficulty: num(formData.get('difficulty')),
    repoUrl: formData.get('repoUrl') ?? '',
    coverId: formData.get('coverId') ?? '',
    status: formData.get('status'),
    tagIds: formData.getAll('tagIds').map(String),
  });
}

async function ensureUniqueSlug(desired: string, currentId?: string) {
  const others = await prisma.lab.findMany({
    where: currentId ? { NOT: { id: currentId } } : undefined,
    select: { slug: true },
  });
  return uniqueSlug(desired, new Set(others.map((l) => l.slug)));
}

export async function saveLab(
  id: string | null,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: 'Certains champs sont invalides.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tagIds, ...data } = parsed.data;
  const slug = await ensureUniqueSlug(data.slug || slugify(data.title), id ?? undefined);

  const existing = id
    ? await prisma.lab.findUnique({ where: { id }, select: { publishedAt: true } })
    : null;
  const publishedAt =
    data.status === 'PUBLISHED' ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const base = { ...data, slug, publishedAt };
  const tagRefs = tagIds.map((tagId) => ({ id: tagId }));

  const saved = id
    ? await prisma.lab.update({ where: { id }, data: { ...base, tags: { set: tagRefs } } })
    : await prisma.lab.create({ data: { ...base, tags: { connect: tagRefs } } });

  revalidateLabs();
  revalidatePath(`/labs/${saved.slug}`);

  if (!id) redirect(`/admin/labs/${saved.id}`);
  return { error: null };
}

export async function toggleLabStatus(id: string) {
  await requireAdmin();

  const lab = await prisma.lab.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, slug: true },
  });
  if (!lab) return;

  const nextStatus = lab.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  await prisma.lab.update({
    where: { id },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === 'PUBLISHED' ? (lab.publishedAt ?? new Date()) : lab.publishedAt,
    },
  });

  revalidateLabs();
  revalidatePath(`/labs/${lab.slug}`);
}

export async function deleteLab(id: string) {
  await requireAdmin();
  const lab = await prisma.lab.delete({ where: { id }, select: { slug: true } });
  revalidateLabs();
  revalidatePath(`/labs/${lab.slug}`);
  redirect('/admin/labs');
}
