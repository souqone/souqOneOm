'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { CarServiceItem } from '@/lib/api/services';

interface ServicesShowcaseProps {
  items: CarServiceItem[];
  isLoading: boolean;
}

export function ServicesShowcase({ items, isLoading }: ServicesShowcaseProps) {
  const t = useTranslations('home');
  const { transformService } = useItemTransformers();

  return (
    <section className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap justify-between items-end gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="h-6 sm:h-8 w-1 bg-primary" />
              <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('latestServices')}</h2>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm">{t('latestServicesDesc')}</p>
          </div>
          <Link href="/browse/services" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
            {t('viewAll')}
          </Link>
        </div>

        <CardGrid
          items={items.slice(0, 4)}
          mapItem={transformService}
          isLoading={isLoading}
          emptyIcon="build"
          emptyMessage={t('noServicesNow')}
        />
      </div>
    </section>
  );
}
