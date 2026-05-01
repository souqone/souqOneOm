'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ListingForm } from '@/features/ads/components/listing-form';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreateListing } from '@/lib/api';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { useTranslations } from 'next-intl';

export function AddCarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingType = (searchParams.get('type') as 'SALE' | 'RENTAL') || 'SALE';
  const createListing = useCreateListing();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(data: Record<string, unknown>, images: UploadedImage[]) {
    setErrorMessages([]);
    try {
      const listing = await createListing.mutateAsync(data);

      if (images.length > 0) {
        setUploading(true);

        for (const img of images) {
          if (img.file) {
            const formData = new FormData();
            formData.append('file', img.file);
            formData.append('isPrimary', String(img.isPrimary));

            const res = await apiFetch(`/uploads/listings/${listing.id}/images`, {
              method: 'POST',
              body: formData,
            });
            if (!res.ok) {
              const err = await res.json().catch(() => null);
              throw new Error(err?.message || tp('errUploadFailed'));
            }
          }
        }
        setUploading(false);
      }

      addToast('success', tp('addCarSuccess'));
      router.push(`${listingType === 'RENTAL' ? '/rental' : '/sale'}/car/${listing.id}`);
    } catch (err) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : tp('addCarError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  const isLoading = createListing.isPending || uploading;

  return (
    <ListingForm
      initialData={{ listingType }}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      errorMessages={errorMessages}
      onClearErrors={() => setErrorMessages([])}
      submitLabel={uploading ? tp('addCarUploading') : tp('addCarSubmit')}
    />
  );
}
