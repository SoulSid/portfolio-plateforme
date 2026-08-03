'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { tagSchema } from '@/lib/validations/content';
import { slugify, uniqueSlug } from '@/lib/slug';

export type FormState = { error: string | null };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

function revalidateAll() {
  revalidateTag('tags');
  revalidateTag('labs');
  revalidateTag('projects');
  revalidatePath('/');
}

export async function saveTag(
  id: string | null,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = tagSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || slugify(String(formData.get('name') ?? '')),
    kind: formData.get('kind'),
    color: formData.get('color') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' };
  }

  const others = await prisma.tag.findMany({
    where: id ? { NOT: { id } } : undefined,
    select: { slug: true },
  });
  const slug = uniqueSlug(parsed.data.slug, new Set(others.map((t) => t.slug)));

  const data = { ...parsed.data, slug };

  if (id) await prisma.tag.update({ where: { id }, data });
  else await prisma.tag.create({ data });

  revalidateAll();
  revalidatePath('/admin/tags');
  return { error: null };
}

/**
 * Supprime un tag. Les projets et labs qui le portaient le perdent simplement :
 * la relation est implicite, aucun contenu n'est touché.
 */
export async function deleteTag(id: string) {
  await requireAdmin();
  await prisma.tag.delete({ where: { id } });
  revalidateAll();
  revalidatePath('/admin/tags');
}
