'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { transportApi } from './api'
import type { CarrierProfile, TransportRequest } from './types'
import { SERVICE_TYPE_ICONS } from './constants'


export default function CarrierDashboardShell() {
  const t = useTranslations('transport')

  const [profile,  setProfile]  = useState<CarrierProfile | null>(null)
  const [nearby,   setNearby]   = useState<TransportRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [p, req] = await Promise.all([
        transportApi.getMyCarrierProfile(),
        transportApi.getRequests({ limit: 6 }),
      ])
      setProfile(p)
      setNearby(req.items)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleAvailability() {
    if (!profile) return
    setToggling(true)
    try {
      const updated = await transportApi.setAvailability(!profile.isAvailable)
      setProfile(updated)
    } finally { setToggling(false) }
  }

  if (loading) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-surface-dim rounded-xl animate-pulse" />)}
      </div>
    </main>
  )

  if (!profile) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8 text-center">
      <p className="text-title-lg text-on-surface-variant mb-4">ليس لديك بروفايل مزود بعد.</p>
      <Link href="/transport/carrier/register"
        className="bg-gradient-to-br from-brand-amber to-amber-600 text-white px-6 py-3 rounded-xl font-title-md">
        {t('becomeCarrier')}
      </Link>
    </main>
  )

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 py-8">
      {/* Availability toggle */}
      <section className="bg-brand-navy rounded-2xl p-6 md:p-8 shadow-lg mb-8 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 outline outline-1 outline-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(255,255,255) 0%, transparent 40%)' }} />
        <div className="relative z-10 flex flex-col gap-2 max-w-md">
          <h1 className="font-hero-md text-hero-md text-white">{t('dashboard.availableToggle')}</h1>
          <p className="font-body-lg text-body-lg text-white/70">{t('dashboard.availableDesc')}</p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/10">
          <span className={`font-title-md text-title-md font-bold ${profile.isAvailable ? 'text-brand-amber' : 'text-white/50'}`}>
            {profile.isAvailable ? t('availableNow') + ' •' : t('unavailable')}
          </span>
          <button onClick={toggleAvailability} disabled={toggling}
            className={`w-16 h-8 rounded-full relative transition-colors duration-300 ${profile.isAvailable ? 'bg-brand-amber' : 'bg-white/20'}`}>
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${profile.isAvailable ? 'left-1' : 'right-1'}`} />
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: t('dashboard.quotesSubmitted'), val: profile.completedTrips,  icon: 'request_quote', bg: 'bg-surface-container',    color: 'text-primary' },
          { label: t('dashboard.quotesAccepted'),  val: profile.completedTrips,  icon: 'check_circle',  bg: 'bg-brand-amber/10',        color: 'text-brand-amber' },
          { label: t('dashboard.tripsCompleted'),  val: profile.completedTrips,  icon: 'local_shipping', bg: 'bg-primary/10',            color: 'text-primary' },
          { label: t('rating'),                    val: profile.averageRating.toFixed(1), icon: 'star', bg: 'bg-brand-amber/10',       color: 'text-brand-amber' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-outline-variant/10 hover:border-outline-variant/20 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <span className="font-title-md text-title-md text-secondary">{s.label}</span>
              <div className={`p-2 ${s.bg} rounded-lg ${s.color}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
            </div>
            <span className="font-hero-lg text-hero-lg text-on-surface">{s.val}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Nearby requests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-hero-sm text-hero-sm text-on-surface">{t('dashboard.nearbyRequests')}</h2>
            <Link href="/transport/browse" className="font-title-md text-title-md text-primary hover:underline">
              {t('viewAll')}
            </Link>
          </div>
          {nearby.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-8">{t('empty.nearbyRequests')}</p>
          ) : nearby.map(req => (
            <article key={req.id}
              className="bg-surface-container-lowest rounded-[16px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-outline-variant/10 hover:border-outline-variant/20 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="p-3 bg-surface-container rounded-xl text-primary shrink-0">
                  <span className="material-symbols-outlined text-3xl">{SERVICE_TYPE_ICONS[req.serviceType]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-title-md text-title-md text-on-surface">{t('fields.from')} {req.fromGovernorate}</span>
                    <span className="material-symbols-outlined text-secondary text-sm">arrow_left_alt</span>
                    <span className="font-title-md text-title-md text-on-surface">{t('fields.to')} {req.toGovernorate}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-secondary line-clamp-1">
                    {t(`serviceTypes.${req.serviceType}`)}
                    {req.weightTons ? ` • ${req.weightTons} ${t('fields.tons')}` : ''}
                  </p>
                </div>
              </div>
              <Link href={`/transport/requests/${req.id}`}
                className="w-full sm:w-auto bg-gradient-to-r from-brand-amber to-[#FF9D5C] text-white font-title-md text-title-md py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 whitespace-nowrap text-center">
                {t('actions.submitQuote')}
              </Link>
            </article>
          ))}
        </div>

        {/* Recent quotes */}
        <div className="space-y-4">
          <h2 className="font-hero-sm text-hero-sm text-on-surface mb-4">{t('dashboard.recentQuotes')}</h2>
          <div className="bg-surface-container-lowest rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-outline-variant/10 overflow-hidden">
            <div className="p-4 text-center text-body-sm text-on-surface-variant">
              <Link href="/transport/my-quotes" className="text-primary hover:underline font-bold">
                {t('myQuotes')}
              </Link>
            </div>
          </div>
          <Link href="/transport/my-quotes"
            className="block bg-gradient-to-r from-brand-amber to-[#FF9D5C] text-white font-title-md text-title-md py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all text-center">
            {t('myQuotes')}
          </Link>
        </div>
      </div>
    </main>
  )
}
