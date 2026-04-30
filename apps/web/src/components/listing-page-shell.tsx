/**
 * @deprecated — Replaced by BrowseGlobalShell + unified Meilisearch search.
 * All listing browsing now goes through /browse. Scheduled for removal.
 */
'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { useTranslations } from 'next-intl';

/* ── Types ── */

interface CategoryOption {
  value: string;
  label: string;
}

interface PaginatedMeta {
  page: number;
  total: number;
  totalPages: number;
}

interface ListingPageShellProps<T> {
  /** Page title (e.g. "قطع غيار") */
  title: string;
  /** Count label suffix (e.g. "إعلان", "خدمة") */
  countLabel: string;
  /** Placeholder for search input */
  searchPlaceholder: string;
  /** URL path for "add" button (e.g. "/add-listing/parts") */
  addHref: string;
  /** Label for "add" button (e.g. "+ أضف قطعة") */
  addLabel: string;
  /** CSS class for add button (e.g. "btn-warning", "btn-success") */
  addBtnClass?: string;
  /** Base URL path for this page (e.g. "/parts") */
  basePath: string;
  /** Category filter options */
  categories: CategoryOption[];
  /** URL param key for category filter (e.g. "partCategory", "serviceType") */
  filterParamKey: string;
  /** Grid className override (default: 3-col) */
  gridClassName?: string;
  /** React Query hook that returns { data, isLoading, error } */
  useDataHook: (params: Record<string, string>) => {
    data: { items: T[]; meta: PaginatedMeta } | undefined;
    isLoading: boolean;
    error: unknown;
  };
  /** Render function for each item card */
  renderCard: (item: T, index: number) => ReactNode;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Material icon name for hero section */
  heroIcon?: string;
  /** Subtitle text for hero section */
  heroSubtitle?: string;
}

/* ── Shell component ── */

export function ListingPageShell<T>(props: ListingPageShellProps<T>) {
  return (
    <Suspense fallback={<><Navbar /><main className="pt-28 pb-16 max-w-[1440px] mx-auto px-4"><ListingSkeleton count={6} /></main></>}>
      <ListingPageContent {...props} />
    </Suspense>
  );
}

function ListingPageContent<T>({
  title,
  countLabel,
  searchPlaceholder,
  addHref,
  addLabel,
  addBtnClass: _addBtnClass = 'btn-warning',
  basePath,
  categories,
  filterParamKey,
  gridClassName = 'grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4',
  useDataHook,
  renderCard,
  emptyTitle: emptyTitleProp,
  emptyDescription: emptyDescProp,
  heroIcon = 'category',
  heroSubtitle,
}: ListingPageShellProps<T>) {
  const tc = useTranslations('common');
  const tl = useTranslations('listings');
  const searchParams = useSearchParams();
  const router = useRouter();
  const emptyTitle = emptyTitleProp ?? tc('noResults');
  const emptyDescription = emptyDescProp ?? tl('tryDifferentSearch');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get(filterParamKey) || '');

  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (selectedFilter) params[filterParamKey] = selectedFilter;
  params.page = searchParams.get('page') || '1';

  const { data, isLoading, error } = useDataHook(params);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (selectedFilter) sp.set(filterParamKey, selectedFilter);
    router.push(`${basePath}?${sp.toString()}`);
  }

  function handleFilterChange(value: string) {
    setSelectedFilter(value);
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (value) sp.set(filterParamKey, value);
    router.push(`${basePath}?${sp.toString()}`);
  }

  return (
    <>
      <Navbar />
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]" />
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
        {/* Decorative blurs */}
        <div className="absolute top-[-20%] right-0 w-[60vw] md:w-[500px] h-[60vw] md:h-[500px] rounded-full bg-white/[0.05] blur-3xl" />
        <div className="absolute bottom-[-20%] left-0 w-[50vw] md:w-[400px] h-[50vw] md:h-[400px] rounded-full bg-blue-300/[0.08] blur-3xl" />

        <div className="relative z-10 pt-20 pb-8 sm:pt-28 sm:pb-12 md:pt-32 md:pb-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            {/* Icon badge */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
              <span className="material-symbols-outlined text-white text-3xl">{heroIcon}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-sm">{title}</h1>
            <p className="text-white/70 text-xs sm:text-sm mb-5 sm:mb-7 max-w-lg mx-auto">
              {heroSubtitle || tl('browseInOman', { total: String(data?.meta.total ?? ''), label: countLabel })}
            </p>

            {/* Glass Search Box */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-white/90 dark:bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:ring-2 focus-within:ring-white/40 transition-all">
                    <span className="material-symbols-outlined text-primary/50 dark:text-white/40 text-xl shrink-0">search</span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="flex-1 bg-transparent text-sm font-medium text-on-surface dark:text-white placeholder:text-on-surface-variant/50 dark:placeholder:text-white/40 focus:outline-none min-w-0"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch('')} className="text-on-surface-variant/40 hover:text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                  <button type="submit" className="shrink-0 bg-white text-primary px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-lg">
                    <span className="material-symbols-outlined text-base">search</span>
                    <span className="hidden sm:inline">{tc('search')}</span>
                  </button>
                </div>

                {/* Category chips inside glass */}
                {categories.length > 1 && (
                  <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 sm:flex-wrap mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                    {categories.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleFilterChange(c.value)}
                        className={`shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition-all ${
                          selectedFilter === c.value
                            ? 'bg-white text-primary shadow-sm'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

            {/* Stats row */}
            <div className="flex justify-center items-center gap-4 sm:gap-6 mt-5 sm:mt-7">
              <div className="flex items-center gap-1.5 text-white/60">
                <span className="material-symbols-outlined text-sm">{heroIcon}</span>
                <span className="text-xs font-black text-white">{data?.meta.total ?? '...'}</span>
                <span className="text-xs">{countLabel}</span>
              </div>
              <span className="w-px h-4 bg-white/20" />
              <Link href={addHref} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-xs font-bold">{addLabel}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ RESULTS ═══════════ */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-on-surface">{title}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {data ? `${data.meta.total} ${countLabel}` : tc('loading')}
            </p>
          </div>
        </div>

        {/* Grid / Loading / Error / Empty */}
        {isLoading ? (
          <ListingSkeleton count={6} />
        ) : error ? (
          <ErrorState message={tl('loadError')} />
        ) : !data?.items.length ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className={gridClassName}>
            {data.items.map((item, i) => renderCard(item, i))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (() => {
          const current = data.meta.page;
          const total = data.meta.totalPages;
          const goTo = (p: number) => { const sp = new URLSearchParams(searchParams.toString()); sp.set('page', String(p)); router.push(`${basePath}?${sp.toString()}`); };
          const btnCls = (active: boolean) => `w-10 h-10 flex items-center justify-center font-black text-sm rounded-xl transition-all ${active ? 'bg-primary text-on-primary shadow-md' : 'border border-outline-variant/10 text-on-surface hover:bg-surface-container'}`;

          const pages: (number | '...')[] = [];
          pages.push(1);
          if (current > 3) pages.push('...');
          for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
          if (current < total - 2) pages.push('...');
          if (total > 1) pages.push(total);

          return (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button onClick={() => goTo(Math.max(1, current - 1))} disabled={current <= 1}
                className="w-10 h-10 border border-outline-variant/10 rounded-xl flex items-center justify-center hover:bg-surface-container transition-all disabled:opacity-30">
                <span className="material-symbols-outlined icon-flip text-lg">chevron_right</span>
              </button>
              {pages.map((p, i) =>
                p === '...' ? (
                  <span key={`e${i}`} className="w-8 text-center text-on-surface-variant/50">...</span>
                ) : (
                  <button key={p} onClick={() => goTo(p)} className={btnCls(p === current)}>{p}</button>
                )
              )}
              <button onClick={() => goTo(Math.min(total, current + 1))} disabled={current >= total}
                className="w-10 h-10 border border-outline-variant/10 rounded-xl flex items-center justify-center hover:bg-surface-container transition-all disabled:opacity-30">
                <span className="material-symbols-outlined icon-flip text-lg">chevron_left</span>
              </button>
            </div>
          );
        })()}
      </main>
      <Footer />
    </>
  );
}
