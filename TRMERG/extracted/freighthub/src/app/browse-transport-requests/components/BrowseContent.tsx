'use client';

import { useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import FilterSidebar from './FilterSidebar';
import RequestsGrid from './RequestsGrid';
import ActiveFilterChips from './ActiveFilterChips';
import MobileFilterSheet from './MobileFilterSheet';
import type { GetRequestsParams, TransportServiceType, RequestStatus } from '@/features/transport/types';

export interface BrowseFilters {
  serviceType?: TransportServiceType;
  status?: RequestStatus;
  fromGovernorate?: string;
  toGovernorate?: string;
  sortBy?: 'createdAt' | 'budgetMax' | 'scheduledAt';
  sortOrder?: 'asc' | 'desc';
}

export default function BrowseContent() {
  const [filters, setFilters] = useState<BrowseFilters>({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const handleFilterChange = useCallback((newFilters: BrowseFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleClearFilter = useCallback((key: keyof BrowseFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const queryParams: GetRequestsParams = {
    ...filters,
    page,
    limit: 12,
  };

  const activeFilterCount = Object.keys(filters).filter(
    (k) => filters[k as keyof BrowseFilters] !== undefined
  ).length;

  return (
    <div dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl text-[var(--color-on-surface)]"
            style={{ fontWeight: 800 }}
          >
            تصفّح طلبات النقل
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            ابحث عن الطلبات المناسبة وقدّم عرضك
          </p>
        </div>

        {/* Mobile Filter Button */}
        <button
          className="md:hidden relative flex items-center gap-2 btn-navy text-sm py-2.5 px-4"
          onClick={() => setMobileFilterOpen(true)}
        >
          <SlidersHorizontal size={16} />
          تصفية
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[var(--color-brand-amber)] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAll}
      />

      {/* Main Layout */}
      <div className="flex gap-6 mt-4">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <FilterSidebar filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <RequestsGrid
            params={queryParams}
            page={page}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={(f) => {
          handleFilterChange(f);
          setMobileFilterOpen(false);
        }}
      />
    </div>
  );
}