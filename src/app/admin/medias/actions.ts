'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cloudinaryConfigured, destroyAsset, uploadAsset } from '@/lib/cloudinary';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('Non autorisé.');
}

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export type UploadResult = { url: string | null; error: string | null };

/**
 * Upload d'une image. Renvoie l'URL publique, utilisée aussi bien par la
 * bibliothèque que par le glisser-déposer dans l'éditeur.
 */
export async function uploadMedia(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  if (!cloudinaryConfigured) {
    return { url: null, error: 'Cloudinary n’est pas configuré (voir .env.local).' };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: 'Aucun fichier reçu.' };
  }
  if (!ALLOWED.includes(file.type)) {
    return { url: null, error: `Format non accepté (${file.type || 'inconnu'}).` };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Fichier trop lourd : 8 Mo maximum.' };
  }

  const alt = String(formData.get('alt') ?? '').trim() || file.name;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadAsset(buffer, file.name);

    await prisma.media.upsert({
      where: { publicId: asset.publicId },
      update: { ...asset, alt },
      create: { ...asset, alt },
    });

    revalidatePath('/admin/medias');
    return { url: asset.url, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload échoué.';
    return { url: null, error: message };
  }
}

/** Supprime le média chez Cloudinary ET en base — sinon on garde des orphelins. */
export async function deleteMedia(id: string) {
  await requireAdmin();

  const media = await prisma.media.findUnique({ where: { id }, select: { publicId: true } });
  if (!media) return;

  if (cloudinaryConfigured) {
    try {
      await destroyAsset(media.publicId);
    } catch {
      /* Le fichier a pu être supprimé côté Cloudinary : on retire quand même la ligne. */
    }
  }

  await prisma.media.delete({ where: { id } });
  revalidatePath('/admin/medias');
}

export async function updateMediaAlt(id: string, alt: string) {
  await requireAdmin();
  await prisma.media.update({ where: { id }, data: { alt: alt.trim() } });
  revalidatePath('/admin/medias');
}
