'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { transportApi } from './api'
import type { CarrierProfile, TransportServiceType, VehicleType } from './types'

const VEHICLE_LABELS: Record<VehicleType, string> = {
  PICKUP:      'ونيت',      VAN:         'فان',
  TRUCK_SMALL: 'دينا',      TRUCK_LARGE: 'تريلا',
  TRAILER:     'سطحة',      TIPPER:      'قلاب',
  CRANE:       'ونش',       EXCAVATOR:   'حفار',
  OTHER:       'أخرى',
}

const SERVICE_LABELS: Record<TransportServiceType, string> = {
  GOODS:        'بضائع عامة',  FURNITURE:    'نقل أثاث',
  CONSTRUCTION: 'مواد بناء',   HEAVY:        'معدات ثقيلة',
  BACKLOAD:     'حمولات راجعة', EQUIPMENT:   'تأجير معدات',
}

export default function CarrierProfileShell({ id }: { id: string }) {
  const t = useTranslations('transport')
  const [carrier, setCarrier] = useState<CarrierProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    transportApi.getCarrier(id).then(setCarrier).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-6">
      <div className="h-64 bg-surface-dim rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 h-48 bg-surface-dim rounded-xl animate-pulse" />
        <div className="md:col-span-8 h-48 bg-surface-dim rounded-xl animate-pulse" />
      </div>
    </main>
  )

  if (!carrier) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-16 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-6xl text-outline mb-4 block">person_off</span>
      <p className="text-title-lg">لم يتم العثور على البروفايل</p>
    </main>
  )

  const displayName = carrier.companyName ?? carrier.user?.displayName ?? carrier.user?.username

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8 space-y-6">
      {/* Hero banner */}
      <div className="relative bg-surface-container-lowest rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 overflow-hidden">
        {/* Cover */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-brand-navy to-primary-container relative">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_white,_transparent)]" />
        </div>
        {/* Profile row */}
        <div className="px-6 pb-6 relative z-10 flex flex-col md:flex-row gap-6 md:items-end -mt-16 md:-mt-20">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-surface-container-lowest overflow-hidden bg-white shrink-0 shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">business</span>
          </div>
          <div className="flex-grow flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-hero-sm text-hero-sm text-on-background">{displayName}</h1>
                {carrier.isVerified && (
                  <span className="material-symbols-outlined text-primary text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full font-label-md text-label-md">
                  <span className={`w-2 h-2 rounded-full ${carrier.isAvailable ? 'bg-brand-green' : 'bg-outline-variant'}`} />
                  {carrier.isAvailable ? t('availableNow') : t('unavailable')}
                </span>
                <span className="text-secondary font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[14px] align-middle">location_on</span>
                  {' '}{carrier.governorate}{carrier.city ? `، ${carrier.city}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Stats row */}
        <div className="border-t border-outline-variant/20 bg-surface-container-low/50">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-outline-variant/20 p-4">
            {[
              { label: 'الرحلات المكتملة', val: carrier.completedTrips.toLocaleString('ar-OM') },
              { label: t('rating'),         val: <span className="flex items-center justify-center gap-1">
                  {carrier.averageRating.toFixed(1)}
                  <span className="material-symbols-outlined text-brand-amber text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </span> },
              { label: 'التقييمات',         val: carrier.reviewCount.toLocaleString('ar-OM') },
              { label: 'عضو منذ',           val: new Date(carrier.createdAt).getFullYear() },
            ].map(s => (
              <div key={s.label} className="text-center px-2">
                <p className="font-body-sm text-body-sm text-secondary mb-1">{s.label}</p>
                <p className="font-title-lg text-title-lg text-on-background">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar actions */}
        <div className="md:col-span-4 space-y-4 order-1 md:order-2">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 flex flex-col gap-4 sticky top-32">
            {carrier.whatsapp && (
              <a href={`https://wa.me/${carrier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="w-full bg-brand-green text-white rounded-xl py-3 px-4 font-title-md text-title-md flex justify-center items-center gap-2 hover:shadow-lg transition-all">
                <span className="material-symbols-outlined">chat</span>
                {t('actions.whatsapp')}
              </a>
            )}
            {carrier.contactPhone && (
              <a href={`tel:${carrier.contactPhone}`}
                className="w-full bg-surface-container-low text-primary rounded-xl py-3 px-4 font-title-md text-title-md flex justify-center items-center gap-2 hover:bg-surface-container-high transition-all">
                <span className="material-symbols-outlined">call</span>
                {carrier.contactPhone}
              </a>
            )}
            <Link href="/transport/new"
              className="w-full border-2 border-brand-amber text-brand-amber rounded-xl py-3 px-4 font-title-md text-title-md flex justify-center items-center gap-2 hover:bg-brand-amber/5 transition-all">
              <span className="material-symbols-outlined">request_quote</span>
              {t('actions.requestQuote')}
            </Link>
            <div className="pt-4 mt-2 border-t border-outline-variant/20">
              <p className="font-body-sm text-body-sm text-secondary mb-2">معلومات إضافية</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline">location_on</span>
                  <span className="font-body-md text-body-md">{carrier.governorate}{carrier.city ? `، ${carrier.city}` : ''}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-8 space-y-6 order-2 md:order-1">
          {/* Bio */}
          {carrier.bio && (
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm outline outline-1 outline-outline-variant/10">
              <h2 className="font-title-lg text-title-lg text-on-background mb-4">نبذة</h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{carrier.bio}</p>
            </div>
          )}

          {/* Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle types */}
            {carrier.vehicleTypes.length > 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 hover:outline-outline-variant/20 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary bg-primary-container/10 p-2 rounded-lg">local_shipping</span>
                  <h3 className="font-title-md text-title-md text-on-background">{t('fields.vehicleTypes')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {carrier.vehicleTypes.map(v => (
                    <span key={v} className="px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg font-body-sm text-body-sm border border-outline-variant/10">
                      {VEHICLE_LABELS[v]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service types */}
            {carrier.serviceTypes.length > 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm outline outline-1 outline-outline-variant/10 hover:outline-outline-variant/20 transition-all">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-brand-amber bg-brand-amber/10 p-2 rounded-lg">handyman</span>
                  <h3 className="font-title-md text-title-md text-on-background">{t('fields.serviceTypesLabel')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {carrier.serviceTypes.map(s => (
                    <span key={s} className="px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg font-body-sm text-body-sm border border-outline-variant/10">
                      {SERVICE_LABELS[s]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
