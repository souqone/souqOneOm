'use client';

import { useRef, useState, useEffect } from 'react';
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
  { key: 'Sale',     icon: Car,    href: '/cars/browse',                    gradient: 'from-blue-600 to-indigo-700' },
  { key: 'Rent',     icon: Key,    href: '/cars/browse?listingType=RENTAL', gradient: 'from-emerald-600 to-teal-700' },
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

/* ─── Typing Animation ───────────────────────────────────────────────── */

function TypingText({ text, className, speed = 60 }: { text: string; className?: string; speed?: number }) {
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
    <span className={className}>
      {displayed}
      {!done && <span className="inline-block w-[2px] h-[1em] bg-white/80 align-middle animate-pulse ms-0.5" />}
    </span>
  );
}

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
    router.push(`/cars/browse${q ? `?q=${encodeURIComponent(q)}` : ''}` as any);
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
          <div className="relative w-full overflow-hidden aspect-[16/7] sm:aspect-[16/4] lg:aspect-[16/4] xl:aspect-[16/4] rounded-2xl sm:rounded-3xl">
            <Image
              src="/images/categories/cars.webp"
              alt="سيارات سوق وان"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              quality={80}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADQAQCdASoQAAkAAkA4JZQCdAEO/hepgAAA/vxR0f//LGf/0pV//9Kf/+lf/6Uq1PUAAP7+IQAA"
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
                <span className="material-symbols-outlined text-amber-400 text-[14px] sm:text-[16px]">verified</span>
                {t('badge')}
              </div>

              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-1 sm:mb-2 lg:mb-3">
                <TypingText text={t('heroTitle')} speed={80} />
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-lg lg:max-w-xl">
                {t('heroSubtitle')}
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-5">
                <Link
                  href="/cars/browse"
                  className="btn-primary shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black rounded-lg sm:rounded-xl hover:brightness-110 transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none">explore</span>
                  {t('searchBtn')}
                </Link>
                <Link
                  href="/cars/new"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none">add_circle</span>
                  {t('addListingCta')}
                </Link>
              </div>

              {/* Stats as trust badges */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 flex-wrap">
                {STATS.slice(0, 3).map(s => (
                  <span key={s.key} className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2 py-1 sm:px-2.5 sm:py-1 lg:px-3 lg:py-1.5">
                    {t(`stat${s.key}`)} {t(`stat${s.key}Label`)}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. QUICK LINKS ═══════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-2 sm:px-4 md:px-8 mt-4 sm:mt-6">
        <AnimatedSection>
          <motion.div
            variants={stagger}
            className="grid grid-cols-4 gap-1 sm:gap-3 md:gap-4"
          >
            {QUICK_LINKS_DATA.map(link => {
              const Icon = link.icon;
              return (
                <motion.div key={link.key} variants={fadeUp}>
                  <Link
                    href={link.href}
                    className="group flex flex-col items-center text-center py-2 sm:py-3 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-1.5 sm:mb-2 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={18} className="text-white sm:hidden" />
                      <Icon size={22} className="text-white hidden sm:block" />
                    </div>
                    <h3 className="text-[10px] sm:text-[13px] md:text-[14px] font-bold text-on-surface leading-tight">{t(`ql${link.key}`)}</h3>
                    <span className="text-[8px] sm:text-[10px] md:text-[11px] font-medium text-on-surface-variant mt-0.5">{t(`ql${link.key}Count`)}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatedSection>
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
                <Link href="/cars/browse" className="text-xs text-primary font-bold hover:underline ms-2">
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
                    href={`/cars/browse?make=${brand.value}`}
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
              <Link href="/cars/browse" className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {saleCars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {saleCars.map(item => (
                    <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" hideContactButtons />
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
              <Link href="/cars/browse?listingType=RENTAL" className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                {t('viewAll')}
                <ArrowLeft size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp}>
              {rentalCars.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {rentalCars.map(item => (
                    <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" hideContactButtons />
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
                    <UnifiedCard key={svc.id} item={transformService(svc as any)} className="h-full" hideContactButtons />
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
                    <UnifiedCard key={part.id} item={transformPart(part)} className="h-full" hideContactButtons />
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
