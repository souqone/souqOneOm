'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { transportApi } from '@/features/transport/api'
import { TransportRequestCard, TransportRequestCardSkeleton } from '@/features/transport/components/TransportRequestCard'
import type { TransportRequest, TransportRequestStatus } from '@/features/transport/types'

const TABS: { key: TransportRequestStatus | 'ALL'; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'all' },
  { key: 'OPEN', labelKey: 'open' },
  { key: 'QUOTED', labelKey: 'quoted' },
  { key: 'COMPLETED', labelKey: 'completed' },
  { key: 'CANCELLED', labelKey: 'cancelled' },
]

export default function MyRequestsPage() {
  const t = useTranslations('transport')

  const [tab, setTab] = useState<TransportRequestStatus | 'ALL'>('ALL')
  const [items, setItems] = useState<TransportRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setPage(1)
    transportApi.myRequests(1)
      .then(res => {
        setItems(res.items ?? [])
        setHasMore((res.meta?.totalPages ?? 1) > 1)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const loadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    try {
      const res = await transportApi.myRequests(next)
      setItems(prev => [...prev, ...(res.items ?? [])])
      setPage(next)
      setHasMore((res.meta?.totalPages ?? 1) > next)
    } catch { /* silent */ }
    setLoadingMore(false)
  }

  const filtered = tab === 'ALL' ? items : items.filter(r => r.status === tab)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-on-surface mb-6">{t('myRequests')}</h1>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors',
                tab === key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <TransportRequestCardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">local_shipping</span>
            <p className="text-[14px] text-on-surface-variant">{t('empty.myRequests')}</p>
          </div>
        )}

        {/* Items */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(r => <TransportRequestCard key={r.id} request={r} />)}
          </div>
        )}

        {/* Load more */}
        {!isLoading && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-outline-variant/60 text-[13px] text-on-surface font-medium hover:bg-surface-container/50 disabled:opacity-50 transition-all"
            >
              {loadingMore ? <Loader2 size={14} className="animate-spin" /> : t('loadMore')}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
