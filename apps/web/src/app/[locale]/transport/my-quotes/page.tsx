'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { transportApi } from '@/features/transport/api'
import { SERVICE_TYPE_ICONS } from '@/features/transport/constants'
import type { TransportQuote, QuoteStatus } from '@/features/transport/types'

const TABS: { key: QuoteStatus | 'ALL'; labelKey: string }[] = [
  { key: 'ALL', labelKey: 'all' },
  { key: 'PENDING', labelKey: 'pending' },
  { key: 'ACCEPTED', labelKey: 'accepted' },
  { key: 'REJECTED', labelKey: 'rejected' },
]

const QUOTE_DOT: Record<QuoteStatus, string> = {
  PENDING: 'bg-amber-500',
  ACCEPTED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-gray-400',
}

export default function MyQuotesPage() {
  const t = useTranslations('transport')

  const [tab, setTab] = useState<QuoteStatus | 'ALL'>('ALL')
  const [items, setItems] = useState<TransportQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    transportApi.myQuotes(1)
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
      const res = await transportApi.myQuotes(next)
      setItems(prev => [...prev, ...(res.items ?? [])])
      setPage(next)
      setHasMore((res.meta?.totalPages ?? 1) > next)
    } catch { /* silent */ }
    setLoadingMore(false)
  }

  const handleWithdraw = async (quoteId: string) => {
    setActionLoading(quoteId)
    try {
      await transportApi.withdrawQuote(quoteId)
      setItems(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q))
    } catch { /* silent */ }
    setActionLoading(null)
  }

  const filtered = tab === 'ALL' ? items : items.filter(q => q.status === tab)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-on-surface mb-6">{t('myQuotes')}</h1>

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
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container-high rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">request_quote</span>
            <p className="text-[14px] text-on-surface-variant">{t('empty.myQuotes')}</p>
          </div>
        )}

        {/* Items */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(q => {
              // We may not have request details on the quote, show what we can
              const req = (q as TransportQuote & { request?: { serviceType: string; fromGovernorate: string; toGovernorate: string; id: string } }).request

              return (
                <div key={q.id} className="border border-outline-variant/30 rounded-xl bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {req && (
                        <span className="material-symbols-outlined text-amber-600 text-lg">
                          {SERVICE_TYPE_ICONS[req.serviceType as keyof typeof SERVICE_TYPE_ICONS]}
                        </span>
                      )}
                      {req && (
                        <span className="text-[13px] font-medium text-on-surface">
                          {t('fields.from')} {req.fromGovernorate} → {t('fields.to')} {req.toGovernorate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-2 h-2 rounded-full', QUOTE_DOT[q.status])} />
                      <span className="text-[11px] text-on-surface-variant font-medium">{t(`quoteStatus.${q.status}`)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold text-on-surface">
                      {q.price.toLocaleString('en-US')} <span className="text-[12px] font-normal text-on-surface-variant">ر.ع.</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {q.status === 'PENDING' && (
                        <button
                          onClick={() => handleWithdraw(q.id)}
                          disabled={actionLoading === q.id}
                          className="px-4 py-1.5 rounded-full border border-red-300 text-red-600 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === q.id ? <Loader2 size={12} className="animate-spin" /> : t('actions.withdrawQuote')}
                        </button>
                      )}
                      {q.status === 'ACCEPTED' && req && (
                        <Link
                          href={`/transport/requests/${req.id}`}
                          className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary/90 transition-colors"
                        >
                          {t('actions.viewBooking')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
