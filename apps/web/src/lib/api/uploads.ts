import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiFetch } from '../auth';

export interface UploadResult {
  url: string;
  key: string;
}

export interface ListingImageResult {
  id: string;
  url: string;
  alt: string | null;
  order: number;
  isPrimary: boolean;
  listingId: string;
  createdAt: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'UPLOAD_FAILED');
      }

      return res.json();
    },
  });
}

export function useAddListingImage(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { file: File; isPrimary?: boolean }): Promise<ListingImageResult> => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('isPrimary', String(params.isPrimary ?? false));

      const res = await apiFetch(`/uploads/listings/${listingId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'UPLOAD_FAILED');
      }

      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });
}

export function useRemoveListingImage(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      apiRequest(`/uploads/listings/${listingId}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });
}

export function useReorderListingImages(listingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: string[]) =>
      apiRequest(`/uploads/listings/${listingId}/images/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ imageIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });
}
