'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Bus, Users, GraduationCap, Crown, Truck, MinusSquare,
  ArrowLeft, Search, Plus, Shield, Star, MapPin, BadgeCheck,
  KeyRound, TrendingUp,
} from 'lucide-react';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import SubNavBar from '@/components/layout/SubNavBar';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { BusListingItem } from '@/lib/api/buses';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';

// ── Config ────────────────────────────────────────────────────────────────────

const HERO_SAMPLE_BUS: UnifiedListingItem = {
  id: 'hero-sample-bus',
  category: 'buses',
  title: 'حافلة سياحية فاخرة',
  price: 45000,
  priceLabel: null,
  currency: 'OMR',
  images: ['/images/categories/buses.webp'],
  governorate: 'MUSCAT',
  createdAt: '2024-01-01T00:00:00.000Z',
  primaryBadge: { label: 'للبيع', color: 'blue' },
  secondaryBadge: { label: 'تفاوض مقبول', color: 'green' },
  details: [
    { icon: 'Calendar', value: '2022' },
    { icon: 'Users',    value: '45 مقعد' },
    { icon: 'Settings', value: 'ديزل' },
  ],
  href: '/browse/buses',
  favoriteEntityType: 'BUS_LISTING',
  sellerVerified: true,
  isPriceNegotiable: true,
};

const BG_CLS: { [k: string]: string } = {
  '#2563eb': 'bg-blue-50 dark:bg-blue-950/40',
  '#16a34a': 'bg-green-50 dark:bg-green-950/40',
  '#d97706': 'bg-amber-50 dark:bg-amber-950/40',
  '#7c3aed': 'bg-violet-50 dark:bg-violet-950/40',
  '#0d9488': 'bg-teal-50 dark:bg-teal-950/40',
  '#e11d48': 'bg-rose-50 dark:bg-rose-950/40',
};

const ICON_BG_CLS: { [k: string]: string } = {
  '#2563eb': 'bg-blue-100 dark:bg-blue-900/30',
  '#16a34a': 'bg-green-100 dark:bg-green-900/30',
  '#d97706': 'bg-amber-100 dark:bg-amber-900/30',
  '#7c3aed': 'bg-violet-100 dark:bg-violet-900/30',
  '#0d9488': 'bg-teal-100 dark:bg-teal-900/30',
  '#e11d48': 'bg-rose-100 dark:bg-rose-900/30',
};

const STATS_STATIC = [
  { label: 'بائع موثّق',    icon: BadgeCheck, color: '#16a34a', value: '+80'  },
  { label: 'نوع حافلة',     icon: Star,       color: '#d97706', value: '6'    },
  { label: 'محافظة مخدومة', icon: MapPin,     color: '#7c3aed', value: '11'   },
] as const;

const QUICK_LINKS = [
  { title: 'حافلات للبيع',   sublabel: 'جديدة ومستعملة',   icon: Bus,      color: '#2563eb', href: '/browse/buses?busListingType=BUS_SALE' },
  { title: 'حافلات للإيجار', sublabel: 'أسعار مرنة',       icon: KeyRound, color: '#16a34a', href: '/browse/buses?busListingType=BUS_RENT' },
  { title: 'عقود تشغيل',     sublabel: 'تعاقد طويل الأمد', icon: Truck,    color: '#7c3aed', href: '/browse/buses?busListingType=BUS_CONTRACT' },
  { title: 'أضف حافلتك',     sublabel: 'مجاناً الآن',      icon: Plus,     color: '#d97706', href: '/add-listing/bus' },
] as const;

const BUS_TYPES = [
  { label: 'حافلات سياحية', sublabel: 'رحلات وجولات سياحية',    icon: Bus,           color: '#2563eb', filter: 'TOURIST' },
  { label: 'حافلات مدرسية', sublabel: 'نقل آمن للطلاب',         icon: GraduationCap, color: '#d97706', filter: 'SCHOOL' },
  { label: 'نقل موظفين',    sublabel: 'حلول مرنة للعمالة',       icon: Users,         color: '#0d9488', filter: 'EMPLOYEE_TRANSPORT' },
  { label: 'VIP',           sublabel: 'خدمات نقل فاخرة',         icon: Crown,         color: '#7c3aed', filter: 'VIP' },
  { label: 'نقل عام',       sublabel: 'خطوط جماعية منتظمة',      icon: Truck,         color: '#16a34a', filter: 'PUBLIC' },
  { label: 'ميني باص',      sublabel: 'مجموعات صغيرة',           icon: MinusSquare,   color: '#e11d48', filter: 'MINIBUS' },
] as const;

const HOW_STEPS = [
  { num: 1, icon: Search, title: 'تصفّح الحافلات',    desc: 'ابحث بين مئات الحافلات بالفلاتر المناسبة.',         color: '#2563eb' },
  { num: 2, icon: Bus,    title: 'اختر حافلتك',        desc: 'قارن الأسعار والمواصفات والصور بالتفصيل.',           color: '#d97706' },
  { num: 3, icon: Users,  title: 'تواصل مع المالك',    desc: 'اتصل مباشرةً عبر الهاتف أو واتساب.',                color: '#7c3aed' },
  { num: 4, icon: Shield, title: 'أتمّ الصفقة بأمان', desc: 'تحقق من الوثائق واستلم حافلتك بكل ثقة.',             color: '#16a34a' },
] as const;

const BUS_SECTIONS_CONFIG = [
  { type: 'BUS_SALE',               title: 'حافلات للبيع',      subtitle: 'حافلات جديدة ومستعملة بأفضل الأسعار',   color: '#2563eb', href: '/browse/buses?busListingType=BUS_SALE' },
  { type: 'BUS_RENT',               title: 'حافلات للإيجار',    subtitle: 'خيارات إيجار مرنة تناسب كل الاحتياجات', color: '#16a34a', href: '/browse/buses?busListingType=BUS_RENT' },
  { type: 'BUS_CONTRACT',           title: 'حافلات للتعاقد',    subtitle: 'عقود تشغيل طويلة المدى',                 color: '#7c3aed', href: '/browse/buses?busListingType=BUS_CONTRACT' },
  { type: 'BUS_SALE_WITH_CONTRACT', title: 'بيع مع عقد تشغيل', subtitle: 'شراء الحافلة مع ضمان العقد',             color: '#d97706', href: '/browse/buses?busListingType=BUS_SALE_WITH_CONTRACT' },
] as const;

/* ─── Main Component ──────────────────────────────────────────────────── */

interface Props {
  buses: BusListingItem[];
  totalBuses: number;
}

export function BusesLandingClient({ buses, totalBuses }: Props) {
  const { transformBus } = useItemTransformers();

  const stats = useMemo(() => [
    { label: 'حافلة متاحة', icon: Bus, color: '#2563eb', value: totalBuses > 0 ? `${totalBuses.toLocaleString('en-US')}+` : '+200' },
    ...STATS_STATIC,
  ], [totalBuses]);

  const busGroups = useMemo(() => {
    const groups: Record<string, BusListingItem[]> = {};
    for (const bus of buses) {
      const key = bus.busListingType || 'BUS_SALE';
      if (!groups[key]) groups[key] = [];
      groups[key].push(bus);
    }
    return groups;
  }, [buses]);

  return (
    <>
      <Navbar />
      <SubNavBar />
      <div dir="rtl">

        {/* ═══════════════════ 1. HERO ═══════════════════ */}
        <section className="relative overflow-hidden gradient-navy text-white">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />
          </div>
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/4 translate-y-1/4" />

          <div className="relative max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-10 sm:py-20 lg:py-24" style={{ paddingTop: '85px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-white/90">
                    {totalBuses > 0 ? `${totalBuses.toLocaleString('en-US')}+ حافلة متاحة في عُمان` : 'منصة عُمانية متخصصة في الحافلات'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl text-white leading-tight mb-3 sm:mb-4" style={{ fontWeight: 800, lineHeight: 1.3 }}>
                  اشترِ أو استأجر حافلتك
                  <br />
                  <span className="text-[var(--color-brand-amber)]">أو بِعها اليوم</span>
                </h1>

                <p className="text-sm sm:text-lg text-white/75 mb-5 sm:mb-8 leading-relaxed max-w-lg">
                  سوق متخصص يجمع بائعي ومستأجري الحافلات من جميع محافظات سلطنة عُمان.
                  أسعار تنافسية وبائعون موثّقون.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                  <Link href="/browse/buses" className="btn-transport-primary text-sm sm:text-base py-3 sm:py-3.5 px-6 justify-center sm:justify-start w-full sm:w-auto">
                    <Bus size={18} />
                    تصفّح الحافلات
                  </Link>
                  <Link href="/add-listing/bus" className="btn-outline-white text-sm sm:text-base py-3 sm:py-3.5 px-6 justify-center sm:justify-start w-full sm:w-auto">
                    أضف إعلانك مجاناً
                    <ArrowLeft size={18} />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {([
                    { icon: Shield, text: 'بائعون موثّقون' },
                    { icon: Star,   text: 'تقييمات حقيقية' },
                    { icon: MapPin, text: 'تغطية 11 محافظة' },
                  ] as const).map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-white/70">
                      <Icon size={14} className="text-[var(--color-brand-amber)]" />
                      <span className="text-xs font-semibold">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Bus Card Preview (desktop only) */}
              <div className="hidden lg:block">
                <div className="relative max-w-sm mx-auto scale-[0.8] origin-top mt-10">
                  <div className="transform rotate-1 hover:rotate-0 transition-transform duration-300">
                    <UnifiedCard item={HERO_SAMPLE_BUS} hideContactButtons />
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

        {/* ═══════════════════ 2. STATS BAR ═══════════════════ */}
        <section className="py-5 sm:py-8">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {stats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-2xl ${BG_CLS[s.color]}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG_CLS[s.color]}`}>
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-bold text-[var(--color-on-surface)]">{s.value}</p>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-on-surface-variant)]">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ 3. QUICK LINKS ═══════════════════ */}
        <section className="py-8 sm:py-12">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">تصفّح حسب القسم</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">اختر ما يناسبك من بين أقسامنا المتنوعة</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              {QUICK_LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.title} href={link.href} className="card-base card-hover p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${BG_CLS[link.color]}`}>
                      <Icon size={22} style={{ color: link.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>{link.title}</p>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">{link.sublabel}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ 4. BUS TYPES GRID ═══════════════════ */}
        <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">تصفّح حسب نوع الحافلة</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)]">اختر نوع الحافلة المناسب لاحتياجك</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {BUS_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Link key={type.filter} href={`/browse/buses?busType=${type.filter}`} className="card-base card-hover p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${BG_CLS[type.color]}`}>
                      <Icon size={22} style={{ color: type.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>{type.label}</p>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">{type.sublabel}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════ 5. LISTINGS BY TYPE ═══════════════════ */}
        {BUS_SECTIONS_CONFIG.map((sec, idx) => {
          const items = busGroups[sec.type] ?? [];
          if (items.length === 0) return null;
          const hasBg = idx % 2 === 0;
          return (
            <section
              key={sec.type}
              className={`py-8 sm:py-12${hasBg ? ' bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]' : ''}`}
            >
              <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
                <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="h-6 sm:h-8 w-1 rounded-full" style={{ backgroundColor: sec.color }} />
                      <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">{sec.title}</h2>
                    </div>
                    <p className="text-sm text-[var(--color-on-surface-variant)]">{sec.subtitle}</p>
                  </div>
                  <Link href={sec.href} className="flex items-center gap-1.5 font-bold text-xs sm:text-sm hover:underline transition-colors" style={{ color: sec.color }}>
                    عرض الكل <ArrowLeft size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {items.slice(0, 8).map(bus => (
                    <UnifiedCard key={bus.id} item={transformBus(bus)} className="h-full" hideContactButtons />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* ═══════════════════ 6. HOW IT WORKS ═══════════════════ */}
        <section className="py-10 sm:py-16 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="text-center mb-6 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">كيف يعمل سوق ون للحافلات؟</h2>
              <p className="text-sm text-[var(--color-on-surface-variant)] max-w-lg mx-auto">أربع خطوات بسيطة تفصلك عن حافلتك المثالية</p>
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
        <section className="py-10 sm:py-16">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="gradient-navy rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-amber)]/20 flex items-center justify-center">
                    <Bus size={24} className="text-[var(--color-brand-amber)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-amber)]">للبائعين</p>
                    <h2 className="text-xl font-bold" style={{ fontWeight: 700 }}>بِع حافلتك بأفضل سعر</h2>
                  </div>
                </div>

                <p className="text-sm text-white/75 leading-relaxed mb-6 max-w-lg">
                  أضف إعلانك مجاناً وتواصل مع آلاف المشترين والمستأجرين المهتمين في جميع محافظات سلطنة عُمان.
                </p>

                <div className="flex flex-wrap gap-2.5 sm:gap-4 mb-6 sm:mb-8">
                  {([
                    { icon: TrendingUp, label: 'مشاهدة يومياً', value: '+500',  color: '#16a34a' },
                    { icon: Star,       label: 'متوسط التقييم', value: '4.8',   color: '#d97706' },
                    { icon: Shield,     label: 'إعلان مجاني',   value: '100%',  color: '#7c3aed' },
                  ] as const).map(stat => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                        <Icon size={16} style={{ color: stat.color }} />
                        <div>
                          <p className="text-sm font-bold" style={{ fontWeight: 700 }}>{stat.value}</p>
                          <p className="text-[10px] text-white/60">{stat.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                  <Link
                    href="/add-listing/bus"
                    className="btn-navy rounded-full w-full sm:w-auto justify-center sm:justify-start"
                    style={{ background: 'var(--color-brand-amber)', color: '#fff' }}
                  >
                    <Plus size={16} />
                    أضف إعلانك مجاناً
                  </Link>
                  <Link href="/browse/buses" className="btn-outline-white w-full sm:w-auto justify-center sm:justify-start">
                    <Search size={16} />
                    تصفّح الحافلات أولاً
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}
