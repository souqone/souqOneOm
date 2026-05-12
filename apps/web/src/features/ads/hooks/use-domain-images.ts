import { useState } from 'react';
import { apiFetch } from '@/lib/auth';
import type { UploadedImage } from '@/features/ads/components/image-uploader';

export type ImageDomain = 'buses' | 'cars' | 'equipment' | 'parts' | 'services';

export function useDomainImages(domain: ImageDomain) {
  const [images, setImages] = useState<UploadedImage[]>([]);

  async function uploadImages(listingId: string, imgs: UploadedImage[]) {
    for (const img of imgs) {
      if (!img.file) continue;
      const fd = new FormData();
      fd.append('file', img.file);
      fd.append('isPrimary', String(img.isPrimary));
      const res = await apiFetch(`/uploads/${domain}/${listingId}/images`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'فشل رفع الصورة');
      }
    }
  }

  function hydrateImages(source: Array<{ id: string; url: string; isPrimary: boolean; order?: number }>) {
    setImages(
      source
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((img, i) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary, order: i })),
    );
  }

  return { images, setImages, uploadImages, hydrateImages };
}
