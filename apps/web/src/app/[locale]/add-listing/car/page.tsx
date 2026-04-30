'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { ListingForm } from '@/features/ads/components/listing-form';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreateListing } from '@/lib/api';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { useTranslations } from 'next-intl';

export default function AddCarListingPage() {
  return (
    <Suspense fallback={<><Navbar /><main className="pt-[75px] pb-16 max-w-[900px] mx-auto px-4"><div className="animate-pulse bg-surface-container-low h-96 rounded-3xl" /></main></>}>
      <AddCarContent />
    </Suspense>
  );
}

function AddCarContent() {
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
      router.push(`/sale/car/${listing.id}`);
    } catch (err) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : tp('addCarError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  const isLoading = createListing.isPending || uploading;

  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-[75px] pb-8 max-w-[900px] mx-auto px-4 md:px-8">
        <ListingForm
          initialData={{ listingType }}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          errorMessages={errorMessages}
          onClearErrors={() => setErrorMessages([])}
          submitLabel={uploading ? tp('addCarUploading') : tp('addCarSubmit')}
        />
      </main>
      <Footer />
    </AuthGuard>
  );
}
