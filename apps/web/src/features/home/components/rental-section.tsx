'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { ListingItem } from '@/lib/api/listings';

interface RentalSectionProps {
  items: ListingItem[];
  isLoading: boolean;
}

export function RentalSection({ items, isLoading }: RentalSectionProps) {
  const tp = useTranslations('pages');
  const { transformCar } = useItemTransformers();
  return (
    <section className="py-6 sm:py-10 bg-surface-container-low dark:bg-surface-dim">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="h-6 sm:h-8 w-1 bg-primary" />
              <h2 className="text-base sm:text-xl md:text-3xl font-black">{tp('rentalTitle')}</h2>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm">{tp('rentalSubtitle')}</p>
          </div>
          <Link href="/browse/cars?listingType=RENTAL" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors shrink-0">
            {tp('rentalViewAll')}
          </Link>
        </div>

        <CardGrid
          items={items}
          mapItem={transformCar}
          isLoading={isLoading}
          emptyIcon="car_rental"
          emptyMessage={tp('rentalEmpty')}
          emptyAction={{ label: tp('rentalAddCar'), href: '/add-listing' }}
        />
      </div>
    </section>
  );
}
