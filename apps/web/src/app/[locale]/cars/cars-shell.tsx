'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ListingSearchBar } from '@/components/shared/listing-search-bar';
import { BrandGrid } from '@/features/listings/components/BrandGrid';
import { CAR_SLIDER_ITEMS } from '@/features/listings/data/cars';
import { useBrandCounts } from '@/features/listings/hooks/useBrandCounts';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import {
  Car, Key, Wrench, Settings, Star, Shield, Users,
  MapPin, Search, Plus, ArrowLeft, TrendingUp,
} from 'lucide-react';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';

// ── Config ────────────────────────────────────────────────────────────────────

const CAR_TYPES = [
  { label: 'سيارات للبيع',   sublabel: 'جديدة ومستعملة بأفضل الأسعار',   icon: Car,      color: '#2563eb', href: '/cars/browse' },
  { label: 'سيارات للإيجار', sublabel: 'يومي وأسبوعي وشهري',              icon: Key,      color: '#16a34a', href: '/cars/browse?listingType=RENTAL' },
  { label: 'قطع الغيار',    sublabel: 'أصلية وبديلة لجميع الماركات',      icon: Settings, color: '#d97706', href: '/browse/parts' },
  { label: 'خدمات السيارات', sublabel: 'صيانة وطلاء وتجليد وأكثر',        icon: Wrench,   color: '#7c3aed', href: '/browse/services' },
] as const;

const HERO_SAMPLE_CAR: UnifiedListingItem = {
  id: 'hero-sample',
  category: 'cars',
  title: 'سوق وان للسيارات',
  price: 18500,
  priceLabel: null,
  currency: 'OMR',
  images: ['/images/categories/cars.webp'],
  governorate: 'MUSCAT',
  createdAt: new Date().toISOString(),
  primaryBadge: { label: 'للبيع', color: 'blue' },
  secondaryBadge: { label: 'تفاوض مقبول', color: 'green' },
  details: [
    { icon: 'Calendar', value: '2022' },
    { icon: 'Gauge',    value: '45,000 كم' },
    { icon: 'Settings', value: 'أوتوماتيك' },
  ],
  href: '/cars/browse',
  favoriteEntityType: 'LISTING',
  sellerVerified: true,
  isPriceNegotiable: true,
};

const BG_CLS: { [k: string]: string } = {
  '#2563eb': 'bg-blue-50 dark:bg-blue-950/40',
  '#16a34a': 'bg-green-50 dark:bg-green-950/40',
  '#d97706': 'bg-amber-50 dark:bg-amber-950/40',
  '#7c3aed': 'bg-violet-50 dark:bg-violet-950/40',
};

const HOW_STEPS = [
  { num: 1, icon: Search,  title: 'تصفّح الإعلانات',   desc: 'ابحث بين مئات السيارات بالفلاتر المناسبة.',        color: '#2563eb' },
  { num: 2, icon: Car,     title: 'اختر سيارتك',       desc: 'قارن الأسعار والصور والمواصفات بالتفصيل.',          color: '#d97706' },
  { num: 3, icon: Users,   title: 'تواصل مع البائع',   desc: 'اتصل مباشرةً بالبائع عبر الهاتف أو واتساب.',        color: '#7c3aed' },
  { num: 4, icon: Shield,  title: 'أتمّ الصفقة بأمان', desc: 'تحقق من الوثائق واستلم سيارتك بكل ثقة.',            color: '#16a34a' },
] as const;

// ── Brand section ────────────────────────────────────────────────────────────

function CarsBrandSection() {
  const router = useRouter()
  const brandCounts = useBrandCounts(CAR_SLIDER_ITEMS.map(i => i.value))

  function handleBrandFilter(_key: string, value: string | boolean | null) {
    if (value) router.push(`/cars/browse?make=${encodeURIComponent(String(value))}`)
    else router.push('/cars/browse')
  }

  return (
    <BrandGrid
      items={CAR_SLIDER_ITEMS}
      filters={{}}
      onFilterChange={handleBrandFilter}
      counts={brandCounts}
    />
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CarsShellProps {
  saleCars: any[];
  rentalCars: any[];
  services: any[];
  parts: any[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CarsShell({ saleCars, rentalCars, services, parts }: CarsShellProps) {
  const { transformCar, transformPart, transformService } = useItemTransformers();

  return (
    <div dir="rtl">

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative overflow-hidden gradient-navy text-white">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/4 translate-y-1/4" />

        <div className="relative max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-4 sm:py-[61px] lg:py-[74px]" style={{ paddingTop: '82px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Content */}
            <div className="text-center sm:text-start">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-white/90">منصة عُمانية متخصصة في بيع وتأجير السيارات</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl text-white leading-tight mb-3 sm:mb-4" style={{ fontWeight: 800, lineHeight: 1.3 }}>
                اشترِ سيارتك المثالية
                <br />
                <span className="text-[var(--color-brand-amber)]">أو بِعها اليوم</span>
              </h1>

              <p className="text-sm sm:text-lg text-white/75 mb-5 sm:mb-8 leading-relaxed max-w-lg mx-auto sm:mx-0">
                سوق متخصص يجمع بائعي ومشتري السيارات من جميع محافظات سلطنة عُمان.
                أسعار تنافسية وبائعون موثّقون.
              </p>

              <div className="flex flex-row gap-2 sm:gap-3 mb-4 sm:mb-8">
                <Link href="/cars/browse" className="btn-transport-primary flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6">
                  <Car size={13} className="sm:hidden" aria-hidden="true" />
                  <Car size={18} className="hidden sm:block" aria-hidden="true" />
                  تصفّح السيارات
                </Link>
                <Link href="/cars/new" className="btn-outline-white flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6">
                  أضف إعلانك مجاناً
                  <ArrowLeft size={13} className="sm:hidden" aria-hidden="true" />
                  <ArrowLeft size={18} className="hidden sm:block" aria-hidden="true" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                {([
                  { icon: Shield,   text: 'بائعون موثّقون' },
                  { icon: Star,     text: 'تقييمات حقيقية' },
                  { icon: MapPin,   text: 'تغطية 11 محافظة' },
                ] as const).map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-white/70">
                    <Icon size={14} className="text-[var(--color-brand-amber)]" />
                    <span className="text-xs font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Card Preview (desktop only) */}
            <div className="hidden lg:block">
              <div className="relative max-w-sm mx-auto scale-[0.8] origin-top mt-10">
                <div className="transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <UnifiedCard item={HERO_SAMPLE_CAR} hideContactButtons />
                </div>
                <div className="absolute -top-3 -left-3 bg-[var(--color-brand-amber)] text-white rounded-2xl px-3 py-2 shadow-lg z-10 pointer-events-none">
                  <div className="text-xs font-bold">سعر مميز!</div>
                  <div className="text-[10px] opacity-80">تفاوض مقبول</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. SEARCH BAR ═══════════════════ */}
      <ListingSearchBar
        categories={[{
          key: 'cars',
          label: 'سيارات',
          route: '/cars/browse',
          subcategories: [
            { key: 'sale',     label: 'سيارات للبيع',   route: '/cars/browse?listingType=SALE'   },
            { key: 'rent',     label: 'سيارات للإيجار', route: '/cars/browse?listingType=RENTAL' },
            { key: 'parts',    label: 'قطع الغيار',     route: '/browse/parts'                   },
            { key: 'services', label: 'خدمات السيارات', route: '/browse/services'                },
          ],
        }]}
        defaultCat="cars"
        addListingHref="/cars/new"
      />

      {/* ═══════════════════ 2b. BRAND GRID ═══════════════════ */}
      <CarsBrandSection />

      {/* ═══════════════════ 3. CAR TYPES GRID ═══════════════════ */}
      <section className="py-8 sm:py-12">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">تصفّح حسب النوع</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)]">اختر ما يناسبك من بين أقسامنا المتنوعة</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {CAR_TYPES.map(card => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="card-base card-hover p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${BG_CLS[card.color]}`}>
                    <Icon size={22} style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>{card.label}</p>
                    <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">{card.sublabel}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. LATEST CARS FOR SALE ═══════════════════ */}
      {saleCars.length > 0 && (
        <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full bg-[#2563eb]" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">أحدث سيارات البيع</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">سيارات مضافة حديثاً من بائعين موثّقين</p>
              </div>
              <Link href="/cars/browse" className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {saleCars.map(item => (
                <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 5. LATEST CARS FOR RENT ═══════════════════ */}
      {rentalCars.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full bg-[#16a34a]" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">سيارات للإيجار</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">خيارات إيجار مرنة تناسب كل الاحتياجات</p>
              </div>
              <Link href="/cars/browse?listingType=RENTAL" className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {rentalCars.map(item => (
                <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 6. SPARE PARTS ═══════════════════ */}
      {parts.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full bg-[#d97706]" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">قطع الغيار</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">قطع أصلية وبديلة لجميع الماركات</p>
              </div>
              <Link href="/browse/parts" className="flex items-center gap-1.5 text-amber-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {parts.map(item => (
                <UnifiedCard key={item.id} item={transformPart(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 7. CAR SERVICES ═══════════════════ */}
      {services.length > 0 && (
        <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full bg-[#7c3aed]" />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">خدمات السيارات</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">صيانة وطلاء وتجليد وفحص وأكثر</p>
              </div>
              <Link href="/browse/services" className="flex items-center gap-1.5 text-violet-600 font-bold text-xs sm:text-sm hover:underline transition-colors">
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {services.map(item => (
                <UnifiedCard key={item.id} item={transformService(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 8. HOW IT WORKS ═══════════════════ */}
      <section className="py-10 sm:py-16 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">كيف يعمل سوق ون للسيارات؟</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-lg mx-auto">أربع خطوات بسيطة تفصلك عن سيارة أحلامك</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {HOW_STEPS.map(step => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="card-base p-3.5 sm:p-5 flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${BG_CLS[step.color]}`}>
                      <Icon size={20} style={{ color: step.color }} />
                    </div>
                    <span className="text-2xl font-bold" style={{ color: step.color, opacity: 0.25 }}>{step.num}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>{step.title}</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. SELLER CTA ═══════════════════ */}
      <section className="py-4 sm:py-16 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+53px)] sm:pb-16">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="gradient-navy rounded-2xl sm:rounded-3xl p-4 sm:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-amber)]/20 flex items-center justify-center">
                  <Car size={24} className="text-[var(--color-brand-amber)]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-amber)]">للبائعين</p>
                  <h2 className="text-xl font-bold" style={{ fontWeight: 700 }}>بِع سيارتك بأفضل سعر</h2>
                </div>
              </div>

              <p className="text-sm text-white/75 leading-relaxed mb-6 max-w-lg">
                أضف إعلانك مجاناً وتواصل مع آلاف المشترين المهتمين في جميع محافظات سلطنة عُمان.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4 mb-4 sm:mb-8">
                {([
                  { icon: TrendingUp, label: 'مشاهدة يومياً', value: '+1000', color: '#16a34a' },
                  { icon: Star,       label: 'متوسط التقييم', value: '4.8',   color: '#d97706' },
                  { icon: Shield,     label: 'إعلان مجاني',   value: '100%',  color: '#7c3aed' },
                ] as const).map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2 bg-white/10 rounded-xl px-2 sm:px-4 py-2 sm:py-2.5 text-center sm:text-start">
                      <Icon size={16} style={{ color: stat.color }} />
                      <div>
                        <p className="text-sm font-bold" style={{ fontWeight: 700 }}>{stat.value}</p>
                        <p className="text-[10px] text-white/60">{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-row gap-2 sm:gap-3">
                <Link
                  href="/cars/new"
                  className="btn-navy rounded-full flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-sm !py-2 !px-3 sm:!py-3 sm:!px-6"
                  style={{ background: 'var(--color-brand-amber)', color: '#fff' }}
                >
                  <Plus size={13} className="sm:hidden" aria-hidden="true" />
                  <Plus size={16} className="hidden sm:block" aria-hidden="true" />
                  أضف إعلانك مجاناً
                </Link>
                <Link href="/cars/browse" className="btn-outline-white flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-sm !py-2 !px-3 sm:!py-3 sm:!px-6">
                  <Search size={13} className="sm:hidden" aria-hidden="true" />
                  <Search size={16} className="hidden sm:block" aria-hidden="true" />
                  تصفّح الإعلانات أولاً
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
