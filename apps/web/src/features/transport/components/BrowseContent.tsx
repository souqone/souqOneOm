'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from './FilterSidebar';
import RequestsGrid from './RequestsGrid';
import ActiveFilterChips from './ActiveFilterChips';
import MobileFilterSheet from './MobileFilterSheet';
import type { GetRequestsParams, TransportServiceType, TransportRequestStatus } from '../types';

export interface BrowseFilters {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  fromWilayat?: string;
  toGovernorate?: string;
  toWilayat?: string;
  sortBy?: string;
}

function parseSortBy(sortBy?: string): Pick<GetRequestsParams, 'sortBy' | 'sortOrder'> {
  if (!sortBy) return {};
  const [field, order] = sortBy.split('_') as [string, string];
  const sortByMap: Record<string, GetRequestsParams['sortBy']> = {
    createdAt: 'createdAt',
    budgetMax: 'budgetMax',
    scheduledAt: 'scheduledAt',
  };
  return {
    sortBy: sortByMap[field],
    sortOrder: order === 'asc' ? 'asc' : 'desc',
  };
}

export default function BrowseContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<BrowseFilters>({
    serviceType: searchParams.get('serviceType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    fromGovernorate: searchParams.get('fromGovernorate') ?? undefined,
    toGovernorate: searchParams.get('toGovernorate') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = useCallback((newFilters: BrowseFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const requestParams: GetRequestsParams = {
    page: currentPage,
    limit: 12,
    ...(filters.serviceType && { serviceType: filters.serviceType as TransportServiceType }),
    ...(filters.status && { status: filters.status as TransportRequestStatus }),
    ...(filters.fromGovernorate && { fromGovernorate: filters.fromGovernorate }),
    ...(filters.toGovernorate && { toGovernorate: filters.toGovernorate }),
    ...parseSortBy(filters.sortBy),
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
            تصفّح طلبات النقل
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            ابحث عن طلبات النقل المناسبة وقدّم عروضك
          </p>
        </div>

        {/* Mobile filter trigger */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <MobileFilterSheet filters={filters} onApply={handleFilterChange} />
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips filters={filters} onChange={handleFilterChange} />

        {/* Layout */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <RequestsGrid params={requestParams} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
