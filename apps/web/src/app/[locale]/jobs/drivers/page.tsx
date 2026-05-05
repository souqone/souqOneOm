'use client';
import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import DriverCard from '@/features/jobs/components/DriverCard';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';
import { useDrivers } from '@/lib/api/jobs';
import { OMAN_GOVERNORATES, LICENSE_TYPE_LABELS, STRINGS } from '@/features/jobs/constants';
import { cn } from '@/lib/utils';
import type { DriverProfile } from '@/features/jobs/types';

const PAGE_SIZE = 12

interface DriverFilters {
  governorate: string
  licenseType: string
  isAvailable: boolean | undefined
  isVerified: boolean | undefined
  sortBy: string
}

const DEFAULT_FILTERS: DriverFilters = {
  governorate: '',
  licenseType: '',
  isAvailable: undefined,
  isVerified: undefined,
  sortBy: 'rating_desc',
}

function DriverCardSkeleton() {
  return (
    <div className="card-base rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-surface-dim shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-surface-dim rounded-lg" />
          <div className="h-3 w-24 bg-surface-dim rounded-lg" />
        </div>
        <div className="h-6 w-20 bg-surface-dim rounded-full" />
      </div>
      <div className="flex gap-3 mb-3">
        <div className="h-4 w-16 bg-surface-dim rounded-lg" />
        <div className="h-4 w-20 bg-surface-dim rounded-lg" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-20 bg-surface-dim rounded-full" />
        <div className="h-5 w-20 bg-surface-dim rounded-full" />
      </div>
      <div className="h-9 bg-surface-dim rounded-xl" />
    </div>
  )
}

function BrowseDriversContent() {
  const searchParams = useSearchParams()
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<DriverFilters>({
    ...DEFAULT_FILTERS,
    governorate: searchParams.get('governorate') ?? '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const params: Record<string, string> = {
    page: String(currentPage),
    limit: String(PAGE_SIZE),
  }
  if (filters.governorate) params.governorate = filters.governorate
  if (filters.licenseType) params.licenseType = filters.licenseType
  if (filters.isAvailable === true) params.isAvailable = 'true'
  if (filters.isVerified === true) params.isVerified = 'true'
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, isError, refetch } = useDrivers(params)

  const rawDrivers = data?.items ?? []
  const totalCount = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  // Client-side sort
  let drivers = [...rawDrivers] as unknown as DriverProfile[]
  if (filters.sortBy === 'rating_desc') {
    drivers = drivers.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
  } else if (filters.sortBy === 'completion_desc') {
    drivers = drivers.sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0))
  } else if (filters.sortBy === 'response_asc') {
    drivers = drivers.sort((a, b) => (a.responseTimeHours ?? 999) - (b.responseTimeHours ?? 999))
  }

  const handleFilterChange = (key: keyof DriverFilters, value: DriverFilters[keyof DriverFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
    setDebouncedSearch('')
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setCurrentPage(1)
    }, 300)
  }

  const FilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-on-surface">{STRINGS.FILTER_TITLE}</h3>
        <button
          onClick={handleClearFilters}
          className="text-xs font-bold text-primary hover:underline"
        >
          {STRINGS.CLEAR_FILTERS}
        </button>
      </div>

      {/* Governorate */}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1.5">المحافظة</label>
        <select
          value={filters.governorate}
          onChange={e => handleFilterChange('governorate', e.target.value)}
          className="input-base text-sm w-full"
        >
          <option value="">جميع المحافظات</option>
          {OMAN_GOVERNORATES.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* License Type */}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1.5">نوع الرخصة</label>
        <div className="space-y-2">
          {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="licenseType"
                value={value}
                checked={filters.licenseType === value}
                onChange={() => handleFilterChange('licenseType', value)}
                className="accent-primary"
              />
              <span className="text-sm text-on-surface">{label}</span>
            </label>
          ))}
          {filters.licenseType && (
            <button
              onClick={() => handleFilterChange('licenseType', '')}
              className="text-xs text-primary hover:underline"
            >
              إلغاء التحديد
            </button>
          )}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-bold text-on-surface">متاح الآن فقط</span>
          <button
            onClick={() => handleFilterChange('isAvailable', filters.isAvailable === true ? undefined : true)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              filters.isAvailable === true ? 'bg-primary' : 'bg-outline-variant'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
              filters.isAvailable === true ? 'start-5' : 'start-0.5'
            )} />
          </button>
        </label>
      </div>

      {/* Verified */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-bold text-on-surface">موثّق فقط</span>
          <button
            onClick={() => handleFilterChange('isVerified', filters.isVerified === true ? undefined : true)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors duration-200',
              filters.isVerified === true ? 'bg-primary' : 'bg-outline-variant'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
              filters.isVerified === true ? 'start-5' : 'start-0.5'
            )} />
          </button>
        </label>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-bold text-on-surface-variant mb-1.5">الترتيب</label>
        <select
          value={filters.sortBy}
          onChange={e => handleFilterChange('sortBy', e.target.value)}
          className="input-base text-sm w-full"
        >
          <option value="rating_desc">الأعلى تقييماً</option>
          <option value="completion_desc">نسبة الإتمام</option>
          <option value="response_asc">الأسرع رداً</option>
        </select>
      </div>
    </div>
  )

  return (
    <>
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">{STRINGS.BROWSE_DRIVERS}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          تصفّح السائقين المحترفين المتاحين في السلطنة
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 end-4 text-outline pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="ابحث عن سائق..."
          className="input-base pe-11 text-sm h-11"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute top-1/2 -translate-y-1/2 start-3 text-outline hover:text-on-surface transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <div className="hidden lg:block w-64 xl:w-72 shrink-0">
          <div className="card-base rounded-2xl p-5 sticky top-24">
            <FilterPanel />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-on-surface">
              {STRINGS.RESULTS_COUNT(totalCount)}
            </span>
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 btn-outline text-sm py-2 px-3"
            >
              <SlidersHorizontal size={14} />
              فلترة
            </button>
          </div>

          {/* Error state */}
          {isError && (
            <div className="card-base rounded-2xl p-4 mb-4 border-error/30 bg-red-50">
              <p className="text-sm text-error font-bold">{STRINGS.ERROR_GENERIC}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <DriverCardSkeleton key={`skel-driver-${i}`} />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <JobEmptyState
              title="لا يوجد سائقون"
              description="جرب تغيير الفلاتر أو البحث بكلمات مختلفة."
              onClear={handleClearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {drivers.map(driver => (
                <DriverCard key={`driver-${driver.id}`} driver={driver} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-sm font-bold transition-colors',
                    currentPage === page
                      ? 'bg-primary text-white' :'border border-outline-variant hover:bg-surface text-on-surface'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Mobile Filter Drawer */}
    {mobileFilterOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} />
        <div className="absolute bottom-0 start-0 end-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-on-surface">{STRINGS.FILTER_TITLE}</h3>
            <button onClick={() => setMobileFilterOpen(false)}>
              <X size={20} className="text-on-surface-variant" />
            </button>
          </div>
          <FilterPanel />
          <button
            onClick={() => setMobileFilterOpen(false)}
            className="btn-amber w-full mt-4"
          >
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    )}
    </>
  )
}

export default function BrowseDriversPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">{STRINGS.LOADING}</div>}>
      <BrowseDriversContent />
    </Suspense>
  )
}
