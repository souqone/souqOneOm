'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { ListingItem } from '@/lib/api/listings';

interface FeaturedShowroomProps {
  items: ListingItem[];
  isLoading: boolean;
}

export function FeaturedShowroom({ items, isLoading }: FeaturedShowroomProps) {
  const t = useTranslations('home');
  const { transformCar } = useItemTransformers();
  return (
    <section className="bg-surface-container-low dark:bg-surface-dim py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap justify-between items-end gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="h-6 sm:h-8 w-1 bg-primary" />
              <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('latestCars')}</h2>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm">{t('latestCarsDesc')}</p>
          </div>
          <Link
            href="/browse/cars"
            className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors"
          >
            {t('viewAll')}
          </Link>
        </div>

        <CardGrid
          items={items}
          mapItem={transformCar}
          isLoading={isLoading}
          emptyIcon="directions_car"
          emptyMessage={t('noListingsNow')}
        />
      </div>
    </section>
  );
}
