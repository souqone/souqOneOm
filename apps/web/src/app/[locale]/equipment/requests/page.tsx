'use client';

import { useState, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useEquipmentListings } from '@/lib/api/equipment';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import { resolveLocationLabel } from '@/lib/location-data';
import { getGovernorates } from '@/lib/location-data';
import { relativeTimeT } from '@/lib/time-utils';
import { useTranslations, useLocale } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const EQUIP_TYPES = [
  { value: '', label: 'كل الأنواع' },
  { value: 'EXCAVATOR', label: 'حفارة' },
  { value: 'CRANE', label: 'رافعة' },
  { value: 'LOADER', label: 'لودر' },
  { value: 'BULLDOZER', label: 'بلدوزر' },
  { value: 'FORKLIFT', label: 'رافعة شوكية' },
  { value: 'CONCRETE_MIXER', label: 'خلاطة خرسانة' },
  { value: 'GENERATOR', label: 'مولد كهربائي' },
  { value: 'COMPRESSOR', label: 'ضاغط هواء' },
  { value: 'SCAFFOLDING', label: 'سقالات' },
  { value: 'WELDING_MACHINE', label: 'ماكينة لحام' },
  { value: 'TRUCK', label: 'شاحنة' },
  { value: 'DUMP_TRUCK', label: 'قلاب' },
  { value: 'WATER_TANKER', label: 'تنكر مياه' },
  { value: 'LIGHT_EQUIPMENT', label: 'معدة خفيفة' },
  { value: 'OTHER_EQUIPMENT', label: 'أخرى' },
];

const EQUIP_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  EQUIP_TYPES.filter(t => t.value).map(t => [t.value, t.label])
);

function WantedCard({ item, locale, tt }: { item: EquipmentListingItem; locale: string; tt: ReturnType<typeof useTranslations> }) {
  const locationLabel = item.governorate ? resolveLocationLabel(item.governorate, locale) ?? item.governorate : null;
  const budgetText = item.budgetMax
    ? `حتى ${Number(item.budgetMax).toLocaleString('en-US')} ${item.currency}`
    : item.budgetMin
    ? `من ${Number(item.budgetMin).toLocaleString('en-US')} ${item.currency}`
    : null;

  return (
    <Link
      href={`/equipment/requests/${item.id}`}
      className="group flex flex-col bg-background border border-outline-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-outline-variant/40 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-orange-600 text-xl">assignment</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {EQUIP_TYPE_LABEL[item.equipmentType] ?? item.equipmentType}
            {item.quantity && item.quantity > 1 && ` · الكمية: ${item.quantity}`}
          </p>
        </div>
        <span className="shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
          مطلوب
        </span>
      </div>

      <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-3 flex-1">{item.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {item.withOperator && (
          <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">engineering</span>
            مع مشغل
          </span>
        )}
        {item.startDate && (
          <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-medium">
            {new Date(item.startDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {item.rentalDuration && (
          <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full font-medium">
            {item.rentalDuration}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
        <div className="flex items-center gap-3">
          {budgetText && <span className="text-[13px] font-black text-amber-600">{budgetText}</span>}
          {locationLabel && (
            <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {locationLabel}
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-on-surface-variant/50 mt-2">
        {relativeTimeT(item.createdAt, tt, locale)}
      </p>
    </Link>
  );
}

function RequestSkeleton() {
  return (
    <div className="flex flex-col bg-background border border-outline-variant/20 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-surface-container-high animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-surface-container-high animate-pulse rounded-full" />
          <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded-full" />
        </div>
        <div className="w-14 h-5 bg-surface-container-high animate-pulse rounded-lg" />
      </div>
      <div className="h-3 w-full bg-surface-container-high animate-pulse rounded-full mb-2" />
      <div className="h-3 w-4/5 bg-surface-container-high animate-pulse rounded-full mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-surface-container-high animate-pulse rounded-full" />
        <div className="h-5 w-20 bg-surface-container-high animate-pulse rounded-full" />
      </div>
      <div className="flex justify-between pt-3 border-t border-outline-variant/10">
        <div className="h-4 w-24 bg-surface-container-high animate-pulse rounded-full" />
        <div className="h-4 w-16 bg-surface-container-high animate-pulse rounded-full" />
      </div>
    </div>
  );
}

export default function EquipmentWantedPage() {
  const locale = useLocale();
  const tt = useTranslations('time');

  const [search, setSearch] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [withOperator, setWithOperator] = useState<'' | 'true' | 'false'>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const params: Record<string, string> = { page: String(page), limit: '12', listingType: 'EQUIPMENT_WANTED' };
  if (search.trim()) params.q = search.trim();
  if (equipmentType) params.equipmentType = equipmentType;
  if (governorate) params.governorate = governorate;
  if (withOperator) params.withOperator = withOperator;

  const { data, isLoading, error } = useEquipmentListings(params);
  const items = data?.items ?? [];
  const meta = data?.meta;

  const governorates = getGovernorates(locale as 'ar' | 'en');
  const hasActiveFilters = equipmentType || governorate || withOperator;

  function clearFilters() {
    setEquipmentType('');
    setGovernorate('');
    setWithOperator('');
    setPage(1);
  }

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-bl from-orange-700 via-orange-600 to-amber-700 px-4 pt-8 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-[11px] font-medium mb-3">
            <span className="material-symbols-outlined text-[14px] text-orange-300">assignment</span>
            سوق المعدات الثقيلة
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">طلبات المعدات</h1>
          <p className="text-white/70 text-sm mb-5">تصفح طلبات المعدات المطلوبة وتواصل مباشرةً مع أصحاب الطلبات</p>
          <div className="max-w-xl mx-auto flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 ps-4 pe-1.5 py-1.5">
            <Search size={16} className="text-white/60 shrink-0" />
            <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)} placeholder="ابحث في الطلبات..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none" dir="rtl" />
            {search && (
              <button onClick={() => handleSearchChange('')} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X size={12} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowFilters(p => !p)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${showFilters || hasActiveFilters ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest border-outline-variant/25 text-on-surface hover:border-primary/40'}`}>
            <SlidersHorizontal size={15} />
            فلترة
            {hasActiveFilters && <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">{[equipmentType, governorate, withOperator].filter(Boolean).length}</span>}
          </button>
          <Link href="/equipment/requests/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 transition-colors ms-auto">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            أضف طلبك
          </Link>
          {meta && <span className="text-sm text-on-surface-variant">{meta.total.toLocaleString('en-US')} طلب</span>}
        </div>

        {showFilters && (
          <div className="mt-3 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">نوع المعدة</label>
              <select value={equipmentType} onChange={e => { setEquipmentType(e.target.value); setPage(1); }} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                {EQUIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">المحافظة</label>
              <select value={governorate} onChange={e => { setGovernorate(e.target.value); setPage(1); }} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                <option value="">كل المحافظات</option>
                {governorates.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1.5">مشغّل معدة</label>
              <select value={withOperator} onChange={e => { setWithOperator(e.target.value as '' | 'true' | 'false'); setPage(1); }} className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                <option value="">الكل</option>
                <option value="true">مع مشغّل</option>
                <option value="false">بدون مشغّل</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="sm:col-span-3 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors w-fit">
                <X size={13} />مسح الفلاتر
              </button>
            )}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {error ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error_outline</span>
            <p className="text-on-surface-variant font-medium">حدث خطأ في تحميل الطلبات</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <RequestSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-orange-500 text-3xl">assignment_late</span>
            </div>
            <h3 className="text-base font-bold text-on-surface mb-2">لا توجد طلبات</h3>
            <p className="text-sm text-on-surface-variant mb-6 max-w-xs">
              {hasActiveFilters ? 'جرب تغيير معايير الفلترة' : 'كن أول من ينشر طلب معدة'}
            </p>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">مسح الفلاتر</button>
              )}
              <Link href="/equipment/requests/new" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>أضف طلبك
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => <WantedCard key={item.id} item={item} locale={locale} tt={tt} />)}
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                  const pageNum = meta.totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= meta.totalPages - 2 ? meta.totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === pageNum ? 'bg-primary text-on-primary shadow-sm' : 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
