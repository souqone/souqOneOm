'use client'

import { Suspense, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import {
  Search, X, Loader2, SearchX, TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CardSkeleton } from '@/components/loading-skeleton'

import { useGlobalSearch } from '../hooks/useGlobalSearch'
import { useFilterState } from '../hooks/useFilterState'
import { UnifiedCard } from './UnifiedCard'
import { ActiveFilters } from './ActiveFilters'
import { FilterSidebar } from './FilterSidebar'
import type { ListingCategory } from '../types/category.types'
import {
  ALL_SEARCH_CATEGORIES,
  CATEGORY_META,
  SEARCH_SORT_OPTIONS,
  getAllCategorySpecificKeys,
  type SearchCategory,
} from '../config/search-engine.config'

// FilterSidebar and ActiveFilters natively handle __global__ now.

// ─── Category Tab Component ──────────────────────────────────────────────────

function CategoryTabs({
  active,
  onSelect,
}: {
  active: SearchCategory | ''
  onSelect: (cat: SearchCategory | '') => void
}) {
  const tabs: { value: SearchCategory | ''; labelAr: string; icon: string }[] = [
    { value: '', labelAr: 'الكل', icon: 'grid_view' },
    ...ALL_SEARCH_CATEGORIES.map(cat => ({
      value: cat,
      labelAr: CATEGORY_META[cat].labelAr,
      icon: CATEGORY_META[cat].icon,
    })),
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
      {tabs.map(tab => {
        const isActive = active === tab.value
        return (
          <button
            key={tab.value || 'all'}
            onClick={() => onSelect(tab.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] whitespace-nowrap',
              'transition-all duration-150 ease-out border active:scale-95',
              isActive
                ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/20'
                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/40 hover:text-primary',
            )}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span className="font-semibold">{tab.labelAr}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Trending/Suggested Searches ─────────────────────────────────────────────

const TRENDING_SEARCHES = ['تويوتا', 'لاندكروزر', 'إيجار', 'صيانة', 'سائق']

// ─── Top-level export ─────────────────────────────────────────────────────────

export function BrowseGlobalShell() {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ShellContent />
    </Suspense>
  )
}

function ShellFallback() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">
        <div className="h-14 bg-outline-variant/20 rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Shell Content ────────────────────────────────────────────────────────────

function ShellContent() {
  const t = useTranslations('listings')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read category from URL params (unified routing)
  const urlCategory = (searchParams.get('category') || '') as SearchCategory | ''

  // FilterState for shared filters (governorate, price)
  const { filters, setFilter, clearAll, hasActiveFilters } = useFilterState('__global__' as unknown as ListingCategory)

  // Core search params from URL
  const q = searchParams.get('q') || ''
  const page = Number(searchParams.get('page') ?? '1')

  const [searchQuery, setSearchQuery] = useState(q)
  useEffect(() => { setSearchQuery(q) }, [q])

  // Fetch from Meilisearch
  const { items, total, totalPages, isLoading, isFetching } = useGlobalSearch({
    q,
    category: urlCategory || undefined,
    filters,
    page,
  })

  // ── Handlers ──

  const submitSearch = (query: string = searchQuery) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (query.trim()) params.set('q', query.trim())
    else params.delete('q')
    router.push(`/browse?${params.toString()}`)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitSearch()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')
    router.push(`/browse?${params.toString()}`)
  }

  const handleCategorySelect = (cat: SearchCategory | '') => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear ALL category-specific filters to prevent stale params
    // e.g. switching cars→jobs should NOT carry `make=Toyota`
    const categoryKeys = getAllCategorySpecificKeys()
    for (const key of categoryKeys) {
      params.delete(key)
    }

    if (cat) params.set('category', cat)
    else params.delete('category')
    params.delete('page')
    router.push(`/browse?${params.toString()}`)
  }

  const handleFilterChange = (key: string, value: string | boolean | null) => {
    if (key !== 'page') setFilter('page', null)
    setFilter(key, value)
  }

  // Active category label
  const activeCategoryLabel = urlCategory ? CATEGORY_META[urlCategory]?.labelAr : 'كل الإعلانات'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-surface-container-lowest to-background border-b border-outline-variant/30 pb-5 pt-4">
        <div className="max-w-7xl mx-auto px-6">

          {/* Title row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-primary/5 border border-primary/10 shadow-sm flex items-center justify-center text-primary">
              <Search size={22} strokeWidth={2.5} />
            </div>
            <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-on-surface leading-none">
              {q ? t('resultsFor', { q }) : activeCategoryLabel}
            </h1>
          </div>

          {/* Search input */}
          <div className="relative w-full max-w-2xl">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="ابحث عن سيارات، قطع، خدمات، وظائف..."
              className="w-full h-14 rounded-full border border-outline-variant/50 bg-surface-container-lowest/50 pr-6 pl-24 text-[14px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-sm transition-all text-right"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute left-[60px] top-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-full transition-colors z-10"
              >
                <X size={15} />
              </button>
            )}
            <button
              onClick={() => submitSearch()}
              className="absolute left-1.5 top-1.5 w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 z-10"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Category tabs */}
          <div className="mt-5">
            <CategoryTabs active={urlCategory} onSelect={handleCategorySelect} />
          </div>

        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 flex gap-6 items-start py-5">

        {/* Sidebar */}
        <FilterSidebar
          category={'__global__' as unknown as ListingCategory}
          filters={filters}
          onFilterChange={handleFilterChange}
          onFiltersChange={(updates) => Object.entries(updates).forEach(([k, v]) => setFilter(k, v))}
          onClearAll={clearAll}
        />

        <main className="flex-1 min-w-0 pb-16">

          {/* Sort + count */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-[13px] text-on-surface-variant">
              {isLoading
                ? <span className="h-4 w-24 bg-surface-container rounded animate-pulse inline-block" />
                : `${total.toLocaleString('en-US')} ${t('advertisement')}`}
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-on-surface-variant">{t('sortBy')}:</span>
              <select
                value={(filters['sort'] as string) || ''}
                onChange={(e) => setFilter('sort', e.target.value || null)}
                className="h-8 rounded-lg border border-outline-variant/60 bg-background px-2.5 text-[12px] text-on-surface focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                {SEARCH_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || '_default'} value={opt.value}>
                    {opt.labelAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters */}
          {hasActiveFilters && (
            <div className="mb-4">
              <ActiveFilters
                category={'__global__' as unknown as ListingCategory}
                filters={filters}
                onRemove={(key) => setFilter(key, null)}
                onClearAll={clearAll}
              />
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* ── Zero Results — Smart Fallback ── */}
          {!isLoading && total === 0 && (q || urlCategory || hasActiveFilters) && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-outline-variant/30 rounded-xl bg-background mt-4">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <SearchX size={30} className="text-on-surface-variant/40" />
              </div>
              <h3 className="text-[15px] font-medium text-on-surface mb-1">{t('noResults')}</h3>
              <p className="text-[13px] text-on-surface-variant mb-5">{t('tryChangeFilters')}</p>

              {/* Suggested actions */}
              <div className="flex flex-col gap-3 items-center">
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <X size={14} />
                    {t('clearFilters')}
                  </button>
                )}

                {/* Trending searches */}
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                    <TrendingUp size={14} />
                    <span>الأكثر بحثاً</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {TRENDING_SEARCHES.map((s) => (
                      <button
                        key={s}
                        onClick={() => submitSearch(s)}
                        className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[12px] text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty state (no search yet) ── */}
          {!isLoading && !q && !urlCategory && !hasActiveFilters && total === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <Search size={28} className="text-on-surface-variant/40" />
              </div>
              <h3 className="text-[15px] font-medium text-on-surface mb-1">
                ابدأ البحث
              </h3>
              <p className="text-[13px] text-on-surface-variant mb-5">
                ابحث عن أي إعلان أو اختر فئة من الأعلى
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {TRENDING_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => submitSearch(s)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[12px] text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Results Grid ── */}
          {!isLoading && total > 0 && (
            <>
              {!urlCategory ? (
                // Federated View
                <div className="flex flex-col gap-8">
                  {Object.entries(
                    items.reduce((acc, item) => {
                      if (!acc[item.category]) acc[item.category] = [];
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, typeof items>)
                  ).map(([cat, catItems]) => (
                    <div key={cat} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-[17px] font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            {CATEGORY_META[cat as SearchCategory]?.icon}
                          </span>
                          {CATEGORY_META[cat as SearchCategory]?.labelAr}
                        </h2>
                        {catItems.length >= 4 && (
                          <button
                            onClick={() => handleCategorySelect(cat as SearchCategory)}
                            className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            عرض المزيد
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {catItems.slice(0, 4).map((item) => (
                          <UnifiedCard key={item.id} item={item} className="h-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Flat View (Category Specific)
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {items.map((item) => (
                      <UnifiedCard key={item.id} item={item} className="h-full" />
                    ))}
                  </div>

                  {totalPages > page && (
                    <div className="flex justify-center mt-8 pb-8">
                      <button
                        onClick={() => setFilter('page', String(page + 1))}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface font-medium hover:border-outline-variant/80 hover:bg-surface-container/50 disabled:opacity-50 transition-all bg-background shadow-sm"
                      >
                        {isFetching
                          ? <Loader2 size={15} className="animate-spin text-primary" />
                          : <span>{t('loadMore')}</span>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </main>
      </div>

      <Footer />
    </div>
  )
}

// Suppress unused-link warning
void Link
