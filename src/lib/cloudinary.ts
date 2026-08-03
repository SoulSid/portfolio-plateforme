import { v2 as cloudinary } from 'cloudinary';

/**
 * Client Cloudinary — serveur uniquement.
 * Les clés ne doivent JAMAIS franchir la frontière du navigateur : seul
 * NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME est public, et il ne permet rien à lui seul.
 */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const FOLDER = 'portfolio';

export interface UploadedAsset {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/** Envoie un fichier à Cloudinary depuis un buffer. */
export async function uploadAsset(buffer: Buffer, filename: string): Promise<UploadedAsset> {
  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: FOLDER, resource_type: 'image', filename_override: filename },
        (error, uploaded) => {
          if (error || !uploaded) reject(error ?? new Error('Upload échoué.'));
          else resolve(uploaded as unknown as Record<string, unknown>);
        },
      )
      .end(buffer);
  });

  return {
    url: String(result.secure_url),
    publicId: String(result.public_id),
    width: Number(result.width),
    height: Number(result.height),
    bytes: Number(result.bytes),
  };
}

/** Supprime définitivement un fichier de Cloudinary. */
export async function destroyAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
