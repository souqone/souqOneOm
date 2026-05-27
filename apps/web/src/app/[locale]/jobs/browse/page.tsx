'use client';
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronRight, ChevronLeft } from 'lucide-react';
import JobCard from '@/features/jobs/components/JobCard';
import JobCardSkeleton from '@/features/jobs/components/JobCardSkeleton';
import JobFilterSidebar, { type JobFilters } from '@/features/jobs/components/JobFilterSidebar';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';
import { type JobsResponse } from '@/lib/api/jobs';
import { apiRequest } from '@/lib/auth';
import type { DriverJob } from '@/features/jobs/types';
import { STRINGS, SORT_OPTIONS, LICENSE_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/features/jobs/constants';
import { cn } from '@/lib/utils';

const DEFAULT_FILTERS: JobFilters = {
  jobType: '',
  employmentType: '',
  governorate: '',
  wilayat: '',
  licenseType: '',
  sortBy: 'createdAt_desc',
}

const PAGE_SIZE = 9

function BrowseJobsContent() {
  const searchParams = useSearchParams()
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [jobs, setJobs] = useState<DriverJob[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<JobFilters>({
    ...DEFAULT_FILTERS,
    jobType: searchParams.get('type') ?? '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const loadJobs = useCallback(async (
    activeFilters: JobFilters,
    search: string,
    page: number
  ) => {
    setLoading(true)
    setError(null)
    try {
      const [sortBy, sortOrder] = activeFilters.sortBy.split('_')
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      if (activeFilters.jobType) params.set('jobType', activeFilters.jobType)
      if (activeFilters.employmentType) params.set('employmentType', activeFilters.employmentType)
      if (activeFilters.governorate) params.set('governorate', activeFilters.governorate)
      if (activeFilters.licenseType) params.set('licenseType', activeFilters.licenseType)
      if (search) params.set('search', search)
      if (sortBy) params.set('sortBy', sortBy)
      if (sortOrder) params.set('sortOrder', sortOrder)
      const result = await apiRequest<JobsResponse>(`/jobs?${params.toString()}`)
      setJobs(result.items as unknown as DriverJob[])
      setTotalCount(result.meta.total)
      setTotalPages(result.meta.totalPages)
    } catch {
      setError(STRINGS.ERROR_GENERIC)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs(filters, searchQuery, currentPage)
  }, [filters, currentPage, loadJobs, searchQuery])

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1)
      loadJobs(filters, value, 1)
    }, 300)
  }

  const pageNumbers = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">{STRINGS.BROWSE_JOBS}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          تصفّح جميع إعلانات الوظائف والسائقين في السلطنة
        </p>
      </div>

      {/* Job Type Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {[
          { value: '', label: 'الكل', emoji: '' },
          { value: 'HIRING', label: 'طلب سائق', emoji: '🔵' },
          { value: 'OFFERING', label: 'عرض خدمة', emoji: '🟢' },
        ].map(tab => (
          <button
            key={`tab-${tab.value || 'all'}`}
            onClick={() => handleFilterChange('jobType', tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 border',
              filters.jobType === tab.value
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-on-surface-variant border-outline-variant hover:border-outline hover:text-on-surface'
            )}
          >
            {tab.emoji && <span>{tab.emoji}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 end-4 text-outline pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder={STRINGS.SEARCH_PLACEHOLDER}
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

      {/* Active Filter Pills */}
      {(filters.jobType || filters.employmentType || filters.governorate || filters.licenseType || searchQuery) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-primary border border-primary/20">
              بحث: {searchQuery}
              <button onClick={() => handleSearchChange('')} className="hover:text-error transition-colors">
                <X size={11} />
              </button>
            </span>
          )}
          {filters.jobType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-primary border border-primary/20">
              {filters.jobType === 'HIRING' ? 'طلب سائق' : 'عرض خدمة'}
              <button onClick={() => handleFilterChange('jobType', '')} className="hover:text-error transition-colors">
                <X size={11} />
              </button>
            </span>
          )}
          {filters.employmentType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-primary border border-primary/20">
              {EMPLOYMENT_TYPE_LABELS[filters.employmentType] ?? filters.employmentType}
              <button onClick={() => handleFilterChange('employmentType', '')} className="hover:text-error transition-colors">
                <X size={11} />
              </button>
            </span>
          )}
          {filters.governorate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-primary border border-primary/20">
              {filters.governorate}
              <button onClick={() => handleFilterChange('governorate', '')} className="hover:text-error transition-colors">
                <X size={11} />
              </button>
            </span>
          )}
          {filters.licenseType && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-primary border border-primary/20">
              {LICENSE_TYPE_LABELS[filters.licenseType] ?? filters.licenseType}
              <button onClick={() => handleFilterChange('licenseType', '')} className="hover:text-error transition-colors">
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <div className="hidden lg:block w-64 xl:w-72 shrink-0">
          <div className="card-base rounded-2xl p-5 sticky top-24">
            <JobFilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
              totalCount={totalCount}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: count + sort + mobile filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-on-surface">
                {STRINGS.RESULTS_COUNT(totalCount)}
              </span>
              {loading && (
                <span className="text-xs text-on-surface-variant animate-pulse">جاري التحميل...</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 btn-outline text-sm py-2 px-3"
              >
                <SlidersHorizontal size={14} />
                فلترة
              </button>
              {/* Sort select */}
              <select
                value={filters.sortBy}
                onChange={e => handleFilterChange('sortBy', e.target.value)}
                className="input-base text-sm w-auto py-2 pe-8"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={`sort-${opt.value}`} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="card-base rounded-2xl p-4 mb-4 border-error/30 bg-red-50">
              <p className="text-sm text-error font-bold">{error}</p>
              <button
                onClick={() => loadJobs(filters, searchQuery, currentPage)}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {/* Jobs Grid */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <JobCardSkeleton key={`skel-browse-${i}`} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <JobEmptyState
              title={STRINGS.EMPTY_JOBS}
              description="جرب تغيير الفلاتر أو البحث بكلمات مختلفة للعثور على ما تبحث عنه."
              onClear={handleClearFilters}
              ctaLabel="أنشئ أول إعلان"
              ctaHref="/jobs/new"
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {jobs.map(job => (
                <JobCard key={`browse-${job.id}`} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                  currentPage === 1
                    ? 'text-outline cursor-not-allowed' :'btn-outline p-0'
                )}
              >
                <ChevronRight size={16} />
              </button>

              {pageNumbers.map(n => (
                <button
                  key={`page-${n}`}
                  onClick={() => setCurrentPage(n)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-sm font-bold transition-all duration-150',
                    currentPage === n
                      ? 'bg-primary text-white shadow-sm'
                      : 'btn-outline'
                  )}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                  currentPage === totalPages
                    ? 'text-outline cursor-not-allowed' :'btn-outline p-0'
                )}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

          {/* Items per page + total */}
          {!loading && jobs.length > 0 && (
            <p className="text-xs text-on-surface-variant text-center mt-3">
              عرض {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} من {totalCount} إعلان
            </p>
          )}
        </div>
      </div>

      {/* Mobile Filter */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        totalCount={totalCount}
      />
    </div>
  )
}

export default function BrowseJobsPage() {
  return (
    <Suspense fallback={<div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 animate-pulse"><div className="h-10 bg-surface-dim rounded-xl mb-4 w-full" /><div className="h-64 bg-surface-dim rounded-2xl" /></div>}>
      <BrowseJobsContent />
    </Suspense>
  )
}

/* Mobile Filter Sheet */
function MobileFilterSheet({
  open, onClose, filters, onFilterChange, onClearFilters, totalCount,
}: {
  open: boolean; onClose: () => void;
  filters: JobFilters; onFilterChange: (key: keyof JobFilters, value: string) => void;
  onClearFilters: () => void; totalCount: number;
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bg-white rounded-t-3xl max-h-[calc(85vh-53px)] overflow-y-auto" style={{ bottom: 'calc(53px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="sticky top-0 bg-white border-b border-outline-variant px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h3 className="font-bold text-base text-on-surface">{STRINGS.FILTER_TITLE}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <JobFilterSidebar
            filters={filters}
            onChange={(key, value) => {
              onFilterChange(key, value)
            }}
            onClear={() => {
              onClearFilters()
              onClose()
            }}
            totalCount={totalCount}
          />
          <button
            onClick={onClose}
            className="btn-primary w-full mt-5 text-sm"
          >
            عرض {STRINGS.RESULTS_COUNT(totalCount)}
          </button>
        </div>
      </div>
    </div>
  )
}
