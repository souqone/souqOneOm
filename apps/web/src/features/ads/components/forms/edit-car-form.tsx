'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ListingForm } from '@/features/ads/components/listing-form';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { useListing, useUpdateListing } from '@/lib/api';
import { useRemoveListingImage } from '@/lib/api/uploads';
import { useImageUpload } from '@/features/ads/hooks/use-image-upload';
import { carListingSchema } from '@/features/ads/validations/listing.schema';
import { mapCarListingToForm } from '@/lib/adapters/listing-adapter';
import { getImageUrl } from '@/lib/image-utils';
import { useToast } from '@/components/toast';
import { useTranslations } from 'next-intl';

export function EditCarForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  // Data Fetching
  const { data: car, isLoading: isFetching, isError } = useListing(id);
  const updateListing = useUpdateListing(id);
  const removeImage = useRemoveListingImage(id);
  
  // Hooks & State
  const { uploadImages, isUploading } = useImageUpload();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  // Tracking original images
  const initialImageIdsRef = useRef<string[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && car?.images && car.images.length > 0) {
      initialImageIdsRef.current = car.images.map((img: any) => img.id).filter(Boolean);
      initializedRef.current = true;
    }
  }, [car]);

  async function handleSubmit(data: Record<string, unknown>, images: UploadedImage[]) {
    setErrorMessages([]);
    try {
      // 1. Zod Validation
      const parsedData = carListingSchema.parse(data);

      // 2. API Call (Update Data)
      await updateListing.mutateAsync(parsedData);

      // 3. Remove deleted images
      const currentIds = new Set(images.filter(img => img.id).map(img => img.id));
      const removedIds = initialImageIdsRef.current.filter(imgId => !currentIds.has(imgId));
      for (const imgId of removedIds) {
        try {
          await removeImage.mutateAsync(imgId);
        } catch {
          // ignore — image may already be deleted
        }
      }

      // 4. Upload new images using the centralized hook
      const newImages = images.filter((img) => img.file);
      if (newImages.length > 0) {
        const result = await uploadImages(id, newImages);
        if (!result.success) {
          setErrorMessages(result.errors);
          addToast('error', tp('errUploadFailed'));
          return;
        }
      }

      // 5. Success
      initialImageIdsRef.current = images.filter(img => img.id).map(img => img.id as string);
      addToast('success', tp('editListingSaved'));
      router.push(`/sale/car/${id}`);
      
    } catch (err: any) {
      if (err.name === 'ZodError') {
        const messages = err.errors.map((e: any) => e.message);
        setErrorMessages(messages);
      } else {
        const msg = err instanceof Error ? err.message : tp('editListingError');
        setErrorMessages(msg.split('\n').filter(Boolean));
      }
    }
  }

  if (isFetching) {
    return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  }
  
  if (isError || !car) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  // Use the adapter to map data cleanly
  const initialData = mapCarListingToForm({ ...car, price: car.price != null ? Number(car.price) : null } as Parameters<typeof mapCarListingToForm>[0]);

  // Convert existing DB images to UploadedImage format
  const existingImages: UploadedImage[] = (car.images || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((img: any, i: number) => ({
      id: img.id,
      url: getImageUrl(img.url) || img.url,
      isPrimary: img.isPrimary,
      order: i,
    }));

  const isBusy = updateListing.isPending || isUploading;

  return (
    <ListingForm
      initialData={initialData}
      initialImages={existingImages}
      onSubmit={handleSubmit}
      isLoading={isBusy}
      errorMessages={errorMessages}
      onClearErrors={() => setErrorMessages([])}
      submitLabel={isUploading ? tp('editListingUploading') : tp('editListingSave')}
      title={tp('editListingTitle')}
    />
  );
}
