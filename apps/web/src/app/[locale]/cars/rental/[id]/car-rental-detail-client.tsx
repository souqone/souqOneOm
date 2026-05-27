'use client';

import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useUnifiedListing } from '@/features/sale/hooks/useUnifiedListing';
import { getSaleConfig } from '@/features/sale/config/specs.config';
import { SalePageShell } from '@/features/sale/components/SalePageShell';
import { useTranslations } from 'next-intl';
import { useEnumTranslations } from '@/lib/enum-translations';

function Skeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse pt-4">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-6" />
        <div className="h-7 w-96 bg-surface-container-high rounded mb-3" />
        <div className="h-[370px] bg-surface-container-high rounded-2xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-surface-container-high rounded" style={{ width: `${80 - i * 5}%` }} />
            ))}
          </div>
          <div className="h-64 bg-surface-container-high rounded-2xl" />
        </div>
      </div>
    </>
  );
}

export default function CarRentalDetailClient() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('listing');
  const enumT = useEnumTranslations();

  const { listing, isLoading, error } = useUnifiedListing('car', id);

  if (isLoading) return <Skeleton />;
  if (error || !listing) notFound();

  const config = getSaleConfig(t, enumT)['car'];

  return (
    <>
      <Navbar />
      <div className="pt-2">
        <SalePageShell listing={listing} config={config} />
      </div>
      <Footer />
    </>
  );
}
