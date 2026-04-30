'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { ListingForm, ListingFormData } from '@/features/ads/components/listing-form';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { DetailSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useListing, useUpdateListing } from '@/lib/api';
import { useRemoveListingImage } from '@/lib/api/uploads';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations } from 'next-intl';

export default function EditCarListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: car, isLoading, isError, refetch } = useListing(id);
  const updateListing = useUpdateListing(id);
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const removeImage = useRemoveListingImage(id);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const initialImageIdsRef = useRef<string[]>([]);
  const initializedRef = useRef(false);

  async function handleSubmit(data: Record<string, unknown>, images: UploadedImage[]) {
    setErrorMessages([]);
    try {
      await updateListing.mutateAsync(data);

      // Delete removed images from backend
      const currentIds = new Set(images.filter(img => img.id).map(img => img.id));
      const removedIds = initialImageIdsRef.current.filter(imgId => !currentIds.has(imgId));
      for (const imgId of removedIds) {
        try {
          await removeImage.mutateAsync(imgId);
        } catch {
          // ignore — image may already be deleted
        }
      }

      // Upload new images (those with a File object)
      const newImages = images.filter((img) => img.file);
      if (newImages.length > 0) {
        setUploading(true);

        for (const img of newImages) {
          if (img.file) {
            const formData = new FormData();
            formData.append('file', img.file);
            formData.append('isPrimary', String(img.isPrimary));

            const res = await apiFetch(`/uploads/listings/${id}/images`, {
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

      // Update ref to reflect current saved state (prevents stale IDs on re-submit)
      initialImageIdsRef.current = images.filter(img => img.id).map(img => img.id as string);

      addToast('success', tp('editListingSaved'));
      router.push(`/sale/car/${id}`);
    } catch (err) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : tp('editListingError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  // Populate initial image IDs once after car data loads
  useEffect(() => {
    if (!initializedRef.current && car?.images && car.images.length > 0) {
      initialImageIdsRef.current = car.images.map(img => img.id).filter(Boolean);
      initializedRef.current = true;
    }
  }, [car]);

  if (isLoading) return <><Navbar /><DetailSkeleton /></>;
  if (isError || !car) return <><Navbar /><div className="pt-28 px-8"><ErrorState onRetry={() => refetch()} /></div></>;

  const initialData: Partial<ListingFormData> = {
    title: car.title,
    make: car.make,
    model: car.model,
    year: car.year,
    price: String(car.price),
    currency: car.currency,
    mileage: car.mileage ? String(car.mileage) : '',
    fuelType: car.fuelType || '',
    transmission: car.transmission || '',
    condition: car.condition || '',
    bodyType: car.bodyType || '',
    exteriorColor: car.exteriorColor || '',
    interiorColor: car.interior || '',
    engineSize: car.engineSize || '',
    horsepower: car.horsepower ? String(car.horsepower) : '',
    doors: car.doors ? String(car.doors) : '',
    seats: car.seats ? String(car.seats) : '',
    driveType: car.driveType || '',
    features: car.features ?? [],
    description: car.description || '',
    governorate: car.governorate || '',
    city: car.city || '',
    latitude: car.latitude ?? null,
    longitude: car.longitude ?? null,
    isPriceNegotiable: car.isPriceNegotiable,
    listingType: (car.listingType as 'SALE' | 'RENTAL' | 'WANTED') ?? 'SALE',
    dailyPrice: car.dailyPrice ? String(car.dailyPrice) : '',
    weeklyPrice: car.weeklyPrice ? String(car.weeklyPrice) : '',
    monthlyPrice: car.monthlyPrice ? String(car.monthlyPrice) : '',
    minRentalDays: car.minRentalDays ? String(car.minRentalDays) : '1',
    depositAmount: car.depositAmount ? String(car.depositAmount) : '',
    kmLimitPerDay: car.kmLimitPerDay ? String(car.kmLimitPerDay) : '',
    withDriver: car.withDriver ?? false,
    deliveryAvailable: car.deliveryAvailable ?? false,
    insuranceIncluded: car.insuranceIncluded ?? false,
    cancellationPolicy: car.cancellationPolicy || '',
  };

  // Convert existing DB images to UploadedImage format
  const existingImages: UploadedImage[] = (car.images || [])
    .sort((a, b) => {
      const aOrder = 'order' in a ? (a as { order: number }).order : 0;
      const bOrder = 'order' in b ? (b as { order: number }).order : 0;
      return aOrder - bOrder;
    })
    .map((img, i) => ({
      id: img.id,
      url: getImageUrl(img.url) || img.url,
      isPrimary: img.isPrimary,
      order: i,
    }));

  const isBusy = updateListing.isPending || uploading;

  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-[75px] pb-16 max-w-[900px] mx-auto px-4 md:px-8">

        <ListingForm
          initialData={initialData}
          initialImages={existingImages}
          onSubmit={handleSubmit}
          isLoading={isBusy}
          errorMessages={errorMessages}
          onClearErrors={() => setErrorMessages([])}
          submitLabel={uploading ? tp('editListingUploading') : tp('editListingSave')}
          title={tp('editListingTitle')}
        />
      </main>
      <Footer />
    </AuthGuard>
  );
}
