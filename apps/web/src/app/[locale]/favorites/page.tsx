'use client';

import { Link } from '@/i18n/navigation';
import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { ErrorState } from '@/components/error-state';
import { Heart } from 'lucide-react';
import { useFavorites, type EntityType } from '@/lib/api';
import { useTranslations } from 'next-intl';

// ── Types ──
type SortOption = 'newest' | 'price' | 'oldest';

// ── Category Tabs Config ──
const CATEGORY_TABS: { value: EntityType; labelKey: string; icon: string }[] = [
  { value: 'LISTING', labelKey: 'catCars', icon: 'directions_car' },
  { value: 'BUS_LISTING', labelKey: 'catBuses', icon: 'directions_bus' },
  { value: 'EQUIPMENT_LISTING', labelKey: 'catEquipment', icon: 'construction' },
  { value: 'SPARE_PART', labelKey: 'catParts', icon: 'settings' },
  { value: 'CAR_SERVICE', labelKey: 'catServices', icon: 'build' },
  { value: 'JOB', labelKey: 'catJobs', icon: 'work' },
  { value: 'INSURANCE', labelKey: 'catInsurance', icon: 'shield' },
  { value: 'OPERATOR_LISTING', labelKey: 'catOperators', icon: 'engineering' },
];

// ── Sort Options ──
const SORT_KEYS: { value: SortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'price', labelKey: 'sortPrice' },
  { value: 'oldest', labelKey: 'sortOldest' },
];

// ── Main Page ──
export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const { transformFavorite } = useItemTransformers();
  const [activeTab, setActiveTab] = useState<EntityType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filterType = activeTab === 'ALL' ? undefined : activeTab;
  const { data, isLoading, isError, refetch } = useFavorites(filterType);
  const items = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.meta?.total ?? 0;

  // Compute available tabs based on all favorites (not filtered)
  const { data: allFavs } = useFavorites(undefined);
  const availableTabs = useMemo(() => {
    if (!allFavs?.items) return [];
    const types = new Set(allFavs.items.map(i => i.entityType));
    return CATEGORY_TABS.filter(tab => types.has(tab.value));
  }, [allFavs]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = Number(a.listing?.price ?? 0);
          const priceB = Number(b.listing?.price ?? 0);
          return priceB - priceA;
        });
      default:
        return sorted;
    }
  }, [items, sortBy]);

  // Note: UnifiedCard handles its own favorite toggle now (built-in heart button).
  // Undo affordance is dropped here for simplicity.

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background pb-24 lg:pb-16">

        {/* ══ PREMIUM BANNER HEADER ══ */}
        <div className="relative bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] overflow-hidden px-4 pt-8 pb-10">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h30v30H0zm30 30h30v30H30z\' fill=\'%23fff\' fill-opacity=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }} />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
          <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Heart size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-white leading-tight">
                {t('pageTitle')}
              </h1>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-white/15 text-[11px] font-medium text-white/90">
                {t('subtitle', { count: totalCount })}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ A) CATEGORY FILTER TABS ═══ */}
        <div className="px-4 md:px-8 max-w-7xl mx-auto mt-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-on-surface text-surface'
                  : 'border border-outline-variant/30 text-on-surface hover:border-on-surface/50'
              }`}
            >
              {t('filterAll')}
            </button>
            {availableTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-on-surface text-surface'
                    : 'border border-outline-variant/30 text-on-surface hover:border-on-surface/50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* ═══ B) SORT BAR ═══ */}
          {totalCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {SORT_KEYS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium flex-shrink-0 transition-colors ${
                    sortBy === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant/20 text-on-surface-variant hover:border-primary/30 bg-surface-container-lowest cursor-pointer'
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ C) CONTENT GRID ═══ */}
        <div className="px-4 md:px-8 mt-6 max-w-7xl mx-auto">
          {isLoading ? (
            /* ── Skeleton ── */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-outline-variant/10 overflow-hidden bg-surface-container-lowest animate-pulse">
                  <div className="aspect-[16/10] bg-surface-container-high" />
                  <div className="p-2.5 sm:p-3 space-y-2">
                    <div className="h-3 sm:h-4 w-3/4 bg-surface-container-high rounded" />
                    <div className="h-2 sm:h-3 w-1/2 bg-surface-container rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : sortedItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {sortedItems.map((fav) => {
                return (
                  <UnifiedCard
                    key={fav.id}
                    item={transformFavorite(fav as any)}
                    className="h-full"
                  />
                );
              })}
            </div>
          ) : (
            /* ── Empty State ── */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart size={28} className="text-primary" />
              </div>
              <h3 className="text-[16px] font-medium text-on-surface mb-1">{t('emptyTitle')}</h3>
              <p className="text-[13px] text-on-surface-variant mb-6 max-w-xs">
                {t('emptyDescription')}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-[13px] font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">search</span>
                {t('browseListings')}
              </Link>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </AuthGuard>
  );
}
