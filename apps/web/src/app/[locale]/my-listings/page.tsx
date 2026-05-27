'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { useMyListings, useDeleteListing } from '@/lib/api';
import { useMyBusListings, useDeleteBusListing } from '@/lib/api/buses';
import { useMyEquipmentListings, useDeleteEquipmentListing, useMyOperatorListings, useDeleteOperatorListing } from '@/lib/api/equipment';
import { useMyParts, useDeletePart } from '@/lib/api/parts';
import { useMyCarServices, useDeleteCarService } from '@/lib/api/services';
import { useMyJobs, useDeleteJob } from '@/lib/api/jobs';
import { useCreateFeaturedPayment } from '@/lib/api/payments';
import { getImageUrl } from '@/lib/image-utils';
import { relativeTimeT } from '@/lib/time-utils';
import { resolveLocationLabel } from '@/lib/location-data';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { MoreVertical, Plus, PlusCircle, Pencil, RefreshCw, Pause, Trash2 } from 'lucide-react';

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

const SECTION_TABS = [
  { key: 'cars', icon: 'directions_car', labelKey: 'sectionCars' },
  { key: 'buses', icon: 'directions_bus', labelKey: 'sectionBuses' },
  { key: 'equipment', icon: 'construction', labelKey: 'sectionEquipment' },
  { key: 'operators', icon: 'engineering', labelKey: 'sectionOperators' },
  { key: 'parts', icon: 'build', labelKey: 'sectionParts' },
  { key: 'services', icon: 'car_repair', labelKey: 'sectionServices' },
  { key: 'jobs', icon: 'work', labelKey: 'sectionJobs' },
] as const;

type SectionKey = typeof SECTION_TABS[number]['key'];

const SECTION_LABEL_MAP: Record<SectionKey, string> = {
  cars: 'sectionCars', buses: 'sectionBuses', equipment: 'sectionEquipment',
  operators: 'sectionOperators', parts: 'sectionParts', services: 'sectionServices', jobs: 'sectionJobs',
};

// ─── Dropdown menu component ───
function ActionMenu({ itemId: _itemId, isActive, isExpired, onEdit, onRenew, onPause, onDelete, tp }: {
  itemId: string; isActive: boolean; isExpired: boolean;
  onEdit: () => void; onRenew: () => void; onPause: () => void; onDelete: () => void;
  tp: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
      >
        <MoreVertical size={16} className="text-on-surface-variant" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Pencil size={15} className="text-on-surface-variant" />
            {tp('myListingsEditListing')}
          </button>
          {isExpired && (
            <button
              onClick={() => { setOpen(false); onRenew(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <RefreshCw size={15} className="text-on-surface-variant" />
              {tp('myListingsRenew')}
            </button>
          )}
          {isActive && (
            <button
              onClick={() => { setOpen(false); onPause(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <Pause size={15} className="text-on-surface-variant" />
              {tp('myListingsPause')}
            </button>
          )}
          <div className="h-px bg-outline-variant/20 mx-3" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2 size={15} />
            {tp('myListingsDeleteListing')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyListingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('cars');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const tt = useTranslations('time');
  const locale = useLocale();

  // ─── Car listings ───
  const carParams: Record<string, string> = { limit: '50' };
  if (statusFilter !== 'ALL') carParams.status = statusFilter;
  const cars = useMyListings(carParams);
  const deleteCar = useDeleteListing();

  // ─── Other sections (useMy* hooks) ───
  const buses = useMyBusListings();
  const deleteBus = useDeleteBusListing();
  const equipment = useMyEquipmentListings();
  const deleteEquipment = useDeleteEquipmentListing();
  const operators = useMyOperatorListings();
  const deleteOperator = useDeleteOperatorListing();
  const parts = useMyParts();
  const deleteParts = useDeletePart();
  const services = useMyCarServices();
  const deleteService = useDeleteCarService();
  const jobs = useMyJobs();
  const deleteJob = useDeleteJob();
  const featureMut = useCreateFeaturedPayment();

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: tp('myListingsFilterAll') },
    { key: 'ACTIVE', label: tp('myListingsFilterActive') },
    { key: 'PENDING', label: tp('myListingsFilterPending') },
    { key: 'EXPIRED', label: tp('myListingsFilterExpired') },
    { key: 'DRAFT', label: tp('myListingsFilterDraft') },
  ];

  const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
    ACTIVE:      { label: tp('myListingsFilterActive'),  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    PENDING:     { label: tp('myListingsFilterPending'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    EXPIRED:     { label: tp('myListingsFilterExpired'), cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400' },
    DRAFT:       { label: tp('myListingsFilterDraft'),   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    SOLD:        { label: tp('myListingsFilterSold'),    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400' },
    OPEN:        { label: 'مفتوح',       cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    IN_PROGRESS: { label: 'قيد التنفيذ', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    CLOSED:      { label: 'مغلق',        cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400' },
    CANCELLED:   { label: 'ملغي',        cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };

  // ─── Section data mapping ───
  function getSectionData(): { items: any[]; isLoading: boolean; refetch: () => void } {
    switch (activeSection) {
      case 'cars': return { items: cars.data?.items ?? [], isLoading: cars.isLoading, refetch: cars.refetch };
      case 'buses': return { items: buses.data ?? [], isLoading: buses.isLoading, refetch: buses.refetch };
      case 'equipment': return { items: equipment.data ?? [], isLoading: equipment.isLoading, refetch: equipment.refetch };
      case 'operators': return { items: operators.data ?? [], isLoading: operators.isLoading, refetch: operators.refetch };
      case 'parts': return { items: parts.data ?? [], isLoading: parts.isLoading, refetch: parts.refetch };
      case 'services': return { items: services.data ?? [], isLoading: services.isLoading, refetch: services.refetch };
      case 'jobs': return { items: jobs.data?.items ?? [], isLoading: jobs.isLoading, refetch: jobs.refetch };
      default: return { items: [], isLoading: false, refetch: () => {} };
    }
  }

  function getDeleteFn(): ((id: string, opts: any) => void) | null {
    switch (activeSection) {
      case 'cars': return (id, opts) => deleteCar.mutate(id, opts);
      case 'buses': return (id, opts) => deleteBus.mutate(id, opts);
      case 'equipment': return (id, opts) => deleteEquipment.mutate(id, opts);
      case 'operators': return (id, opts) => deleteOperator.mutate(id, opts);
      case 'parts': return (id, opts) => deleteParts.mutate(id, opts);
      case 'services': return (id, opts) => deleteService.mutate(id, opts);
      case 'jobs': return (id, opts) => deleteJob.mutate(id, opts);
      default: return null;
    }
  }

  function getEditRoute(id: string): string {
    switch (activeSection) {
      case 'cars': return `/edit-listing/car/${id}`;
      case 'buses': return `/edit-listing/bus/${id}`;
      case 'equipment': return `/edit-listing/equipment/${id}`;
      case 'operators': return `/edit-listing/operator/${id}`;
      case 'parts': return `/edit-listing/parts/${id}`;
      case 'services': return `/edit-listing/service/${id}`;
      case 'jobs': return `/edit-listing/job/${id}`;
      default: return `/edit-listing/${id}`;
    }
  }

  const ENTITY_TYPE_MAP: Record<SectionKey, string> = {
    cars: 'LISTING', buses: 'BUS_LISTING', equipment: 'EQUIPMENT_LISTING',
    operators: 'OPERATOR_LISTING', parts: 'SPARE_PART', services: 'CAR_SERVICE', jobs: 'JOB',
  };

  const sectionData = getSectionData();
  const deleteFn = getDeleteFn();

  const getItemStatus = (item: any): string => item.status;

  // Filter by status
  const filteredItems = activeSection === 'cars'
    ? sectionData.items
    : statusFilter === 'ALL'
      ? sectionData.items
      : sectionData.items.filter((item: any) => getItemStatus(item) === statusFilter);

  const activeStatusFilters = statusFilters;

  // ─── Stats ───
  const stats = useMemo(() => {
    const all = sectionData.items;
    const activeCount = all.filter((i: any) => i.status === 'ACTIVE').length;
    const expiredCount = all.filter((i: any) => i.status === 'EXPIRED' || i.status === 'SOLD' || i.status === 'CANCELLED').length;
    const totalViews = all.reduce((sum: number, i: any) => sum + (i.viewCount || 0), 0);
    return { activeCount, expiredCount, totalViews };
  }, [sectionData.items]);

  function getItemImage(item: any): string | null {
    if (activeSection === 'cars') {
      const img = item.images?.find((i: any) => i.isPrimary) ?? item.images?.[0];
      return getImageUrl(img?.url) || null;
    }
    return getImageUrl(item.images?.[0]?.url || item.imageUrl) || null;
  }

  function getItemPrice(item: any): string | null {
    if (item.listingType === 'EQUIPMENT_WANTED') {
      if (item.budgetMax) return `حتى ${Number(item.budgetMax).toLocaleString('en-US')} ${item.currency || 'OMR'}`;
      if (item.budgetMin) return `من ${Number(item.budgetMin).toLocaleString('en-US')} ${item.currency || 'OMR'}`;
      return null;
    }
    const p = item.price || item.salary || item.priceFrom || item.basePrice || item.dailyPrice;
    if (!p) return null;
    return `${Number(p).toLocaleString('en-US')} ${item.currency || 'OMR'}`;
  }

  function getItemMeta(item: any): string {
    const metaParts: string[] = [];
    metaParts.push(tp(SECTION_LABEL_MAP[activeSection]));
    if (item.governorate) metaParts.push(resolveLocationLabel(item.governorate, locale) ?? item.governorate);
    if (item.createdAt) metaParts.push(relativeTimeT(item.createdAt, tt, locale));
    return metaParts.join(' · ');
  }

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background pb-24 lg:pb-16">

        {/* ══ COVER BANNER + TITLE ══ */}
        <div className="relative bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] overflow-hidden px-4 pt-8 pb-10">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\' fill=\'%23fff\' fill-opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          <div className="relative max-w-3xl mx-auto flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">storefront</span>
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-white leading-tight">
                {tp('myListingsTitle')}
              </h1>
              <p className="text-[12px] text-white/70 mt-0.5">
                {stats.activeCount} {tp('myListingsStatsActive')} · {stats.totalViews.toLocaleString('en-US')} {tp('myListingsStatsTotalViews')}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ A) PAGE HEADER ═══ */}
        <div className="px-4 pb-4 max-w-3xl mx-auto mt-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-outline-variant/15 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="text-[22px] font-semibold text-on-surface">{stats.activeCount}</div>
              <div className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-wide">{tp('myListingsStatsActive')}</div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-outline-variant/15 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="text-[22px] font-semibold text-on-surface">{stats.expiredCount}</div>
              <div className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-wide">{tp('myListingsStatsExpired')}</div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-outline-variant/15 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="text-[22px] font-semibold text-on-surface">{stats.totalViews.toLocaleString('en-US')}</div>
              <div className="text-[11px] text-on-surface-variant mt-1 uppercase tracking-wide">{tp('myListingsStatsTotalViews')}</div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 px-4 pb-2 max-w-3xl mx-auto">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveSection(tab.key); setStatusFilter('ALL'); }}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium rounded-2xl transition-all ${
                activeSection === tab.key
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                  : 'border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-primary/30 bg-surface-container-lowest'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span className="leading-tight text-center">{tp(tab.labelKey)}</span>
            </button>
          ))}
        </div>

        {/* ═══ B) STATUS FILTER TABS ═══ */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2 mt-3 max-w-3xl mx-auto">
          {activeStatusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3.5 py-1.5 text-[12px] font-medium rounded-full transition-all whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-on-surface text-surface-container-lowest dark:bg-on-surface dark:text-background'
                  : 'border border-outline-variant/25 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50 bg-surface-container-lowest'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ═══ C) LISTINGS LIST ═══ */}
        <main className="max-w-3xl mx-auto mt-4">
          {sectionData.isLoading ? (
            <div className="flex flex-col gap-3 px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest">
                  <div className="w-20 h-20 rounded-xl bg-surface-container-high animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-surface-container-high animate-pulse rounded-full" />
                    <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded-full" />
                    <div className="h-3 w-1/3 bg-surface-container-high animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="flex flex-col gap-3 px-4">
              {filteredItems.map((item: any) => {
                const itemStatus = getItemStatus(item);
                const badge = STATUS_BADGE[itemStatus] ?? { label: itemStatus, cls: 'bg-gray-100 text-gray-600' };
                const entityType = ENTITY_TYPE_MAP[activeSection];
                const imgSrc = getItemImage(item);
                const price = getItemPrice(item);
                const meta = getItemMeta(item);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all"
                  >
                    {/* Image */}
                    <Link href={getEditRoute(item.id)} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high relative">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={item.title || ''}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                            <span className="material-symbols-outlined text-2xl">image</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Middle section */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-on-surface line-clamp-1">{item.title}</h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{meta}</p>
                      {price && (
                        <p className="text-[13px] font-semibold text-primary mt-0.5">{price}</p>
                      )}
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1.5 ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Actions menu */}
                    <ActionMenu
                      itemId={item.id}
                      isActive={itemStatus === 'ACTIVE' || itemStatus === 'OPEN'}
                      isExpired={itemStatus === 'EXPIRED' || itemStatus === 'SOLD'}
                      tp={tp}
                      onEdit={() => {
                        window.location.href = `/${locale}${getEditRoute(item.id)}`;
                      }}
                      onRenew={async () => {
                        try {
                          const res = await featureMut.mutateAsync({ entityType, entityId: item.id });
                          window.location.href = res.checkoutUrl;
                        } catch (err: any) {
                          addToast('error', err?.message || tp('myListingsFeatureError'));
                        }
                      }}
                      onPause={() => {
                        // Pause not yet implemented in API — placeholder
                        addToast('info', tp('myListingsPause'));
                      }}
                      onDelete={() => {
                        if (confirm(tp('myListingsDeleteConfirm'))) {
                          deleteFn?.(item.id, { onSuccess: () => sectionData.refetch() });
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ═══ D) EMPTY STATE ═══ */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PlusCircle size={28} className="text-primary" />
              </div>
              <h3 className="text-[15px] font-medium text-on-surface mb-2">
                {statusFilter === 'ALL'
                  ? tp('myListingsEmptyAll')
                  : tp('myListingsEmptyFiltered', { filter: statusFilters.find(f => f.key === statusFilter)?.label ?? '' })}
              </h3>
              <p className="text-[13px] text-on-surface-variant mb-6 max-w-xs">{tp('myListingsEmptyDesc')}</p>
              <Link
                href="/add-listing"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
              >
                <Plus size={16} />
                {tp('myListingsAddNew')}
              </Link>
            </div>
          )}
        </main>

        {/* ═══ E) FLOATING ADD BUTTON ═══ */}
        <div className="fixed bottom-6 left-4 z-40 lg:hidden">
          <Link
            href="/add-listing"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/30 text-[13px] font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            {tp('myListingsAddListing')}
          </Link>
        </div>
      </div>
      <Footer />
    </AuthGuard>
  );
}
