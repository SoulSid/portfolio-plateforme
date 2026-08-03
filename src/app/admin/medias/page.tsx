import { prisma } from '@/lib/prisma';
import { cloudinaryConfigured } from '@/lib/cloudinary';
import { MediaLibrary, type MediaItem } from '@/components/admin/MediaLibrary';

export const metadata = { title: 'Médias — Administration' };
export const dynamic = 'force-dynamic';

export default async function MediasPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' } });

  const items: MediaItem[] = media.map((m) => ({
    id: m.id,
    url: m.url,
    alt: m.alt,
    width: m.width,
    height: m.height,
    bytes: m.bytes,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <h1 className="font-display text-2xl font-bold tracking-tight">Médias</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Les images envoyées ici sont hébergées sur Cloudinary. Copiez une URL pour l&apos;utiliser
        dans un article, ou déposez directement une image dans l&apos;éditeur.
      </p>
      <MediaLibrary items={items} configured={cloudinaryConfigured} />
    </>
  );
}
