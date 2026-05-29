'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useRequests } from '../hooks/useRequests';
import TransportRequestCard from './TransportRequestCard';
import RequestCardSkeleton from './RequestCardSkeleton';

export default function LatestRequests() {
  const t = useTranslations('transport');
  const { data, isLoading, isError } = useRequests({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' });

  return (
    <section className="py-8 sm:py-12" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              {t('latestRequests')}
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-0.5">
              {t('latestRequestsSubtitle')}
            </p>
          </div>
          <Link
            href="/transport/browse"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-navy)] hover:text-[var(--color-brand-amber)] transition-colors"
          >
            {t('viewAll')}
            <ArrowLeft size={16} />
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RequestCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 p-4 bg-[var(--color-error-light)] border border-red-200 rounded-2xl">
            <AlertCircle size={18} className="text-[var(--color-error)] flex-shrink-0" />
            <p className="text-sm text-[var(--color-error)]">
              {t('errors.loadFailed')}
            </p>
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.items.map((request) => (
                <TransportRequestCard key={request.id} request={request} />
              ))}
            </div>
            {data.items.length === 0 && (
              <p className="text-center text-sm text-[var(--color-on-surface-muted)] py-8">
                {t('empty.requests')}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
