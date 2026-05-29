'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, Truck, XCircle } from 'lucide-react';
import FilterSidebar from './FilterSidebar';
import RequestsGrid from './RequestsGrid';
import ActiveFilterChips from './ActiveFilterChips';
import MobileFilterSheet from './MobileFilterSheet';
import { useAuth } from '@/providers/auth-provider';
import { useMyCarrierProfile } from '@/features/transport/api';
import type { GetRequestsParams, TransportServiceType, TransportRequestStatus } from '../types';

export interface BrowseFilters {
  serviceType?: string;
  status?: string;
  fromGovernorate?: string;
  fromWilayat?: string;
  fromCity?: string;
  toGovernorate?: string;
  toWilayat?: string;
  toCity?: string;
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
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { data: carrierProfile } = useMyCarrierProfile(isAuthenticated);
  const isCarrier = !!carrierProfile;

  const t = useTranslations('transport');
  const [filters, setFilters] = useState<BrowseFilters>({
    serviceType: searchParams.get('serviceType') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    fromGovernorate: searchParams.get('fromGovernorate') ?? undefined,
    fromWilayat: searchParams.get('fromWilayat') ?? undefined,
    fromCity: searchParams.get('fromCity') ?? undefined,
    toGovernorate: searchParams.get('toGovernorate') ?? undefined,
    toWilayat: searchParams.get('toWilayat') ?? undefined,
    toCity: searchParams.get('toCity') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // B-1: re-sync React state when the browser navigates back/forward
  // (filters are pushed via window.history.replaceState, not Next.js router,
  // so we need a popstate listener to pull the URL back into state)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      setFilters({
        serviceType:     p.get('serviceType')     ?? undefined,
        status:          p.get('status')          ?? undefined,
        fromGovernorate: p.get('fromGovernorate') ?? undefined,
        fromWilayat:     p.get('fromWilayat')     ?? undefined,
        fromCity:        p.get('fromCity')         ?? undefined,
        toGovernorate:   p.get('toGovernorate')   ?? undefined,
        toWilayat:       p.get('toWilayat')       ?? undefined,
        toCity:          p.get('toCity')           ?? undefined,
        sortBy:          p.get('sortBy')           ?? undefined,
      });
      setCurrentPage(1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleFilterChange = useCallback((newFilters: BrowseFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    // Sync to URL via history API (avoids Next.js router re-render)
    const params = new URLSearchParams();
    if (newFilters.serviceType) params.set('serviceType', newFilters.serviceType);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.fromGovernorate) params.set('fromGovernorate', newFilters.fromGovernorate);
    if (newFilters.fromWilayat) params.set('fromWilayat', newFilters.fromWilayat);
    if (newFilters.fromCity) params.set('fromCity', newFilters.fromCity);
    if (newFilters.toGovernorate) params.set('toGovernorate', newFilters.toGovernorate);
    if (newFilters.toWilayat) params.set('toWilayat', newFilters.toWilayat);
    if (newFilters.toCity) params.set('toCity', newFilters.toCity);
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    const qs = params.toString();
    const newUrl = `${pathname}${qs ? '?' + qs : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [pathname]);

  const requestParams: GetRequestsParams = {
    page: currentPage,
    limit: 12,
    ...(filters.serviceType && { serviceType: filters.serviceType as TransportServiceType }),
    ...(filters.status && { status: filters.status as TransportRequestStatus }),
    ...(filters.fromGovernorate && { fromGovernorate: filters.fromGovernorate }),
    ...(filters.fromWilayat && { fromWilayat: filters.fromWilayat }),
    ...(filters.fromCity && { fromCity: filters.fromCity }),
    ...(filters.toGovernorate && { toGovernorate: filters.toGovernorate }),
    ...(filters.toWilayat && { toWilayat: filters.toWilayat }),
    ...(filters.toCity && { toCity: filters.toCity }),
    ...parseSortBy(filters.sortBy),
  };

  // Count active filters for the mobile badge
  const activeFilterCount = [
    filters.serviceType,
    filters.status,
    filters.fromGovernorate,
    filters.toGovernorate,
    filters.sortBy,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[var(--color-background)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
            {t('browseTitle')}
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            {t('browseSubtitle')}
          </p>
        </div>

        {/* Carrier CTA for unauthenticated visitors */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-[var(--color-brand-navy)]/10 border border-[var(--color-brand-navy)]/20 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-navy)] flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-on-surface)]">{t('carrierCtaTitle')}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)]">{t('carrierCtaSubtitle')}</p>
              </div>
            </div>
            <Link
              href="/transport/carriers/register"
              className="btn-primary text-sm px-4 py-2 flex-shrink-0"
            >
              {t('registerAsCarrier')}
            </Link>
          </div>
        )}

        {/* Carrier CTA for authenticated non-carrier users */}
        {isAuthenticated && !isCarrier && (
          <div className="flex items-center justify-between gap-4 p-4 mb-4 rounded-2xl border border-[var(--color-brand-navy)]/20 bg-[var(--color-brand-navy)]/5">
            <div>
              <p className="font-semibold text-sm text-[var(--color-on-surface)]">
                {t('carrierCtaAuthTitle')}
              </p>
              <p className="text-xs text-[var(--color-on-surface-muted)] mt-0.5">
                {t('carrierCtaAuthSubtitle')}
              </p>
            </div>
            <Link
              href="/transport/carriers/register"
              className="btn-primary text-sm whitespace-nowrap flex-shrink-0"
            >
              {t('registerAsCarrier')}
            </Link>
          </div>
        )}

        {/* Mobile filter trigger */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <MobileFilterSheet filters={filters} onApply={handleFilterChange} />
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-brand-navy)] text-white text-xs font-bold">
              <SlidersHorizontal size={12} />
              {activeFilterCount} {t('activeFilters')}
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={() => handleFilterChange({})}
              className="flex items-center gap-1 text-xs text-[var(--color-error)] font-semibold hover:opacity-80 transition-opacity"
            >
              <XCircle size={13} />
              {t('clearFilters')}
            </button>
          )}
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
            <RequestsGrid 
              params={requestParams} 
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
