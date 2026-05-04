'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { transportApi } from './api'
import type { TransportQuote, QuoteStatus } from './types'

const TABS: { key: string; statuses: QuoteStatus[] | null }[] = [
  { key: 'all',      statuses: null },
  { key: 'pending',  statuses: ['PENDING'] },
  { key: 'accepted', statuses: ['ACCEPTED'] },
  { key: 'rejected', statuses: ['REJECTED', 'WITHDRAWN'] },
]

const STATUS_COLORS: Record<QuoteStatus, string> = {
  PENDING:   'bg-amber-100 text-brand-amber',
  ACCEPTED:  'bg-green-100 text-price-green',
  REJECTED:  'bg-red-100 text-error',
  WITHDRAWN: 'bg-surface-variant text-on-surface-variant',
}

const STATUS_ICONS: Record<QuoteStatus, string> = {
  PENDING:   'pending_actions',
  ACCEPTED:  'check_circle',
  REJECTED:  'cancel',
  WITHDRAWN: 'undo',
}

export default function MyQuotesShell() {
  const t = useTranslations('transport')

  const [items,   setItems]   = useState<TransportQuote[]>([])
  const [tab,     setTab]     = useState('all')
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(false)

  async function load(p = 1) {
    setLoading(true)
    try {
      const res = await transportApi.myQuotes(p, 20)
      setItems(prev => p === 1 ? res.items : [...prev, ...res.items])
      setHasMore(p < res.meta.totalPages)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  async function withdraw(id: string) {
    await transportApi.withdrawQuote(id)
    load(1)
  }

  const pendingCount  = items.filter(q => q.status === 'PENDING').length
  const acceptedCount = items.filter(q => q.status === 'ACCEPTED').length

  const filtered = tab === 'all' ? items : items.filter(q => {
    const cfg = TABS.find(x => x.key === tab)
    return cfg?.statuses?.includes(q.status) ?? true
  })

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-hero-lg text-hero-lg text-brand-navy mb-2">{t('myQuotes')}</h1>
          <p className="font-body-lg text-body-lg text-secondary">إدارة وتتبع جميع عروض الأسعار التي قدمتها لطلبات النقل.</p>
        </div>
        {/* Stats bento */}
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex-1 md:w-[140px] text-center">
            <span className="font-body-sm text-body-sm text-secondary block mb-1">{t('pending')}</span>
            <span className="font-hero-md text-hero-md text-brand-amber">{pendingCount}</span>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex-1 md:w-[140px] text-center">
            <span className="font-body-sm text-body-sm text-secondary block mb-1">{t('accepted')}</span>
            <span className="font-hero-md text-hero-md text-price-green">{acceptedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2">
        {TABS.map(({ key }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-6 py-2 rounded-full font-title-md text-title-md whitespace-nowrap transition-colors
              ${tab === key
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container-lowest text-secondary border border-outline-variant/30 hover:bg-surface-container-low'}`}>
            {t(key as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-surface-dim rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">local_shipping</span>
          <p className="text-title-lg">{t('empty.myQuotes')}</p>
          <Link href="/transport/browse" className="mt-4 inline-block text-primary hover:underline font-bold">
            {t('browseRequests')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(q => {
            const req = q.request
            const isDone = q.status === 'REJECTED' || q.status === 'WITHDRAWN'
            return (
              <div key={q.id}
                className={`bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 hover:border-outline-variant/20 shadow-sm hover:shadow-lg transition-all flex flex-col gap-4 ${isDone ? 'opacity-75' : ''}`}>
                {/* Status + price */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${STATUS_COLORS[q.status].replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 bg-')}`}>
                      <span className="material-symbols-outlined">{STATUS_ICONS[q.status]}</span>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded font-label-md text-label-md uppercase mb-1 ${STATUS_COLORS[q.status]}`}>
                        {t(`quoteStatus.${q.status}`)}
                      </span>
                      <h3 className="font-title-lg text-title-lg text-on-surface">
                        {t('requestDetail')} #{q.requestId.slice(-6).toUpperCase()}
                      </h3>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-body-sm text-body-sm text-secondary block">{t('yourQuote')}</span>
                    <span className={`font-hero-sm text-hero-sm ${isDone ? 'text-secondary line-through' : 'text-primary'}`}>
                      {q.price} <span className="font-body-md text-body-md">ر.ع.</span>
                    </span>
                  </div>
                </div>

                {/* Route */}
                {req && (
                  <div className="flex items-center gap-4 py-3 border-y border-outline-variant/10">
                    <div className="flex-1">
                      <span className="font-body-sm text-body-sm text-secondary block mb-1">{t('fields.from')}</span>
                      <div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                        {req.fromGovernorate}{req.fromCity ? `، ${req.fromCity}` : ''}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant">arrow_left_alt</span>
                    <div className="flex-1">
                      <span className="font-body-sm text-body-sm text-secondary block mb-1">{t('fields.to')}</span>
                      <div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">flag</span>
                        {req.toGovernorate}{req.toCity ? `، ${req.toCity}` : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                {q.message && (
                  <div className="bg-surface-container-low p-3 rounded-lg flex gap-3 items-start">
                    <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">chat</span>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">{q.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-auto pt-2">
                  <Link href={`/transport/requests/${q.requestId}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-surface-container border border-outline-variant/30 text-secondary font-title-md text-title-md hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                    {t('requestDetail')}
                  </Link>
                  {q.status === 'PENDING' && (
                    <button onClick={() => withdraw(q.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-error-container text-error font-title-md text-title-md hover:bg-error hover:text-on-error transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">cancel</span>
                      {t('actions.withdrawQuote')}
                    </button>
                  )}
                  {q.status === 'ACCEPTED' && q.request?.booking && (
                    <Link href={`/transport/bookings/${q.request.booking.id}`}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-price-green text-white font-title-md text-title-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      {t('actions.viewBooking')}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-8">
          <button onClick={() => load(page + 1)} disabled={loading}
            className="bg-surface-container text-on-surface px-8 py-3 rounded-full font-title-md hover:bg-surface-dim transition-colors disabled:opacity-50">
            {t('loadMore')}
          </button>
        </div>
      )}
    </main>
  )
}
