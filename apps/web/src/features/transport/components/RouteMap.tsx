'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const RouteMapClient = dynamic(
  () => import('./RouteMapClient').then((m) => m.RouteMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-surface-container-high animate-pulse flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">map</span>
      </div>
    ),
  },
)

interface RouteMapProps {
  fromLat?: number
  fromLng?: number
  toLat?: number
  toLng?: number
  className?: string
}

export function RouteMap({ fromLat, fromLng, toLat, toLng, className = 'h-48' }: RouteMapProps) {
  const t = useTranslations('transport')

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return (
      <div className={`w-full ${className} rounded-xl bg-surface-container flex items-center justify-center`}>
        <span className="text-[13px] text-on-surface-variant">{t('mapUnavailable')}</span>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <RouteMapClient fromLat={fromLat} fromLng={fromLng} toLat={toLat} toLng={toLng} />
    </div>
  )
}
