'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'
import {
  Search, Plus, Truck, Package, Sofa, HardHat, ArrowLeftRight, Wrench,
  ArrowLeft, TrendingUp, ShieldCheck, MapPin, Layers,
} from 'lucide-react'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { SERVICE_TYPES } from '@/features/transport/constants'
import { transportApi } from '@/features/transport/api'
import { TransportRequestCard, TransportRequestCardSkeleton } from '@/features/transport/components/TransportRequestCard'
import type { TransportRequest, TransportServiceType } from '@/features/transport/types'

// ── Neon Typing Animation ──────────────────────────────────────────────────

function NeonTypingText({ text, className, speed = 70, glowColor = '#FE5E00' }: { text: string; className?: string; speed?: number; glowColor?: string }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return (
    <span
      className={className}
      style={{
        textShadow: `0 0 7px ${glowColor}80, 0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20`,
        transition: 'text-shadow 0.3s ease',
      }}
    >
      {displayed}
      {!done && (
        <span
          className="inline-block w-[3px] h-[0.85em] align-middle ms-0.5 rounded-full animate-pulse"
          style={{ backgroundColor: glowColor, boxShadow: `0 0 8px ${glowColor}, 0 0 20px ${glowColor}80` }}
        />
      )}
    </span>
  )
}

/* ─── Animation Helpers ───────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Data ────────────────────────────────────────────────────────────── */

const SERVICE_ICONS_LUCIDE: Record<TransportServiceType, typeof Truck> = {
  GOODS: Package,
  FURNITURE: Sofa,
  CONSTRUCTION: HardHat,
  HEAVY: Truck,
  BACKLOAD: ArrowLeftRight,
  EQUIPMENT: Wrench,
}

const SERVICE_COLORS: Record<TransportServiceType, string> = {
  GOODS: 'from-blue-500 to-blue-600',
  FURNITURE: 'from-amber-500 to-amber-600',
  CONSTRUCTION: 'from-teal-500 to-teal-600',
  HEAVY: 'from-purple-500 to-purple-600',
  BACKLOAD: 'from-green-500 to-green-600',
  EQUIPMENT: 'from-rose-500 to-rose-600',
}

const STEPS = [
  { num: '١', icon: 'add_circle',     gradient: 'from-primary to-[#2563eb]' },
  { num: '٢', icon: 'request_quote',  gradient: 'from-teal-500 to-teal-600' },
  { num: '٣', icon: 'local_shipping', gradient: 'from-brand-amber to-[#ff7a2e]' },
] as const

const WHY_ITEMS = [
  { icon: TrendingUp,  key: 'why1' },
  { icon: ShieldCheck, key: 'why2' },
  { icon: MapPin,      key: 'why3' },
  { icon: Layers,      key: 'why4' },
] as const

/* ─── Quick Links Data ───────────────────────────────────────────────── */

const QUICK_LINKS = [
  { title: 'تصفح الطلبات', icon: Search,  href: '/transport/browse',           gradient: 'from-blue-600 to-indigo-700',  count: 'طلبات مفتوحة' },
  { title: 'أنشئ طلب نقل', icon: Plus,    href: '/transport/new',               gradient: 'from-emerald-600 to-teal-700', count: 'مجاناً' },
  { title: 'سجّل كمزود',   icon: Truck,   href: '/transport/carrier/register',  gradient: 'from-purple-600 to-pink-600',  count: 'استقبل طلبات' },
  { title: 'طلباتي',       icon: Package, href: '/transport/my-requests',       gradient: 'from-amber-500 to-orange-600', count: 'إدارة الطلبات' },
] as const

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function TransportLandingPage() {
  const t = useTranslations('transport')
  const tl = useTranslations('transport.landing')
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRequests, setTotalRequests] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const sl = Math.abs(el.scrollLeft)
    setCanScrollLeft(sl > 4)
    setCanScrollRight(sl + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    transportApi
      .getRequests({ limit: '12', status: 'OPEN' })
      .then(res => {
        setRequests(res.items ?? [])
        setTotalRequests(res.meta?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchRef.current?.value?.trim()
    router.push(`/transport/browse${q ? `?q=${encodeURIComponent(q)}` : ''}` as Parameters<typeof router.push>[0])
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section>
        {/* Search bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface-container-lowest dark:bg-surface-container rounded-full border border-outline-variant/20 ps-3 pe-1.5 py-1 shadow-sm">
              <Search size={16} className="text-on-surface-variant/50 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder={tl('searchPlaceholder')}
                dir="auto"
                className="flex-1 h-8 sm:h-9 bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none min-w-0"
              />
              <button type="submit" className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-full flex items-center justify-center hover:brightness-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-on-primary text-[16px] sm:text-[18px]">search</span>
              </button>
            </form>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-3">
          <div className="relative w-full overflow-hidden aspect-[16/9] sm:aspect-[16/5] lg:aspect-[16/5.5] xl:aspect-[16/5] rounded-2xl sm:rounded-3xl">
            <Image
              src="/images/categories/equipment.webp"
              alt="سوق وان للنقل"
              fill
              priority
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-12 xl:px-16 text-white"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/80 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-brand-amber text-[14px] sm:text-[16px]">verified</span>
                <span>{totalRequests > 0 ? `${totalRequests.toLocaleString('ar-EG')} طلب نقل` : 'خدمات النقل والشحن'}</span>
              </div>

              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-1 sm:mb-2 lg:mb-3">
                <span className="text-white">أكبر سوق </span>
                <NeonTypingText text="نقل وشحن" speed={100} glowColor="#FE5E00" className="text-brand-amber" />
                <span className="text-white"> في عُمان</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-lg lg:max-w-xl">
                {tl('heroSubtitle')}
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-5">
                <Link
                  href="/transport/browse"
                  className="btn-brand shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black rounded-lg sm:rounded-xl hover:brightness-110 transition-all"
                >
                  <Truck size={14} className="sm:w-[18px] sm:h-[18px]" />
                  {tl('heroCta')}
                </Link>
                <Link
                  href="/transport/new"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                  {tl('heroAddCta')}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="hidden sm:flex items-center justify-center gap-2 lg:gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 lg:px-3 lg:py-1.5">
                  <span className="material-symbols-outlined !text-[13px] lg:!text-sm leading-none">verified_user</span>
                  مزودون موثوقون
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 lg:px-3 lg:py-1.5">
                  <span className="material-symbols-outlined !text-[13px] lg:!text-sm leading-none">local_shipping</span>
                  نقل وشحن
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. QUICK LINKS ═══════════════════ */}
      <section className="relative z-20 max-w-6xl mx-auto px-2 sm:px-4 md:px-8 mt-4 sm:mt-6">
        <div className="grid grid-cols-4 gap-1 sm:gap-3 md:gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group flex flex-col items-center text-center py-2 sm:py-3 hover:opacity-80 transition-opacity"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-1.5 sm:mb-2 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <link.icon size={18} className="text-white sm:hidden" />
                <link.icon size={22} className="text-white hidden sm:block" />
              </div>
              <h3 className="text-[10px] sm:text-[13px] md:text-[14px] font-bold text-on-surface leading-tight">{link.title}</h3>
              <span className="text-[8px] sm:text-[10px] md:text-[11px] font-medium text-on-surface-variant mt-0.5">{link.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════ 3. SERVICE TYPES ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{tl('typesTitle')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{tl('typesSubtitle')}</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              {SERVICE_TYPES.map((type: TransportServiceType) => {
                const Icon = SERVICE_ICONS_LUCIDE[type]
                return (
                  <motion.div key={type} variants={fadeUp}>
                    <Link
                      href={`/transport/browse?serviceType=${type}`}
                      className="group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${SERVICE_COLORS[type]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={28} className="text-white" strokeWidth={2} />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-sm sm:text-[15px] text-on-surface mb-0.5">{t(`serviceTypes.${type}`)}</h3>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 4. LATEST REQUESTS ═══════════════════ */}
      <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{tl('featuredTitle')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{tl('featuredSubtitle')}</p>
            </motion.div>

            <motion.div variants={fadeUp}>
              {/* Header with arrows */}
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[18px] sm:text-[20px]">local_shipping</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-black text-on-surface">{t('latestRequests')}</h3>
                    <p className="text-[10px] sm:text-xs text-on-surface-variant">{totalRequests > 0 ? `${totalRequests} ${t('advertisement')}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      onClick={() => scroll('left')}
                      disabled={!canScrollLeft}
                      className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <button
                      onClick={() => scroll('right')}
                      disabled={!canScrollRight}
                      className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                  </div>
                  <Link
                    href="/transport/browse"
                    className="text-[11px] sm:text-[13px] font-bold text-primary hover:underline underline-offset-2"
                  >
                    {t('viewAll')}
                    <ArrowLeft size={12} className="inline ms-1" />
                  </Link>
                </div>
              </div>

              {/* Horizontal slider */}
              {loading ? (
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0">
                      <TransportRequestCardSkeleton />
                    </div>
                  ))}
                </div>
              ) : requests.length > 0 ? (
                <div
                  ref={scrollRef}
                  onScroll={checkScroll}
                  className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-3 px-3 pb-2"
                >
                  {requests.map((r) => (
                    <div key={r.id} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0 snap-start">
                      <TransportRequestCard request={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-on-surface-variant text-[14px]">
                  {t('empty.requests')}
                </div>
              )}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 5. HOW IT WORKS ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
              <h2 className="text-base sm:text-xl md:text-3xl font-black mb-2">{tl('stepsTitle')}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{tl('stepsSubtitle')}</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10"
                >
                  <div className="absolute -top-3 start-4 sm:start-6 w-7 h-7 rounded-lg bg-primary text-on-primary text-xs font-black flex items-center justify-center shadow-md">
                    {step.num}
                  </div>

                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-[28px] sm:text-[32px]">{step.icon}</span>
                  </div>
                  <h3 className="font-bold text-[15px] sm:text-lg text-on-surface mb-1.5">{tl(`step${i + 1}Title`)}</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{tl(`step${i + 1}Desc`)}</p>

                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -start-3 w-6 border-t-2 border-dashed border-outline-variant/40" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 6. WHY SOUQONE ═══════════════════ */}
      <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
              <h2 className="text-base sm:text-xl md:text-3xl font-black mb-2">{tl('whyTitle')}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{tl('whySubtitle')}</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {WHY_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.key}
                    variants={fadeUp}
                    className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/15 hover:shadow-ambient transition-all duration-300"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-[15px] text-on-surface mb-1">{tl(`${item.key}Title`)}</h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{tl(`${item.key}Desc`)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 7. FINAL CTA ═══════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#2563eb] to-brand-navy" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -end-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-brand-amber/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-3 sm:px-6 py-12 sm:py-20 text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">
                {tl('ctaTitle')}
              </h2>
              <p className="text-sm sm:text-base text-white/70 mb-6 sm:mb-8 max-w-lg mx-auto">
                {tl('ctaSubtitle')}
              </p>
              <Link
                href="/transport/carrier/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-white text-primary font-black text-sm sm:text-base hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg"
              >
                <Plus size={20} />
                {tl('ctaButton')}
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
      </main>
    </>
  )
}
