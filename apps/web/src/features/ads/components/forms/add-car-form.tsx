'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ListingForm } from '@/features/ads/components/listing-form';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreateListing } from '@/lib/api';
import { useImageUpload } from '@/features/ads/hooks/use-image-upload';
import { carListingSchema } from '@/features/ads/validations/listing.schema';
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
  const { uploadImages, isUploading } = useImageUpload();

  async function handleSubmit(data: Record<string, unknown>, images: UploadedImage[]) {
    setErrorMessages([]);
    try {
      // 1. Zod Validation
      const parsedData = carListingSchema.parse(data);

      // 2. Create Listing API Call
      const listing = await createListing.mutateAsync(parsedData);

      // 3. Upload Images using Hook
      if (images.length > 0) {
        const result = await uploadImages(listing.id, images);
        if (!result.success) {
          setErrorMessages(result.errors);
          // We don't throw here to at least show the listing was created but images failed
          addToast('error', tp('errUploadFailed'));
          return;
        }
      }

      addToast('success', tp('addCarSuccess'));
      router.push(`${listingType === 'RENTAL' ? '/rental' : '/sale'}/car/${listing.id}`);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        const messages = err.errors.map((e: any) => e.message);
        setErrorMessages(messages);
      } else {
        const msg = err instanceof Error ? err.message : tp('addCarError');
        setErrorMessages(msg.split('\n').filter(Boolean));
      }
    }
  }

  const isLoading = createListing.isPending || isUploading;

  return (
    <ListingForm
      initialData={{ listingType }}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      errorMessages={errorMessages}
      onClearErrors={() => setErrorMessages([])}
      submitLabel={isUploading ? tp('addCarUploading') : tp('addCarSubmit')}
    />
  );
}
