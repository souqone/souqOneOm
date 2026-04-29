'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { JobItem } from '@/lib/api';

interface JobsSectionProps {
  items: JobItem[];
  isLoading: boolean;
}

export function JobsSection({ items, isLoading }: JobsSectionProps) {
  const t = useTranslations('home');
  const { transformJob } = useItemTransformers();
  return (
    <section className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="h-6 sm:h-8 w-1 bg-primary" />
              <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('driverJobs')}</h2>
            </div>
            <p className="text-on-surface-variant text-xs sm:text-sm">{t('driverJobsDesc')}</p>
          </div>
          <Link href="/jobs" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors shrink-0">
            {t('viewAll')}
          </Link>
        </div>

        <CardGrid
          items={items.slice(0, 4)}
          mapItem={transformJob}
          isLoading={isLoading}
          cols={4}
          emptyIcon="work_off"
          emptyMessage={t('noJobsNow')}
          emptyAction={{ label: t('addJobListing'), href: '/jobs/new' }}
        />
      </div>
    </section>
  );
}
