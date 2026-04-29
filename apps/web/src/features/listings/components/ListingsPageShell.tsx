'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { 
  SlidersHorizontal, ChevronLeft, Search, Plus, X, 
  List, LayoutGrid, Loader2, SearchX, Clock,
  Car, Bus, Wrench, Settings, Briefcase, HardHat
} from 'lucide-react'
import { clsx } from 'clsx'

import type { ListingCategory } from '../types/category.types'
import { CATEGORY_META, VALID_CATEGORIES } from '../types/category.types'
import { CATEGORY_SORT_OPTIONS } from '../config/filters.config'
import { useUnifiedListings } from '../hooks/useUnifiedListings'
import { useFilterState } from '../hooks/useFilterState'
import { useRecentSearches } from '../hooks/useRecentSearches'
import { getAddListingHref } from '../utils/filter-helpers'
import { CATEGORY_SLIDER_MAP, type SliderItem } from '../data'
import { useDebounce } from '@/hooks/useDebounce'
import { useSuggestions } from '@/lib/api/listings'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

import { FilterSidebar } from './FilterSidebar'
import { FilterSheet } from './FilterSheet'
import { ActiveFilters } from './ActiveFilters'
import { ListingCard } from './ListingCard'
import { ListingCardSkeleton } from './ListingCardSkeleton'
import { UnifiedCard } from './UnifiedCard'
import { CardSkeleton } from '@/components/loading-skeleton'

// ── Icons ────────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
const CATEGORY_ICON: Record<ListingCategory, LucideIcon> = {
  cars: Car, buses: Bus, equipment: Wrench,
  'equipment-requests': Wrench, operators: HardHat,
  parts: Settings, services: Briefcase, jobs: Briefcase,
}

function CategoryBar({ currentCategory }: { currentCategory: ListingCategory }) {
  return (
    <div className="bg-background/80 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-30 pt-2 pb-2 sm:pt-3 sm:pb-3">
      <div className="w-full px-2.5 sm:max-w-4xl sm:mx-auto sm:px-6">
        {/* Full-width capsule — no icons on mobile, compact text */}
        <div className="flex items-center p-1 sm:p-1.5 bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/40 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-300">
          {VALID_CATEGORIES.map((cat, index) => {
            const m = CATEGORY_META[cat]
            const isActive = cat === currentCategory
            const Icon = CATEGORY_ICON[cat]
            const isLast = index === VALID_CATEGORIES.length - 1
            
            return (
              <div key={cat} className="flex items-center flex-1 min-w-0">
                <Link
                  href={`/browse/${cat}`}
                  className={clsx(
                    'flex flex-row items-center justify-center gap-1.5 sm:gap-2.5 px-1 py-2 sm:px-5 sm:py-3 w-full rounded-full transition-all duration-300 group',
                    isActive 
                      ? 'bg-primary text-on-primary shadow-md shadow-primary/20 scale-[1.02]' 
                      : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  <Icon 
                    size={18} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={clsx(
                      "hidden sm:block w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 flex-shrink-0", 
                      isActive ? "text-on-primary" : "text-on-surface-variant group-hover:text-primary"
                    )} 
                  />
                  <span className={clsx(
                    "text-[8px] sm:text-[13px] whitespace-nowrap tracking-tighter sm:tracking-wide", 
                    isActive ? 'font-bold' : 'font-semibold'
                  )}>
                    {m.labelAr}
                  </span>
                </Link>
                
                {/* Vertical Divider */}
                {!isLast && (
                  <div className="w-[1px] h-4 sm:h-8 bg-outline-variant/30 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Reusable Category Slider Component ───────────────────────────────────────
function CategorySlider({
  items, title, defaultFilterKey, filters, onFilterChange, page, setPage,
}: {
  items: SliderItem[]
  title: string
  defaultFilterKey: string
  filters: Record<string, unknown>
  onFilterChange: (key: string, value: string | boolean | null) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

  return (
    <div className="bg-surface-container-lowest border-b border-outline-variant/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative group">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-on-surface tracking-wide">{title}</h2>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-on-surface-variant font-medium">
              {page + 1} / {totalPages}
            </span>
          )}
        </div>

        {/* Navigation Arrow — Left (Next in RTL) */}
        {totalPages > 1 && (
          <div className="absolute inset-y-0 -left-1 hidden sm:flex items-center z-20">
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-surface-container-high border border-outline-variant/30 shadow-md text-on-surface-variant",
                page >= totalPages - 1
                  ? "opacity-0 scale-90 pointer-events-none"
                  : "hover:bg-primary hover:text-on-primary hover:border-primary hover:shadow-lg opacity-0 group-hover:opacity-100"
              )}
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
          </div>
        )}

        {/* Navigation Arrow — Right (Prev in RTL) */}
        {totalPages > 1 && (
          <div className="absolute inset-y-0 -right-1 hidden sm:flex items-center z-20">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-surface-container-high border border-outline-variant/30 shadow-md text-on-surface-variant",
                page === 0
                  ? "opacity-0 scale-90 pointer-events-none"
                  : "hover:bg-primary hover:text-on-primary hover:border-primary hover:shadow-lg opacity-0 group-hover:opacity-100"
              )}
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        )}

        {/* Slider Content — touch swipeable */}
        <div
          className="overflow-hidden rounded-2xl touch-pan-y"
          onTouchStart={(e) => {
            const touch = e.touches[0]
            ;(e.currentTarget as any)._touchStartX = touch.clientX
            ;(e.currentTarget as any)._touchStartY = touch.clientY
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX
            const startY = (e.currentTarget as any)._touchStartY
            if (startX == null) return
            const endX = e.changedTouches[0].clientX
            const endY = e.changedTouches[0].clientY
            const diffX = startX - endX
            const diffY = Math.abs(startY - endY)
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
              if (diffX > 0) setPage(p => Math.min(totalPages - 1, p + 1))
              else setPage(p => Math.max(0, p - 1))
            }
          }}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${page * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIdx) => (
              <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 grid-rows-2 gap-2 sm:gap-4 px-1 sm:px-6">
                {items.slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE).map((item, idx) => {
                  const fKey = item.filterKey || defaultFilterKey
                  const isActive = item.isBoolean
                    ? filters[fKey] === true || filters[fKey] === 'true'
                    : filters[fKey] === item.value

                  return (
                    <button
                      key={item.value + fKey}
                      onClick={() => {
                        if (item.isBoolean) onFilterChange(fKey, isActive ? null : true)
                        else onFilterChange(fKey, isActive ? null : item.value)
                      }}
                      className={clsx(
                        "flex flex-col items-center gap-2 sm:gap-2.5 py-3 sm:py-4 px-1 sm:px-2 rounded-xl transition-all duration-300",
                        idx >= 6 && "hidden sm:flex",
                        idx >= 8 && "sm:hidden lg:flex",
                        isActive
                          ? "bg-primary-fixed/60 ring-1 ring-primary/30 shadow-sm"
                          : "hover:bg-surface-container hover:shadow-sm"
                      )}
                    >
                      {/* Visual — logo / img / icon */}
                      {item.logo ? (
                        <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.logo}
                            alt={item.name}
                            className={clsx(
                              "w-9 h-9 sm:w-12 sm:h-12 object-contain transition-all duration-300",
                              isActive ? "scale-110" : "opacity-75"
                            )}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <span
                            style={{ display: 'none' }}
                            className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-primary-fixed items-center justify-center text-primary font-bold text-base sm:text-lg"
                          >
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      ) : (
                        <div className={clsx(
                          "w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden",
                          item.img
                            ? "bg-surface-container"
                            : isActive
                              ? `bg-gradient-to-br ${item.gradient} scale-110 shadow-md`
                              : `bg-gradient-to-br ${item.gradient} opacity-75`,
                          isActive && item.img && "ring-2 ring-primary/30 shadow-md scale-105"
                        )}>
                          {item.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.img} alt={item.name} className={clsx(
                              "w-full h-full object-cover transition-all duration-300",
                              isActive ? "scale-110" : "opacity-90"
                            )} />
                          ) : (
                            <span className="material-symbols-outlined text-white text-xl sm:text-2xl">{item.icon}</span>
                          )}
                        </div>
                      )}

                      {/* Label */}
                      <span className={clsx(
                        "text-[10px] sm:text-[11px] text-center font-bold tracking-tight truncate w-full leading-tight",
                        isActive ? "text-primary" : "text-on-surface-variant"
                      )}>
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 sm:mt-5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  page === i
                    ? "w-8 bg-primary"
                    : "w-2 bg-outline-variant/40 hover:bg-outline-variant"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Shell Export ────────────────────────────────────────────────────────

interface ListingsPageShellProps {
  category: ListingCategory
}

export function ListingsPageShell({ category }: ListingsPageShellProps) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <ShellContent category={category} />
    </Suspense>
  )
}

function ShellFallback() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-4 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-10 bg-outline-variant/30 rounded-lg animate-pulse mb-6" />
          <div className="h-14 bg-outline-variant/30 rounded-xl animate-pulse mb-8" />
          <div className="flex gap-6">
            <div className="hidden lg:block w-[308px] h-[600px] bg-outline-variant/20 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ── Shell Content ────────────────────────────────────────────────────────────

function ShellContent({ category }: { category: ListingCategory }) {
  const t = useTranslations('listings')
  const meta = CATEGORY_META[category]
  const sortOptions = CATEGORY_SORT_OPTIONS[category]
  const CategoryIcon = CATEGORY_ICON[category]

  // Filter State (from URL params)
  const { filters, setFilter, setFilters, clearAll, activeCount, hasActiveFilters } = useFilterState(category)

  // Local State
  const [fabSheetOpen, setFabSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState((filters['q'] as string) || '')
  const [sliderPage, setSliderPage] = useState(0)
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()
  const { data: suggestions = [], isFetching: isFetchingSuggestions } = useSuggestions(debouncedSearch)

  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Sync search state with URL when initial loads
  useEffect(() => {
    setSearchQuery((filters['q'] as string) || '')
  }, [filters])

  const sort = (filters['sort'] as string) ?? sortOptions[0]?.value ?? ''
  const page = Number(filters['page'] ?? '1')

  // Fetch Data
  const { items, total, totalPages, isLoading, isFetching } = useUnifiedListings(category, filters, page)

  // Handlers
  const submitSearch = (query: string = searchQuery) => {
    if (query.trim()) addSearch(query)
    setSearchQuery(query)
    setFilter('page', null)
    setFilter('q', query || null)
    setIsSearchFocused(false)
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setFilter('page', null)
    setFilter('q', null)
  }

  const handleFilterChange = (key: string, value: string | boolean | null) => {
    if (key !== 'page') setFilter('page', null)
    setFilter(key, value)
  }

  const handleFiltersChange = (updates: Record<string, string | boolean | null>) => {
    setFilters({ ...updates, page: null })
  }

  const handleSave = (id: string) => {
    // TODO: wire to favorites API
    console.log('save', id)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CategoryBar currentCategory={category} />

      {/* ── 1. Premium Header (Breadcrumb + Search + Action) ──────────────── */}
      <div className="bg-gradient-to-b from-surface-container-lowest to-background border-b border-outline-variant/30 pb-4 sm:pb-5 pt-2 sm:pt-3">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-2">
            
            {/* Title & Breadcrumb Group */}
            <div className="flex flex-col gap-1.5 flex-shrink-0 w-full md:w-auto">
              
              {/* Premium Title */}
              <div className="flex items-center gap-3">
                {/* Clean, Elegant Icon Box */}
                <div className="w-12 h-12 rounded-[14px] bg-primary/5 border border-primary/10 shadow-sm flex items-center justify-center text-primary">
                  <CategoryIcon size={22} strokeWidth={2.5} />
                </div>
                
                {/* Sharp, Heavy Typography */}
                <h1 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-on-surface leading-none">
                  {meta.labelAr}
                </h1>
              </div>
              
              {/* Minimalist Breadcrumb */}
              <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/70 mt-1 px-1">
                <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
                <ChevronLeft size={14} className="text-outline-variant/60" />
                <span className="text-on-surface/90">{meta.labelAr}</span>
                
                {(filters['q'] as string) && (
                  <>
                    <ChevronLeft size={14} className="text-outline-variant/60" />
                    <span className="text-on-surface">
                      {filters['q']}
                    </span>
                  </>
                )}
              </nav>
            </div>

            {/* Search */}
            <div ref={searchContainerRef} className="relative w-full md:max-w-xl lg:max-w-2xl mx-auto group z-40">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={t('searchIn', { category: meta.labelAr })}
                className={clsx(
                  "w-full h-12 sm:h-14 border border-outline-variant/50 bg-surface-container-lowest/50 pr-4 sm:pr-6 pl-20 sm:pl-24 text-[13px] sm:text-[14px] placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 shadow-sm transition-all text-right",
                  isSearchFocused && (searchQuery ? suggestions.length > 0 : recentSearches.length > 0) 
                    ? "rounded-t-3xl rounded-b-none border-b-transparent shadow-md"
                    : "rounded-full hover:shadow-md"
                )}
              />
              
              {/* Clear Button */}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute left-[60px] top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container p-1.5 rounded-full transition-colors z-10"
                >
                  <X size={15} />
                </button>
              )}

              {/* Primary Search Button (Like Airbnb) */}
              <button
                onClick={() => submitSearch()}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 z-10"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>

              {/* Dropdown (Recent Searches / Suggestions) */}
              {isSearchFocused && (searchQuery ? suggestions.length > 0 : recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-background border border-outline-variant/50 border-t-0 rounded-b-3xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50">
                    <span className="text-[12px] font-semibold text-on-surface-variant">
                      {searchQuery ? 'اقتراحات' : 'عمليات البحث السابقة'}
                    </span>
                    {!searchQuery && (
                      <button 
                        onClick={clearSearches}
                        className="text-[11px] text-primary hover:underline"
                      >
                        مسح السجل
                      </button>
                    )}
                    {searchQuery && isFetchingSuggestions && (
                      <Loader2 size={12} className="animate-spin text-primary" />
                    )}
                  </div>
                  <ul className="py-2">
                    {searchQuery ? (
                      // Suggestions
                      suggestions.map(term => (
                        <li key={term} className="px-2 py-0.5">
                          <button
                            onClick={() => submitSearch(term)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container rounded-lg transition-colors text-right"
                          >
                            <Search size={15} className="text-on-surface-variant/70" />
                            <span className="text-[14px] text-on-surface font-medium">{term}</span>
                          </button>
                        </li>
                      ))
                    ) : (
                      // Recent Searches
                      recentSearches.map(term => (
                        <li key={term} className="flex items-center justify-between px-2 py-0.5">
                          <button
                            onClick={() => submitSearch(term)}
                            className="flex-1 flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container rounded-lg transition-colors text-right"
                          >
                            <Clock size={15} className="text-on-surface-variant/70" />
                            <span className="text-[14px] text-on-surface font-medium">{term}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSearch(term)
                            }}
                            className="p-2 mr-2 text-on-surface-variant/50 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                            aria-label="مسح من السجل"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Add Button */}
            <Link
              href={getAddListingHref(category)}
              className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-[#2563eb] text-on-primary text-[14px] font-semibold hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all whitespace-nowrap flex-shrink-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              {t('addListing')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── 0. Category Slider (All Categories) ────────────────────────── */}
      {CATEGORY_SLIDER_MAP[category] && (
        <CategorySlider
          items={CATEGORY_SLIDER_MAP[category]!.items}
          title={CATEGORY_SLIDER_MAP[category]!.title}
          defaultFilterKey={CATEGORY_SLIDER_MAP[category]!.defaultFilterKey}
          filters={filters}
          onFilterChange={handleFilterChange}
          page={sliderPage}
          setPage={setSliderPage}
        />
      )}


      {/* ── 3. Main Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 flex gap-4 sm:gap-6 items-start py-3 sm:py-5">
        
        {/* Sidebar */}
        <FilterSidebar
          category={category}
          filters={filters}
          onFilterChange={handleFilterChange}
          onFiltersChange={handleFiltersChange}
          onClearAll={clearAll}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 pb-40 lg:pb-16">

          {/* ── A) Sort Bar ── */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-[13px] text-on-surface-variant">
              {isLoading
                ? <span className="h-4 w-24 bg-surface-container rounded animate-pulse inline-block" />
                : `${total.toLocaleString('ar-EG')} ${t('advertisement')}` 
              }
            </span>

            <div className="flex items-center justify-between sm:justify-start gap-3">
              {/* Grid/List Toggle */}
              <div className="flex border border-outline-variant/60 rounded-lg overflow-hidden bg-background">
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    "p-1.5 transition-colors",
                    viewMode === 'list' ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                  aria-label={t('viewList')}
                >
                  <List size={15} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    "p-1.5 transition-colors",
                    viewMode === 'grid' ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
                  )}
                  aria-label={t('viewGrid')}
                >
                  <LayoutGrid size={15} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-on-surface-variant">{t('sortBy')}:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => setFilter('sort', e.target.value)}
                    className="h-8 rounded-lg border border-outline-variant/60 bg-background pl-6 pr-2.5 text-[12px] text-on-surface focus:outline-none focus:border-primary/50 cursor-pointer appearance-none transition-colors hover:border-outline-variant/80"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.labelAr}
                      </option>
                    ))}
                  </select>
                  <ChevronLeft size={12} className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── B) Active Filters ── */}
          {hasActiveFilters && (
            <div className="mb-4">
              <ActiveFilters
                category={category}
                filters={filters}
                onRemove={key => {
                  if (key === 'make') {
                    handleFiltersChange({ make: null, model: null })
                  } else if (key === 'governorate') {
                    handleFiltersChange({ governorate: null, city: null })
                  } else {
                    setFilter(key, null)
                  }
                }}
                onClearAll={clearAll}
              />
            </div>
          )}

          {/* ── C) Results ── */}
          {/* Loading */}
          {isLoading && viewMode === 'list' && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          )}
          {isLoading && viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Error */}
          {/* NOTE: error state not currently returned by hook in a way that triggers this, but keeping structure ready */}

          {/* Empty (No filters) */}
          {!isLoading && total === 0 && !hasActiveFilters && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-outline-variant/30 rounded-xl bg-background mt-4">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <CategoryIcon size={30} className="text-on-surface-variant/40" />
              </div>
              <h3 className="text-[15px] font-medium text-on-surface mb-1">
                {t('noListingsYet', { category: meta.labelAr })}
              </h3>
              <p className="text-[13px] text-on-surface-variant mb-5">
                {t('beFirst')}
              </p>
              <Link
                href={getAddListingHref(category)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 shadow-sm"
              >
                <Plus size={15} />
                {t('addListing')}
              </Link>
            </div>
          )}

          {/* Empty (With filters) */}
          {!isLoading && total === 0 && hasActiveFilters && (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-outline-variant/30 rounded-xl bg-background mt-4">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <SearchX size={30} className="text-on-surface-variant/40" />
              </div>
              <h3 className="text-[15px] font-medium text-on-surface mb-1">
                {t('noResults')}
              </h3>
              <p className="text-[13px] text-on-surface-variant mb-5">
                {t('tryChangeFilters')}
              </p>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface hover:bg-surface-container transition-colors"
              >
                <X size={14} />
                {t('clearFilters')}
              </button>
            </div>
          )}

          {/* Items */}
          {!isLoading && total > 0 && (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  {items.map(item => <ListingCard key={item.id} item={item} onSave={handleSave} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  {items.map(item => (
                    <UnifiedCard key={item.id} item={item} className="h-full" />
                  ))}
                </div>
              )}

              {/* Load More */}
              {totalPages > page && (
                <div className="flex justify-center mt-8 pb-8">
                  <button
                    onClick={() => setFilter('page', String(page + 1))}
                    disabled={isFetching}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface font-medium hover:border-outline-variant/80 hover:bg-surface-container/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-background shadow-sm"
                  >
                    {isFetching ? (
                      <Loader2 size={15} className="animate-spin text-primary" />
                    ) : (
                      <>
                        <span>{t('loadMore')}</span>
                        <span className="text-on-surface-variant text-[11px] font-normal">
                          ({t('remaining', { n: (total - items.length).toLocaleString('ar-EG') })})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* ── Mobile FAB (lg:hidden) ────────────────────────────────── */}
      <div 
        className="lg:hidden fixed left-4 z-40 transition-all duration-300"
        style={{ bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => setFabSheetOpen(true)}
          className="flex items-center gap-2 h-12 px-6 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] text-[14px] font-medium bg-primary text-on-primary active:scale-95 transition-all cursor-pointer"
        >
          <SlidersHorizontal size={16} />
          {t('filters')}
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-background text-primary text-[10px] font-bold flex items-center justify-center -mr-1 shadow-sm">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* FAB FilterSheet (mobile) */}
      {fabSheetOpen && (
        <FilterSheet
          category={category}
          filters={filters}
          onFilterChange={handleFilterChange}
          onFiltersChange={handleFiltersChange}
          onClearAll={clearAll}
          onClose={() => setFabSheetOpen(false)}
          total={total}
        />
      )}

      <Footer />
    </div>
  )
}
