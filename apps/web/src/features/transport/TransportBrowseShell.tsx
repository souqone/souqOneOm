'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { clsx } from 'clsx'
import { ChevronLeft, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { transportApi } from './api'
import { SERVICE_TYPES, SERVICE_TYPE_ICONS, OMAN_GOVERNORATES } from './constants'
import { TransportRequestCard, TransportRequestCardSkeleton } from './components/TransportRequestCard'
import type { TransportRequest, TransportServiceType, TransportRequestStatus } from './types'

const STATUS_TABS: { key: TransportRequestStatus | 'ALL'; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'all' },
  { key: 'OPEN', labelKey: 'open' },
  { key: 'QUOTED', labelKey: 'quoted' },
]

export function TransportBrowseShell() {
  const t = useTranslations('transport')
  const searchParams = useSearchParams()

  // Filters from URL
  const initialServiceType = searchParams.get('serviceType') as TransportServiceType | null
  const initialQ = searchParams.get('q') || ''
  const initialGov = searchParams.get('governorate') || ''

  const [items, setItems] = useState<TransportRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filter state
  const [serviceType, setServiceType] = useState<TransportServiceType | null>(initialServiceType)
  const [statusTab, setStatusTab] = useState<TransportRequestStatus | 'ALL'>('ALL')
  const [governorate, setGovernorate] = useState(initialGov)
  const [query, setQuery] = useState(initialQ)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    if (!append) setIsLoading(true)
    else setLoadingMore(true)

    try {
      const params: Record<string, string> = {
        page: String(pageNum),
        limit: '12',
      }
      if (serviceType) params.serviceType = serviceType
      if (statusTab !== 'ALL') params.status = statusTab
      if (governorate) params.fromGovernorate = governorate
      if (query) params.q = query

      const res = await transportApi.getRequests(params)
      if (append) {
        setItems(prev => [...prev, ...(res.items ?? [])])
      } else {
        setItems(res.items ?? [])
      }
      setHasMore((res.meta?.totalPages ?? 1) > pageNum)
      setPage(pageNum)
    } catch {
      /* silent */
    } finally {
      setIsLoading(false)
      setLoadingMore(false)
    }
  }, [serviceType, statusTab, governorate, query])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const handleLoadMore = () => {
    fetchData(page + 1, true)
  }

  const clearFilters = () => {
    setServiceType(null)
    setStatusTab('ALL')
    setGovernorate('')
    setQuery('')
  }

  const hasFilters = !!serviceType || statusTab !== 'ALL' || !!governorate || !!query

  const inputClass = 'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors'

  // ── Filter Sidebar (desktop) ──────────────────────

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="text-[12px] font-medium text-on-surface-variant mb-1.5 block">{t('filters')}</label>
        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('landing.searchPlaceholder')}
            className={inputClass}
          />
        </div>
      </div>

      {/* Service Type */}
      <div>
        <label className="text-[12px] font-medium text-on-surface-variant mb-2 block">{t('whatToTransport')}</label>
        <div className="space-y-1">
          {SERVICE_TYPES.map(st => (
            <button
              key={st}
              onClick={() => setServiceType(serviceType === st ? null : st)}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors',
                serviceType === st
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container',
              )}
            >
              <span className="material-symbols-outlined text-[16px]">{SERVICE_TYPE_ICONS[st]}</span>
              {t(`serviceTypes.${st}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Governorate */}
      <div>
        <label className="text-[12px] font-medium text-on-surface-variant mb-1.5 block">{t('fields.governorate')}</label>
        <select
          value={governorate}
          onChange={e => setGovernorate(e.target.value)}
          className={inputClass}
        >
          <option value="">{t('all')}</option>
          {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 rounded-xl border border-outline-variant/40 text-[13px] text-on-surface-variant font-medium hover:bg-surface-container transition-colors"
        >
          {t('clearFilters')}
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-1 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-on-surface-variant/70 mb-5">
          <Link href="/transport" className="hover:text-primary transition-colors">{t('home')}</Link>
          <ChevronLeft size={14} className="text-outline-variant/60" />
          <span className="text-on-surface/90">{t('browseRequests')}</span>
        </nav>

        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg sm:text-2xl font-bold text-on-surface">{t('browseRequests')}</h1>
          <Link
            href="/transport/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-bold hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {t('newRequest')}
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto">
          {STATUS_TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setStatusTab(key)}
              className={clsx(
                'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors',
                statusTab === key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Main layout: sidebar + content */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/10 p-5">
              <FilterPanel />
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TransportRequestCardSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4">local_shipping</span>
                <h3 className="text-[16px] font-bold text-on-surface mb-1">{t('noResults')}</h3>
                <p className="text-[13px] text-on-surface-variant mb-4">{t('tryChangeFilters')}</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2 rounded-full bg-primary text-on-primary text-[13px] font-bold hover:bg-primary/90 transition-colors"
                  >
                    {t('clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {items.map(r => (
                    <TransportRequestCard key={r.id} request={r} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface font-medium hover:bg-surface-container/50 disabled:opacity-50 transition-all"
                    >
                      {loadingMore ? <Loader2 size={14} className="animate-spin" /> : t('loadMore')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter FAB */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className="lg:hidden fixed bottom-20 end-4 z-40 w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <SlidersHorizontal size={20} />
      </button>

      {/* Mobile filter sheet */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 start-0 end-0 bg-background rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-on-surface">{t('filters')}</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
