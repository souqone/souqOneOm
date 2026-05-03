'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { transportApi } from '@/features/transport/api'
import { TransportRequestCard, TransportRequestCardSkeleton } from '@/features/transport/components/TransportRequestCard'
import { QuoteCard } from '@/features/transport/components/QuoteCard'
import type { CarrierProfile, TransportRequest, TransportQuote } from '@/features/transport/types'

export default function CarrierDashboardPage() {
  const t = useTranslations('transport')

  const [profile, setProfile] = useState<CarrierProfile | null>(null)
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [quotes, setQuotes] = useState<TransportQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    Promise.all([
      transportApi.getMyCarrierProfile().catch(() => null),
      transportApi.myQuotes().catch(() => ({ items: [] })),
    ])
      .then(([p, q]) => {
        setProfile(p)
        setQuotes(q.items ?? [])
        if (p?.governorate) {
          transportApi
            .getRequests({ fromGovernorate: p.governorate, status: 'OPEN', limit: '5' })
            .then(r => setRequests(r.items ?? []))
            .catch(() => {})
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async () => {
    if (!profile) return
    setToggling(true)
    try {
      const updated = await transportApi.setAvailability(!profile.isAvailable)
      setProfile(updated)
    } catch { /* silent */ }
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 flex-1 animate-pulse space-y-6">
          <div className="h-20 bg-surface-container-high rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-surface-container-high rounded-xl" />)}
          </div>
          {Array.from({ length: 3 }).map((_, i) => <TransportRequestCardSkeleton key={i} />)}
        </div>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant">{t('empty.requests')}</p>
        </div>
        <Footer />
      </div>
    )
  }

  const acceptedQuotes = quotes.filter(q => q.status === 'ACCEPTED').length

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-on-surface mb-6">{t('dashboard.title')}</h1>

        {/* Availability toggle */}
        <div className="rounded-2xl bg-surface-container p-6 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[16px] font-bold text-on-surface">{t('dashboard.availableToggle')}</h2>
            <p className="text-[13px] text-on-surface-variant">{t('dashboard.availableDesc')}</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={clsx(
              'w-14 h-8 rounded-full relative transition-colors',
              profile.isAvailable ? 'bg-amber-500' : 'bg-gray-300',
            )}
          >
            {toggling ? (
              <Loader2 size={14} className="animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            ) : (
              <span
                className={clsx(
                  'absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all',
                  profile.isAvailable ? 'left-1' : 'left-7',
                )}
              />
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label={t('dashboard.quotesSubmitted')} value={String(quotes.length)} />
          <StatCard label={t('dashboard.quotesAccepted')} value={String(acceptedQuotes)} />
          <StatCard label={t('dashboard.tripsCompleted')} value={String(profile.completedTrips)} />
          <StatCard
            label={t('dashboard.avgRating')}
            value={profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—'}
            icon={<Star size={14} className="text-amber-500 fill-amber-500" />}
          />
        </div>

        {/* Nearby requests */}
        <section className="mb-8">
          <h2 className="text-[16px] font-bold text-on-surface mb-4">{t('dashboard.nearbyRequests')}</h2>
          {requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map(r => <TransportRequestCard key={r.id} request={r} />)}
            </div>
          ) : (
            <p className="text-[13px] text-on-surface-variant py-6 text-center">{t('empty.nearbyRequests')}</p>
          )}
        </section>

        {/* Recent quotes */}
        <section>
          <h2 className="text-[16px] font-bold text-on-surface mb-4">{t('dashboard.recentQuotes')}</h2>
          {quotes.length > 0 ? (
            <div className="space-y-3">
              {quotes.slice(0, 5).map(q => <QuoteCard key={q.id} quote={q} />)}
            </div>
          ) : (
            <p className="text-[13px] text-on-surface-variant py-6 text-center">{t('empty.myQuotes')}</p>
          )}
        </section>
      </div>
      <Footer />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="border border-outline-variant/30 rounded-xl bg-background p-4 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-2xl font-bold text-on-surface">{value}</span>
      </div>
      <span className="text-[12px] text-on-surface-variant">{label}</span>
    </div>
  )
}
