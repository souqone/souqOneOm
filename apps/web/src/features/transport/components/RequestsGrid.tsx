'use client';

import { AlertCircle, PackageOpen } from 'lucide-react';
import { useRequests } from '../hooks/useRequests';
import TransportRequestCard from './TransportRequestCard';
import RequestCardSkeleton from './RequestCardSkeleton';
import type { GetRequestsParams } from '../types';
import { useTranslations } from 'next-intl';

interface RequestsGridProps {
  params: GetRequestsParams;
  onPageChange: (page: number) => void;
}

export default function RequestsGrid({ params, onPageChange }: RequestsGridProps) {
  const t = useTranslations('transport');
  const { data, isLoading, isError } = useRequests(params);
  const currentPage = params.page ?? 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <RequestCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 p-5 bg-[var(--color-error-light)] border border-red-200 rounded-2xl">
        <AlertCircle size={20} className="text-[var(--color-error)] flex-shrink-0" />
        <p className="text-sm text-[var(--color-error)]">
          {t('emptyStates.loadFailed')}
        </p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] flex items-center justify-center">
          <PackageOpen size={28} className="text-[var(--color-on-surface-muted)]" />
        </div>
        <p className="text-base font-bold text-[var(--color-on-surface)]">{t('emptyStates.noRequests')}</p>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {t('emptyStates.tryFilters')}
        </p>
      </div>
    );
  }

  const { meta } = data;

  return (
    <div dir="rtl">
      {/* Results count */}
      <p className="text-xs text-[var(--color-on-surface-muted)] mb-4">
        {t('showingResults', {
          from: (currentPage - 1) * (params.limit ?? 12) + 1,
          to: Math.min(currentPage * (params.limit ?? 12), meta.total),
          total: meta.total.toLocaleString('en-US')
        })}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {data.items.map((request) => (
          <TransportRequestCard key={request.id} request={request} />
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => { onPageChange(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage <= 1}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] disabled:opacity-40 hover:bg-[var(--color-surface-container)] transition-colors"
          >
            {t('previous')}
          </button>
          <span className="text-sm text-[var(--color-on-surface-variant)]">
            {currentPage} / {meta.totalPages}
          </span>
          <button
            onClick={() => { onPageChange(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage >= meta.totalPages}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] disabled:opacity-40 hover:bg-[var(--color-surface-container)] transition-colors"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
