import { apiFetch } from '@/lib/auth';
import type { UploadedImage } from '@/features/ads/components/image-uploader';

/**
 * Upload images to a listing entity.
 *
 * @param uploadEndpoint - Base endpoint (e.g. '/uploads/buses')
 * @param entityId       - The created entity ID
 * @param images         - Array of UploadedImage (only those with .file are uploaded)
 */
export async function uploadImages(
  uploadEndpoint: string,
  entityId: string,
  images: UploadedImage[],
): Promise<void> {
  const filesToUpload = images.filter((img) => img.file);

  for (const img of filesToUpload) {
    const fd = new FormData();
    fd.append('file', img.file!);
    fd.append('isPrimary', String(img.isPrimary));

    const res = await apiFetch(`${uploadEndpoint}/${entityId}/images`, {
      method: 'POST',
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'Image upload failed');
    }
  }
}
