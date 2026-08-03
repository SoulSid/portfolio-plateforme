import { uploadMedia } from '@/app/admin/medias/actions';

/**
 * Passerelle entre l'éditeur et la bibliothèque de médias : un fichier déposé
 * dans le contenu part sur Cloudinary et revient sous forme d'URL publique.
 */
export async function uploadFromEditor(file: File): Promise<string | null> {
  const data = new FormData();
  data.set('file', file);
  data.set('alt', file.name.replace(/\.[^.]+$/, ''));
  const result = await uploadMedia(data);
  if (result.error) {
    window.alert(result.error);
    return null;
  }
  return result.url;
}
