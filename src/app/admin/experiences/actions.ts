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
  revalidatePath('/admin/experiences');
}

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), 'Date invalide.')
  .transform((v) => (v === null ? null : new Date(v)));

const schema = z.object({
  company: z.string().trim().min(1, "L'entreprise est requise.").max(120),
  role: z.string().trim().min(1, 'Le poste est requis.').max(120),
  roleEn: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  startDate: z.string().trim().min(1, 'La date de début est requise.'),
  endDate: optionalDate,
  description: z.string().trim().min(1, 'La description est requise.').max(4000),
  descriptionEn: z.string().trim().max(4000).optional(),
  order: z.coerce.number().int().min(0),
});

export async function saveExperience(
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    company: formData.get('company'),
    role: formData.get('role'),
    roleEn: formData.get('roleEn') || undefined,
    location: formData.get('location') || undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') ?? '',
    description: formData.get('description'),
    descriptionEn: formData.get('descriptionEn') || undefined,
    order: formData.get('order') || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' };

  const data = {
    ...parsed.data,
    startDate: new Date(parsed.data.startDate),
    roleEn: parsed.data.roleEn ?? null,
    location: parsed.data.location ?? null,
    descriptionEn: parsed.data.descriptionEn ?? null,
  };

  if (id) await prisma.experience.update({ where: { id }, data });
  else await prisma.experience.create({ data });

  refresh();
  return { error: null };
}

export async function deleteExperience(id: string) {
  await requireAdmin();
  await prisma.experience.delete({ where: { id } });
  refresh();
}
