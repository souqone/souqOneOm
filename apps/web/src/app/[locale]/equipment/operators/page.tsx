'use client';

import { useState, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useOperatorListings } from '@/lib/api/equipment';
import type { OperatorListingItem } from '@/lib/api/equipment';
import { resolveLocationLabel } from '@/lib/location-data';
import { getGovernorates } from '@/lib/location-data';
import { relativeTimeT } from '@/lib/time-utils';
import { useTranslations, useLocale } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────

const OPERATOR_TYPES = [
  { value: '', label: 'كل الأنواع' },
  { value: 'DRIVER', label: 'سائق' },
  { value: 'OPERATOR', label: 'مشغّل معدة' },
  { value: 'TECHNICIAN', label: 'فني' },
  { value: 'MAINTENANCE', label: 'صيانة' },
];

const OPERATOR_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  OPERATOR_TYPES.filter(t => t.value).map(t => [t.value, t.label])
);

const EQUIP_TYPE_CHIPS = [
  { value: 'EXCAVATOR', label: 'حفارة', icon: 'precision_manufacturing' },
  { value: 'CRANE', label: 'رافعة', icon: 'hardware' },
  { value: 'LOADER', label: 'لودر', icon: 'front_loader' },
  { value: 'BULLDOZER', label: 'بلدوزر', icon: 'agriculture' },
  { value: 'FORKLIFT', label: 'رافعة شوكية', icon: 'forklift' },
  { value: 'GENERATOR', label: 'مولد', icon: 'bolt' },
  { value: 'TRUCK', label: 'شاحنة', icon: 'local_shipping' },
];

// ── Operator Card ──────────────────────────────────────────────────────────

function OperatorCard({ op, locale, tt }: { op: OperatorListingItem; locale: string; tt: ReturnType<typeof useTranslations> }) {
  const locationLabel = op.governorate ? resolveLocationLabel(op.governorate, locale) ?? op.governorate : null;
  const cur = !op.currency || op.currency === 'OMR' ? 'ر.ع.' : op.currency;
  const rateText = op.dailyRate
    ? `${Number(op.dailyRate).toLocaleString('en-US')} ${cur} / يوم`
    : op.hourlyRate
    ? `${Number(op.hourlyRate).toLocaleString('en-US')} ${cur} / ساعة`
    : 'اتصل للسعر';

  const initials = (op.user?.displayName ?? op.user?.username ?? '?').slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/equipment/operators/${op.id}`}
      className="group flex flex-col bg-background border border-outline-variant/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-outline-variant/40 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header with gradient */}
      <div className="relative h-16 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 flex items-end px-5 pb-3">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
        {/* Avatar */}
        <div className="absolute -bottom-6 right-5">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-container-lowest border-2 border-background flex items-center justify-center shadow-md overflow-hidden">
            {op.user?.avatarUrl ? (
              <img src={op.user.avatarUrl} alt={op.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-purple-600">{initials}</span>
            )}
          </div>
        </div>
        {/* Verified badge */}
        {op.user?.isVerified && (
          <div className="absolute top-2.5 left-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            موثّق
          </div>
        )}
      </div>

      {/* Body */}
      <div className="pt-8 px-5 pb-5 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors mb-0.5">
          {op.title}
        </h3>
        <p className="text-[11px] text-on-surface-variant mb-3">
          {OPERATOR_TYPE_LABEL[op.operatorType] ?? op.operatorType}
          {op.experienceYears ? ` · ${op.experienceYears} سنة خبرة` : ''}
        </p>

        <p className="text-[12px] text-on-surface-variant line-clamp-2 mb-3 flex-1">{op.description}</p>

        {/* Specializations */}
        {op.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {op.specializations.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full font-bold">{s}</span>
            ))}
            {op.specializations.length > 3 && (
              <span className="text-[10px] text-on-surface-variant/60">+{op.specializations.length - 3}</span>
            )}
          </div>
        )}

        {/* Equipment types */}
        {op.equipmentTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {op.equipmentTypes.slice(0, 3).map(et => (
              <span key={et} className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">{et}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10 mt-auto">
          <span className="text-[14px] font-black text-amber-600">{rateText}</span>
          {locationLabel && (
            <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {locationLabel}
            </span>
          )}
        </div>

        {/* Time */}
        <p className="text-[10px] text-on-surface-variant/50 mt-2">
          {relativeTimeT(op.createdAt, tt, locale)}
        </p>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function OperatorSkeleton() {
  return (
    <div className="flex flex-col bg-background border border-outline-variant/20 rounded-2xl overflow-hidden">
      <div className="h-16 bg-surface-container-high animate-pulse" />
      <div className="pt-8 px-5 pb-5 space-y-3">
        <div className="h-4 w-3/4 bg-surface-container-high animate-pulse rounded-full" />
        <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded-full" />
        <div className="h-3 w-full bg-surface-container-high animate-pulse rounded-full" />
        <div className="h-3 w-4/5 bg-surface-container-high animate-pulse rounded-full" />
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-surface-container-high animate-pulse rounded-full" />
          <div className="h-5 w-16 bg-surface-container-high animate-pulse rounded-full" />
        </div>
        <div className="flex justify-between pt-3 border-t border-outline-variant/10">
          <div className="h-4 w-24 bg-surface-container-high animate-pulse rounded-full" />
          <div className="h-4 w-16 bg-surface-container-high animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function EquipmentOperatorsPage() {
  const locale = useLocale();
  const tt = useTranslations('time');

  const [search, setSearch] = useState('');
  const [operatorType, setOperatorType] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const params: Record<string, string> = { page: String(page), limit: '12', status: 'ACTIVE' };
  if (search.trim()) params.q = search.trim();
  if (operatorType) params.operatorType = operatorType;
  if (governorate) params.governorate = governorate;
  if (equipmentTypeFilter) params.equipmentTypes = equipmentTypeFilter;

  const { data, isLoading, error } = useOperatorListings(params);
  const items = data?.items ?? [];
  const meta = data?.meta;

  const governorates = getGovernorates(locale as 'ar' | 'en');
  const hasActiveFilters = operatorType || governorate || equipmentTypeFilter;

  function clearFilters() {
    setOperatorType('');
    setGovernorate('');
    setEquipmentTypeFilter('');
    setPage(1);
  }

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 400);
  }, []);

  return (
    <>
      <main className="min-h-screen bg-background">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-bl from-purple-800 via-purple-700 to-pink-700 px-4 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-[11px] font-medium mb-3">
              <span className="material-symbols-outlined text-[14px] text-purple-300">engineering</span>
              مشغّلو المعدات الثقيلة
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">
              مشغّلون ومهندسون محترفون
            </h1>
            <p className="text-white/70 text-sm mb-5">
              سائقون، مشغّلون، فنيون وفرق صيانة للمعدات الثقيلة في سلطنة عُمان
            </p>
            {/* Search */}
            <div className="max-w-xl mx-auto flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full border border-white/20 ps-4 pe-1.5 py-1.5">
              <Search size={16} className="text-white/60 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن مشغّل أو تخصص..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                dir="rtl"
              />
              {search && (
                <button onClick={() => handleSearchChange('')} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X size={12} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Equipment type quick chips ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setEquipmentTypeFilter(''); setPage(1); }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              !equipmentTypeFilter ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/25 text-on-surface-variant hover:border-primary/40 bg-surface-container-lowest'
            }`}
          >
            الكل
          </button>
          {EQUIP_TYPE_CHIPS.map(chip => (
            <button
              key={chip.value}
              onClick={() => { setEquipmentTypeFilter(chip.value); setPage(1); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                equipmentTypeFilter === chip.value ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/25 text-on-surface-variant hover:border-primary/40 bg-surface-container-lowest'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant/25 text-on-surface hover:border-primary/40'
              }`}
            >
              <SlidersHorizontal size={15} />
              فلترة
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-black">
                  {[operatorType, governorate, equipmentTypeFilter].filter(Boolean).length}
                </span>
              )}
            </button>

            <Link
              href="/add-listing/operator"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors ms-auto"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              سجّل كمشغّل
            </Link>

            {meta && (
              <span className="text-sm text-on-surface-variant">
                {meta.total.toLocaleString('en-US')} مشغّل
              </span>
            )}
          </div>

          {/* ── Filter Panel ── */}
          {showFilters && (
            <div className="mt-3 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">نوع المشغّل</label>
                <select
                  value={operatorType}
                  onChange={e => { setOperatorType(e.target.value); setPage(1); }}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {OPERATOR_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">المحافظة</label>
                <select
                  value={governorate}
                  onChange={e => { setGovernorate(e.target.value); setPage(1); }}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">كل المحافظات</option>
                  {governorates.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="sm:col-span-2 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors w-fit"
                >
                  <X size={13} />
                  مسح الفلاتر
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          {error ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">error_outline</span>
              <p className="text-on-surface-variant font-medium">حدث خطأ في تحميل المشغّلين</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => <OperatorSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-purple-500 text-3xl">engineering</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">لا يوجد مشغّلون</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-xs">
                {hasActiveFilters ? 'جرب تغيير معايير الفلترة' : 'كن أول من يسجّل كمشغّل'}
              </p>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container transition-colors">
                    مسح الفلاتر
                  </button>
                )}
                <Link
                  href="/add-listing/operator"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  سجّل كمشغّل
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(op => (
                  <OperatorCard key={op.id} op={op} locale={locale} tt={tt} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
                    const pageNum = meta.totalPages <= 5
                      ? i + 1
                      : page <= 3 ? i + 1
                      : page >= meta.totalPages - 2 ? meta.totalPages - 4 + i
                      : page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                          page === pageNum
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                    className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
