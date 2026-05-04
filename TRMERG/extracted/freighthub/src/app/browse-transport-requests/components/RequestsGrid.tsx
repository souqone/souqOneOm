'use client';

import { AlertCircle, PackageOpen, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRequests } from '@/features/transport/hooks/useRequests';
import TransportRequestCard from '@/features/transport/components/TransportRequestCard';
import RequestCardSkeleton from '@/features/transport/components/RequestCardSkeleton';
import type { GetRequestsParams } from '@/features/transport/types';

interface RequestsGridProps {
  params: GetRequestsParams;
  page: number;
  onPageChange: (page: number) => void;
}

export default function RequestsGrid({ params, page, onPageChange }: RequestsGridProps) {
  const { data, isLoading, isError, refetch } = useRequests(params);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-[var(--color-surface-container-high)] rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <RequestCardSkeleton key={`browse-skeleton-${i + 1}`} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-light)] flex items-center justify-center">
          <AlertCircle size={28} className="text-[var(--color-error)]" />
        </div>
        <div>
          <p className="font-bold text-[var(--color-on-surface)] mb-1">تعذّر تحميل الطلبات</p>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            تحقق من اتصالك بالإنترنت وأعد المحاولة
          </p>
        </div>
        <button onClick={() => refetch()} className="btn-navy text-sm py-2.5 px-5">
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-[var(--color-surface-container-high)] flex items-center justify-center">
          <PackageOpen size={36} className="text-[var(--color-on-surface-muted)]" />
        </div>
        <div>
          <p className="font-bold text-lg text-[var(--color-on-surface)] mb-2">
            لا توجد طلبات نقل مطابقة
          </p>
          <p className="text-sm text-[var(--color-on-surface-variant)] max-w-xs">
            جرّب تغيير الفلاتر أو مسحها للاطلاع على جميع الطلبات المتاحة
          </p>
        </div>
      </div>
    );
  }

  const { meta } = data;
  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div dir="rtl">
      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          عرض{' '}
          <span className="font-bold text-[var(--color-on-surface)]">
            {startItem}–{endItem}
          </span>{' '}
          من{' '}
          <span className="font-bold text-[var(--color-on-surface)]">{meta.total}</span>{' '}
          طلب
        </p>
        <span className="text-xs text-[var(--color-on-surface-muted)]">
          صفحة {meta.page} من {meta.totalPages}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.items.map((request) => (
          <TransportRequestCard
            key={`browse-req-${request.id}`}
            request={request}
            href={`/requests/${request.id}`}
          />
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <ChevronRight size={16} />
            السابق
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={`page-btn-${p}`}
                onClick={() => onPageChange(p)}
                className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150 ${
                  p === page
                    ? 'bg-[var(--color-brand-navy)] text-white'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= meta.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            التالي
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}