'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import {
  Search, ArrowLeft, ArrowRight, Car, Wrench, Key, Shield, Plus,
} from 'lucide-react';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { BRAND_LOGOS } from '@/features/listings/config/brand-logos.config';
import type { ListingItem } from '@/lib/api/listings';
import type { SparePartItem } from '@/lib/api/parts';

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

/* ─── Types ───────────────────────────────────────────────────────────── */

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  serviceType: string;
  providerType: string;
  providerName: string;
  priceFrom?: string;
  priceTo?: string;
  currency: string;
  isHomeService: boolean;
  governorate: string;
  city?: string;
  viewCount: number;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  createdAt: string;
  user: { id: string; username: string; displayName?: string; avatarUrl?: string; isVerified?: boolean };
}

interface MotorsShellProps {
  saleCars: ListingItem[];
  rentalCars: ListingItem[];
  services: ServiceItem[];
  parts: SparePartItem[];
}

/* ─── Data ────────────────────────────────────────────────────────────── */

const TOP_BRANDS = [
  { name: 'تويوتا', key: 'toyota', value: 'Toyota' },
  { name: 'نيسان', key: 'nissan', value: 'Nissan' },
  { name: 'هيونداي', key: 'hyundai', value: 'Hyundai' },
  { name: 'لكزس', key: 'lexus', value: 'Lexus' },
  { name: 'كيا', key: 'kia', value: 'Kia' },
  { name: 'مرسيدس', key: 'mercedes-benz', value: 'Mercedes-Benz' },
  { name: 'بي إم دبليو', key: 'bmw', value: 'BMW' },
  { name: 'فورد', key: 'ford', value: 'Ford' },
  { name: 'هوندا', key: 'honda', value: 'Honda' },
  { name: 'لاند روفر', key: 'land-rover', value: 'Land Rover' },
  { name: 'جيب', key: 'jeep', value: 'Jeep' },
  { name: 'شفروليه', key: 'chevrolet', value: 'Chevrolet' },
  { name: 'بي واي دي', key: 'byd', value: 'BYD' },
  { name: 'شانجان', key: 'changan', value: 'Changan' },
  { name: 'جيلي', key: 'geely', value: 'Geely' },
  { name: 'إم جي', key: 'mg', value: 'MG' },
];

const QUICK_LINKS_DATA = [
  { key: 'Sale',     icon: Car,    href: '/browse/cars',                    gradient: 'from-blue-600 to-indigo-700' },
  { key: 'Rent',     icon: Key,    href: '/browse/cars?listingType=RENTAL', gradient: 'from-emerald-600 to-teal-700' },
  { key: 'Services', icon: Wrench, href: '/browse/services',               gradient: 'from-orange-500 to-red-600' },
  { key: 'Parts',    icon: Shield, href: '/browse/parts',                  gradient: 'from-purple-600 to-pink-600' },
] as const;

const STATS = [
  { key: 'Sale',      icon: 'directions_car' },
  { key: 'Rent',      icon: 'car_rental' },
  { key: 'Providers', icon: 'build' },
  { key: 'Buyers',    icon: 'group' },
] as const;

const STEPS = [
  { num: '١', icon: 'search',       gradient: 'from-primary to-[#2563eb]' },
  { num: '٢', icon: 'compare',      gradient: 'from-teal-500 to-teal-600' },
  { num: '٣', icon: 'handshake',    gradient: 'from-brand-amber to-[#ff7a2e]' },
] as const;

/* ─── Main Component ──────────────────────────────────────────────────── */

export function MotorsShell({ saleCars, rentalCars, services, parts }: MotorsShellProps) {
  const t = useTranslations('motorsLanding');
  const { transformCar, transformService, transformPart } = useItemTransformers();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const brandsRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value?.trim();
    router.push(`/browse/cars${q ? `?q=${encodeURIComponent(q)}` : ''}` as any);
  }

  const scrollBrands = (dir: 'start' | 'end') => {
    if (!brandsRef.current) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const amount = 240;
    const scrollAmount = dir === 'end' ? amount : -amount;
    brandsRef.current.scrollBy({ left: isRtl ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-background">

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative overflow-hidden bg-brand-navy">
        {/* Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/categories/cars.webp"
            alt=""
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/80 via-brand-navy/70 to-brand-navy" />
        </div>

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 end-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 pt-16 sm:pt-24 pb-14 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {/* Badge */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-amber-400 text-[16px]">verified</span>
                {t('badge')}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 sm:mb-4">
                {t('heroTitle')}
              </h1>
              <p className="text-sm sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                {t('heroSubtitle')}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 sm:mb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all duration-300" />
                <div className="relative flex items-center bg-white dark:bg-surface-container rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                  <Search size={20} className="ms-4 text-on-surface-variant shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    dir="auto"
                    className="flex-1 h-14 bg-transparent px-3 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-6 me-2 rounded-xl btn-primary text-[14px] font-bold flex items-center gap-2 active:scale-95 transition-all shrink-0"
                  >
                    {t('searchBtn')}
                  </button>
                </div>
              </div>
            </form>

            {/* Stats inline */}
            <div className="flex items-center justify-center gap-6 md:gap-10">
              {STATS.slice(0, 3).map(s => (
                <div key={s.key} className="text-center">
                  <p className="text-xl md:text-2xl font-black text-white">{t(`stat${s.key}`)}</p>
                  <p className="text-[11px] md:text-[12px] text-white/50">{t(`stat${s.key}Label`)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ 2. QUICK LINKS ═══════════════════ */}
      <section className="relative -mt-8 sm:-mt-10 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            >
              {QUICK_LINKS_DATA.map(link => {
                const Icon = link.icon;
                return (
                  <motion.div key={link.key} variants={fadeUp}>
                    <Link
                      href={link.href}
                      className="group relative overflow-hidden flex flex-col rounded-2xl p-5 sm:p-6 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`absolute top-0 start-0 w-full h-1 bg-gradient-to-r ${link.gradient}`} />
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <h3 className="text-[13px] sm:text-[15px] font-bold text-on-surface mb-0.5">{t(`ql${link.key}`)}</h3>
                      <p className="text-[10px] sm:text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">{t(`ql${link.key}Desc`)}</p>
                      <span className="inline-block mt-2 text-[10px] sm:text-[11px] font-bold text-primary/80">{t(`ql${link.key}Count`)}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 3. BRANDS ═══════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="flex items-center justify-between mb-5 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-black">{t('brandsTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('brandsSubtitle')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => scrollBrands('start')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => scrollBrands('end')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <Link href="/browse/cars" className="text-xs text-primary font-bold hover:underline ms-2">
                  {t('brandsViewAll')}
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <div
                ref={brandsRef}
                className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
              >
                {TOP_BRANDS.map(brand => (
                  <Link
                    key={brand.key}
                    href={`/browse/cars?make=${brand.value}`}
                    className="group flex flex-col items-center gap-2 min-w-[90px] p-3 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-surface-container-high flex items-center justify-center p-2 shadow-sm group-hover:shadow-md transition-shadow">
                      <Image
                        src={BRAND_LOGOS[brand.key] || '/brands/placeholder.png'}
                        alt={brand.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-on-surface text-center leading-tight">{brand.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 4. CARS FOR SALE ═══════════════════ */}
      <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 bg-primary rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('saleSectionTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('saleSectionSubtitle')}</p>
              </div>
              <Link href="/browse/cars" className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {saleCars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {saleCars.map(item => (
                    <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/40">directions_car</span>
                  <p className="font-medium text-on-surface-variant">{t('noCarsNow')}</p>
                </div>
              )}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 5. CARS FOR RENT ═══════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 bg-emerald-500 rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('rentSectionTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('rentSectionSubtitle')}</p>
              </div>
              <Link href="/browse/cars?listingType=RENTAL" className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {rentalCars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {rentalCars.map(item => (
                    <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/40">car_rental</span>
                  <p className="font-medium text-on-surface-variant">{t('noRentalNow')}</p>
                </div>
              )}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 6. CAR SERVICES ═══════════════════ */}
      <section className="bg-surface-container-low dark:bg-surface-dim py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 bg-brand-amber rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('servicesSectionTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('servicesSectionSubtitle')}</p>
              </div>
              <Link href="/browse/services" className="flex items-center gap-1.5 text-brand-amber font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {services.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  {services.map(svc => (
                    <UnifiedCard key={svc.id} item={transformService(svc as any)} className="h-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/40">build</span>
                  <p className="font-medium text-on-surface-variant">{t('noServicesNow')}</p>
                </div>
              )}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 7. SPARE PARTS ═══════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 bg-purple-500 rounded-full" />
                  <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('partsSectionTitle')}</h2>
                </div>
                <p className="text-on-surface-variant text-xs sm:text-sm">{t('partsSectionSubtitle')}</p>
              </div>
              <Link href="/browse/parts" className="flex items-center gap-1.5 text-purple-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {parts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {parts.map(part => (
                    <UnifiedCard key={part.id} item={transformPart(part)} className="h-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/40">settings</span>
                  <p className="font-medium text-on-surface-variant">{t('noPartsNow')}</p>
                </div>
              )}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 8. HOW IT WORKS ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-8 sm:mb-12">
              <h2 className="text-base sm:text-xl md:text-3xl font-black mb-2">{t('stepsTitle')}</h2>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('stepsSubtitle')}</p>
            </motion.div>

            <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
                  <h3 className="font-bold text-[15px] sm:text-lg text-on-surface mb-1.5">{t(`step${i + 1}Title`)}</h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{t(`step${i + 1}Desc`)}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block absolute top-1/2 -start-3 w-6 border-t-2 border-dashed border-outline-variant/40" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 8. FINAL CTA ═══════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#2563eb] to-brand-navy" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -end-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-brand-amber/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-3 sm:px-6 py-12 sm:py-20 text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-xs font-medium mb-4">
                <Plus size={14} />
                {t('ctaBadge')}
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-3 sm:mb-4">
                {t('ctaTitle')}
              </h2>
              <p className="text-sm sm:text-base text-white/70 mb-6 sm:mb-8 max-w-lg mx-auto">
                {t('ctaSubtitle')}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/add-listing/car"
                  className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-white text-primary font-black text-sm sm:text-base hover:bg-white/90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg"
                >
                  <Plus size={20} />
                  {t('ctaSell')}
                </Link>
                <Link
                  href="/add-listing/service"
                  className="inline-flex items-center gap-2 px-8 py-3.5 sm:px-10 sm:py-4 rounded-2xl bg-white/15 backdrop-blur-md text-white font-bold text-sm sm:text-base border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
                >
                  <Wrench size={20} />
                  {t('ctaService')}
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-white/60 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  {t('ctaFree')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  {t('ctaInstant')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  {t('ctaBuyers')}
                </span>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

    </main>
  );
}
