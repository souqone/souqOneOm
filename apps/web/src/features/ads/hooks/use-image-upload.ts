import { useState } from 'react';
import { apiFetch } from '@/lib/auth';

/**
 * Interface representing an uploaded image with a file payload.
 */
export interface UploadImagePayload {
  file?: File;
  isPrimary?: boolean;
}

export interface UploadImagesResult {
  success: boolean;
  uploadedCount: number;
  errors: string[];
}

/**
 * Custom hook for handling listing image uploads sequentially.
 * Includes progress tracking, file size validation, and robust error handling.
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  /**
   * Uploads an array of images for a specific listing.
   * 
   * @param listingId - The ID of the created or edited listing.
   * @param images - An array of image objects containing the file and isPrimary flag.
   * @returns A promise resolving to the upload result summary.
   */
  async function uploadImages(listingId: string, images: UploadImagePayload[]): Promise<UploadImagesResult> {
    const filesToUpload = images.filter((img) => img.file instanceof File);
    const result: UploadImagesResult = { success: true, uploadedCount: 0, errors: [] };

    if (filesToUpload.length === 0) {
      return result;
    }

    setIsUploading(true);
    setProgress({ current: 0, total: filesToUpload.length });

    for (let i = 0; i < filesToUpload.length; i++) {
      const img = filesToUpload[i];
      const file = img.file!;

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        result.errors.push(`الملف ${file.name} يتجاوز الحجم المسموح به (5MB).`);
        result.success = false;
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isPrimary', String(!!img.isPrimary));

        const res = await apiFetch(`/uploads/listings/${listingId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || `فشل في رفع الملف ${file.name}`);
        }

        result.uploadedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'خطأ غير معروف أثناء الرفع';
        result.errors.push(msg);
        result.success = false;
      } finally {
        setProgress((prev) => ({ ...prev, current: i + 1 }));
      }
    }

    setIsUploading(false);
    return result;
  }

  return {
    uploadImages,
    isUploading,
    progress,
  };
}
