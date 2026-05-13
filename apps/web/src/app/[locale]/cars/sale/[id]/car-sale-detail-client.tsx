'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ErrorState } from '@/components/error-state';
import { useUnifiedListing } from '@/features/sale/hooks/useUnifiedListing';
import { getSaleConfig } from '@/features/sale/config/specs.config';
import { SalePageShell } from '@/features/sale/components/SalePageShell';
import { useTranslations } from 'next-intl';
import { useEnumTranslations } from '@/lib/enum-translations';

function SalePageSkeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-28 lg:pb-16 animate-pulse">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-5" />
        <div className="h-7 w-96 bg-surface-container-high rounded mb-3" />
        <div className="h-4 w-64 bg-surface-container-high rounded mb-6" />
        <div
          className="grid gap-1 rounded-2xl overflow-hidden mb-8"
          style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '185px 185px' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`bg-surface-container-high ${i === 0 ? 'row-span-2' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-high" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-container-high rounded" />
                <div className="h-3 w-24 bg-surface-container-high rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-container-high rounded-2xl" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded" />
            </div>
          </div>
          <div className="h-96 bg-surface-container-high rounded-2xl" />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function CarSaleDetailClient() {
  const { id } = useParams<{ id: string }>();
  const type = 'car' as const;

  const router = useRouter();
  const ts = useTranslations('sale');
  const enumT = useEnumTranslations();

  const { listing, isLoading, isError, error, refetch, redirectTo } = useUnifiedListing(type, id);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isLoading || redirectTo) {
    return <SalePageSkeleton />;
  }

  if (isError || !listing) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-5xl mx-auto px-4 md:px-8">
            <ErrorState
              onRetry={() => refetch()}
              message={error?.message || ts('notFound')}
            />
          </main>
        </div>
        <Footer />
      </>
    );
  }

  const config = getSaleConfig(ts, enumT)[type];

  return (
    <>
      <Navbar />
      <SalePageShell listing={listing} config={config} />
      <Footer />
    </>
  );
}
