'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useJobs, useRecommendedJobs, useCreateConversation, useApplyToJob, useMyApplications } from '@/lib/api';
import { useRequireJobProfile } from '@/hooks/use-require-job-profile';
import { useAuth } from '@/providers/auth-provider';
import { getGovernorates, getCities, resolveLocationLabel } from '@/lib/location-data';
import { employmentOptionsT, employmentLabelsT } from '@/lib/constants/jobs';
import { getImageUrl } from '@/lib/image-utils';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { clsx } from 'clsx';
import type { JobItem } from '@/lib/api/jobs';

/* ═══════════════════════════════════
   CONSTANTS
═══════════════════════════════════ */

const LICENSE_OPTS = [
  { value: 'LIGHT',      icon: 'directions_car',  labelKey: 'jobsLicenseLight'      },
  { value: 'HEAVY',      icon: 'local_shipping',   labelKey: 'jobsLicenseHeavy'      },
  { value: 'TRANSPORT',  icon: 'fire_truck',       labelKey: 'jobsLicenseTransport'  },
  { value: 'BUS',        icon: 'directions_bus',   labelKey: 'jobsLicenseBus'        },
  { value: 'MOTORCYCLE', icon: 'two_wheeler',      labelKey: 'jobsLicenseMotorcycle' },
] as const;

const SORT_OPTS = [
  { value: 'createdAt_desc', labelKey: 'sortNewest'    },
  { value: 'createdAt_asc',  labelKey: 'sortOldest'    },
  { value: 'salary_desc',    labelKey: 'sortSalaryHigh'},
  { value: 'salary_asc',     labelKey: 'sortSalaryLow' },
] as const;

const JOB_TYPE_TABS = [
  { value: '',         icon: 'grid_view',    labelKey: 'all'            },
  { value: 'OFFERING', icon: 'person_search', labelKey: 'jobsTabOffering'},
  { value: 'HIRING',   icon: 'person_add',   labelKey: 'jobsTabHiring'  },
] as const;

const SALARY_PERIOD_KEYS: Record<string, string> = {
  DAILY:      'jobDetailPerDay',
  MONTHLY:    'jobDetailPerMonth',
  YEARLY:     'jobDetailPerYear',
  NEGOTIABLE: 'jobDetailNegotiable',
};

/* ═══════════════════════════════════
   JOB CARD
═══════════════════════════════════ */

function JobCard({ job }: { job: JobItem }) {
  const { user }           = useAuth();
  const { requireProfile } = useRequireJobProfile();
  const { addToast }       = useToast();
  const router             = useRouter();
  const locale             = useLocale();
  const tp                 = useTranslations('pages');
  const tm                 = useTranslations('mappings');
  const createConv         = useCreateConversation();
  const applyMutation      = useApplyToJob();

  const { data: myApplications } = useMyApplications();
  const myApplication = myApplications?.find(a => a.jobId === job.id) ?? null;

  const isOwner  = !!(user && job.user.id === user.id);
  const isHiring = job.jobType === 'HIRING';
  const isActive = job.status === 'ACTIVE';

  async function handleApply() {
    requireProfile('driver', async () => {
      try {
        await applyMutation.mutateAsync({ jobId: job.id });
        addToast('success', tp('jobDetailApplySuccess'));
      } catch (err: any) {
        addToast('error', err?.message || tp('jobDetailApplyFail'));
      }
    });
  }

  async function handleChat() {
    requireProfile('any', async () => {
      try {
        const conv = await createConv.mutateAsync({ entityType: 'JOB', entityId: job.id });
        router.push(`/messages/${conv.id}`);
      } catch (err: any) {
        addToast('error', err?.message || tp('jobDetailErrorConversation'));
      }
    });
  }

  return (
    <article className="bg-surface-container-lowest dark:bg-surface-container
                        border border-outline-variant/10 rounded-2xl shadow-sm
                        hover:shadow-lg hover:shadow-black/[0.06]
                        hover:border-outline-variant/20 transition-all group">
      <div className="p-4 md:p-5">

        {/* ── Row 1: Avatar + Title + Badge ── */}
        <div className="flex items-start gap-3 mb-3">

          {/* Employer avatar */}
          <div className="relative flex-shrink-0">
            <div className={clsx(
              'w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center',
              'text-white font-black text-lg shadow-sm ring-2 ring-outline-variant/10',
              isHiring
                ? 'bg-gradient-to-br from-[#004ac6] to-[#0B2447]'
                : 'bg-gradient-to-br from-violet-500 to-violet-700'
            )}>
              {job.user.avatarUrl ? (
                <Image
                  src={getImageUrl(job.user.avatarUrl) ?? ''}
                  alt={job.user.displayName || job.user.username}
                  width={48} height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-lg font-black">
                  {(job.user.displayName || job.user.username || '?')[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Verified badge */}
            {job.user.isVerified && (
              <div className="absolute -bottom-0.5 -end-0.5
                             bg-primary text-white rounded-full
                             w-5 h-5 flex items-center justify-center shadow-sm
                             ring-2 ring-surface-container-lowest">
                <span className="material-symbols-outlined text-[6px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
            )}
          </div>

          {/* Title + employer */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/jobs/${job.slug || job.id}`}
              className="font-bold text-on-surface text-[14px] leading-snug
                         line-clamp-2 group-hover:text-primary transition-colors"
            >
              {job.title}
            </Link>
            <p className="text-[11px] text-on-surface-variant/70 mt-0.5 truncate">
              {job.user.displayName || job.user.username}
            </p>
          </div>

          {/* Job type badge */}
          <span className={clsx(
            'flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border',
            isHiring
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-violet-500/10 text-violet-600 border-violet-200'
          )}>
            {isHiring ? tp('jobsTabHiring') : tp('jobsTabOffering')}
          </span>
        </div>

        {/* ── Row 2: Meta chips ── */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/70
                          bg-surface-container-low border border-outline-variant/[0.08]
                          px-2 py-0.5 rounded-lg">
            <span className="material-symbols-outlined text-[6px]">location_on</span>
            {resolveLocationLabel(job.governorate, locale) || job.governorate}
          </span>

          <span className="text-[10px] font-medium text-on-surface-variant/70
                          bg-surface-container-low border border-outline-variant/[0.08]
                          px-2 py-0.5 rounded-lg">
            {employmentLabelsT(tm)[job.employmentType] ?? job.employmentType}
          </span>

          {job.licenseTypes?.slice(0, 2).map(lt => {
            const opt = LICENSE_OPTS.find(o => o.value === lt);
            return (
              <span key={lt}
                className="flex items-center gap-0.5 text-[9px] font-bold
                          bg-primary/8 text-primary border border-primary/15
                          px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[5px]">
                  {opt?.icon ?? 'badge'}
                </span>
                {opt ? tp(opt.labelKey as any) : lt}
              </span>
            );
          })}
        </div>

        {/* ── Row 3: Salary + Stats ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {job.salary ? (
              <div className="flex items-baseline gap-1">
                <span className="font-black text-primary text-[17px] leading-none">
                  {Number(job.salary).toLocaleString('ar-OM')}
                </span>
                <span className="text-[10px] text-primary/60">{job.currency || 'OMR'}</span>
                {job.salaryPeriod && job.salaryPeriod !== 'NEGOTIABLE' && (
                  <span className="text-[10px] text-on-surface-variant/50">
                    / {tp(SALARY_PERIOD_KEYS[job.salaryPeriod] as any)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[12px] font-bold text-on-surface-variant/60">
                {tp('jobDetailNegotiable')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[7px] text-on-surface-variant/40">
            {job._count?.applications != null && (
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[4px]">group</span>
                {job._count.applications}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[4px]">visibility</span>
              {job.viewCount.toLocaleString('ar-OM')}
            </span>
          </div>
        </div>

        {/* ── Row 4: Actions (role-aware) ── */}
        <div className="border-t border-outline-variant/[0.06] pt-3 flex gap-2">

          {/* OWNER */}
          {isOwner && (
            <Link href={`/jobs/${job.slug || job.id}`}
              className="flex-1 flex items-center justify-center gap-1.5
                         px-3 py-1.5 rounded-lg
                         bg-primary/8 border border-primary/20 text-primary
                         text-[12px] font-semibold
                         hover:bg-primary/12 transition-all">
              <span className="material-symbols-outlined text-[7px]">people</span>
              {tp('myJobsApplications')} ({job._count?.applications ?? 0})
            </Link>
          )}

          {/* DRIVER — already applied */}
          {!isOwner && myApplication && (
            <div className={clsx(
              'flex-1 flex items-center justify-center gap-1.5',
              'px-3 py-1.5 rounded-lg border text-[12px] font-semibold',
              myApplication.status === 'ACCEPTED'
                ? 'bg-green-50 border-green-200 text-green-700'
                : myApplication.status === 'REJECTED'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            )}>
              <span className="material-symbols-outlined text-[8px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {myApplication.status === 'ACCEPTED' ? 'check_circle'
                  : myApplication.status === 'REJECTED' ? 'cancel'
                  : 'schedule'}
              </span>
              {myApplication.status === 'ACCEPTED' ? tp('jobDetailAppAccepted')
                : myApplication.status === 'REJECTED' ? tp('jobDetailAppRejected')
                : tp('jobDetailAppPending')}
            </div>
          )}

          {/* DRIVER — not applied yet + active */}
          {!isOwner && !myApplication && user && isActive && (
            <button onClick={handleApply} disabled={applyMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5
                         px-3 py-1.5 rounded-lg
                         bg-primary text-on-primary
                         text-[12px] font-semibold
                         hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50">
              {applyMutation.isPending
                ? <div className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[8px]">assignment</span>
              }
              {tp('jobDetailApply')}
            </button>
          )}

          {/* VISITOR — not logged in */}
          {!isOwner && !user && (
            <Link href={`/jobs/${job.slug || job.id}`}
              className="flex-1 flex items-center justify-center gap-1.5
                         px-3 py-1.5 rounded-lg
                         bg-primary text-on-primary
                         text-[12px] font-semibold
                         hover:brightness-105 transition-all">
              <span className="material-symbols-outlined text-[7px]">open_in_new</span>
              {tp('jobsViewDetails')}
            </Link>
          )}

          {/* Closed / Expired */}
          {!isOwner && user && !myApplication && !isActive && (
            <div className="flex-1 flex items-center justify-center gap-1.5
                           px-3 py-1.5 rounded-lg
                           bg-surface-container-high border border-outline-variant/15
                           text-on-surface-variant/50 text-[12px] font-medium">
              <span className="material-symbols-outlined text-[8px]">block</span>
              {job.status === 'CLOSED' ? tp('jobDetailClosedAd') : tp('jobDetailExpired')}
            </div>
          )}

          {/* Chat — everyone except owner */}
          {!isOwner && (
            <button onClick={handleChat} disabled={createConv.isPending}
              className="flex-1 flex items-center justify-center gap-1.5
                         px-3 py-1.5 rounded-lg
                         border border-outline-variant/15 text-on-surface-variant
                         text-[12px] font-semibold
                         hover:text-primary hover:border-primary/20 hover:bg-primary/5
                         transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-[7px]">chat</span>
              {tp('jobDetailChat')}
            </button>
          )}

        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════
   FILTER SIDEBAR CONTENT
═══════════════════════════════════ */

function FilterContent({
  governorate, city, employmentType, licenseType, sortBy,
  onUpdate, onClear, activeCount,
}: {
  governorate: string; city: string; employmentType: string;
  licenseType: string; sortBy: string;
  onUpdate: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}) {
  const tp     = useTranslations('pages');
  const tm     = useTranslations('mappings');
  const locale = useLocale();
  const govs   = getGovernorates('OM', locale);
  const empOpts = employmentOptionsT(tm);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface text-sm">
          {tp('filters')}
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear}
            className="text-[11px] text-red-500 hover:text-red-600 font-bold transition-colors">
            {tp('clearAll')}
          </button>
        )}
      </div>

      {/* Selects — 2 per row */}
      <div className="grid grid-cols-2 gap-2">

        {/* Sort */}
        <div>
          <p className="text-[11px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">
            {tp('sortLabel')}
          </p>
          <select value={sortBy} onChange={e => onUpdate('sortBy', e.target.value)}
            className="w-full bg-surface-container-low dark:bg-surface-container
                       border border-outline-variant/15 rounded-xl px-2 py-2
                       text-[11px] text-on-surface outline-none
                       focus:border-primary/40 transition-colors">
            <option value="">{tp('sortNewest')}</option>
            {SORT_OPTS.map(o => (
              <option key={o.value} value={o.value}>{tp(o.labelKey as any)}</option>
            ))}
          </select>
        </div>

        {/* Governorate */}
        <div>
          <p className="text-[11px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">
            {tp('allGovernorates')}
          </p>
          <select value={governorate} onChange={e => { onUpdate('governorate', e.target.value); onUpdate('city', ''); }}
            className="w-full bg-surface-container-low dark:bg-surface-container
                       border border-outline-variant/15 rounded-xl px-2 py-2
                       text-[11px] text-on-surface outline-none
                       focus:border-primary/40 transition-colors">
            <option value="">الكل</option>
            {govs.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        {/* City / Wilaya */}
        <div className="col-span-2">
          <p className="text-[11px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">
            الولاية
          </p>
          <select value={city} onChange={e => onUpdate('city', e.target.value)}
            className="w-full bg-surface-container-low dark:bg-surface-container
                       border border-outline-variant/15 rounded-xl px-2 py-2
                       text-[11px] text-on-surface outline-none
                       focus:border-primary/40 transition-colors">
            <option value="">كل الولايات</option>
            {governorate
              ? getCities('OM', governorate, locale).map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))
              : govs.map(g => (
                  <optgroup key={g.value} label={g.label}>
                    {getCities('OM', g.value, locale).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                ))
            }
          </select>
        </div>

      </div>

      {/* Employment Type */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">
          {tp('jobsEmploymentType')}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {empOpts.map(o => (
            <button key={o.value}
              onClick={() => onUpdate('employmentType', employmentType === o.value ? '' : o.value)}
              className={clsx(
                'flex items-center justify-center w-full px-2 py-1.5 rounded-xl text-[11px]',
                'font-medium transition-all text-center',
                employmentType === o.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/8 hover:text-primary'
              )}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* License Type */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-1.5 uppercase tracking-wide">
          {tp('jobsLicenseType')}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {LICENSE_OPTS.map(o => (
            <button key={o.value}
              onClick={() => onUpdate('licenseType', licenseType === o.value ? '' : o.value)}
              className={clsx(
                'flex items-center justify-center w-full px-2 py-1.5 rounded-xl text-[11px]',
                'font-medium transition-all text-center',
                licenseType === o.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/8 hover:text-primary'
              )}>
              {tp(o.labelKey as any)}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════
   MOBILE FILTER BOTTOM SHEET
═══════════════════════════════════ */

function MobileFilterSheet({
  open, onClose,
  governorate, city, employmentType, licenseType, sortBy,
  onUpdate, onClear, activeCount, totalResults,
}: {
  open: boolean; onClose: () => void;
  governorate: string; city: string; employmentType: string;
  licenseType: string; sortBy: string;
  onUpdate: (k: string, v: string) => void;
  onClear: () => void;
  activeCount: number;
  totalResults: number;
}) {
  const tp = useTranslations('pages');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-3xl
                     max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant/30 rounded-full" />
        </div>
        <div className="sticky top-0 bg-surface-container-lowest
                       flex items-center justify-between px-4 py-3
                       border-b border-outline-variant/[0.08] z-10">
          <span className="font-bold text-on-surface">{tp('filters')}</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-container-low
                      flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[8px]">close</span>
          </button>
        </div>
        <div className="px-4 py-5">
          <FilterContent
            governorate={governorate} city={city} employmentType={employmentType}
            licenseType={licenseType} sortBy={sortBy}
            onUpdate={onUpdate} onClear={onClear} activeCount={activeCount}
          />
        </div>
        <div className="sticky bottom-0 bg-surface-container-lowest
                       border-t border-outline-variant/[0.08] px-4 py-4">
          <button onClick={onClose}
            className="w-full h-12 rounded-2xl bg-primary text-on-primary
                      font-bold text-[14px] shadow-md shadow-primary/20
                      hover:brightness-105 transition-all">
            {tp('rentalsSearchBtn')} ({totalResults})
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   RECOMMENDED SECTION
═══════════════════════════════════ */

function RecommendedSection() {
  const { user }  = useAuth();
  const tp        = useTranslations('pages');
  const { data: jobs, isLoading } = useRecommendedJobs();

  if (!user || isLoading || !jobs || jobs.length === 0) return null;

  return (
    <section className="mt-8 pt-8 border-t border-outline-variant/[0.08]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}>recommend</span>
        <h2 className="text-[16px] font-bold text-on-surface">
          {tp('jobsRecommended')}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {jobs.slice(0, 3).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════
   MAIN PAGE
═══════════════════════════════════ */

export default function JobsPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="min-h-[300px] md:min-h-[380px]
                       bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex gap-6 items-start">
            <div className="hidden md:block w-72 shrink-0">
              <div className="animate-pulse bg-surface-container-low rounded-2xl h-96" />
            </div>
            <div className="flex-1 grid grid-cols-1 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container-low rounded-2xl h-40" />
              ))}
            </div>
          </div>
        </div>
      </>
    }>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const tp  = useTranslations('pages');
  const { profile, requireProfile } = useRequireJobProfile();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const page           = searchParams.get('page') || '1';
  const search         = searchParams.get('search') || '';
  const jobType        = searchParams.get('jobType') || '';
  const employmentType = searchParams.get('employmentType') || '';
  const governorate    = searchParams.get('governorate') || '';
  const city           = searchParams.get('city') || '';
  const licenseType    = searchParams.get('licenseType') || '';
  const sortBy         = searchParams.get('sortBy') || '';

  const [searchInput, setSearchInput]         = useState(search);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = [employmentType, licenseType, governorate, city, sortBy].filter(Boolean).length;

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
    setSearchInput('');
    router.push('/jobs');
  }

  const params = useMemo(() => {
    const p: Record<string, string> = { page, limit: '10' };
    if (search)         p.search         = search;
    if (jobType)        p.jobType        = jobType;
    if (employmentType) p.employmentType = employmentType;
    if (governorate)    p.governorate    = governorate;
    if (city)           p.city           = city;
    if (licenseType)    p.licenseType    = licenseType;
    if (sortBy) {
      const [field, order] = sortBy.split('_');
      if (field) p.sortBy    = field;
      if (order) p.sortOrder = order;
    }
    return p;
  }, [page, search, jobType, employmentType, governorate, city, licenseType, sortBy]);

  const { data, isLoading, isError, refetch } = useJobs(params);
  const items = data?.items ?? [];
  const meta  = data?.meta;

  function goTo(p: number) {
    const sp = new URLSearchParams(searchParams);
    sp.set('page', String(p));
    router.push(`/jobs?${sp.toString()}`);
  }

  return (
    <>
      <Navbar />

      {/* ════════════════════════════════
          HERO SECTION
      ════════════════════════════════ */}
      <section>

        {/* Search bar — above banner */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 bg-surface-container-lowest dark:bg-surface-container
                           rounded-full border border-outline-variant/20 ps-3 pe-1.5 py-1 shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant/50 text-[18px] shrink-0">search</span>
              <input
                type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={tp('jobsSearch')}
                className="flex-1 h-8 sm:h-9 bg-transparent text-xs sm:text-sm text-on-surface
                          placeholder:text-on-surface-variant/50 focus:outline-none min-w-0"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')}
                  className="text-on-surface-variant/40 hover:text-on-surface-variant">
                  <span className="material-symbols-outlined text-[8px]">close</span>
                </button>
              )}
              {/* Mobile filter trigger */}
              <button onClick={() => setShowMobileFilters(true)}
                className={clsx(
                  'md:hidden shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all relative',
                  activeFilterCount > 0
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                )}>
                <span className="material-symbols-outlined text-[8px]">tune</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[9px]
                                 font-black rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button onClick={handleSearch}
                className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-full
                          flex items-center justify-center hover:brightness-110
                          active:scale-95 transition-all">
                <span className="material-symbols-outlined text-on-primary text-[8px] sm:text-[9px]">search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Banner Image */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-3">
          <div className="relative w-full overflow-hidden
                         aspect-[16/9] sm:aspect-[16/5] lg:aspect-[16/5.5]
                         rounded-2xl sm:rounded-3xl">
            <Image
              src="/images/categories/jobs.webp"
              alt="وظائف السائقين — سوق وان"
              fill priority
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2447] via-[#0B2447]/60 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center
                           text-center px-4 sm:px-8 lg:px-12 text-white">

              {/* Count badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5
                             rounded-full bg-white/15 backdrop-blur-sm border border-white/10
                             text-white/80 text-[10px] sm:text-xs font-medium mb-2 sm:mb-3">
                <span className="material-symbols-outlined text-[7px] sm:text-[8px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>
                  {meta?.total
                    ? `${meta.total.toLocaleString('ar-EG')} ${tp('jobsCount')}`
                    : tp('jobsTitle')
                  }
                </span>
              </div>

              <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black
                            leading-tight mb-1 sm:mb-2 lg:mb-3">
                {tp('jobsTitle')}
              </h1>
              <p className="text-[11px] sm:text-sm md:text-base text-white/80
                           leading-snug mb-2 sm:mb-3 lg:mb-5 max-w-md">
                {tp('jobsSubtitle')}
              </p>

              {/* Job type tabs */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 lg:mb-5
                             flex-wrap">
                {JOB_TYPE_TABS.map(tab => (
                  <button key={tab.value}
                    onClick={() => updateParam('jobType', tab.value)}
                    className={clsx(
                      'flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 lg:px-4',
                      'py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl',
                      'whitespace-nowrap transition-all border',
                      jobType === tab.value
                        ? 'bg-white text-primary border-white shadow-sm'
                        : 'bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur-sm'
                    )}>
                    <span className="material-symbols-outlined text-[6px] sm:text-[7px]">{tab.icon}</span>
                    {tp(tab.labelKey as any)}
                  </button>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => updateParam('jobType', '')}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5
                            bg-primary text-on-primary
                            px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3
                            text-[10px] sm:text-sm lg:text-base font-black
                            rounded-lg sm:rounded-xl hover:brightness-110 transition-all shadow-lg">
                  <span className="material-symbols-outlined text-[7px] sm:text-[9px]">work</span>
                  {tp('jobsBrowseAll')}
                </button>
                <button
                  onClick={() => requireProfile('employer', () => router.push('/jobs/new'))}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5
                            px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2.5 lg:py-3
                            text-[10px] sm:text-sm lg:text-base font-bold
                            rounded-lg sm:rounded-xl border border-white/30
                            text-white hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-[7px] sm:text-[9px]">add</span>
                  {tp('jobsAddJob')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          ONBOARDING CTA
      ════════════════════════════════ */}
      {!profile.isLoading && !profile.hasAny && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-l from-[#004ac6]/90 via-[#1a3a8f]/80 to-[#0B2447]/90" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
              <div className="flex gap-3 shrink-0">
                {['local_shipping', 'business'].map(icon => (
                  <div key={icon} className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm
                                            flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-white text-[12px]">{icon}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 text-center sm:text-start">
                <h3 className="text-base sm:text-lg font-black text-white mb-0.5">
                  {tp('jobsOnboardingTitle')}
                </h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  {tp('jobsOnboardingDesc')}
                </p>
              </div>
              <Link href="/jobs/onboarding"
                className="shrink-0 bg-white text-[#004ac6] px-5 py-2.5 rounded-xl
                          font-black text-sm shadow-lg hover:shadow-xl
                          hover:scale-[1.02] active:scale-[0.98] transition-all
                          flex items-center gap-2">
                <span className="material-symbols-outlined text-[8px]">person_add</span>
                {tp('jobsCreateProfile')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          MAIN LAYOUT — SIDEBAR + RESULTS
      ════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex gap-6 items-start">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden md:block w-72 shrink-0 sticky top-20">
            <div className="bg-surface-container-lowest dark:bg-surface-container
                           border border-outline-variant/10 rounded-2xl p-5 shadow-sm">
              <FilterContent
                governorate={governorate}
                city={city}
                employmentType={employmentType}
                licenseType={licenseType}
                sortBy={sortBy}
                onUpdate={updateParam}
                onClear={clearFilters}
                activeCount={activeFilterCount}
              />
            </div>
          </aside>

          {/* ── RESULTS ── */}
          <main className="flex-1 min-w-0">

            {/* Results count bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-on-surface-variant">
                <span className="font-black text-on-surface">{meta?.total ?? 0}</span>{' '}
                {tp('jobsCount')}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="text-xs text-primary hover:text-primary/80 font-bold
                            flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[7px]">filter_alt_off</span>
                  {tp('clearFilters')}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-surface-container-low
                                         dark:bg-surface-container rounded-2xl h-44" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-red-400">error</span>
                </div>
                <p className="text-lg font-black text-on-surface mb-2">{tp('jobsLoadError')}</p>
                <button onClick={() => refetch()}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-xl
                            text-sm font-black hover:brightness-110 transition-all">
                  {tp('retryBtn')}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-primary/40">work_off</span>
                </div>
                <p className="text-xl font-black text-on-surface mb-2">{tp('jobsNoJobs')}</p>
                <p className="text-on-surface-variant text-sm mb-6">{tp('jobsNoJobsSub')}</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters}
                    className="text-primary font-bold underline underline-offset-2 text-sm">
                    {tp('clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3">
                  {items.map(job => <JobCard key={job.id} job={job} />)}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (() => {
                  const current = Number(page);
                  const total   = meta.totalPages;
                  const pages: (number | '...')[] = [1];
                  if (current > 3) pages.push('...');
                  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
                  if (current < total - 2) pages.push('...');
                  if (total > 1) pages.push(total);

                  return (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <button onClick={() => goTo(Math.max(1, current - 1))} disabled={current <= 1}
                        className="w-10 h-10 border border-outline-variant/10 rounded-xl
                                  flex items-center justify-center hover:bg-surface-container
                                  transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                      {pages.map((p, i) =>
                        p === '...' ? (
                          <span key={`e${i}`} className="w-8 text-center text-on-surface-variant/50 text-sm">...</span>
                        ) : (
                          <button key={p} onClick={() => goTo(p as number)}
                            className={clsx(
                              'w-10 h-10 rounded-xl text-sm font-black transition-all',
                              p === current
                                ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                                : 'border border-outline-variant/10 text-on-surface hover:bg-surface-container'
                            )}>
                            {p}
                          </button>
                        )
                      )}
                      <button onClick={() => goTo(Math.min(total, current + 1))} disabled={current >= total}
                        className="w-10 h-10 border border-outline-variant/10 rounded-xl
                                  flex items-center justify-center hover:bg-surface-container
                                  transition-all disabled:opacity-30">
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                    </div>
                  );
                })()}

                <RecommendedSection />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        governorate={governorate}
        city={city}
        employmentType={employmentType}
        licenseType={licenseType}
        sortBy={sortBy}
        onUpdate={updateParam}
        onClear={clearFilters}
        activeCount={activeFilterCount}
        totalResults={meta?.total ?? 0}
      />

      <Footer />
    </>
  );
}
