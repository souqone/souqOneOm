'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { transportApi } from './api'
import type { TransportRequest, TransportRequestStatus } from './types'
import { SERVICE_TYPE_ICONS } from './constants'

const TABS: { key: string; statuses: TransportRequestStatus[] | null }[] = [
  { key: 'all',       statuses: null },
  { key: 'open',      statuses: ['OPEN'] },
  { key: 'quoted',    statuses: ['QUOTED'] },
  { key: 'completed', statuses: ['COMPLETED'] },
  { key: 'cancelled', statuses: ['CANCELLED', 'EXPIRED'] },
]

const STATUS_COLORS: Record<string, string> = {
  OPEN:        'bg-primary/10 text-primary',
  QUOTED:      'bg-brand-amber/10 text-brand-amber',
  ACCEPTED:    'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  COMPLETED:   'bg-brand-green/10 text-brand-green',
  CANCELLED:   'bg-error/10 text-error',
  EXPIRED:     'bg-outline-variant/30 text-on-surface-variant',
}

export default function MyRequestsShell() {
  const t = useTranslations('transport')

  const [items,    setItems]    = useState<TransportRequest[]>([])
  const [tab,      setTab]      = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(false)

  async function load(p = 1) {
    setLoading(true)
    try {
      const res = await transportApi.myRequests(p, 20)
      setItems(prev => p === 1 ? res.items : [...prev, ...res.items])
      setHasMore(p < res.meta.totalPages)
      setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [])

  const filtered = tab === 'all'
    ? items
    : items.filter(r => {
        const cfg = TABS.find(x => x.key === tab)
        return cfg?.statuses?.includes(r.status) ?? true
      })

  const quotedCount = items.filter(r => r.status === 'QUOTED').length

  async function cancel(id: string) {
    await transportApi.cancelRequest(id)
    load(1)
  }

  return (
    <main className="max-w-page-max-width mx-auto px-page-padding-x-sm md:px-page-padding-x-lg py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="font-hero-lg text-hero-lg text-on-background">{t('myRequests')}</h1>
        <Link href="/transport/new"
          className="bg-gradient-to-br from-brand-amber to-amber-600 text-on-primary px-6 py-3 rounded-xl font-title-md text-title-md shadow-md hover:shadow-lg transition-all flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          {t('newRequest')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-outline-variant/20 mb-8 gap-8 px-2">
        {TABS.map(({ key }) => (
          <button key={key}
            onClick={() => setTab(key)}
            className={`pb-3 font-title-md text-title-md whitespace-nowrap transition-colors flex items-center gap-2
              ${tab === key ? 'text-brand-amber border-b-2 border-brand-amber' : 'text-on-surface-variant hover:text-primary'}`}>
            {t(key as Parameters<typeof t>[0])}
            {key === 'quoted' && quotedCount > 0 && (
              <span className="bg-brand-amber/10 text-brand-amber px-2 py-0.5 rounded-full font-label-sm text-label-sm">
                {quotedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-surface-dim rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-6xl text-outline mb-4 block">list_alt</span>
          <p className="text-title-lg">{t('empty.myRequests')}</p>
          <Link href="/transport/new" className="mt-4 inline-block text-primary hover:underline font-bold">
            {t('newRequest')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(req => {
            const icon      = SERVICE_TYPE_ICONS[req.serviceType]
            const statusCls = STATUS_COLORS[req.status] ?? 'bg-surface-variant text-on-surface-variant'
            const isActive  = req.status === 'OPEN' || req.status === 'QUOTED'
            return (
              <div key={req.id}
                className="bg-surface-container-lowest rounded-xl p-4 md:p-5 border border-outline-variant/10 hover:border-outline-variant/20 hover:shadow-lg transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full font-label-md text-label-md ${statusCls}`}>
                      {t(`status.${req.status}`)}
                      {req.status === 'QUOTED' && req.quotesCount ? ` (${req.quotesCount})` : ''}
                    </span>
                    <span className="text-on-surface-variant font-body-sm text-body-sm">#{req.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-on-background line-clamp-1">{req.cargoDescription}</h3>
                  <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                    <span className="material-symbols-outlined text-lg">my_location</span>
                    <span>{req.fromGovernorate}</span>
                    <span className="material-symbols-outlined text-sm">arrow_left_alt</span>
                    <span className="material-symbols-outlined text-lg">location_on</span>
                    <span>{req.toGovernorate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-outline-variant/10 pt-4 md:pt-0">
                  {(req.budgetMin || req.budgetMax) && (
                    <div className="text-right">
                      <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">{t('steps.timing')}</div>
                      <div className="font-title-lg text-title-lg text-on-background">
                        {req.budgetMin ?? '—'} – {req.budgetMax ?? '—'} ر.ع.
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {isActive && (
                      <button onClick={() => cancel(req.id)} className="text-error hover:underline font-title-md text-title-md px-4 py-2">
                        {t('actions.cancelRequest')}
                      </button>
                    )}
                    <Link href={`/transport/requests/${req.id}`}
                      className={`flex-1 md:flex-none border px-6 py-2 rounded-xl font-title-md text-title-md transition-colors text-center
                        ${req.status === 'QUOTED'
                          ? 'border-brand-amber text-brand-amber hover:bg-brand-amber/5'
                          : 'border-outline text-on-surface-variant hover:bg-surface-container'}`}>
                      {req.status === 'QUOTED'
                        ? t('quotesCount', { count: req.quotesCount ?? 0 })
                        : t('requestDetail')}
                    </Link>
                  </div>
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
