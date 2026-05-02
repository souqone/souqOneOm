# Agent Prompt — JobCard + Jobs Shell Separation
# اقرأ الملفات أولاً — لا تكتب سطر كود قبل ما تقرأ

---

## Context

SouqOne — الـ `/jobs/page.tsx` موجودة وشغالة.
المشكلة الوحيدة: الكروت بتستخدم `UnifiedCard + transformJob`
اللي مفيهاش action buttons ولا verified badge ولا role awareness.

**الهدف:**
1. ابني `JobCard` مخصصة بـ role-aware actions
2. استبدل `UnifiedCard + transformJob` بيها في `/jobs/page.tsx`
3. افصل jobs من `ListingShellPage`

---

## اقرأ الملفات دي الأول

```
apps/web/src/app/[locale]/jobs/page.tsx              ← الصفحة الموجودة
apps/web/src/lib/api/jobs.ts                         ← types + hooks
apps/web/src/hooks/use-require-job-profile.ts        ← requireProfile pattern
apps/web/src/features/listings/types/category.types.ts
apps/web/src/features/listings/config/categories.config.ts
apps/web/src/features/listings/config/filters.config.ts
apps/web/src/features/listings/hooks/useUnifiedListings.ts
apps/web/src/features/listings/components/ListingsPageShell.tsx
```

---

## Part A — JobCard Component

### إنشاء: `apps/web/src/features/jobs/components/JobCard.tsx`

```tsx
'use client';

import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import { useAuth } from '@/providers/auth-provider';
import { useRequireJobProfile } from '@/hooks/use-require-job-profile';
import { useCreateConversation, useApplyToJob, useMyApplications } from '@/lib/api';
import { useToast } from '@/components/toast';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';
import { employmentLabelsT } from '@/lib/constants/jobs';
import { getImageUrl } from '@/lib/image-utils';
import type { JobItem } from '@/lib/api/jobs';
import { clsx } from 'clsx';

interface JobCardProps {
  job: JobItem;
}

// ── License labels — reuse same keys as jobs/page.tsx ──
const LICENSE_ICONS: Record<string, string> = {
  LIGHT: 'directions_car',
  HEAVY: 'local_shipping',
  TRANSPORT: 'fire_truck',
  BUS: 'directions_bus',
  MOTORCYCLE: 'two_wheeler',
};

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const { requireProfile } = useRequireJobProfile();
  const { addToast } = useToast();
  const router = useRouter();
  const locale = useLocale();
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const createConv = useCreateConversation();
  const applyMutation = useApplyToJob();

  // ── Derive: has this user already applied? ──
  const { data: myApplications } = useMyApplications();
  const myApplication = myApplications?.find(a => a.jobId === job.id) ?? null;

  const isOwner   = !!(user && job.user.id === user.id);
  const isHiring  = job.jobType === 'HIRING';
  const isActive  = job.status === 'ACTIVE';

  // ── Salary period labels ──
  const salaryPeriodLabel: Record<string, string> = {
    DAILY:      tp('jobDetailPerDay'),
    MONTHLY:    tp('jobDetailPerMonth'),
    YEARLY:     tp('jobDetailPerYear'),
    NEGOTIABLE: tp('jobDetailNegotiable'),
  };

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
    <div className="bg-surface-container-lowest dark:bg-surface-container
                   border border-outline-variant/10 rounded-2xl shadow-sm
                   hover:shadow-md hover:border-outline-variant/20
                   transition-all overflow-hidden group">
      <div className="p-4">

        {/* ── Row 1: Employer avatar + title + type badge ── */}
        <div className="flex items-start gap-3 mb-3">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={clsx(
              'w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center',
              'text-white font-black text-base shadow-sm',
              isHiring
                ? 'bg-gradient-to-br from-[#004ac6] to-[#0B2447]'
                : 'bg-gradient-to-br from-violet-500 to-violet-700'
            )}>
              {job.user.avatarUrl ? (
                <Image
                  src={getImageUrl(job.user.avatarUrl) ?? ''}
                  alt={job.user.displayName || job.user.username}
                  width={44} height={44}
                  className="object-cover w-full h-full"
                />
              ) : (
                (job.user.displayName || job.user.username || '?')[0]?.toUpperCase()
              )}
            </div>
            {/* Verified badge — exact pattern from DriverCard */}
            {job.user.isVerified && (
              <div className="absolute -bottom-0.5 -end-0.5 bg-primary text-white
                             rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
            )}
          </div>

          {/* Title + employer name */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/jobs/${job.slug || job.id}`}
              className="font-bold text-on-surface text-[13px] leading-tight
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
            'shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border',
            isHiring
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-violet-500/10 text-violet-600 border-violet-200'
          )}>
            {isHiring ? tp('jobsTabHiring') : tp('jobsTabOffering')}
          </span>
        </div>

        {/* ── Row 2: Location + Employment type + License chips ── */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Location */}
          <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/60
                          bg-surface-container-low border border-outline-variant/[0.08]
                          px-2 py-0.5 rounded-lg">
            <span className="material-symbols-outlined text-[11px]">location_on</span>
            {resolveLocationLabel(job.governorate, locale) || job.governorate}
          </span>

          {/* Employment type */}
          <span className="text-[10px] font-medium text-on-surface-variant/60
                          bg-surface-container-low border border-outline-variant/[0.08]
                          px-2 py-0.5 rounded-lg">
            {employmentLabelsT(tm)[job.employmentType] ?? job.employmentType}
          </span>

          {/* License chips — max 2 */}
          {job.licenseTypes?.slice(0, 2).map(lt => (
            <span key={lt}
              className="flex items-center gap-0.5 text-[9px] font-bold
                        bg-primary/8 text-primary border border-primary/15
                        px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[10px]">
                {LICENSE_ICONS[lt] ?? 'badge'}
              </span>
              {tp(`jobsLicense${lt.charAt(0) + lt.slice(1).toLowerCase()}` as any) || lt}
            </span>
          ))}
        </div>

        {/* ── Row 3: Salary + Meta ── */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {job.salary ? (
              <div className="flex items-baseline gap-1">
                <span className="font-black text-primary text-base leading-none">
                  {Number(job.salary).toLocaleString('ar-OM')}
                </span>
                <span className="text-[10px] text-primary/60">{job.currency || 'OMR'}</span>
                {job.salaryPeriod && job.salaryPeriod !== 'NEGOTIABLE' && (
                  <span className="text-[10px] text-on-surface-variant/50">
                    / {salaryPeriodLabel[job.salaryPeriod] ?? job.salaryPeriod}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[12px] font-bold text-on-surface-variant/60">
                {tp('jobDetailNegotiable')}
              </span>
            )}
          </div>

          {/* Meta: applicants + views */}
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/40">
            {job._count?.applications != null && (
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">group</span>
                {job._count.applications}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[11px]">visibility</span>
              {job.viewCount.toLocaleString('ar-OM')}
            </span>
          </div>
        </div>

        {/* ── Row 4: Role-Aware Actions ── */}
        {isActive && (
          <div className="flex gap-2 pt-3 border-t border-outline-variant/[0.06]">

            {/* OWNER → view applicants */}
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

            {/* DRIVER → already applied */}
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

            {/* DRIVER → not applied yet */}
            {!isOwner && !myApplication && user && (
              <button
                onClick={handleApply}
                disabled={applyMutation.isPending}
                className="flex-1 h-9 rounded-xl bg-primary text-on-primary
                           text-[11px] font-bold flex items-center justify-center gap-1.5
                           shadow-sm shadow-primary/20 hover:brightness-105
                           active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {applyMutation.isPending ? (
                  <div className="w-3 h-3 border border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">assignment</span>
                )}
                {tp('jobDetailApply')}
              </button>
            )}

            {/* VISITOR → view details */}
            {!isOwner && !user && (
              <Link href={`/jobs/${job.slug || job.id}`}
                className="flex-1 h-9 rounded-xl bg-primary text-on-primary
                           text-[11px] font-bold flex items-center justify-center gap-1.5
                           shadow-sm shadow-primary/20 hover:brightness-105 transition-all">
                <span className="material-symbols-outlined text-base">open_in_new</span>
                {tp('jobDetailBreadcrumb')}
              </Link>
            )}

            {/* Chat — shown to everyone except owner */}
            {!isOwner && (
              <button
                onClick={handleChat}
                disabled={createConv.isPending}
                aria-label={tp('jobDetailChat')}
                className="w-9 h-9 rounded-xl border border-outline-variant/15
                           text-on-surface-variant flex items-center justify-center
                           hover:text-primary hover:border-primary/20 hover:bg-primary/5
                           transition-all disabled:opacity-50 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">chat</span>
              </button>
            )}

          </div>
        )}

        {/* Closed/Expired state */}
        {!isActive && (
          <div className="pt-3 border-t border-outline-variant/[0.06]">
            <div className="h-9 rounded-xl bg-surface-container-high border border-outline-variant/15
                           flex items-center justify-center gap-1.5
                           text-on-surface-variant/50 text-[11px] font-medium">
              <span className="material-symbols-outlined text-base">block</span>
              {job.status === 'CLOSED' ? tp('jobDetailClosedAd') : tp('jobDetailExpired')}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
```

---

## Part B — Update `/jobs/page.tsx`

### ملف: `apps/web/src/app/[locale]/jobs/page.tsx`

اقرأ الملف الحالي كامل الأول.

#### B1 — أضف import
```tsx
// ADD at top with other imports:
import { JobCard } from '@/features/jobs/components/JobCard';
```

#### B2 — احذف imports غير المحتاجة
```tsx
// REMOVE these (no longer needed after replacing UnifiedCard):
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
```

#### B3 — احذف استخدام transformJob
```tsx
// REMOVE this line inside JobsContent:
const { transformJob } = useItemTransformers();
```

#### B4 — استبدل UnifiedCard بـ JobCard في grid الـ results
```tsx
// FIND (داخل grid الـ results):
{items.map((job) => (
  <UnifiedCard key={job.id} item={transformJob(job)} className="h-full" />
))}

// REPLACE WITH:
{items.map((job) => (
  <JobCard key={job.id} job={job} />
))}
```

#### B5 — عدّل الـ grid من 3 columns لـ 1 column (horizontal cards)
```tsx
// FIND:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">

// REPLACE WITH:
<div className="grid grid-cols-1 gap-3">
```

---

## Part C — Remove Jobs from ListingShellPage

### C1. `features/listings/types/category.types.ts`
حذف `'jobs'` من:
- `ListingCategory` type
- `VALID_CATEGORIES` array
- `CATEGORY_META` object

### C2. `features/listings/config/categories.config.ts`
**مهم: لا تحذف `normalizeJob()` — بتستخدمه home page.**
احذف فقط entry الـ `NORMALIZERS` map:
```ts
// DELETE only this line:
jobs: normalizeJob,
```

### C3. `features/listings/config/filters.config.ts`
احذف `jobs` entry من `FILTERS_CONFIG`:
```ts
// DELETE:
jobs: [ ... ],
```

### C4. `features/listings/hooks/useUnifiedListings.ts`
احذف `jobsQuery` وكل entries بـ `jobs:` في result maps.

### C5. `features/listings/components/ListingsPageShell.tsx`
احذف `jobs` entry من `CATEGORY_ICON` map (Briefcase icon).

---

## Part D — Redirect `/browse/jobs` → `/jobs`

### إنشاء: `apps/web/src/app/[locale]/browse/jobs/page.tsx`

```tsx
import { redirect } from 'next/navigation';

export default function BrowseJobsRedirect() {
  redirect('/jobs');
}
```

---

## Part E — Fix Breadcrumb

### ملف: `apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx`

```tsx
// FIND:
<Link href="/browse/jobs" ...>

// REPLACE WITH:
<Link href="/jobs" ...>
```

---

## Validation

```bash
cd apps/web
npx tsc --noEmit
```

تحقق يدوياً:
```
✅ /jobs → يعرض jobs بـ JobCard الجديدة
✅ /browse/jobs → redirect لـ /jobs
✅ /browse/cars → jobs مش ظاهرة في category bar
✅ Home page jobs section → لسه شغالة
✅ JobCard verified badge ظاهر لـ verified users
✅ JobCard actions مختلفة حسب الـ role
```

---

## Hard Rules

- ❌ لا تحذف `normalizeJob()` — home page بتستخدمه
- ❌ لا تعدل `UnifiedCard` — بتخدم باقي الأقسام
- ❌ لا تغير أي حاجة في hero / search / filters الموجودة
- ❌ لا تغير pagination
- ❌ لا تضيف imports جديدة غير المذكورة
- ✅ `JobCard` بتستخدم `useMyApplications()` derive pattern فقط
- ✅ الـ verified badge بنفس pattern `jobs/drivers/page.tsx`
- ✅ `employmentLabelsT(tm)` مش `employmentLabelsT(tp)` — نفس pattern الصفحة الموجودة
- ✅ شغّل `npx tsc --noEmit` بعد كل التغييرات
