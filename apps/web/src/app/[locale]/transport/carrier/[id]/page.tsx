'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Star, ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { ErrorState } from '@/components/error-state'
import { transportApi } from '@/features/transport/api'
import { VEHICLE_TYPE_LABELS } from '@/features/transport/constants'
import type { CarrierProfile, VehicleType, TransportServiceType } from '@/features/transport/types'

function ProfileSkeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-surface-container-high rounded" />
            <div className="h-3 w-24 bg-surface-container-high rounded" />
          </div>
        </div>
        <div className="h-20 bg-surface-container-high rounded-xl" />
        <div className="h-32 bg-surface-container-high rounded-xl" />
      </div>
      <Footer />
    </>
  )
}

export default function CarrierProfilePage() {
  const params = useParams<{ id: string }>()
  const carrierId = params.id
  const t = useTranslations('transport')

  const [carrier, setCarrier] = useState<CarrierProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!carrierId) return
    transportApi.getCarrier(carrierId)
      .then(setCarrier)
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false))
  }, [carrierId])

  if (isLoading) return <ProfileSkeleton />

  if (isError || !carrier) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-3xl mx-auto px-4"><ErrorState message={t('noResults')} /></main>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-on-surface-variant/70 mb-6">
          <Link href="/transport" className="hover:text-primary transition-colors">{t('home')}</Link>
          <ChevronLeft size={14} className="text-outline-variant/60" />
          <span className="text-on-surface/90">{t('carrierProfile')}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-2xl font-bold text-on-surface-variant overflow-hidden">
            {carrier.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={carrier.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (carrier.user.displayName ?? carrier.user.username).charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface">
                {carrier.companyName || carrier.user.displayName || carrier.user.username}
              </h1>
              {carrier.isVerified && (
                <span className="text-[12px] text-primary font-medium">✓ {t('verified')}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={clsx(
                  'flex items-center gap-1 text-[12px] font-medium',
                  carrier.isAvailable ? 'text-green-600' : 'text-on-surface-variant'
                )}
              >
                <span className={clsx('w-2 h-2 rounded-full', carrier.isAvailable ? 'bg-green-500' : 'bg-gray-400')} />
                {carrier.isAvailable ? t('availableNow') : t('unavailable')}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[13px] text-on-surface-variant mb-6">
          <span>{t('completedTrips')}: {carrier.completedTrips}</span>
          <span className="text-outline-variant/40">·</span>
          {carrier.averageRating > 0 && (
            <>
              <span className="flex items-center gap-0.5">
                <Star size={13} className="text-amber-500 fill-amber-500" />
                {carrier.averageRating.toFixed(1)}
              </span>
              <span className="text-outline-variant/40">·</span>
            </>
          )}
          <span>{t('memberSince')} {new Date(carrier.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })}</span>
        </div>

        {/* Vehicle + service chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {carrier.vehicleTypes.map((v: VehicleType) => (
            <span key={v} className="px-3 py-1 rounded-full bg-surface-container text-sm text-on-surface-variant">
              {VEHICLE_TYPE_LABELS[v]}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {carrier.serviceTypes.map((s: TransportServiceType) => (
            <span key={s} className="px-3 py-1 rounded-full bg-amber-500/10 text-sm text-amber-700">
              {t(`serviceTypes.${s}`)}
            </span>
          ))}
        </div>

        {/* Region */}
        <p className="text-[14px] text-on-surface mb-2">
          {carrier.governorate}{carrier.city ? ` - ${carrier.city}` : ''}
        </p>

        {/* Bio */}
        {carrier.bio && (
          <p className="text-[14px] text-on-surface-variant leading-relaxed mb-6">{carrier.bio}</p>
        )}

        {/* WhatsApp */}
        {carrier.whatsapp && (
          <a
            href={`https://wa.me/${carrier.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500 text-white text-[13px] font-semibold hover:bg-green-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.842L.057 23.854a.5.5 0 0 0 .61.61l6.012-1.453A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6a9.563 9.563 0 0 1-4.861-1.327l-.348-.207-3.613.873.888-3.524-.227-.362A9.565 9.565 0 0 1 2.4 12C2.4 6.698 6.698 2.4 12 2.4S21.6 6.698 21.6 12 17.302 21.6 12 21.6z"/>
            </svg>
            {t('actions.whatsapp')}
          </a>
        )}
      </div>
      <Footer />
    </>
  )
}
