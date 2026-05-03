'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ChevronLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ErrorState } from '@/components/error-state'
import { useAuth } from '@/providers/auth-provider'
import { transportApi } from '@/features/transport/api'
import { SERVICE_TYPE_ICONS } from '@/features/transport/constants'
import { RequestStatusTimeline } from '@/features/transport/components/RequestStatusTimeline'
import { QuoteCard } from '@/features/transport/components/QuoteCard'
import { BookingActions } from '@/features/transport/components/BookingActions'
import type { TransportBooking } from '@/features/transport/types'

function BookingSkeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-5 w-48 bg-surface-container-high rounded mb-6" />
        <div className="h-[60px] bg-surface-container-high rounded-xl mb-6" />
        <div className="space-y-4">
          <div className="h-24 bg-surface-container-high rounded-xl" />
          <div className="h-32 bg-surface-container-high rounded-xl" />
          <div className="h-12 bg-surface-container-high rounded-xl" />
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>()
  const bookingId = params.id
  const t = useTranslations('transport')
  const { user } = useAuth()

  const [booking, setBooking] = useState<TransportBooking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    // fetch booking via my bookings and find
    // Since there's no direct get booking endpoint, we load from request
    setIsLoading(true)
    transportApi.myBookings('shipper')
      .then(res => {
        const found = res.items?.find((b: TransportBooking) => b.id === bookingId)
        if (found) return found
        return transportApi.myBookings('carrier').then(r => r.items?.find((b: TransportBooking) => b.id === bookingId))
      })
      .then(b => {
        if (b) setBooking(b)
        else setIsError(true)
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [bookingId])

  const handleAction = async (action: 'start' | 'complete' | 'cancel') => {
    if (!booking) return
    setActionLoading(true)
    try {
      let updated: TransportBooking
      if (action === 'start') updated = await transportApi.markInProgress(booking.id)
      else if (action === 'complete') updated = await transportApi.completeBooking(booking.id)
      else updated = await transportApi.cancelBooking(booking.id)
      setBooking(updated)
    } catch { /* silent */ }
    setActionLoading(false)
  }

  if (isLoading) return <BookingSkeleton />

  if (isError || !booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-2xl mx-auto px-4">
            <ErrorState message={t('noResults')} />
          </main>
        </div>
        <Footer />
      </>
    )
  }

  const userRole: 'shipper' | 'carrier' | 'other' =
    user?.id === booking.request?.userId
      ? 'shipper'
      : user?.id === booking.quote?.carrier?.userId
        ? 'carrier'
        : 'other'

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-on-surface-variant/70 mb-5">
          <Link href="/transport" className="hover:text-primary transition-colors">{t('home')}</Link>
          <ChevronLeft size={14} className="text-outline-variant/60" />
          <span className="text-on-surface/90">{t('bookingDetail')}</span>
        </nav>

        {/* Status */}
        <RequestStatusTimeline status={booking.status} />

        {/* Trip details */}
        {booking.request && (
          <div className="border border-outline-variant/30 rounded-xl p-5 space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">
                {SERVICE_TYPE_ICONS[booking.request.serviceType]}
              </span>
              <span className="text-[14px] font-bold text-on-surface">
                {t(`serviceTypes.${booking.request.serviceType}`)}
              </span>
            </div>
            <p className="text-[13px] text-on-surface">
              {t('fields.from')}: {booking.request.fromGovernorate} → {t('fields.to')}: {booking.request.toGovernorate}
            </p>
            <p className="text-[13px] text-on-surface-variant">{booking.request.cargoDescription}</p>
          </div>
        )}

        {/* Accepted quote */}
        {booking.quote && (
          <div className="mb-6">
            <h3 className="text-[15px] font-bold text-on-surface mb-3">{t('acceptedQuote')}</h3>
            <QuoteCard quote={booking.quote} />
            {booking.quote.carrier?.whatsapp && (
              <a
                href={`https://wa.me/${booking.quote.carrier.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 px-5 py-2.5 rounded-full bg-green-500 text-white text-[13px] font-semibold hover:bg-green-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.842L.057 23.854a.5.5 0 0 0 .61.61l6.012-1.453A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.563 9.563 0 0 1-4.861-1.327l-.348-.207-3.613.873.888-3.524-.227-.362A9.565 9.565 0 0 1 2.4 12C2.4 6.698 6.698 2.4 12 2.4S21.6 6.698 21.6 12 17.302 21.6 12 21.6z"/>
                </svg>
                {t('actions.whatsapp')}
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <BookingActions
          booking={booking}
          userRole={userRole}
          onAction={handleAction}
          isLoading={actionLoading}
        />
      </div>
      <Footer />
    </>
  )
}
