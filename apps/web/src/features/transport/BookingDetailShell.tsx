'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/providers/auth-provider'
import { transportApi } from './api'
import type { TransportBooking } from './types'

const BOOKING_FLOW = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const
const FLOW_ICONS: Record<string, string> = {
  ACCEPTED:    'handshake',
  IN_PROGRESS: 'local_shipping',
  COMPLETED:   'task_alt',
}

function BookingTimeline({ status }: { status: string }) {
  const t = useTranslations('transport')
  const cur = BOOKING_FLOW.indexOf(status as typeof BOOKING_FLOW[number])
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
      <div className="relative flex items-center justify-between w-full max-w-md mx-auto">
        <div className="absolute left-0 right-0 top-4 -translate-y-1/2 h-1 bg-outline-variant/30 -z-10 w-[calc(100%-2rem)] mx-auto" />
        <div className="absolute right-[1rem] top-4 -translate-y-1/2 h-1 bg-brand-amber -z-10 transition-all duration-500"
          style={{ width: `${Math.max(0, (cur / (BOOKING_FLOW.length - 1))) * (100 - 12)}%` }} />
        {BOOKING_FLOW.map((s, i) => {
          const done   = i < cur
          const active = i === cur
          return (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md
                ${done  ? 'bg-brand-amber text-white'
                : active ? 'bg-white border-4 border-brand-amber flex items-center justify-center shadow-md'
                : 'bg-white border-2 border-outline-variant'}`}>
                {done
                  ? <span className="material-symbols-outlined text-sm font-bold">check</span>
                  : active
                    ? <div className="w-2.5 h-2.5 bg-brand-amber rounded-full" />
                    : null}
                {!done && !active && (
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant"
                    style={{ fontVariationSettings: "'FILL' 0" }}>{FLOW_ICONS[s]}</span>
                )}
              </div>
              <span className={`font-label-sm text-label-sm ${active ? 'text-brand-navy font-bold' : done ? 'text-brand-amber' : 'text-outline'}`}>
                {t(`status.${s}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BookingDetailShell({ id }: { id: string }) {
  const t = useTranslations('transport')
  const { user } = useAuth()

  const [booking, setBooking] = useState<TransportBooking | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await transportApi.myBookings('shipper', 1, 50)
      const found = data.items.find(b => b.id === id)
        ?? (await (async () => {
          const asCarrier = await transportApi.myBookings('carrier', 1, 50)
          return asCarrier.items.find(b => b.id === id) ?? null
        })())
      setBooking(found ?? null)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (loading) return (
    <main className="max-w-[700px] mx-auto px-page-padding-x-sm md:px-page-padding-x-md py-8">
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-surface-dim rounded-xl animate-pulse" />)}
      </div>
    </main>
  )

  if (!booking) return (
    <main className="max-w-[700px] mx-auto px-page-padding-x-sm py-16 text-center text-on-surface-variant">
      الحجز غير موجود
    </main>
  )

  const req = booking.request
  const carrier = booking.quote?.carrier
  const isShipper = req?.userId === user?.id
  const canStart    = booking.status === 'ACCEPTED'
  const canComplete = booking.status === 'IN_PROGRESS'
  const canCancel   = booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS'

  return (
    <main className="max-w-[700px] mx-auto px-page-padding-x-sm md:px-page-padding-x-md py-8">
      <div className="flex flex-col gap-6">
        {/* Status header */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 pt-4">
          <div className="w-20 h-20 bg-brand-amber/10 rounded-full flex items-center justify-center border-2 border-brand-amber">
            <span className="material-symbols-outlined text-4xl text-brand-amber">local_shipping</span>
          </div>
          <div>
            <h1 className="text-brand-navy font-hero-md">{t(`status.${booking.status}`)}</h1>
            <p className="text-outline font-body-md mt-1">#{id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Timeline */}
        <BookingTimeline status={booking.status} />

        {/* Trip details */}
        {req && (
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-lg">route</span>
              <div className="flex items-center gap-2 font-title-md text-brand-navy">
                <span>{t('fields.from')} {req.fromGovernorate}</span>
                <span className="material-symbols-outlined text-brand-amber font-bold">arrow_left_alt</span>
                <span>{t('fields.to')} {req.toGovernorate}</span>
              </div>
            </div>
            <hr className="border-outline-variant/20" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-outline">{t('steps.serviceType')}</span>
                <span className="font-body-md text-on-surface font-bold">{t(`serviceTypes.${req.serviceType}`)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-outline">{t('fields.cargo')}</span>
                <span className="font-body-md text-on-surface font-bold line-clamp-2">{req.cargoDescription}</span>
              </div>
            </div>
          </div>
        )}

        {/* Carrier card */}
        {carrier && (
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center border-2 border-brand-amber/20 shrink-0">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-title-lg text-brand-navy">
                    {carrier.companyName ?? carrier.user?.displayName}
                  </span>
                  {carrier.isVerified && (
                    <span className="material-symbols-outlined text-brand-amber text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-outline">
                  <span className="material-symbols-outlined text-brand-amber text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="font-label-md">
                    {carrier.averageRating.toFixed(1)} ({carrier.completedTrips} {t('completedTrips')})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end w-full md:w-auto gap-3">
              <div className="font-hero-sm text-brand-amber font-black">
                {booking.quote?.price ?? '—'} ر.ع.
              </div>
              {carrier.whatsapp && (
                <a href={`https://wa.me/${carrier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white font-title-md py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors w-full shadow-sm">
                  <span>{t('actions.whatsapp')}</span>
                  <span className="material-symbols-outlined">chat</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {(isShipper || !isShipper) && (
          <div className="flex flex-col gap-3 mt-4">
            {canStart && (
              <button onClick={async () => { await transportApi.markInProgress(id); load() }}
                className="bg-gradient-to-l from-brand-amber to-[#FF8C42] text-white font-title-lg py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98] w-full flex justify-center items-center gap-2">
                {t('actions.startTrip')}
                <span className="material-symbols-outlined font-bold">check</span>
              </button>
            )}
            {canComplete && (
              <button onClick={async () => { await transportApi.completeBooking(id); load() }}
                className="bg-gradient-to-l from-price-green to-[#22c55e] text-white font-title-lg py-4 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-[0.98] w-full flex justify-center items-center gap-2">
                {t('actions.completeTrip')}
                <span className="material-symbols-outlined font-bold">done_all</span>
              </button>
            )}
            {canCancel && (
              <button onClick={async () => { await transportApi.cancelBooking(id); load() }}
                className="text-error font-title-md py-3 text-center w-full hover:underline mt-2">
                {t('actions.cancelBooking')}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
