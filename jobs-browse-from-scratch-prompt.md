# Agent Prompt — Jobs Browse Page (From Scratch)
# `apps/web/src/app/[locale]/jobs/page.tsx`

---

## Context

SouqOne — Omani marketplace. اكتب `/jobs/page.tsx` من الصفر.
الملف الحالي يُحذف ويُستبدل بالكامل.

**المرجع الأساسي للـ style:**
```
apps/web/src/app/[locale]/jobs/my/page.tsx
apps/web/src/app/[locale]/jobs/drivers/page.tsx
apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx
```

اقرأ الملفات دي الأول لتفهم الـ patterns المستخدمة.

---

## اقرأ هذه الملفات أولاً

```
apps/web/src/app/[locale]/jobs/my/page.tsx
apps/web/src/app/[locale]/jobs/drivers/page.tsx
apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx
apps/web/src/lib/api/jobs.ts
apps/web/src/hooks/use-require-job-profile.ts
apps/web/src/lib/location-data.ts
apps/web/src/lib/constants/jobs.ts
apps/web/src/lib/image-utils.ts
apps/web/src/messages/ar.json      ← لتعرف الـ keys الموجودة
```

---

## الـ Layout — صورة كاملة

```
┌─────────────────────────────────────────────────────┐
│                    HERO SECTION                     │
│  gradient + search box + tabs + stats               │
│  Mobile: 320px height / Desktop: 380px height       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [Onboarding CTA — لو مفيش profile]                 │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────┐
│   SIDEBAR    │           RESULTS                    │
│   w-72       │           flex-1                     │
│              │                                      │
│  • نوع الإعلان│  ┌──────────────────────────────┐  │
│  • نوع التوظيف│  │      JOB CARD                │  │
│  • المحافظة  │  │  [avatar] title    [badge]   │  │
│  • الرخصة    │  │  employer · verified ✓        │  │
│  • الراتب    │  │  📍 location  💼 emp_type      │  │
│  • ترتيب     │  │  🪪 license chips              │  │
│              │  │  ──────────────────────────   │  │
│  [مسح الكل]  │  │  salary    views · applicants  │  │
│              │  │  ──────────────────────────   │  │
│              │  │  [Apply] / [Status] / [Chat]   │  │
│              │  └──────────────────────────────┘  │
│              │                                      │
│              │  PAGINATION                          │
└──────────────┴──────────────────────────────────────┘

Mobile: Sidebar → Bottom Sheet (يطلع من تحت)
```

---

## Hero Section — Dimensions

```
Mobile:   min-h-[300px]  pt-16 pb-8
Desktop:  min-h-[380px]  pt-28 pb-12

نفس الـ gradient:
bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]

نفس الـ pattern:
opacity-[0.07] checkerboard SVG

نفس الـ decorative blurs من job-detail-client.tsx
```

---

## ملف واحد — `apps/web/src/app/[locale]/jobs/page.tsx`

```tsx
'use client';

import { Suspense, useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useJobs, useRecommendedJobs, useCreateConversation,
         useApplyToJob, useMyApplications } from '@/lib/api';
import { useRequireJobProfile } from '@/hooks/use-require-job-profile';
import { useAuth } from '@/providers/auth-provider';
import { getGovernorates, resolveLocationLabel } from '@/lib/location-data';
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

  // Derive: has this user already applied?
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

          {/* Employer avatar — صورة البروفايل داخل الدائرة */}
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
                <span className="material-symbols-outlined text-[11px]"
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
            <span className="material-symbols-outlined text-[11px]">location_on</span>
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
                <span className="material-symbols-outlined text-[10px]">
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

          <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/40">
            {job._count?.applications != null && (
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">group</span>
                {job._count.applications}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">visibility</span>
              {job.viewCount.toLocaleString('ar-OM')}
            </span>
          </div>
        </div>

        {/* ── Row 4: Actions (role-aware) ── */}
        <div className="border-t border-outline-variant/[0.06] pt-3 flex gap-2">

          {/* OWNER */}
          {isOwner && (
            <Link href={`/jobs/${job.slug || job.id}`}
              className="flex-1 h-9 rounded-xl bg-primary/8 border border-primary/20
                         text-primary text-[11px] font-bold
                         flex items-center justify-center gap-1.5
                         hover:bg-primary/12 transition-all">
              <span className="material-symbols-outlined text-base">people</span>
              {tp('myJobsApplications')} ({job._count?.applications ?? 0})
            </Link>
          )}

          {/* DRIVER — already applied */}
          {!isOwner && myApplication && (
            <div className={clsx(
              'flex-1 h-9 rounded-xl border text-[11px] font-bold',
              'flex items-center justify-center gap-1.5',
              myApplication.status === 'ACCEPTED'
                ? 'bg-green-50 border-green-200 text-green-700'
                : myApplication.status === 'REJECTED'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            )}>
              <span className="material-symbols-outlined text-base"
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
              className="flex-1 h-9 rounded-xl bg-primary text-on-primary
                         text-[11px] font-bold flex items-center justify-center gap-1.5
                         shadow-sm shadow-primary/20 hover:brightness-105
                         active:scale-[0.98] transition-all disabled:opacity-50">
              {applyMutation.isPending
                ? <div className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-base">assignment</span>
              }
              {tp('jobDetailApply')}
            </button>
          )}

          {/* VISITOR — not logged in */}
          {!isOwner && !user && (
            <Link href={`/jobs/${job.slug || job.id}`}
              className="flex-1 h-9 rounded-xl bg-primary text-on-primary
                         text-[11px] font-bold flex items-center justify-center gap-1.5
                         shadow-sm shadow-primary/20 hover:brightness-105 transition-all">
              <span className="material-symbols-outlined text-base">open_in_new</span>
              {tp('jobDetailBreadcrumb')}
            </Link>
          )}

          {/* Closed/Expired */}
          {!isOwner && !isActive && (
            <div className="flex-1 h-9 rounded-xl bg-surface-container-high
                           border border-outline-variant/15
                           flex items-center justify-center gap-1.5
                           text-on-surface-variant/50 text-[11px] font-medium">
              <span className="material-symbols-outlined text-base">block</span>
              {job.status === 'CLOSED' ? tp('jobDetailClosedAd') : tp('jobDetailExpired')}
            </div>
          )}

          {/* Chat — everyone except owner */}
          {!isOwner && (
            <button onClick={handleChat} disabled={createConv.isPending}
              aria-label={tp('jobDetailChat')}
              className="w-9 h-9 flex-shrink-0 rounded-xl border border-outline-variant/15
                         text-on-surface-variant flex items-center justify-center
                         hover:text-primary hover:border-primary/20 hover:bg-primary/5
                         transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-base">chat</span>
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
  governorate, employmentType, licenseType, sortBy,
  onUpdate, onClear, activeCount,
}: {
  governorate: string; employmentType: string;
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-on-surface text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          {tp('filters')}
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear}
            className="text-[11px] text-red-500 hover:text-red-600 font-bold
                      flex items-center gap-0.5 transition-colors">
            <span className="material-symbols-outlined text-xs">close</span>
            {tp('clearAll')}
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-2 uppercase tracking-wide">
          {tp('sortLabel')}
        </p>
        <select value={sortBy} onChange={e => onUpdate('sortBy', e.target.value)}
          className="w-full bg-surface-container-low dark:bg-surface-container
                     border border-outline-variant/15 rounded-xl px-3 py-2.5
                     text-[12px] text-on-surface outline-none
                     focus:border-primary/40 transition-colors">
          <option value="">{tp('sortNewest')}</option>
          {SORT_OPTS.map(o => (
            <option key={o.value} value={o.value}>{tp(o.labelKey as any)}</option>
          ))}
        </select>
      </div>

      {/* Governorate */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-2 uppercase tracking-wide">
          {tp('allGovernorates')}
        </p>
        <select value={governorate} onChange={e => onUpdate('governorate', e.target.value)}
          className="w-full bg-surface-container-low dark:bg-surface-container
                     border border-outline-variant/15 rounded-xl px-3 py-2.5
                     text-[12px] text-on-surface outline-none
                     focus:border-primary/40 transition-colors">
          <option value="">{tp('allGovernorates')}</option>
          {govs.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>

      {/* Employment Type */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-2 uppercase tracking-wide flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">work</span>
          {tp('jobsEmploymentType')}
        </p>
        <div className="flex flex-col gap-1.5">
          {empOpts.map(o => (
            <button key={o.value}
              onClick={() => onUpdate('employmentType', employmentType === o.value ? '' : o.value)}
              className={clsx(
                'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[12px]',
                'font-medium transition-all text-start',
                employmentType === o.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/8 hover:text-primary'
              )}>
              <div className={clsx(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                employmentType === o.value ? 'border-on-primary' : 'border-outline-variant/40'
              )}>
                {employmentType === o.value && (
                  <div className="w-2 h-2 rounded-full bg-on-primary" />
                )}
              </div>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* License Type */}
      <div>
        <p className="text-[11px] text-on-surface-variant font-bold mb-2 uppercase tracking-wide flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">card_membership</span>
          {tp('jobsLicenseType')}
        </p>
        <div className="flex flex-col gap-1.5">
          {LICENSE_OPTS.map(o => (
            <button key={o.value}
              onClick={() => onUpdate('licenseType', licenseType === o.value ? '' : o.value)}
              className={clsx(
                'flex items-center gap-2 w-full px-3 py-2 rounded-xl text-[12px]',
                'font-medium transition-all text-start',
                licenseType === o.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/8 hover:text-primary'
              )}>
              <span className="material-symbols-outlined text-sm">{o.icon}</span>
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
  governorate, employmentType, licenseType, sortBy,
  onUpdate, onClear, activeCount, totalResults,
}: {
  open: boolean; onClose: () => void;
  governorate: string; employmentType: string;
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-surface-container-lowest rounded-t-3xl
                     max-h-[88vh] overflow-y-auto shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant/30 rounded-full" />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 bg-surface-container-lowest
                       flex items-center justify-between px-4 py-3
                       border-b border-outline-variant/[0.08] z-10">
          <span className="font-bold text-on-surface">{tp('filters')}</span>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-container-low
                      flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="px-4 py-5">
          <FilterContent
            governorate={governorate}
            employmentType={employmentType}
            licenseType={licenseType}
            sortBy={sortBy}
            onUpdate={onUpdate}
            onClear={onClear}
            activeCount={activeCount}
          />
        </div>

        {/* Apply button */}
        <div className="sticky bottom-0 bg-surface-container-lowest
                       border-t border-outline-variant/[0.08] px-4 py-4 pb-safe">
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
  const locale    = useLocale();
  const tp        = useTranslations('pages');
  const { data: jobs, isLoading } = useRecommendedJobs();

  if (!user || isLoading || !jobs || jobs.length === 0) return null;

  return (
    <section className="mt-8 pt-8 border-t border-outline-variant/[0.08]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}>recommend</span>
        <h2 className="text-[16px] font-bold text-on-surface">
          وظائف مقترحة لك
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
          <div className="md:flex md:gap-6">
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
  const tm  = useTranslations('mappings');
  const { profile, requireProfile } = useRequireJobProfile();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const locale       = useLocale();

  // ── URL State ──
  const page           = searchParams.get('page') || '1';
  const search         = searchParams.get('search') || '';
  const jobType        = searchParams.get('jobType') || '';
  const employmentType = searchParams.get('employmentType') || '';
  const governorate    = searchParams.get('governorate') || '';
  const licenseType    = searchParams.get('licenseType') || '';
  const sortBy         = searchParams.get('sortBy') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = [employmentType, licenseType, governorate, sortBy].filter(Boolean).length;

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

  // ── API Params ──
  const params = useMemo(() => {
    const p: Record<string, string> = { page, limit: '10' };
    if (search)         p.search         = search;
    if (jobType)        p.jobType        = jobType;
    if (employmentType) p.employmentType = employmentType;
    if (governorate)    p.governorate    = governorate;
    if (licenseType)    p.licenseType    = licenseType;
    if (sortBy) {
      const [field, order] = sortBy.split('_');
      if (field) p.sortBy    = field;
      if (order) p.sortOrder = order;
    }
    return p;
  }, [page, search, jobType, employmentType, governorate, licenseType, sortBy]);

  const { data, isLoading, isError, refetch } = useJobs(params);
  const items = data?.items ?? [];
  const meta  = data?.meta;

  // ── Pagination ──
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
      <section className="relative overflow-hidden min-h-[300px] md:min-h-[380px]">

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]" />

        {/* Pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Decorative blurs */}
        <div className="absolute top-[-20%] right-0 w-[60vw] md:w-[500px] h-[60vw] md:h-[500px] rounded-full bg-white/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-0 w-[50vw] md:w-[400px] h-[50vw] md:h-[400px] rounded-full bg-blue-300/[0.08] blur-3xl pointer-events-none" />

        <div className="relative z-10 pt-16 pb-8 sm:pt-24 sm:pb-10 md:pt-28 md:pb-14">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">

            {/* Icon badge */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                           bg-white/10 backdrop-blur-sm mb-4 border border-white/10">
              <span className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-black text-white mb-2 drop-shadow-sm">
              {tp('jobsTitle')}
            </h1>
            <p className="text-white/70 text-xs sm:text-sm mb-6 max-w-md mx-auto">
              {tp('jobsSubtitle')}
            </p>

            {/* Glass Search Box */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20
                           rounded-2xl p-2.5 md:p-3 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">

              {/* Search row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl
                               px-3 py-2.5 focus-within:ring-2 focus-within:ring-white/40">
                  <span className="material-symbols-outlined text-primary/50 text-xl shrink-0">search</span>
                  <input
                    type="text" value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={tp('jobsSearch')}
                    className="flex-1 bg-transparent text-sm font-medium text-on-surface
                              placeholder:text-on-surface-variant/50 focus:outline-none min-w-0"
                  />
                  {searchInput && (
                    <button onClick={() => setSearchInput('')}
                      className="text-on-surface-variant/40 hover:text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>

                <button onClick={handleSearch}
                  className="shrink-0 bg-white text-primary px-4 sm:px-6 py-2.5 font-black
                            text-xs sm:text-sm rounded-xl hover:bg-white/90
                            active:scale-[0.97] transition-all shadow-lg
                            flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">search</span>
                  <span className="hidden sm:inline">{tp('rentalsSearchBtn')}</span>
                </button>

                {/* Mobile filter button */}
                <button onClick={() => setShowMobileFilters(true)}
                  className={clsx(
                    'md:hidden shrink-0 px-3 py-2.5 rounded-xl text-sm font-black',
                    'transition-all flex items-center gap-1 relative border',
                    activeFilterCount > 0
                      ? 'bg-white/30 text-white border-white/40'
                      : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                  )}>
                  <span className="material-symbols-outlined text-sm">tune</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-white
                                   text-primary text-[10px] font-black rounded-full
                                   flex items-center justify-center shadow-sm">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Job type tabs */}
              <div className="flex overflow-x-auto gap-1.5 mt-2.5 pt-2.5
                             border-t border-white/10"
                style={{ scrollbarWidth: 'none' }}>
                {JOB_TYPE_TABS.map(tab => (
                  <button key={tab.value}
                    onClick={() => updateParam('jobType', tab.value)}
                    className={clsx(
                      'shrink-0 flex items-center gap-1.5 px-3 py-1.5',
                      'text-[11px] font-bold rounded-lg whitespace-nowrap transition-all',
                      jobType === tab.value
                        ? 'bg-white text-primary shadow-sm'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    )}>
                    <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                    {tp(tab.labelKey as any)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center items-center gap-4 mt-5">
              <div className="flex items-center gap-1.5 text-white/60">
                <span className="material-symbols-outlined text-sm">work</span>
                <span className="text-xs font-black text-white">{meta?.total ?? '...'}</span>
                <span className="text-xs">{tp('jobsCount')}</span>
              </div>
              <span className="w-px h-4 bg-white/20" />
              <button
                onClick={() => requireProfile('employer', () => router.push('/jobs/new'))}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors group">
                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">
                  add_circle
                </span>
                <span className="text-xs font-bold">{tp('jobsAddJob')}</span>
              </button>
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
                    <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
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
                <span className="material-symbols-outlined text-base">person_add</span>
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
          <main className="flex-1 min-w-0" id="main-content">

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
                  <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                  {tp('clearFilters')}
                </button>
              )}
            </div>

            {/* States */}
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
                {/* Cards */}
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

                {/* Recommended */}
                <RecommendedSection />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        governorate={governorate}
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
```

---

## Validation

```bash
cd apps/web
npx tsc --noEmit
```

Manual checklist:
```
✅ Hero: mobile min-h-[300px] / desktop min-h-[380px]
✅ Desktop: sidebar on right + cards on left
✅ Mobile: no sidebar — filter button opens bottom sheet
✅ JobCard: employer profile image inside avatar circle
✅ JobCard: verified badge (blue circle with check)
✅ Role-aware actions: owner / applied / apply / visitor
✅ Chat button: shows for all except owner
✅ Search: updates URL params
✅ Filters: update URL params (no page state)
✅ Pagination: smart ellipsis
✅ Recommended section: shows for logged-in users
✅ Onboarding CTA: shows when no profile
```

---

## Hard Rules

- ❌ لا تغير أي شيء خارج هذا الملف
- ❌ لا تستخدم UnifiedCard أو transformJob
- ❌ لا state للـ filters — كل حاجة في URL params
- ❌ لا inline styles إلا الـ SVG pattern و fontVariationSettings
- ✅ Sidebar sticky top-20 على الديسكتوب
- ✅ Bottom sheet على الموبايل (مش collapsible panel)
- ✅ كل text من tp() — مش hardcoded
- ✅ شغّل npx tsc --noEmit بعد الكتابة
