'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type FormState = { error: string | null; saved: boolean };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

const optional = (max: number) => z.string().trim().max(max).optional();

const schema = z.object({
  fullName: z.string().trim().min(1, 'Le nom est requis.').max(120),
  tagline: z.string().trim().min(1, 'La phrase de présentation est requise.').max(300),
  taglineEn: optional(300),
  bio: z.string().max(20000),
  bioEn: z.string().max(20000).optional(),
  email: optional(160),
  phone: optional(60),
  location: optional(120),
  avatarUrl: optional(500),
  cvUrl: optional(500),
  seoTitle: optional(120),
  seoDesc: optional(300),
  seoTitleEn: optional(120),
  seoDescEn: optional(300),
  linkedin: optional(300),
  github: optional(300),
  x: optional(300),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.', saved: false };
  }

  const { linkedin, github, x, ...rest } = parsed.data;
  const socials = Object.fromEntries(
    Object.entries({ linkedin, github, x }).filter(([, v]) => v && v !== ''),
  );

  const nullable = (v: string | undefined) => (v && v !== '' ? v : null);

  const data = {
    fullName: rest.fullName,
    tagline: rest.tagline,
    taglineEn: nullable(rest.taglineEn),
    bio: rest.bio,
    bioEn: nullable(rest.bioEn),
    email: nullable(rest.email),
    phone: nullable(rest.phone),
    location: nullable(rest.location),
    avatarUrl: nullable(rest.avatarUrl),
    cvUrl: nullable(rest.cvUrl),
    seoTitle: nullable(rest.seoTitle),
    seoDesc: nullable(rest.seoDesc),
    seoTitleEn: nullable(rest.seoTitleEn),
    seoDescEn: nullable(rest.seoDescEn),
    socials,
  };

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });

  revalidateTag('settings');
  revalidatePath('/', 'layout');
  return { error: null, saved: true };
}
