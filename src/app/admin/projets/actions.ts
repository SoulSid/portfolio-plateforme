'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { projectSchema } from '@/lib/validations/content';
import { slugify, uniqueSlug } from '@/lib/slug';

export type FormState = { error: string | null; fieldErrors?: Record<string, string[]> };

/** Toute action d'écriture vérifie la session : le middleware ne suffit pas. */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

/** Rafraîchit le cache du front public après chaque écriture (section 5 du brief). */
function revalidateProjects() {
  revalidateTag('projects');
  revalidatePath('/');
  revalidatePath('/projets');
}

function parseForm(formData: FormData) {
  return projectSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    summary: formData.get('summary'),
    content: formData.get('content') ?? '',
    client: formData.get('client') ?? '',
    role: formData.get('role') ?? '',
    repoUrl: formData.get('repoUrl') ?? '',
    demoUrl: formData.get('demoUrl') ?? '',
    startedAt: formData.get('startedAt') ?? '',
    finishedAt: formData.get('finishedAt') ?? '',
    coverId: formData.get('coverId') ?? '',
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
    order: formData.get('order') || 0,
    tagIds: formData.getAll('tagIds').map(String),
  });
}

/** Garantit l'unicité du slug, en ignorant l'entrée en cours de modification. */
async function ensureUniqueSlug(desired: string, currentId?: string) {
  const others = await prisma.project.findMany({
    where: currentId ? { NOT: { id: currentId } } : undefined,
    select: { slug: true },
  });
  return uniqueSlug(desired, new Set(others.map((p) => p.slug)));
}

export async function saveProject(
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

  /* publishedAt est posé la première fois que l'entrée passe en PUBLISHED. */
  const existing = id
    ? await prisma.project.findUnique({ where: { id }, select: { publishedAt: true } })
    : null;
  const publishedAt =
    data.status === 'PUBLISHED' ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const base = { ...data, slug, publishedAt };
  const tagRefs = tagIds.map((tagId) => ({ id: tagId }));

  /* `set` remplace les liaisons existantes ; à la création il n'y en a pas, d'où `connect`. */
  const saved = id
    ? await prisma.project.update({
        where: { id },
        data: { ...base, tags: { set: tagRefs } },
      })
    : await prisma.project.create({
        data: { ...base, tags: { connect: tagRefs } },
      });

  revalidateProjects();
  revalidatePath(`/projets/${saved.slug}`);

  if (!id) redirect(`/admin/projets/${saved.id}`);
  return { error: null };
}

/** Publication / dépublication depuis la liste, sans ouvrir la fiche. */
export async function toggleProjectStatus(id: string) {
  await requireAdmin();

  const project = await prisma.project.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, slug: true },
  });
  if (!project) return;

  const nextStatus = project.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  await prisma.project.update({
    where: { id },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === 'PUBLISHED' ? (project.publishedAt ?? new Date()) : project.publishedAt,
    },
  });

  revalidateProjects();
  revalidatePath(`/projets/${project.slug}`);
}

export async function deleteProject(id: string) {
  await requireAdmin();
  const project = await prisma.project.delete({ where: { id }, select: { slug: true } });
  revalidateProjects();
  revalidatePath(`/projets/${project.slug}`);
  redirect('/admin/projets');
}
