'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  Wrench, HardHat, Package, Users, Plus, MapPin, ArrowLeft,
  Search, Shield, Star, BadgeCheck, TrendingUp,
  Zap, Truck, Wind, Droplets, RefreshCw,
} from 'lucide-react';
import type { EquipmentListingItem, EquipmentRequestItem, OperatorListingItem } from '@/lib/api/equipment';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';

// ── Config ────────────────────────────────────────────────────────────────────

const HERO_SAMPLE_EQUIPMENT: UnifiedListingItem = {
  id: 'hero-sample-equipment',
  category: 'equipment',
  title: 'حفارة هيتاشي ZX200',
  price: 85000,
  priceLabel: null,
  currency: 'OMR',
  images: ['/images/categories/equipment.webp'],
  governorate: 'MUSCAT',
  createdAt: '2024-01-01T00:00:00.000Z',
  primaryBadge: { label: 'للبيع', color: 'blue' },
  secondaryBadge: { label: 'ممتاز', color: 'green' },
  details: [
    { icon: 'Calendar', value: '2021' },
    { icon: 'Gauge',    value: '1,200 ساعة' },
    { icon: 'Settings', value: 'ديزل' },
  ],
  href: '/browse/equipment',
  favoriteEntityType: 'EQUIPMENT_LISTING',
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

const QUICK_LINKS = [
  { title: 'معدات للبيع',   sublabel: 'جديدة ومستعملة',      icon: Package, color: '#d97706', href: '/browse/equipment' },
  { title: 'معدات للإيجار', sublabel: 'يومي وشهري',           icon: Wrench,  color: '#16a34a', href: '/browse/equipment?listingType=EQUIPMENT_RENT' },
  { title: 'طلبات المعدات', sublabel: 'انشر واحصل على عروض', icon: HardHat, color: '#2563eb', href: '/equipment/requests/new' },
  { title: 'مشغلين معدات',  sublabel: 'سائقين وفنيين',        icon: Users,   color: '#7c3aed', href: '/browse/equipment?tab=operators' },
] as const;

const EQUIP_TYPES = [
  { key: 'EXCAVATOR',      label: 'حفارة',        icon: Package,    color: '#d97706' },
  { key: 'CRANE',          label: 'رافعة',         icon: TrendingUp, color: '#2563eb' },
  { key: 'LOADER',         label: 'لودر',          icon: Truck,      color: '#16a34a' },
  { key: 'BULLDOZER',      label: 'بلدوزر',        icon: Truck,      color: '#0d9488' },
  { key: 'FORKLIFT',       label: 'رافعة شوكية',   icon: Package,    color: '#7c3aed' },
  { key: 'CONCRETE_MIXER', label: 'خلاطة',         icon: RefreshCw,  color: '#e11d48' },
  { key: 'GENERATOR',      label: 'مولد كهربائي',  icon: Zap,        color: '#d97706' },
  { key: 'COMPRESSOR',     label: 'ضاغط هواء',     icon: Wind,       color: '#2563eb' },
  { key: 'SCAFFOLDING',    label: 'سقالات',         icon: HardHat,    color: '#16a34a' },
  { key: 'TRUCK',          label: 'شاحنة',          icon: Truck,      color: '#7c3aed' },
  { key: 'DUMP_TRUCK',     label: 'قلاب',           icon: Truck,      color: '#0d9488' },
  { key: 'WATER_TANKER',   label: 'تنكر مياه',      icon: Droplets,   color: '#e11d48' },
] as const;

const HOW_STEPS = [
  { num: 1, icon: Search,  title: 'تصفّح المعدات',    desc: 'ابحث بين مئات المعدات بالفلاتر المناسبة.',         color: '#d97706' },
  { num: 2, icon: Package, title: 'اختر معدتك',        desc: 'قارن الأسعار والمواصفات والصور بالتفصيل.',          color: '#2563eb' },
  { num: 3, icon: Users,   title: 'تواصل مع المالك',   desc: 'اتصل مباشرةً عبر الهاتف أو واتساب.',               color: '#7c3aed' },
  { num: 4, icon: Shield,  title: 'أتمّ الصفقة بأمان', desc: 'تحقق من الوثائق واستلم معدتك بكل ثقة.',            color: '#16a34a' },
] as const;

// ── Props ────────────────────────────────────────────────────────────────────

interface EquipmentShellProps {
  saleEquipment: EquipmentListingItem[];
  rentalEquipment: EquipmentListingItem[];
  operators: OperatorListingItem[];
  requests: EquipmentRequestItem[];
}

// ── Main Component ──────────────────────────────────────────────────────────

export function EquipmentShell({ saleEquipment, rentalEquipment, operators, requests }: EquipmentShellProps) {
  const { transformEquipment } = useItemTransformers();

  const stats = useMemo(() => [
    { label: 'معدة للبيع',   icon: Package,    color: '#d97706', value: saleEquipment.length > 0   ? `${saleEquipment.length}+`   : '+100' },
    { label: 'معدة للإيجار', icon: Wrench,     color: '#16a34a', value: rentalEquipment.length > 0 ? `${rentalEquipment.length}+` : '+50'  },
    { label: 'نوع معدة',     icon: Star,       color: '#2563eb', value: '12'                                                               },
    { label: 'مشغل متاح',   icon: BadgeCheck, color: '#7c3aed', value: operators.length > 0       ? `${operators.length}+`       : '+30'  },
  ], [saleEquipment.length, rentalEquipment.length, operators.length]);

  const OPERATOR_TYPES: Record<string, string> = { DRIVER: 'سائق', OPERATOR: 'مشغل', TECHNICIAN: 'فني', MAINTENANCE: 'صيانة' };

  return (
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

        <div className="relative max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 sm:py-20 lg:py-24" style={{ paddingTop: '85px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            <div className="text-center sm:text-start">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-white/90">سوق المعدات الثقيلة في سلطنة عُمان</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl text-white leading-tight mb-3 sm:mb-4" style={{ fontWeight: 800, lineHeight: 1.3 }}>
                بِع أو استأجر معدتك
                <br />
                <span className="text-[var(--color-brand-amber)]">أو طلب معدة اليوم</span>
              </h1>

              <p className="text-sm sm:text-lg text-white/75 mb-5 sm:mb-8 leading-relaxed max-w-lg mx-auto sm:mx-0">
                سوق متخصص يجمع بائعي ومستأجري المعدات الثقيلة والمشغلين المحترفين من جميع محافظات سلطنة عُمان.
              </p>

              <div className="flex flex-row gap-2 sm:gap-3 mb-4 sm:mb-8">
                <Link href="/browse/equipment" className="btn-transport-primary flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6">
                  <Package size={13} className="sm:hidden" aria-hidden="true" />
                  <Package size={18} className="hidden sm:block" aria-hidden="true" />
                  تصفّح المعدات
                </Link>
                <Link href="/add-listing/equipment" className="btn-outline-white flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6">
                  أضف معدتك مجاناً
                  <ArrowLeft size={13} className="sm:hidden" aria-hidden="true" />
                  <ArrowLeft size={18} className="hidden sm:block" aria-hidden="true" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
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

            <div className="hidden lg:block">
              <div className="relative max-w-sm mx-auto scale-[0.8] origin-top mt-10">
                <div className="transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <UnifiedCard item={HERO_SAMPLE_EQUIPMENT} hideContactButtons />
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
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 p-2 sm:p-3 rounded-2xl ${BG_CLS[s.color]}`}>
                  <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG_CLS[s.color]}`}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div className="text-center sm:text-start">
                    <p className="text-sm sm:text-lg font-bold text-[var(--color-on-surface)]">{s.value}</p>
                    <p className="text-[9px] sm:text-[11px] leading-tight text-[var(--color-on-surface-variant)]">{s.label}</p>
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

      {/* ═══════════════════ 4. EQUIPMENT TYPES GRID ═══════════════════ */}
      <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">تصفّح حسب نوع المعدة</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)]">اختر نوع المعدة المناسب لمشروعك</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {EQUIP_TYPES.map(type => {
              const Icon = type.icon;
              return (
                <Link key={type.key} href={`/browse/equipment?equipmentType=${type.key}`} className="card-base card-hover p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${BG_CLS[type.color]}`}>
                    <Icon size={22} style={{ color: type.color }} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-on-surface)] leading-tight" style={{ fontWeight: 700 }}>{type.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. SALE LISTINGS ═══════════════════ */}
      {saleEquipment.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full" style={{ backgroundColor: '#d97706' }} />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">أحدث المعدات للبيع</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">معدات جديدة ومستعملة بأفضل الأسعار</p>
              </div>
              <Link href="/browse/equipment" className="flex items-center gap-1.5 font-bold text-xs sm:text-sm hover:underline" style={{ color: '#d97706' }}>
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {saleEquipment.slice(0, 8).map(item => (
                <UnifiedCard key={item.id} item={transformEquipment(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 6. RENTAL LISTINGS ═══════════════════ */}
      {rentalEquipment.length > 0 && (
        <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">معدات للإيجار</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">يومي، أسبوعي، أو شهري</p>
              </div>
              <Link href="/browse/equipment?listingType=EQUIPMENT_RENT" className="flex items-center gap-1.5 font-bold text-xs sm:text-sm hover:underline" style={{ color: '#16a34a' }}>
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
              {rentalEquipment.slice(0, 8).map(item => (
                <UnifiedCard key={item.id} item={transformEquipment(item)} className="h-full" hideContactButtons />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 7. OPEN REQUESTS ═══════════════════ */}
      {requests.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full" style={{ backgroundColor: '#2563eb' }} />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">طلبات المعدات</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">طلبات مفتوحة تنتظر عروضك</p>
              </div>
              <Link href="/equipment/requests" className="flex items-center gap-1.5 font-bold text-xs sm:text-sm hover:underline" style={{ color: '#2563eb' }}>
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {requests.slice(0, 6).map(req => (
                <Link key={req.id} href={`/equipment/requests/${req.id}`} className="card-base card-hover p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 dark:bg-blue-950/40">
                      <HardHat size={20} style={{ color: '#2563eb' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)] line-clamp-1">{req.title}</h3>
                      <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5">
                        الكمية: {req.quantity}
                        {req.budgetMax && ` · ميزانية: ${Number(req.budgetMax).toLocaleString('en-US')} ${req.currency}`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex-shrink-0">مفتوح</span>
                  </div>
                  {req.description && (
                    <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-2">{req.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-on-surface-variant)]">
                    {req.governorate && (
                      <span className="flex items-center gap-1"><MapPin size={12} />{req.governorate}</span>
                    )}
                    <span className="flex items-center gap-1 font-bold" style={{ color: '#2563eb' }}>
                      <Search size={12} />{req._count?.bids ?? 0} عروض
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 8. OPERATORS ═══════════════════ */}
      {operators.length > 0 && (
        <section className="py-8 sm:py-12 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
            <div className="flex flex-wrap items-end justify-between gap-2 mb-5 sm:mb-8">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div className="h-6 sm:h-8 w-1 rounded-full" style={{ backgroundColor: '#7c3aed' }} />
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[var(--color-on-surface)]">مشغلين معدات</h2>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)]">سائقين وفنيين محترفين</p>
              </div>
              <Link href="/equipment/operators" className="flex items-center gap-1.5 font-bold text-xs sm:text-sm hover:underline" style={{ color: '#7c3aed' }}>
                عرض الكل <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {operators.slice(0, 6).map(op => {
                const rate = op.dailyRate
                  ? `${Number(op.dailyRate).toLocaleString('en-US')} ${op.currency}/يوم`
                  : op.hourlyRate
                  ? `${Number(op.hourlyRate).toLocaleString('en-US')} ${op.currency}/ساعة`
                  : 'اتصل للسعر';
                return (
                  <Link key={op.id} href={`/equipment/operators/${op.id}`} className="card-base card-hover p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50 dark:bg-violet-950/40">
                        <Users size={22} style={{ color: '#7c3aed' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[var(--color-on-surface)] line-clamp-1">{op.title}</h3>
                        <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                          {OPERATOR_TYPES[op.operatorType] || op.operatorType}
                          {op.experienceYears ? ` · ${op.experienceYears} سنة خبرة` : ''}
                        </p>
                      </div>
                    </div>
                    {op.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {op.specializations.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-50 dark:bg-violet-950/40" style={{ color: '#7c3aed' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-outline-variant)]/10">
                      <span className="text-sm font-bold" style={{ color: '#d97706' }}>{rate}</span>
                      {op.governorate && (
                        <span className="text-[11px] text-[var(--color-on-surface-variant)] flex items-center gap-1">
                          <MapPin size={12} />{op.governorate}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ 9. HOW IT WORKS ═══════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">كيف يعمل سوق ون للمعدات؟</h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] max-w-lg mx-auto">أربع خطوات بسيطة تفصلك عن معدتك المثالية</p>
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

      {/* ═══════════════════ 10. SELLER CTA ═══════════════════ */}
      <section className="py-4 sm:py-16 pb-[calc(1rem+env(safe-area-inset-bottom,0px)+53px)] sm:pb-16 bg-[var(--color-surface-container-low)] dark:bg-[var(--color-surface-dim)]">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
          <div className="gradient-navy rounded-2xl sm:rounded-3xl p-4 sm:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-amber)]/20 flex items-center justify-center">
                  <Package size={24} className="text-[var(--color-brand-amber)]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-amber)]">للبائعين والمؤجرين</p>
                  <h2 className="text-xl font-bold" style={{ fontWeight: 700 }}>بِع أو أجّر معدتك بأفضل سعر</h2>
                </div>
              </div>

              <p className="text-sm text-white/75 leading-relaxed mb-6 max-w-lg">
                أضف إعلانك مجاناً وتواصل مع آلاف المشترين والمستأجرين المهتمين في جميع محافظات سلطنة عُمان.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4 mb-4 sm:mb-8">
                {([
                  { icon: TrendingUp, label: 'مشاهدة يومياً', value: '+500',  color: '#16a34a' },
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
                  href="/add-listing/equipment"
                  className="btn-navy rounded-full flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-sm !py-2 !px-3 sm:!py-3 sm:!px-6"
                  style={{ background: 'var(--color-brand-amber)', color: '#fff' }}
                >
                  <Plus size={13} className="sm:hidden" aria-hidden="true" />
                  <Plus size={16} className="hidden sm:block" aria-hidden="true" />
                  أضف معدتك مجاناً
                </Link>
                <Link href="/equipment/requests/new" className="btn-outline-white flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-sm !py-2 !px-3 sm:!py-3 sm:!px-6">
                  <HardHat size={13} className="sm:hidden" aria-hidden="true" />
                  <HardHat size={16} className="hidden sm:block" aria-hidden="true" />
                  انشر طلب معدة
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

