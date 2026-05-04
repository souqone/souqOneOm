'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useRequests } from '@/features/transport/hooks/useRequests';
import TransportRequestCard from '@/features/transport/components/TransportRequestCard';
import RequestCardSkeleton from '@/features/transport/components/RequestCardSkeleton';

export default function LatestRequests() {
  const { data, isLoading, isError, refetch } = useRequests({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' });

  return (
    <section className="py-12 sm:py-16 bg-[var(--color-surface-container)]" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2
              className="text-xl sm:text-2xl text-[var(--color-on-surface)]"
              style={{ fontWeight: 800 }}
            >
              أحدث طلبات النقل
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
              طلبات جديدة تنتظر عروضك
            </p>
          </div>
          <Link
            href="/browse-transport-requests"
            className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-navy)] hover:text-[var(--color-brand-amber)] transition-colors duration-150"
          >
            عرض الكل
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 })?.map((_, i) => (
              <RequestCardSkeleton key={`skeleton-latest-${i + 1}`} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-error-light)] flex items-center justify-center">
              <AlertCircle size={24} className="text-[var(--color-error)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-on-surface)] mb-1">تعذّر تحميل الطلبات</p>
              <p className="text-sm text-[var(--color-on-surface-variant)]">تحقق من اتصالك بالإنترنت وأعد المحاولة</p>
            </div>
            <button
              onClick={() => refetch()}
              className="btn-navy text-sm py-2 px-4"
            >
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !isError && data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items?.map((request) => (
              <TransportRequestCard
                key={`latest-req-${request?.id}`}
                request={request}
                href={`/requests/${request?.id}`}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        {!isLoading && !isError && (
          <div className="mt-8 text-center">
            <Link
              href="/browse-transport-requests"
              className="btn-navy inline-flex text-sm py-3 px-8"
            >
              تصفح جميع الطلبات
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}