'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Search, ArrowLeft, ArrowRight, ChevronLeft, Wrench, HardHat, Package, Users, Plus, Sparkles, MapPin } from 'lucide-react';
import type { EquipmentListingItem, EquipmentRequestItem, OperatorListingItem } from '@/lib/api/equipment';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { normalizeEquipment } from '@/features/listings/config/categories.config';

// ── Neon Typing Animation ────────────────────────────────────────────────────

function NeonTypingText({ text, className, speed = 70, glowColor = '#f59e0b' }: { text: string; className?: string; speed?: number; glowColor?: string }) {
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

// ── Equipment Type Config ────────────────────────────────────────────────────

const EQUIP_TYPES = [
  { key: 'EXCAVATOR', label: 'حفارة', icon: 'precision_manufacturing' },
  { key: 'CRANE', label: 'رافعة', icon: 'hardware' },
  { key: 'LOADER', label: 'لودر', icon: 'front_loader' },
  { key: 'BULLDOZER', label: 'بلدوزر', icon: 'agriculture' },
  { key: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { key: 'CONCRETE_MIXER', label: 'خلاطة', icon: 'autorenew' },
  { key: 'GENERATOR', label: 'مولد كهربائي', icon: 'bolt' },
  { key: 'COMPRESSOR', label: 'ضاغط هواء', icon: 'air' },
  { key: 'SCAFFOLDING', label: 'سقالات', icon: 'construction' },
  { key: 'TRUCK', label: 'شاحنة', icon: 'local_shipping' },
  { key: 'DUMP_TRUCK', label: 'قلاب', icon: 'local_shipping' },
  { key: 'WATER_TANKER', label: 'تنكر مياه', icon: 'water_drop' },
];

// ── Quick Links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { title: 'معدات للبيع', desc: 'معدات ثقيلة جديدة ومستعملة', icon: Package, href: '/browse/equipment', gradient: 'from-amber-600 to-orange-700', count: 'عروض يومية' },
  { title: 'معدات للإيجار', desc: 'إيجار يومي وشهري بأسعار تنافسية', icon: Wrench, href: '/browse/equipment?listingType=EQUIPMENT_RENT', gradient: 'from-emerald-600 to-teal-700', count: 'أسعار مرنة' },
  { title: 'طلبات المعدات', desc: 'انشر طلبك واحصل على عروض', icon: HardHat, href: '/equipment/requests/new', gradient: 'from-blue-600 to-indigo-700', count: 'عروض مباشرة' },
  { title: 'مشغلين معدات', desc: 'سائقين وفنيين محترفين', icon: Users, href: '/browse/equipment?tab=operators', gradient: 'from-purple-600 to-pink-600', count: 'خبرة عالية' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface EquipmentShellProps {
  saleEquipment: EquipmentListingItem[];
  rentalEquipment: EquipmentListingItem[];
  operators: OperatorListingItem[];
  requests: EquipmentRequestItem[];
}

// ── Main Component ──────────────────────────────────────────────────────────

export function EquipmentShell({ saleEquipment, rentalEquipment, operators, requests }: EquipmentShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const typesRef = useRef<HTMLDivElement>(null);

  const scrollTypes = (dir: 'left' | 'right') => {
    if (!typesRef.current) return;
    typesRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section>
        {/* Search bar — above slider */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-surface-container rounded-full border border-outline-variant/20 ps-3 pe-1.5 py-1 shadow-sm">
              <Search size={16} className="text-on-surface-variant/50 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن معدة، حفارة، رافعة، مولد..."
                className="flex-1 h-8 sm:h-9 bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none min-w-0"
              />
              <Link
                href={`/browse/equipment${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-amber-600 rounded-full flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-white text-[16px] sm:text-[18px]">search</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-3">
          <div className="relative w-full overflow-hidden aspect-[16/9] sm:aspect-[16/5] lg:aspect-[16/5.5] xl:aspect-[16/5] rounded-2xl sm:rounded-3xl">
            <Image
              src="/images/categories/equipment.webp"
              alt="معدات سوق وان"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
              quality={80}
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADQAQCdASoQAAkAAkA4JZQCdAEO/hepgAAA/vxR0f//LGf/0pV//9Kf/+lf/6Uq1PUAAP7+IQAA"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-12 xl:px-16 text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/10 text-white/80 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3">
                <Sparkles size={12} className="text-amber-400 sm:w-[14px] sm:h-[14px]" />
                سوق المعدات الثقيلة في عُمان
              </div>

              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-1 sm:mb-2 lg:mb-3">
                <NeonTypingText text="عالم المعدات الثقيلة" speed={80} glowColor="#f59e0b" className="text-amber-400" />
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-lg lg:max-w-xl">
                بيع وإيجار المعدات الثقيلة، طلبات المعدات، ومشغلين محترفين في مكان واحد
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-5">
                <Link
                  href="/browse/equipment"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-black rounded-lg sm:rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none">explore</span>
                  تصفح المعدات
                </Link>
                <Link
                  href="/add-listing/equipment"
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3 text-[10px] sm:text-sm lg:text-base font-bold rounded-lg sm:rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined !text-[12px] sm:!text-[15px] lg:!text-base leading-none">add_circle</span>
                  أضف معدتك
                </Link>
              </div>

              {/* Stats as trust badges */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 flex-wrap">
                {[
                  { label: 'معدة للبيع', value: `+${saleEquipment.length > 0 ? '500' : '0'}` },
                  { label: 'معدة للإيجار', value: `+${rentalEquipment.length > 0 ? '200' : '0'}` },
                  { label: 'مشغل معتمد', value: `+${operators.length > 0 ? '50' : '0'}` },
                ].map((stat) => (
                  <span key={stat.label} className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] lg:text-xs font-bold bg-white/15 backdrop-blur-sm rounded-full px-2 py-1 sm:px-2.5 sm:py-1 lg:px-3 lg:py-1.5">
                    {stat.value} {stat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. QUICK LINKS
      ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          3. BROWSE BY TYPE — Horizontal scroll
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12 md:mt-16 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-black text-on-surface">تصفح حسب النوع</h2>
            <p className="text-[12px] text-on-surface-variant mt-0.5">اختر نوع المعدة</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scrollTypes('right')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
              <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollTypes('left')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} />
            </button>
            <Link href="/browse/equipment" className="text-[12px] text-amber-600 font-bold hover:underline mr-2">
              عرض الكل
            </Link>
          </div>
        </div>

        <div
          ref={typesRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {EQUIP_TYPES.map((type) => (
            <Link
              key={type.key}
              href={`/browse/equipment?equipmentType=${type.key}`}
              className="group flex flex-col items-center gap-2 min-w-[100px] p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 hover:border-amber-500/40 hover:shadow-md transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-all">
                <span className="material-symbols-outlined text-amber-600 text-[28px]">{type.icon}</span>
              </div>
              <span className="text-[11px] font-bold text-on-surface text-center leading-tight">{type.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. EQUIPMENT FOR SALE
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12 md:mt-16 py-10 bg-surface-container-low/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-amber-600" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface">أحدث المعدات للبيع</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">معدات جديدة ومستعملة بأفضل الأسعار</p>
              </div>
            </div>
            <Link href="/browse/equipment" className="text-[13px] text-amber-600 font-bold hover:underline flex items-center gap-1">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {saleEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {saleEquipment.map((item) => (
                <UnifiedCard key={item.id} item={normalizeEquipment(item)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">construction</span>
              <p className="font-medium">لا توجد معدات للبيع حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. EQUIPMENT FOR RENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-0 py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-emerald-500" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface">معدات للإيجار</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">يومي، أسبوعي، أو شهري</p>
              </div>
            </div>
            <Link href="/browse/equipment?listingType=EQUIPMENT_RENT" className="text-[13px] text-emerald-600 font-bold hover:underline flex items-center gap-1">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {rentalEquipment.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {rentalEquipment.map((item) => (
                <UnifiedCard key={item.id} item={normalizeEquipment(item)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">build</span>
              <p className="font-medium">لا توجد معدات للإيجار حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. OPEN REQUESTS — Equipment wanted
      ═══════════════════════════════════════════════════════════════════════ */}
      {requests.length > 0 && (
        <section className="py-10 bg-surface-container-low/50">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-blue-600" />
                <div>
                  <h2 className="text-lg md:text-xl font-black text-on-surface">طلبات المعدات</h2>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">طلبات مفتوحة تنتظر عروضك</p>
                </div>
              </div>
              <Link href="/equipment/requests/new" className="text-[13px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                أضف طلب
                <ChevronLeft size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/equipment/requests/${req.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-surface-container border border-outline-variant/20 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-blue-600 text-xl">assignment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-bold text-on-surface line-clamp-1">{req.title}</h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        الكمية: {req.quantity}
                        {req.budgetMax && ` · ميزانية: ${Number(req.budgetMax).toLocaleString('en-US')} ${req.currency}`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shrink-0">مفتوح</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-3">{req.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant/60">
                    {req.governorate && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {req.governorate}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-bold text-blue-600">
                      <span className="material-symbols-outlined text-[14px]">gavel</span>
                      {req._count?.bids ?? 0} عروض
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          7. OPERATORS
      ═══════════════════════════════════════════════════════════════════════ */}
      {operators.length > 0 && (
        <section className="py-10">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-purple-600" />
                <div>
                  <h2 className="text-lg md:text-xl font-black text-on-surface">مشغلين معدات</h2>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">سائقين وفنيين محترفين</p>
                </div>
              </div>
              <Link href="/browse/equipment?tab=operators" className="text-[13px] text-purple-600 font-bold hover:underline flex items-center gap-1">
                عرض الكل
                <ChevronLeft size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {operators.map((op) => {
                const OPERATOR_TYPES: Record<string, string> = { DRIVER: 'سائق', OPERATOR: 'مشغل', TECHNICIAN: 'فني', MAINTENANCE: 'صيانة' };
                const rate = op.dailyRate ? `${Number(op.dailyRate).toLocaleString('en-US')} ${op.currency}/يوم` : op.hourlyRate ? `${Number(op.hourlyRate).toLocaleString('en-US')} ${op.currency}/ساعة` : 'اتصل للسعر';
                return (
                  <Link
                    key={op.id}
                    href={`/equipment/operators/${op.id}`}
                    className="group bg-white dark:bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600 text-2xl">engineering</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-bold text-on-surface line-clamp-1">{op.title}</h3>
                        <p className="text-[11px] text-on-surface-variant">
                          {OPERATOR_TYPES[op.operatorType] || op.operatorType}
                          {op.experienceYears ? ` · ${op.experienceYears} سنة خبرة` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-3">{op.description}</p>
                    {op.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {op.specializations.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full font-bold">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <span className="text-[14px] font-black text-amber-600">{rate}</span>
                      {op.governorate && (
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <MapPin size={12} />
                          {op.governorate}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          8. CTA — Post your ad
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-amber-700 via-amber-600/90 to-orange-700 p-8 md:p-12">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] translate-x-1/4 translate-y-1/4" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-[12px] font-medium mb-4">
                <Plus size={14} />
                نشر إعلان جديد
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                عندك معدات تبغى تبيعها أو تأجرها؟
              </h2>
              <p className="text-white/70 text-sm md:text-base max-w-md mx-auto mb-6">
                انشر إعلانك مجاناً ووصّل لآلاف المهتمين في عُمان
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/add-listing/equipment"
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-amber-700 font-bold text-[14px] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Plus size={18} />
                  أضف معدة
                </Link>
                <Link
                  href="/equipment/requests/new"
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white/15 backdrop-blur-md text-white font-bold text-[14px] border border-white/20 hover:bg-white/25 transition-all duration-200"
                >
                  <HardHat size={18} />
                  طلب معدة
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  إعلان مجاني
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  نشر فوري
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  +1000 مهتم نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

