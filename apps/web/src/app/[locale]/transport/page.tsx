'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import TransportRequestCard from '@/features/transport/components/TransportRequestCard'
import { transportApi } from '@/features/transport/api'
import type { TransportRequest } from '@/features/transport/types'

const SERVICE_TYPES = [
  { key: 'GOODS',        icon: 'inventory_2',            tKey: 'GOODS'        },
  { key: 'FURNITURE',    icon: 'chair',                  tKey: 'FURNITURE'    },
  { key: 'CONSTRUCTION', icon: 'construction',           tKey: 'CONSTRUCTION' },
  { key: 'HEAVY',        icon: 'precision_manufacturing',tKey: 'HEAVY'        },
  { key: 'BACKLOAD',     icon: 'swap_horiz',             tKey: 'BACKLOAD'     },
  { key: 'EQUIPMENT',    icon: 'agriculture',            tKey: 'EQUIPMENT'    },
] as const

export default function TransportLandingPage() {
  const t = useTranslations('transport')

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    transportApi.getRequests({ limit: 6, status: 'OPEN' })
      .then(res => setRequests(res.items))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* ── Hero Section ── */}
      <section>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-3">
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/5] rounded-2xl sm:rounded-3xl overflow-hidden">

            {/* Background — navy gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1e52] via-[#102a6e] to-[#1a3a6b]" />

            {/* Subtle radial overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff22 0%, transparent 60%)' }}
            />

            {/* Dark gradient overlay — same as home */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e52]/90 via-[#0a1e52]/30 to-transparent" />

            {/* Decorative icon — top-left (non-text side) */}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 opacity-20 pointer-events-none">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: 'clamp(80px, 15vw, 160px)', fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>

            {/* Content pinned to bottom — same positioning as home hero */}
            <div className="absolute bottom-0 inset-x-0 px-4 sm:px-8 lg:px-12 pb-3 sm:pb-6 lg:pb-10 text-right">
              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight mb-1 sm:mb-2 lg:mb-3">
                {t('subtitle')}
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-xl ms-auto">
                {t('carrierCta').split('—')[0]?.trim() ?? t('subtitle')}
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-end">
                <Link
                  href="/transport/new"
                  className="btn-brand shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black rounded-lg sm:rounded-xl hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  {t('newRequest')}
                </Link>
                <Link
                  href="/transport/carrier/register"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none" style={{ fontVariationSettings: "'FILL' 0" }}>local_shipping</span>
                  {t('becomeCarrier')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Service Types Grid ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-16 md:py-24">
        <div className="flex flex-col gap-4 mb-12">
          <h2 className="font-hero-md text-hero-md text-on-surface">{t('whatToTransport')}</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            اختر نوع الشحنة لتصفح أفضل العروض والمزودين
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {SERVICE_TYPES.map(({ key, icon, tKey }) => (
            <Link
              key={key}
              href={`/transport/browse?type=${key}`}
              className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:shadow-lg hover:border-outline-variant/20 hover:-translate-y-1 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                <span
                  className="material-symbols-outlined text-3xl text-primary group-hover:text-on-primary"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {icon}
                </span>
              </div>
              <span className="font-title-md text-title-md text-on-surface text-center">
                {t(`serviceTypes.${tKey}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Latest Requests ── */}
      <section className="bg-surface-container-low py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-hero-md text-hero-md text-on-surface mb-2">
                {t('latestRequests')}
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                تصفح أحدث الطلبات وقدم عروضك الآن
              </p>
            </div>
            <Link
              href="/transport/browse"
              className="hidden md:flex items-center gap-2 text-primary font-title-md text-title-md hover:opacity-80 transition-opacity"
            >
              {t('viewAll')}
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                arrow_back
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 h-44 animate-pulse" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[64px] opacity-30" style={{ fontVariationSettings: "'FILL' 0" }}>
                local_shipping
              </span>
              <p className="font-body-lg text-body-lg">{t('empty.requests')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map(r => (
                <TransportRequestCard key={r.id} request={r} />
              ))}
            </div>
          )}

          <Link
            href="/transport/browse"
            className="mt-8 md:hidden w-full py-4 border border-outline-variant rounded-xl font-title-md text-title-md text-primary flex items-center justify-center gap-2"
          >
            {t('viewAll')}
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              arrow_back
            </span>
          </Link>
        </div>
      </section>

      {/* ── Carrier CTA ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-20">
        <div className="bg-gradient-to-r from-surface-container-high to-surface-variant rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/20 shadow-sm relative overflow-hidden">
          <div className="absolute -right-20 -top-20 opacity-5">
            <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_shipping
            </span>
          </div>
          <div className="flex flex-col gap-4 relative z-10 max-w-xl text-center md:text-right">
            <h2 className="font-hero-md text-hero-md text-brand-navy">هل لديك شاحنة أو معدة؟</h2>
            <p className="font-title-lg text-title-lg text-on-surface-variant leading-relaxed">
              انضم إلى شبكة المزودين المعتمدين في سوق وان وابدأ في استقبال طلبات النقل وزيادة دخلك اليوم.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <Link
              href="/transport/carrier/register"
              className="w-full md:w-auto bg-gradient-to-br from-brand-amber to-orange-600 text-on-primary font-title-lg text-title-lg px-10 py-5 rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 duration-200 flex items-center justify-center"
            >
              {t('becomeCarrier')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
