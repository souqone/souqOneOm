'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { ListingSkeleton } from '@/components/loading-skeleton';
import { useJobs, useRecommendedJobs } from '@/lib/api';
import { useRequireJobProfile } from '@/hooks/use-require-job-profile';
import { useAuth } from '@/providers/auth-provider';
import { getGovernorates, resolveLocationLabel } from '@/lib/location-data';
import { employmentOptionsT } from '@/lib/constants/jobs';
import { useTranslations, useLocale } from 'next-intl';

export default function JobsPage() {
  return (
    <Suspense fallback={<><Navbar /><main className="pt-24 pb-16"><div className="max-w-7xl mx-auto px-4 md:px-8"><ListingSkeleton count={8} /></div></main></>}>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const { transformJob } = useItemTransformers();
  const { profile, requireProfile } = useRequireJobProfile();

  const licenseOpts = [
    { value: 'LIGHT', label: tp('jobsLicenseLight'), icon: 'directions_car' },
    { value: 'HEAVY', label: tp('jobsLicenseHeavy'), icon: 'local_shipping' },
    { value: 'TRANSPORT', label: tp('jobsLicenseTransport'), icon: 'fire_truck' },
    { value: 'BUS', label: tp('jobsLicenseBus'), icon: 'directions_bus' },
    { value: 'MOTORCYCLE', label: tp('jobsLicenseMotorcycle'), icon: 'two_wheeler' },
  ];

  const sortOpts = [
    { value: 'createdAt_desc', label: tp('sortNewest') },
    { value: 'createdAt_asc', label: tp('sortOldest') },
    { value: 'salary_desc', label: tp('sortSalaryHigh') },
    { value: 'salary_asc', label: tp('sortSalaryLow') },
  ];

  const TABS = [
    { value: '', label: tp('all'), icon: 'grid_view' },
    { value: 'OFFERING', label: tp('jobsTabOffering'), icon: 'person_search' },
    { value: 'HIRING', label: tp('jobsTabHiring'), icon: 'person_add' },
  ];

  const empOpts = employmentOptionsT(tm);

  const searchParams = useSearchParams();
  const router = useRouter();

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';
  const jobType = searchParams.get('jobType') || '';
  const employmentType = searchParams.get('employmentType') || '';
  const governorate = searchParams.get('governorate') || '';
  const licenseType = searchParams.get('licenseType') || '';
  const sortBy = searchParams.get('sortBy') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [employmentType, licenseType, governorate, sortBy].filter(Boolean).length;

  const params = useMemo(() => {
    const p: Record<string, string> = { page, limit: '12' };
    if (search) p.search = search;
    if (jobType) p.jobType = jobType;
    if (employmentType) p.employmentType = employmentType;
    if (governorate) p.governorate = governorate;
    if (licenseType) p.licenseType = licenseType;
    if (sortBy) {
      const [field, order] = sortBy.split('_');
      if (field) p.sortBy = field;
      if (order) p.sortOrder = order;
    }
    return p;
  }, [page, search, jobType, employmentType, governorate, licenseType, sortBy]);

  const { data, isLoading, isError, refetch } = useJobs(params);
  const items = data?.items ?? [];
  const meta = data?.meta;

  function updateParam(key: string, value: string) {
    const sp = new URLSearchParams(searchParams);
    if (value) sp.set(key, value); else sp.delete(key);
    sp.delete('page');
    router.push(`/jobs?${sp.toString()}`);
  }

  function handleSearch() {
    const sp = new URLSearchParams(searchParams);
    if (searchInput) sp.set('search', searchInput); else sp.delete('search');
    sp.delete('page');
    router.push(`/jobs?${sp.toString()}`);
  }

  function clearFilters() {
    router.push('/jobs');
  }

  const locale = useLocale();
  const govs = getGovernorates('OM', locale);

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
              <span className="material-symbols-outlined text-white text-3xl">badge</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-sm">{tp('jobsTitle')}</h1>
            <p className="text-white/70 text-xs sm:text-sm mb-5 sm:mb-7 max-w-lg mx-auto">{tp('jobsSubtitle')}</p>

            {/* Glass Search Box */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-white/90 dark:bg-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:ring-2 focus-within:ring-white/40 transition-all">
                    <span className="material-symbols-outlined text-primary/50 dark:text-white/40 text-xl shrink-0">search</span>
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={tp('jobsSearch')}
                      className="flex-1 bg-transparent text-sm font-medium text-on-surface dark:text-white placeholder:text-on-surface-variant/50 dark:placeholder:text-white/40 focus:outline-none min-w-0"
                     
                    />
                    {searchInput && (
                      <button type="button" onClick={() => setSearchInput('')} className="text-on-surface-variant/40 hover:text-on-surface-variant shrink-0">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                  <button onClick={handleSearch} className="shrink-0 bg-white text-primary px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-white/90 active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-lg">
                    <span className="material-symbols-outlined text-base">search</span>
                    <span className="hidden sm:inline">{tp('rentalsSearchBtn')}</span>
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`shrink-0 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-black transition-all flex items-center gap-1 relative ${
                      showFilters || activeFilterCount > 0
                        ? 'bg-white/30 text-white border border-white/40'
                        : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    <span className="hidden sm:inline text-xs">{tp('filters')}</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tabs inside glass */}
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
                  {TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => updateParam('jobType', tab.value)}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg whitespace-nowrap transition-all ${
                        jobType === tab.value
                          ? 'bg-white text-primary shadow-sm'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center items-center gap-4 sm:gap-6 mt-5 sm:mt-7">
              <div className="flex items-center gap-1.5 text-white/60">
                <span className="material-symbols-outlined text-sm">work</span>
                <span className="text-xs font-black text-white">{meta?.total ?? '...'}</span>
                <span className="text-xs">{tp('jobsCount')}</span>
              </div>
              <span className="w-px h-4 bg-white/20" />
              <button onClick={() => requireProfile('employer', () => router.push('/jobs/new'))} className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-xs font-bold">{tp('jobsAddJob')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ONBOARDING CTA ═══════════ */}
      {!profile.isLoading && !profile.hasAny && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-4 mb-4 relative z-10">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#004ac6]/90 via-[#1a3a8f]/80 to-[#0B2447]/90" />
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/[0.04] blur-3xl -translate-y-1/2 translate-x-1/3" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-7">
              {/* Icons */}
              <div className="flex gap-3 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-white text-2xl">local_shipping</span>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-white text-2xl">business</span>
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-start">
                <h3 className="text-lg sm:text-xl font-black text-white mb-1">
                  {tp('jobsOnboardingTitle')}
                </h3>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  {tp('jobsOnboardingDesc')}
                </p>
              </div>

              {/* Button */}
              <Link
                href="/jobs/onboarding"
                className="shrink-0 bg-white text-[#004ac6] px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                {tp('jobsCreateProfile')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ FILTERS PANEL (below hero) ═══════════ */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-2 mb-4">
          <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-2xl p-4 md:p-5 space-y-4 shadow-lg">
            {/* Row 1: Selects */}
            <div className="flex flex-wrap gap-3">
              <select
                value={governorate}
                onChange={(e) => updateParam('governorate', e.target.value)}
                className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/40 min-w-[150px]"
              >
                <option value="">{tp('allGovernorates')}</option>
                {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/40 min-w-[130px]"
              >
                <option value="">{tp('sortLabel')}</option>
                {sortOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                  {tp('clearAll')}
                </button>
              )}
            </div>

            {/* Row 2: Employment Type */}
            <div>
              <p className="text-[11px] text-on-surface-variant font-bold mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">work</span>
                {tp('jobsEmploymentType')}
              </p>
              <div className="flex flex-wrap gap-2">
                {empOpts.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateParam('employmentType', employmentType === o.value ? '' : o.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                      employmentType === o.value
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low dark:bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: License Type */}
            <div>
              <p className="text-[11px] text-on-surface-variant font-bold mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">card_membership</span>
                {tp('jobsLicenseType')}
              </p>
              <div className="flex flex-wrap gap-2">
                {licenseOpts.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateParam('licenseType', licenseType === o.value ? '' : o.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                      licenseType === o.value
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low dark:bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">{o.icon}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RESULTS ═══════════ */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-container-low dark:bg-surface-container rounded-2xl h-56" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-400">error</span>
            </div>
            <p className="text-lg font-black text-on-surface mb-2">{tp('jobsLoadError')}</p>
            <p className="text-sm text-on-surface-variant mb-6">{tp('tryAgain')}</p>
            <button onClick={() => refetch()} className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-black hover:brightness-110 transition-all">{tp('retryBtn')}</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-primary/40">work_off</span>
            </div>
            <p className="text-xl font-black text-on-surface mb-2">{tp('jobsNoJobs')}</p>
            <p className="text-on-surface-variant text-sm mb-6">{tp('jobsNoJobsSub')}</p>
            <button onClick={() => requireProfile('employer', () => router.push('/jobs/new'))} className="inline-flex items-center gap-1.5 btn-primary px-6 py-2.5 rounded-xl text-sm font-black hover:brightness-110 transition-all shadow-lg">
              <span className="material-symbols-outlined text-base">add</span>
              {tp('jobsAddJob')}
            </button>
          </div>
        ) : (
          <>
            {/* Results count + active filters */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-on-surface-variant font-bold">
                <span className="text-on-surface font-black">{meta?.total ?? 0}</span> {tp('jobsCount')}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  {tp('clearFilters')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {items.map((job) => (
                <UnifiedCard key={job.id} item={transformJob(job)} className="h-full" />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (() => {
              const current = Number(page);
              const total = meta.totalPages;
              const goTo = (p: number) => { const sp = new URLSearchParams(searchParams); sp.set('page', String(p)); router.push(`/jobs?${sp.toString()}`); };
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
          </>
        )}
      </main>

      {/* Recommended Section */}
      <RecommendedJobsSection />

      <Footer />
    </>
  );
}

function RecommendedJobsSection() {
  const locale = useLocale();
  const { user } = useAuth();
  const { data: jobs, isLoading } = useRecommendedJobs();

  if (!user || isLoading || !jobs || jobs.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">recommend</span>
        <h2 className="text-xl font-extrabold">وظائف مقترحة لك</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {jobs.slice(0, 6).map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}
            className="block p-4 bg-surface-container-lowest border border-primary/10 rounded-xl hover:shadow-md transition">
            <p className="font-bold text-sm mb-1">{job.title}</p>
            <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">{job.description}</p>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {resolveLocationLabel(job.governorate, locale) || job.governorate}
              {job.salary && (
                <>
                  <span>·</span>
                  <span className="text-primary font-bold">{job.salary} ر.ع.</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
