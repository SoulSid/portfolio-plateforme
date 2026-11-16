import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Lectures du front public.
 *
 * Chaque requête est mise en cache sous une étiquette (`labs`, `projects`,
 * `series`, `settings`). Les Server Actions de l'admin appellent
 * `revalidateTag` sur ces mêmes étiquettes : le site a la vitesse du statique
 * et se met à jour dès la publication (section 5 du brief).
 *
 * Filet de sécurité : `revalidate: CACHE_SECONDS`. Une écriture qui ne passe
 * PAS par l'admin (seed, Prisma Studio, SQL direct) n'appelle pas
 * revalidateTag ; sans expiration, le site afficherait l'ancien contenu
 * indéfiniment — c'est arrivé le 16/11/2026 après un seed.
 */
const CACHE_SECONDS = 3600;

export const getSettings = unstable_cache(
  async () => prisma.siteSettings.findUnique({ where: { id: 'singleton' } }),
  ['settings'],
  { revalidate: CACHE_SECONDS, tags: ['settings'] },
);

export const getPublishedLabs = unstable_cache(
  async () =>
    prisma.lab.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        tags: true,
        series: { select: { slug: true, title: true, titleEn: true } },
        cover: true,
      },
    }),
  ['labs-published'],
  { revalidate: CACHE_SECONDS, tags: ['labs'] },
);

export const getPublishedProjects = unstable_cache(
  async () =>
    prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ featured: 'desc' }, { order: 'asc' }, { publishedAt: 'desc' }],
      include: { tags: true, cover: true },
    }),
  ['projects-published'],
  { revalidate: CACHE_SECONDS, tags: ['projects'] },
);

export const getPublishedSeries = unstable_cache(
  async () =>
    prisma.labSeries.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        cover: true,
        labs: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ dayNumber: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, slug: true, title: true, titleEn: true, dayNumber: true },
        },
      },
    }),
  ['series-published'],
  { revalidate: CACHE_SECONDS, tags: ['series'] },
);

export const getProfile = unstable_cache(
  async () => {
    const [skills, experiences, education] = await Promise.all([
      prisma.skill.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      prisma.experience.findMany({ orderBy: [{ order: 'asc' }, { startDate: 'desc' }] }),
      prisma.education.findMany({ orderBy: [{ order: 'asc' }, { endDate: 'desc' }] }),
    ]);
    return { skills, experiences, education };
  },
  ['profile'],
  { revalidate: CACHE_SECONDS, tags: ['profile'] },
);

export const getTags = unstable_cache(
  async () => prisma.tag.findMany({ orderBy: [{ kind: 'asc' }, { name: 'asc' }] }),
  ['tags'],
  { revalidate: CACHE_SECONDS, tags: ['tags'] },
);

/**
 * Un lab par slug. `allowDraft` n'est vrai que sur la route d'aperçu, après
 * vérification du jeton — jamais en navigation normale.
 */
export async function getLabBySlug(slug: string, allowDraft = false) {
  const lab = await prisma.lab.findUnique({
    where: { slug },
    include: {
      tags: true,
      cover: true,
      series: {
        select: {
          slug: true,
          title: true,
          titleEn: true,
          labs: {
            where: { status: 'PUBLISHED' },
            orderBy: [{ dayNumber: 'asc' }, { createdAt: 'asc' }],
            select: { slug: true, title: true, titleEn: true, dayNumber: true },
          },
        },
      },
    },
  });
  if (!lab) return null;
  if (lab.status !== 'PUBLISHED' && !allowDraft) return null;
  return lab;
}

export async function getProjectBySlug(slug: string, allowDraft = false) {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { tags: true, cover: true },
  });
  if (!project) return null;
  if (project.status !== 'PUBLISHED' && !allowDraft) return null;
  return project;
}

export async function getSeriesBySlug(slug: string) {
  return prisma.labSeries.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      cover: true,
      labs: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ dayNumber: 'asc' }, { createdAt: 'asc' }],
        include: { tags: true },
      },
    },
  });
}

/** Compteur de vues : volontairement silencieux, il ne doit jamais casser une page. */
export async function incrementViews(kind: 'lab' | 'project', id: string) {
  try {
    if (kind === 'lab') await prisma.lab.update({ where: { id }, data: { views: { increment: 1 } } });
    else await prisma.project.update({ where: { id }, data: { views: { increment: 1 } } });
  } catch {
    /* une vue perdue n'est pas un incident */
  }
}
