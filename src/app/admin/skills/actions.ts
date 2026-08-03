'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type FormState = { error: string | null };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

function refresh() {
  revalidateTag('profile');
  revalidatePath('/');
  revalidatePath('/a-propos');
  revalidatePath('/admin/skills');
}

const schema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.').max(80),
  category: z.string().trim().min(1, 'La catégorie est requise.').max(80),
  categoryEn: z.string().trim().max(80).optional(),
  level: z.coerce.number().int().min(1).max(5),
  order: z.coerce.number().int().min(0),
});

export async function saveSkill(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    categoryEn: formData.get('categoryEn') || undefined,
    level: formData.get('level') || 3,
    order: formData.get('order') || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' };

  const data = { ...parsed.data, categoryEn: parsed.data.categoryEn ?? null };
  if (id) await prisma.skill.update({ where: { id }, data });
  else await prisma.skill.create({ data });

  refresh();
  return { error: null };
}

export async function deleteSkill(id: string) {
  await requireAdmin();
  await prisma.skill.delete({ where: { id } });
  refresh();
}
