'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import {
  Search, Plus, Bus, Users, GraduationCap, Crown, KeyRound,
  Truck, MinusSquare, ArrowLeft,
  TrendingUp, ShieldCheck, Headphones, Layers,
} from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { BusListingItem } from '@/lib/api/buses';

// ── Neon Typing Animation ────────────────────────────────────────────────────

function NeonTypingText({ text, className, speed = 70, glowColor = '#FE5E00' }: { text: string; className?: string; speed?: number; glowColor?: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

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
  );
}

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

/* ─── Bus Category Slider ─────────────────────────────────────────────── */

const BUS_SECTIONS = [
  { type: 'BUS_SALE',               title: 'حافلات للبيع',         icon: 'sell',              color: 'from-blue-500 to-blue-600' },
  { type: 'BUS_RENT',               title: 'حافلات للإيجار',       icon: 'key',               color: 'from-green-500 to-green-600' },
  { type: 'BUS_CONTRACT',           title: 'حافلات للتعاقد',       icon: 'handshake',         color: 'from-purple-500 to-purple-600' },
  { type: 'BUS_SALE_WITH_CONTRACT', title: 'بيع مع عقد تشغيل',    icon: 'assignment_turned_in', color: 'from-amber-500 to-amber-600' },
] as const;

function BusCategorySlider({ items, title, icon, color, filterType }: {
  items: BusListingItem[];
  title: string;
  icon: string;
  color: string;
  filterType: string;
}) {
  const { transformBus } = useItemTransformers();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sl = Math.abs(el.scrollLeft);
    setCanScrollLeft(sl > 4);
    setCanScrollRight(sl + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mb-10 sm:mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
            <span className="material-symbols-outlined text-white text-[18px] sm:text-[20px]">{icon}</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-on-surface">{title}</h3>
            <p className="text-[10px] sm:text-xs text-on-surface-variant">{items.length} إعلان</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label="السابق"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label="التالي"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
          </div>
          <Link
            href={`/browse/buses?busListingType=${filterType}`}
            className="text-[11px] sm:text-[13px] font-bold text-primary hover:underline underline-offset-2"
          >
            عرض الكل
            <ArrowLeft size={12} className="inline ms-1" />
          </Link>
        </div>
      </div>

      {/* Slider */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-3 px-3 pb-2"
      >
        {items.map((bus) => (
          <div key={bus.id} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0 snap-start">
            <UnifiedCard item={transformBus(bus)} className="h-full" />
          </div>
        ))}
      </div>
    </div>
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

export function BusesLandingClient({ buses, totalBuses: _totalBuses }: Props) {
  const t = useTranslations('busesLanding');
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Group buses by listing type for per-section sliders
  const busGroups = useMemo(() => {
    const groups: Record<string, BusListingItem[]> = {};
    for (const bus of buses) {
      const key = bus.busListingType || 'BUS_SALE';
      if (!groups[key]) groups[key] = [];
      groups[key].push(bus);
    }
    return groups;
  }, [buses]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value?.trim();
    router.push(`/browse/buses${q ? `?q=${encodeURIComponent(q)}` : ''}` as any);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section>
        {/* Search bar — above slider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface-container-lowest dark:bg-surface-container rounded-full border border-outline-variant/20 ps-3 pe-1.5 py-1 shadow-sm">
              <Search size={16} className="text-on-surface-variant/50 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder={t('searchPlaceholder')}
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
              src="/images/categories/buses.webp"
              alt="حافلات سوق وان"
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
                <span>{_totalBuses > 0 ? `${_totalBuses.toLocaleString('en-US')} حافلة متاحة` : 'حافلات للبيع والإيجار'}</span>
              </div>

              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-1 sm:mb-2 lg:mb-3">
                <span className="text-white">أكبر سوق </span>
                <NeonTypingText text="حافلات" speed={100} glowColor="#FE5E00" className="text-brand-amber" />
                <span className="text-white"> في عُمان</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-lg lg:max-w-xl">
                {t('heroSubtitle')}
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-5">
                <Link
                  href="/browse/buses"
                  className="btn-brand shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black rounded-lg sm:rounded-xl hover:brightness-110 transition-all"
                >
                  <Bus size={14} className="sm:w-[18px] sm:h-[18px]" />
                  {t('heroCta')}
                </Link>
                <Link
                  href="/add-listing/bus"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                  {t('heroAddCta')}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="hidden sm:flex items-center justify-center gap-2 lg:gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 lg:px-3 lg:py-1.5">
                  <span className="material-symbols-outlined !text-[13px] lg:!text-sm leading-none">verified_user</span>
                  حافلات موثقة
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 lg:px-3 lg:py-1.5">
                  <span className="material-symbols-outlined !text-[13px] lg:!text-sm leading-none">local_shipping</span>
                  بيع وإيجار
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. QUICK LINKS ═══════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-8 mt-6 sm:mt-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {[
            { title: 'حافلات للبيع', icon: Bus, href: '/browse/buses?busListingType=BUS_SALE', gradient: 'from-blue-600 to-indigo-700', count: 'عروض يومية' },
            { title: 'حافلات للإيجار', icon: KeyRound, href: '/browse/buses?busListingType=BUS_RENT', gradient: 'from-emerald-600 to-teal-700', count: 'أسعار مرنة' },
            { title: 'طلبات نقل', icon: Truck, href: '/browse/buses?busListingType=BUS_CONTRACT', gradient: 'from-purple-600 to-pink-600', count: 'عقود تشغيل' },
            { title: 'أضف حافلتك', icon: Plus, href: '/add-listing/bus', gradient: 'from-amber-500 to-orange-600', count: 'مجاناً' },
          ].map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group flex flex-col items-center text-center py-3 sm:py-4 hover:opacity-80 transition-opacity"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <link.icon size={22} className="text-white sm:hidden" />
                <link.icon size={28} className="text-white hidden sm:block" />
              </div>
              <h3 className="text-[11px] sm:text-[14px] md:text-[15px] font-bold text-on-surface leading-tight">{link.title}</h3>
              <span className="text-[9px] sm:text-[11px] md:text-[12px] font-medium text-on-surface-variant mt-0.5">{link.count}</span>
            </Link>
          ))}
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

            {/* Mobile: horizontal slider — Desktop: single row */}
            <div className="sm:hidden flex gap-3 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-2 snap-x snap-mandatory">
              {BUS_TYPES.map(type => {
                const Icon = type.icon;
                const nameKey = `types${type.key.charAt(0).toUpperCase() + type.key.slice(1)}` as any;
                return (
                  <Link
                    key={type.key}
                    href={`/browse/buses?busType=${type.filter}`}
                    className="flex-shrink-0 snap-start w-28 flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/20 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-md`}>
                      <Icon size={22} className="text-white" strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-[11px] text-on-surface text-center leading-tight">{t(nameKey)}</h3>
                  </Link>
                );
              })}
            </div>

            <motion.div
              variants={stagger}
              className="hidden sm:grid sm:grid-cols-6 gap-4"
            >
              {BUS_TYPES.map(type => {
                const Icon = type.icon;
                const nameKey = `types${type.key.charAt(0).toUpperCase() + type.key.slice(1)}` as any;
                const descKey = `${nameKey}Desc` as any;
                return (
                  <motion.div key={type.key} variants={fadeUp}>
                    <Link
                      href={`/browse/buses?busType=${type.filter}`}
                      className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={26} className="text-white" strokeWidth={2} />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-sm text-on-surface mb-0.5">{t(nameKey)}</h3>
                        <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">{t(descKey)}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 4. LISTINGS BY TYPE ═══════════════════ */}
      {buses.length > 0 && (
        <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <AnimatedSection>
              <motion.div variants={fadeUp} className="mb-6 sm:mb-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('featuredTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('featuredSubtitle')}</p>
              </motion.div>

              <motion.div variants={fadeUp}>
                {BUS_SECTIONS.map((sec) => {
                  const sectionBuses = busGroups[sec.type] || [];
                  return (
                    <BusCategorySlider
                      key={sec.type}
                      items={sectionBuses}
                      title={sec.title}
                      icon={sec.icon}
                      color={sec.color}
                      filterType={sec.type}
                    />
                  );
                })}
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
      </main>
    </>
  );
}
