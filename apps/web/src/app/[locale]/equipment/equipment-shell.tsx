'use client';

import { useState, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { Search, ArrowLeft, ArrowRight, ChevronLeft, Wrench, HardHat, Package, Users, Plus, Sparkles, MapPin } from 'lucide-react';
import type { EquipmentListingItem, EquipmentRequestItem, OperatorListingItem } from '@/lib/api/equipment';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { normalizeEquipment } from '@/features/listings/config/categories.config';

// ── Equipment Type Config ────────────────────────────────────────────────────

const EQUIP_TYPES = [
  { key: 'EXCAVATOR', label: 'حفارة', icon: 'precision_manufacturing' },
  { key: 'CRANE', label: 'رافعة', icon: 'crane' },
  { key: 'LOADER', label: 'لودر', icon: 'front_loader' },
  { key: 'BULLDOZER', label: 'بلدوزر', icon: 'agriculture' },
  { key: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { key: 'CONCRETE_MIXER', label: 'خلاطة', icon: 'concrete' },
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
      <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-amber-900/80 to-amber-700/90 pt-8 pb-16 md:pt-12 md:pb-24">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-amber-500 blur-[100px]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-orange-400 blur-[120px]" />
        </div>
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              الرئيسية
            </Link>
            <ChevronLeft size={14} className="opacity-50" />
            <span className="text-white font-medium">المعدات الثقيلة</span>
          </nav>

          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-[12px] font-medium mb-4">
              <Sparkles size={14} className="text-amber-400" />
              سوق المعدات الثقيلة في عُمان
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
              عالم <span className="text-amber-400">المعدات الثقيلة</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto">
              بيع وإيجار المعدات الثقيلة، طلبات المعدات، ومشغلين محترفين في مكان واحد
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all duration-300" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                <Search size={20} className="mr-4 text-on-surface-variant shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن معدة، حفارة، رافعة، مولد..."
                  className="flex-1 h-14 bg-transparent text-[15px] text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                />
                <Link
                  href={`/browse/equipment${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                  className="h-10 px-6 ml-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[14px] font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shrink-0"
                >
                  بحث
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-8">
            {[
              { label: 'معدة للبيع', value: `+${saleEquipment.length > 0 ? '500' : '0'}` },
              { label: 'معدة للإيجار', value: `+${rentalEquipment.length > 0 ? '200' : '0'}` },
              { label: 'مشغل معتمد', value: `+${operators.length > 0 ? '50' : '0'}` },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[11px] md:text-[12px] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. QUICK LINKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="-mt-10 relative z-20 max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group relative overflow-hidden rounded-2xl p-5 md:p-6 bg-white dark:bg-surface-container border border-outline-variant/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${link.gradient}`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <link.icon size={22} className="text-white" />
              </div>
              <h3 className="text-[14px] md:text-[15px] font-bold text-on-surface mb-1">{link.title}</h3>
              <p className="text-[11px] md:text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">{link.desc}</p>
              <span className="inline-block mt-2 text-[10px] md:text-[11px] font-bold text-primary/80">{link.count}</span>
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
                        {req.budgetMax && ` · ميزانية: ${Number(req.budgetMax).toLocaleString()} ${req.currency}`}
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
                const rate = op.dailyRate ? `${Number(op.dailyRate).toLocaleString()} ${op.currency}/يوم` : op.hourlyRate ? `${Number(op.hourlyRate).toLocaleString()} ${op.currency}/ساعة` : 'اتصل للسعر';
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

