'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ErrorState } from '@/components/error-state'
import { useAuth } from '@/providers/auth-provider'
import { transportApi } from './api'
import { SERVICE_TYPE_ICONS, REQUEST_STATUS_COLORS } from './constants'
import { RequestStatusTimeline } from './components/RequestStatusTimeline'
import { RouteMap } from './components/RouteMap'
import { QuoteCard } from './components/QuoteCard'
import type { TransportRequest, TransportQuote, CreateQuoteDto } from './types'

// ─── Skeleton ─────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full animate-pulse">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-6" />
        <div className="h-[60px] bg-surface-container-high rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-surface-container-high rounded-xl" />
            <div className="h-32 bg-surface-container-high rounded-xl" />
            <div className="h-20 bg-surface-container-high rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-surface-container-high rounded-xl" />
            <div className="h-32 bg-surface-container-high rounded-xl" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────

export function RequestDetailClient() {
  const params = useParams<{ id: string }>()
  const requestId = params.id
  const t = useTranslations('transport')
  const { user } = useAuth()

  const [request, setRequest] = useState<TransportRequest | null>(null)
  const [quotes, setQuotes] = useState<TransportQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quotePrice, setQuotePrice] = useState('')
  const [quoteHours, setQuoteHours] = useState('')
  const [quoteMessage, setQuoteMessage] = useState('')
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!requestId) return
    setIsLoading(true)
    transportApi
      .getRequest(requestId)
      .then((r) => {
        setRequest(r)
        // Try to load quotes
        transportApi
          .getQuotes(requestId)
          .then(setQuotes)
          .catch(() => {})
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [requestId])

  const handleSubmitQuote = async () => {
    if (!requestId || !quotePrice) return
    setSubmittingQuote(true)
    try {
      const dto: CreateQuoteDto = {
        price: parseFloat(quotePrice),
        estimatedHours: quoteHours ? parseFloat(quoteHours) : undefined,
        message: quoteMessage || undefined,
      }
      const newQuote = await transportApi.submitQuote(requestId, dto)
      setQuotes((prev) => [newQuote, ...prev])
      setShowQuoteForm(false)
      setQuotePrice('')
      setQuoteHours('')
      setQuoteMessage('')
    } catch {
      /* silent */
    }
    setSubmittingQuote(false)
  }

  const handleAcceptQuote = async (quoteId: string) => {
    setActionLoading(true)
    try {
      await transportApi.acceptQuote(quoteId)
      // Refetch
      const updated = await transportApi.getRequest(requestId)
      setRequest(updated)
      const updatedQuotes = await transportApi.getQuotes(requestId).catch(() => [])
      setQuotes(updatedQuotes)
    } catch {
      /* silent */
    }
    setActionLoading(false)
  }

  if (isLoading) return <DetailSkeleton />

  if (isError || !request) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-5xl mx-auto px-4">
            <ErrorState message={t('noResults')} />
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  const isOwner = user?.id === request.userId
  const icon = SERVICE_TYPE_ICONS[request.serviceType] ?? 'local_shipping'
  const statusColor = REQUEST_STATUS_COLORS[request.status] ?? 'bg-gray-100 text-gray-600'

  const inputClass =
    'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-on-surface-variant/70 mb-5">
          <Link href="/transport" className="hover:text-primary transition-colors">{t('home')}</Link>
          <ChevronLeft size={14} className="text-outline-variant/60" />
          <Link href="/transport/browse" className="hover:text-primary transition-colors">{t('browseRequests')}</Link>
          <ChevronLeft size={14} className="text-outline-variant/60" />
          <span className="text-on-surface/90">{t('requestDetail')}</span>
        </nav>

        {/* Status timeline */}
        <RequestStatusTimeline status={request.status} />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Service + status header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-[22px]">{icon}</span>
                </div>
                <div>
                  <h1 className="text-[16px] font-bold text-on-surface">
                    {t(`serviceTypes.${request.serviceType}`)}
                  </h1>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor}`}>
                    {t(`status.${request.status}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Route map */}
            <div className="rounded-2xl border border-outline-variant/10 overflow-hidden">
              <RouteMap
                fromLat={request.fromLat}
                fromLng={request.fromLng}
                toLat={request.toLat}
                toLng={request.toLng}
                className="h-48 sm:h-56"
              />
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[11px] text-on-surface-variant mb-0.5">{t('fields.from')}</p>
                  <p className="text-[13px] font-bold text-on-surface">{request.fromGovernorate}</p>
                  {request.fromAddress && (
                    <p className="text-[12px] text-on-surface-variant">{request.fromAddress}</p>
                  )}
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">arrow_forward</span>
                <div className="flex-1">
                  <p className="text-[11px] text-on-surface-variant mb-0.5">{t('fields.to')}</p>
                  <p className="text-[13px] font-bold text-on-surface">{request.toGovernorate}</p>
                  {request.toAddress && (
                    <p className="text-[12px] text-on-surface-variant">{request.toAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cargo details */}
            <div className="rounded-2xl border border-outline-variant/10 p-5">
              <h2 className="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">inventory_2</span>
                {t('cargoDetails')}
              </h2>
              <p className="text-[13px] text-on-surface leading-relaxed mb-3">{request.cargoDescription}</p>
              <div className="flex flex-wrap gap-3 text-[12px] text-on-surface-variant">
                {request.weightTons && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">scale</span>
                    {request.weightTons} {t('fields.tons')}
                  </span>
                )}
                {request.requiresHelper && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {t('fields.requiresHelper')}
                  </span>
                )}
              </div>
              {request.notes && (
                <p className="mt-3 text-[12px] text-on-surface-variant italic">{request.notes}</p>
              )}
            </div>

            {/* Timing & Budget */}
            <div className="rounded-2xl border border-outline-variant/10 p-5">
              <h2 className="text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">schedule</span>
                {t('timingAndBudget')}
              </h2>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('fields.scheduledAt')}</span>
                  <span className="text-on-surface font-medium">
                    {request.scheduledAt
                      ? new Date(request.scheduledAt).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : request.isFlexible
                        ? t('fields.flexible')
                        : t('fields.asap')}
                  </span>
                </div>
                {(request.budgetMin || request.budgetMax) && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">{t('fields.budgetMin')}</span>
                    <span className="text-on-surface font-medium">
                      {request.budgetMin && request.budgetMax
                        ? `${request.budgetMin} - ${request.budgetMax} ر.ع.`
                        : request.budgetMax
                          ? `≤ ${request.budgetMax} ر.ع.`
                          : `≥ ${request.budgetMin} ر.ع.`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Requester info */}
            <div className="rounded-2xl border border-outline-variant/10 p-5">
              <h2 className="text-[14px] font-bold text-on-surface mb-3">{t('requestOwner')}</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-[14px] font-bold text-on-surface-variant overflow-hidden">
                  {request.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={request.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (request.user.displayName ?? request.user.username).charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-on-surface">
                    {request.user.displayName || request.user.username}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {new Date(request.createdAt).toLocaleDateString('ar-EG', {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Submit quote form */}
            {!isOwner && request.status === 'OPEN' && (
              <div className="rounded-2xl border border-outline-variant/10 p-5 sticky top-24">
                <h3 className="text-[15px] font-bold text-on-surface mb-4">{t('submitYourQuote')}</h3>

                {!user ? (
                  <p className="text-[13px] text-on-surface-variant text-center py-4">{t('loginToQuote')}</p>
                ) : !showQuoteForm ? (
                  <button
                    onClick={() => setShowQuoteForm(true)}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 transition-colors"
                  >
                    {t('actions.submitQuote')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-medium text-on-surface mb-1 block">
                        {t('fields.price')} *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-on-surface mb-1 block">
                        {t('fields.estimatedHours')}
                      </label>
                      <input
                        type="number"
                        value={quoteHours}
                        onChange={(e) => setQuoteHours(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-on-surface mb-1 block">
                        {t('fields.message')}
                      </label>
                      <textarea
                        value={quoteMessage}
                        onChange={(e) => setQuoteMessage(e.target.value)}
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                    <button
                      onClick={handleSubmitQuote}
                      disabled={!quotePrice || submittingQuote}
                      className="w-full py-3 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {submittingQuote ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        t('actions.submitQuote')
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Owner: your quote info */}
            {isOwner && request.status === 'OPEN' && (
              <div className="rounded-2xl border border-outline-variant/10 p-5">
                <p className="text-[13px] text-on-surface-variant text-center">
                  {t('quotesCount', { count: quotes.length })}
                </p>
              </div>
            )}

            {/* Quotes list */}
            {quotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[14px] font-bold text-on-surface">
                  {t('quotesCount', { count: quotes.length })}
                </h3>
                {quotes.map((q) => (
                  <QuoteCard
                    key={q.id}
                    quote={q}
                    isOwner={isOwner}
                    onAccept={isOwner ? handleAcceptQuote : undefined}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
