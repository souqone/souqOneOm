'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import {
  Search, Plus, Bus, Users, GraduationCap, Crown,
  Truck, MinusSquare, ArrowLeft,
  TrendingUp, ShieldCheck, Headphones, Layers,
} from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { BusListingItem } from '@/lib/api/buses';

/* ─── Animation Helpers ───────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
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
  );
}

/* ─── Data ────────────────────────────────────────────────────────────── */

const BUS_TYPES = [
  { key: 'tourist',  icon: Bus,            color: 'from-blue-500 to-blue-600',   filter: 'TOURIST' },
  { key: 'school',   icon: GraduationCap,  color: 'from-amber-500 to-amber-600', filter: 'SCHOOL' },
  { key: 'employee', icon: Users,           color: 'from-teal-500 to-teal-600',   filter: 'EMPLOYEE_TRANSPORT' },
  { key: 'vip',      icon: Crown,           color: 'from-purple-500 to-purple-600', filter: 'VIP' },
  { key: 'public',   icon: Truck,           color: 'from-green-500 to-green-600',  filter: 'PUBLIC' },
  { key: 'mini',     icon: MinusSquare,     color: 'from-rose-500 to-rose-600',    filter: 'MINIBUS' },
] as const;

const STATS = [
  { key: 'Buses',   icon: 'directions_bus' },
  { key: 'Cities',  icon: 'location_city' },
  { key: 'Clients', icon: 'group' },
  { key: 'Years',   icon: 'workspace_premium' },
] as const;

const STEPS = [
  { num: '١', icon: 'search',       gradient: 'from-primary to-[#2563eb]' },
  { num: '٢', icon: 'chat',         gradient: 'from-teal-500 to-teal-600' },
  { num: '٣', icon: 'event_available', gradient: 'from-brand-amber to-[#ff7a2e]' },
] as const;

const WHY_ITEMS = [
  { icon: TrendingUp,  key: 'why1' },
  { icon: ShieldCheck, key: 'why2' },
  { icon: Headphones,  key: 'why3' },
  { icon: Layers,      key: 'why4' },
] as const;

/* ─── Main Component ──────────────────────────────────────────────────── */

interface Props {
  buses: BusListingItem[];
  totalBuses: number;
}

export function BusesLandingClient({ buses, totalBuses }: Props) {
  const t = useTranslations('busesLanding');
  const router = useRouter();
  const { transformBus } = useItemTransformers();
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value?.trim();
    router.push(`/browse/buses${q ? `?q=${encodeURIComponent(q)}` : ''}` as any);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative overflow-hidden bg-brand-navy">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/categories/buses.webp"
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/70 to-brand-navy" />
        </div>

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-10 w-96 h-96 bg-brand-amber/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <span className="material-symbols-outlined text-brand-amber text-[16px]">verified</span>
              <span>{totalBuses > 0 ? `${totalBuses.toLocaleString('ar-EG')} حافلة متاحة` : 'حافلات للبيع والإيجار'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 sm:mb-5">
              {t('heroTitle')}
            </h1>
            <p className="text-sm sm:text-lg text-white/70 leading-relaxed mb-6 sm:mb-8 max-w-xl">
              {t('heroSubtitle')}
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xl mb-6 sm:mb-8">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  dir="auto"
                  className="w-full h-12 sm:h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pe-4 ps-12 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
                />
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
              </div>
              <button
                type="submit"
                className="h-12 sm:h-14 px-6 sm:px-8 btn-brand rounded-2xl font-bold text-sm shrink-0 hover:brightness-110 active:scale-95 transition-all"
              >
                {t('heroCta')}
              </button>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/browse/buses"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-navy font-bold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              >
                <Bus size={18} />
                {t('heroCta')}
              </Link>
              <Link
                href="/add-listing/bus"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white font-bold text-sm hover:bg-white/10 active:scale-95 transition-all"
              >
                <Plus size={18} />
                {t('heroAddCta')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ 2. TRUST STATS ═══════════════════ */}
      <section className="relative -mt-6 sm:-mt-8 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {STATS.map(s => (
                <div
                  key={s.key}
                  className="flex flex-col items-center gap-1.5 py-5 sm:py-6 bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/20 shadow-ambient"
                >
                  <span className="material-symbols-outlined text-primary text-[24px] sm:text-[28px]">{s.icon}</span>
                  <span className="text-lg sm:text-2xl font-black text-on-surface">{t(`stat${s.key}`)}</span>
                  <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium">{t(`stat${s.key}Label`)}</span>
                </div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 3. BUS TYPES ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('typesTitle')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('typesSubtitle')}</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              {BUS_TYPES.map(type => {
                const Icon = type.icon;
                const nameKey = `types${type.key.charAt(0).toUpperCase() + type.key.slice(1)}` as any;
                const descKey = `${nameKey}Desc` as any;
                return (
                  <motion.div key={type.key} variants={fadeUp}>
                    <Link
                      href={`/browse/buses?busType=${type.filter}`}
                      className="group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={28} className="text-white" strokeWidth={2} />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-sm sm:text-[15px] text-on-surface mb-0.5">{t(nameKey)}</h3>
                        <p className="text-[10px] sm:text-[11px] text-on-surface-variant/70 leading-relaxed">{t(descKey)}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 4. FEATURED LISTINGS ═══════════════════ */}
      {buses.length > 0 && (
        <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <AnimatedSection>
              <motion.div variants={fadeUp} className="flex flex-wrap justify-between items-end gap-2 mb-6 sm:mb-8">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                    <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('featuredTitle')}</h2>
                  </div>
                  <p className="text-on-surface-variant text-xs sm:text-sm">{t('featuredSubtitle')}</p>
                </div>
                <Link
                  href="/browse/buses"
                  className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm hover:underline transition-colors"
                >
                  {t('featuredViewAll')}
                  <ArrowLeft size={14} />
                </Link>
              </motion.div>

              <motion.div variants={fadeUp}>
                <CardGrid
                  items={buses}
                  mapItem={transformBus}
                  isLoading={false}
                  emptyIcon="directions_bus"
                  emptyMessage=""
                />
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ═══════════════════ 5. HOW IT WORKS ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
              <h2 className="text-base sm:text-xl md:text-3xl font-black mb-2">{t('stepsTitle')}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('stepsSubtitle')}</p>
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
                  {/* Step Number */}
                  <div className="absolute -top-3 start-4 sm:start-6 w-7 h-7 rounded-lg bg-primary text-on-primary text-xs font-black flex items-center justify-center shadow-md">
                    {step.num}
                  </div>

                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-[28px] sm:text-[32px]">{step.icon}</span>
                  </div>
                  <h3 className="font-bold text-[15px] sm:text-lg text-on-surface mb-1.5">{t(`step${i + 1}Title`)}</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{t(`step${i + 1}Desc`)}</p>

                  {/* Connector line (desktop only) */}
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
              <h2 className="text-base sm:text-xl md:text-3xl font-black mb-2">{t('whyTitle')}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('whySubtitle')}</p>
            </motion.div>

            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {WHY_ITEMS.map((item) => {
                const Icon = item.icon;
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
                      <h3 className="font-bold text-sm sm:text-[15px] text-on-surface mb-1">{t(`${item.key}Title`)}</h3>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{t(`${item.key}Desc`)}</p>
                    </div>
                  </motion.div>
                );
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
                {t('ctaTitle')}
              </h2>
              <p className="text-sm sm:text-base text-white/70 mb-6 sm:mb-8 max-w-lg mx-auto">
                {t('ctaSubtitle')}
              </p>
              <Link
                href="/add-listing/bus"
                className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-white text-primary font-black text-sm sm:text-base hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg"
              >
                <Plus size={20} />
                {t('ctaButton')}
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
