'use client'

import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { transportApi } from './api'
import type { TransportRequest, TransportRequestStatus, TransportServiceType } from './types'
import { OMAN_GOVERNORATES, SERVICE_TYPES } from './constants'

// ─── Status config (matches Stitch HTML) ─────────────────────────────────────

const STATUS_CONFIG: Record<
  TransportRequestStatus,
  { textClass: string; icon: string }
> = {
  OPEN:        { textClass: 'text-price-green', icon: 'fiber_manual_record' },
  QUOTED:      { textClass: 'text-primary',     icon: 'chat_bubble'         },
  ACCEPTED:    { textClass: 'text-primary',     icon: 'check_circle'        },
  IN_PROGRESS: { textClass: 'text-brand-amber', icon: 'local_shipping'      },
  COMPLETED:   { textClass: 'text-price-green', icon: 'done_all'            },
  CANCELLED:   { textClass: 'text-error',       icon: 'cancel'              },
  EXPIRED:     { textClass: 'text-outline',     icon: 'lock'                },
}

const ACTIONABLE: TransportRequestStatus[] = ['OPEN', 'QUOTED']

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({ request, t }: {
  request: TransportRequest
  t: ReturnType<typeof useTranslations<'transport'>>
}) {
  const cfg = STATUS_CONFIG[request.status]
  const isActionable = ACTIONABLE.includes(request.status)

  const timeAgo = (() => {
    const h = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / 3_600_000)
    if (h < 1) return 'منذ قليل'
    if (h < 24) return `منذ ${h} ساعة`
    return `منذ ${Math.floor(h / 24)} يوم`
  })()

  return (
    <Link
      href={`/transport/requests/${request.id}`}
      className={`bg-surface-container-lowest rounded-xl p-5 outline outline-1 outline-outline-variant/10 hover:outline-outline-variant/20 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center${!isActionable ? ' opacity-70' : ''}`}
    >
      {/* Left — main content */}
      <div className="flex-grow">
        {/* Status + time row */}
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-body-sm font-body-sm ${cfg.textClass} flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md`}>
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              {cfg.icon}
            </span>
            {t(`status.${request.status}`)}
          </span>
          <span className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>schedule</span>
            {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-title-lg font-title-lg text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {request.cargoDescription}
        </h3>

        {/* Route */}
        <div className="text-body-md font-body-md text-on-surface-variant flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
          {t('fields.from')} {request.fromGovernorate}
          <span className="material-symbols-outlined text-[18px]">arrow_left_alt</span>
          {t('fields.to')} {request.toGovernorate}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {request.weightTons != null && (
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>scale</span>
              {request.weightTons} {t('fields.tons')}
            </span>
          )}
          {(request.scheduledAt != null || request.isFlexible) && (
            <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>calendar_today</span>
              {request.isFlexible
                ? t('fields.flexible')
                : request.scheduledAt
                  ? new Date(request.scheduledAt).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric' })
                  : t('fields.asap')}
            </span>
          )}
          {(request.budgetMin != null || request.budgetMax != null) && (
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-label-md font-label-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
              {request.budgetMin != null && request.budgetMax != null
                ? `${request.budgetMin}–${request.budgetMax} ر.ع.`
                : `${request.budgetMin ?? request.budgetMax} ر.ع.`}
            </span>
          )}
        </div>
      </div>

      {/* Right — quotes count + action */}
      <div className="shrink-0 flex flex-col items-end gap-3 border-t md:border-t-0 md:border-r border-outline-variant/20 pt-4 md:pt-0 md:pr-6 w-full md:w-auto">
        <div className={`text-center w-full md:w-auto p-3 rounded-lg border border-outline-variant/10 ${isActionable ? 'bg-surface' : 'bg-surface-variant'}`}>
          <div className={`text-hero-sm font-hero-sm ${isActionable ? 'text-primary' : 'text-on-surface-variant'}`}>
            {request.quotesCount ?? 0}
          </div>
          <div className="text-body-sm font-body-sm text-on-surface-variant">عروض</div>
        </div>
        {isActionable ? (
          <div className="w-full md:w-auto bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-6 py-2 rounded-lg text-body-md font-body-md font-bold transition-colors text-center">
            {t('actions.submitQuote')}
          </div>
        ) : (
          <div className="w-full md:w-auto bg-surface-dim text-on-surface-variant px-6 py-2 rounded-lg text-body-md font-body-md font-bold text-center">
            {t(`status.${request.status}`)}
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 outline outline-1 outline-outline-variant/10 flex flex-col md:flex-row gap-6 animate-pulse h-36" />
  )
}

// ─── Browse Shell ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'newest',     tKey: 'sortNewest'     },
  { value: 'oldest',     tKey: 'sortOldest'     },
  { value: 'budgetHigh', tKey: 'sortBudgetHigh' },
  { value: 'budgetLow',  tKey: 'sortBudgetLow'  },
] as const

export default function TransportBrowseShell() {
  const t = useTranslations('transport')
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Filter state from URL ──────────────────────────────────────────────────
  const [selectedTypes, setSelectedTypes] = useState<TransportServiceType[]>(() => {
    const v = searchParams.get('type')
    return v ? (v.split(',') as TransportServiceType[]) : []
  })
  const [fromGov,  setFromGov]  = useState(searchParams.get('from') ?? '')
  const [toGov,    setToGov]    = useState(searchParams.get('to') ?? '')
  const [sort,     setSort]     = useState(searchParams.get('sort') ?? 'newest')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // ── Data state ────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const LIMIT = 10

  // ── Sync URL ──────────────────────────────────────────────────────────────
  const pushUrl = useCallback((
    types: TransportServiceType[],
    from: string,
    to: string,
    s: string,
  ) => {
    const p = new URLSearchParams()
    if (types.length) p.set('type', types.join(','))
    if (from) p.set('from', from)
    if (to)   p.set('to',   to)
    if (s !== 'newest') p.set('sort', s)
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [router])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (pg: number, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true)
    try {
      const sortParam = sort === 'budgetHigh' ? 'budgetDesc'
        : sort === 'budgetLow' ? 'budgetAsc'
        : sort === 'oldest'    ? 'asc'
        : 'desc'
      const res = await transportApi.getRequests({
        page: pg,
        limit: LIMIT,
        ...(selectedTypes.length === 1 ? { serviceType: selectedTypes[0] } : {}),
        ...(fromGov ? { fromGovernorate: fromGov } : {}),
        ...(toGov   ? { toGovernorate:   toGov   } : {}),
        sort: sortParam,
      })
      setTotal(res.meta.total)
      setRequests(prev => append ? [...prev, ...res.items] : res.items)
    } catch {
      if (!append) setRequests([])
    } finally {
      if (!append) setLoading(false); else setLoadingMore(false)
    }
  }, [selectedTypes, fromGov, toGov, sort])

  useEffect(() => {
    setPage(1)
    fetchPage(1, false)
  }, [fetchPage])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleType(type: TransportServiceType) {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(next)
    pushUrl(next, fromGov, toGov, sort)
  }

  function handleFrom(v: string) { setFromGov(v); pushUrl(selectedTypes, v, toGov, sort) }
  function handleTo(v: string)   { setToGov(v);   pushUrl(selectedTypes, fromGov, v, sort) }
  function handleSort(v: string) { setSort(v);    pushUrl(selectedTypes, fromGov, toGov, v) }

  function resetFilters() {
    setSelectedTypes([]); setFromGov(''); setToGov(''); setSort('newest')
    router.replace('?', { scroll: false })
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchPage(next, true)
  }

  const hasMore = requests.length < total

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = (
    <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10 shadow-sm sticky top-[120px]">
      <h2 className="text-title-lg font-title-lg text-on-surface mb-6 border-b border-outline-variant/20 pb-4">
        {t('filters')}
      </h2>

      {/* Service type checkboxes */}
      <div className="mb-6">
        <h3 className="text-body-lg font-body-lg text-on-surface mb-3">نوع الخدمة</h3>
        <div className="space-y-2">
          {SERVICE_TYPES.map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => toggleType(type)}
                className="form-checkbox h-5 w-5 text-primary rounded border-outline-variant focus:ring-primary focus:ring-offset-0 bg-surface"
              />
              <span className="text-body-md font-body-md text-on-surface group-hover:text-primary transition-colors">
                {t(`serviceTypes.${type}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* From governorate */}
      <div className="mb-6">
        <h3 className="text-body-lg font-body-lg text-on-surface mb-3">{t('fields.from')} محافظة</h3>
        <select
          value={fromGov}
          onChange={e => handleFrom(e.target.value)}
          className="form-select w-full rounded-lg border-outline-variant/50 bg-surface-bright text-body-md font-body-md text-on-surface focus:ring-primary focus:border-primary h-[40px] px-3"
        >
          <option value="">الكل</option>
          {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* To governorate */}
      <div className="mb-6">
        <h3 className="text-body-lg font-body-lg text-on-surface mb-3">{t('fields.to')} محافظة</h3>
        <select
          value={toGov}
          onChange={e => handleTo(e.target.value)}
          className="form-select w-full rounded-lg border-outline-variant/50 bg-surface-bright text-body-md font-body-md text-on-surface focus:ring-primary focus:border-primary h-[40px] px-3"
        >
          <option value="">الكل</option>
          {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-body-lg font-body-lg text-on-surface mb-3">{t('sortBy')}</h3>
        <div className="space-y-2">
          {SORT_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="sort"
                checked={sort === opt.value}
                onChange={() => handleSort(opt.value)}
                className="form-radio h-5 w-5 text-primary border-outline-variant focus:ring-primary focus:ring-offset-0 bg-surface"
              />
              <span className="text-body-md font-body-md text-on-surface group-hover:text-primary transition-colors">
                {t(opt.tKey)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={resetFilters}
        className="w-full mt-8 bg-surface-variant text-on-surface px-4 py-2 rounded-lg text-body-md font-body-md font-bold hover:bg-surface-dim transition-colors"
      >
        {t('clearFilters')}
      </button>
    </div>
  )

  return (
    <main className="flex-grow max-w-page-max-width w-full mx-auto px-page-padding-x-sm md:px-page-padding-x-md lg:px-page-padding-x-lg py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="text-body-sm font-body-sm text-on-surface-variant mb-2">
          <Link href="/transport" className="hover:text-primary transition-colors">الرئيسية</Link>
          {' › '}
          <Link href="/transport" className="hover:text-primary transition-colors">{t('title')}</Link>
          {' › '}
          {t('browseTitle')}
        </div>
        <div className="flex items-baseline gap-4">
          <h1 className="text-hero-md font-hero-md text-on-surface">{t('browseTitle')}</h1>
          {!loading && (
            <span className="text-title-md font-title-md text-on-surface-variant">
              ({t('requestsCount', { count: total })})
            </span>
          )}
        </div>
      </div>

      {/* Mobile filter toggle */}
      <button
        onClick={() => setShowMobileFilters(v => !v)}
        className="md:hidden mb-4 flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2 text-body-md font-body-md text-on-surface"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>tune</span>
        {t('filters')}
        {(selectedTypes.length > 0 || fromGov || toGov) && (
          <span className="bg-primary text-on-primary text-label-sm font-label-sm rounded-full px-2 py-0.5">
            {selectedTypes.length + (fromGov ? 1 : 0) + (toGov ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Mobile filters panel */}
      {showMobileFilters && (
        <div className="md:hidden mb-6">{Sidebar}</div>
      )}

      {/* Main layout */}
      <div className="flex flex-col md:flex-row gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-sidebar-width shrink-0">
          {Sidebar}
        </aside>

        {/* Listings */}
        <div className="flex-grow space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] opacity-30" style={{ fontVariationSettings: "'FILL' 0" }}>
                local_shipping
              </span>
              <p className="text-title-lg font-title-lg">{t('noResults')}</p>
              <p className="text-body-md font-body-md">{t('tryChangeFilters')}</p>
              <button onClick={resetFilters} className="mt-2 text-primary text-body-md font-body-md hover:opacity-80 underline underline-offset-2">
                {t('clearFilters')}
              </button>
            </div>
          ) : (
            <>
              {requests.map(r => <RequestCard key={r.id} request={r} t={t} />)}

              {hasMore && (
                <div className="pt-8 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="bg-surface-container border border-primary/20 text-primary hover:bg-primary/5 px-8 py-3 rounded-lg text-title-md font-title-md transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined">expand_more</span>
                    )}
                    {t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
