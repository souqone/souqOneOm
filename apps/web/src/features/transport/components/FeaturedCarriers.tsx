'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Award, Shield } from 'lucide-react';
import { useCarriers } from '../hooks/useCarriers';
import CarrierCard from './CarrierCard';

export default function FeaturedCarriers() {
  const t = useTranslations('transport');
  
  // Fetch verified carriers (we pass isVerified=true and limit=4 to the API)
  const { data, isLoading, isError } = useCarriers({ isVerified: true, limit: 4 });

  if (isError) return null; // Gracefully hide the section if there's an error

  return (
    <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand-amber)]/10 flex items-center justify-center flex-shrink-0">
              <Award className="text-[var(--color-brand-amber)]" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                {t('featuredCarriersTitle')}
              </h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
                {t('featuredCarriersSubtitle')}
              </p>
            </div>
          </div>
          <Link
            href="/transport/browse?tab=carriers"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-navy)] hover:text-[var(--color-brand-amber)] transition-colors"
          >
            {t('viewAllCarriers')}
            <ArrowLeft size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-carrier-${i}`} className="card-base rounded-2xl p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface-dim)] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-[var(--color-surface-dim)] rounded-lg" />
                    <div className="h-3 w-20 bg-[var(--color-surface-dim)] rounded-lg" />
                  </div>
                </div>
                <div className="h-10 bg-[var(--color-surface-dim)] rounded-xl" />
              </div>
            ))}
          </div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-10 text-[var(--color-on-surface-variant)]">
            <Shield size={32} className="mx-auto mb-3 opacity-40 text-[var(--color-brand-navy)]" />
            <p className="font-medium text-sm">{t('empty.carriers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {data?.items.map(carrier => (
              <CarrierCard key={`featured-carrier-${carrier.id}`} carrier={carrier} />
            ))}
          </div>
        )}
        
        <div className="mt-6 sm:hidden flex justify-center">
          <Link
            href="/transport/browse?tab=carriers"
            className="inline-flex items-center gap-1.5 text-sm font-bold btn-outline-primary px-6 py-2.5 rounded-xl"
          >
            {t('viewAllCarriers')}
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
