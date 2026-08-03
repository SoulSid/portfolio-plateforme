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
  revalidatePath('/a-propos');
  revalidatePath('/admin/formations');
}

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), 'Date invalide.')
  .transform((v) => (v === null ? null : new Date(v)));

const schema = z.object({
  school: z.string().trim().min(1, "L'établissement est requis.").max(160),
  degree: z.string().trim().min(1, 'Le diplôme est requis.').max(160),
  degreeEn: z.string().trim().max(160).optional(),
  field: z.string().trim().max(160).optional(),
  fieldEn: z.string().trim().max(160).optional(),
  startDate: optionalDate,
  endDate: optionalDate,
  description: z.string().trim().max(2000).optional(),
  descriptionEn: z.string().trim().max(2000).optional(),
  order: z.coerce.number().int().min(0),
});

export async function saveEducation(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    school: formData.get('school'),
    degree: formData.get('degree'),
    degreeEn: formData.get('degreeEn') || undefined,
    field: formData.get('field') || undefined,
    fieldEn: formData.get('fieldEn') || undefined,
    startDate: formData.get('startDate') ?? '',
    endDate: formData.get('endDate') ?? '',
    description: formData.get('description') || undefined,
    descriptionEn: formData.get('descriptionEn') || undefined,
    order: formData.get('order') || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' };

  const data = {
    ...parsed.data,
    degreeEn: parsed.data.degreeEn ?? null,
    field: parsed.data.field ?? null,
    fieldEn: parsed.data.fieldEn ?? null,
    description: parsed.data.description ?? null,
    descriptionEn: parsed.data.descriptionEn ?? null,
  };

  if (id) await prisma.education.update({ where: { id }, data });
  else await prisma.education.create({ data });

  refresh();
  return { error: null };
}

export async function deleteEducation(id: string) {
  await requireAdmin();
  await prisma.education.delete({ where: { id } });
  refresh();
}
