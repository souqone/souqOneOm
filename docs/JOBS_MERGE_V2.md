# Jobs Merge V2 — Remaining Pages

## ⚠️ DO NOT STOP UNTIL ALL 12 ITEMS BELOW ARE CHECKED OFF

Execute every step in order without pausing or asking for confirmation.

```
PAGES (3 files — replace with drivershub design + real API):
[ ] 1.  app/[locale]/jobs/onboarding/page.tsx    (replace with drivershub design)
[ ] 2.  app/[locale]/jobs/verification/page.tsx  (replace with drivershub design)
[ ] 3.  app/[locale]/jobs/dashboard/page.tsx     (new — from drivershub)

DASHBOARD COMPONENTS (3 files — needed by dashboard page):
[ ] 4.  features/jobs/components/MyPostsList.tsx
[ ] 5.  features/jobs/components/MyProposalsList.tsx
[ ] 6.  features/jobs/components/DashboardStatsRow.tsx   (renamed from StatsRow)

API WIRING (in all 3 pages):
[ ] 7.  mock API removed, real hooks wired
[ ] 8.  delay() calls removed
[ ] 9.  AppLayout / Navbar / Footer / BottomNav removed

SubNavBar:
[ ] 10. /jobs/dashboard added to JOBS_LINKS

VERIFY:
[ ] 11. npx tsc --noEmit — 0 errors
[ ] 12. /jobs/onboarding, /jobs/verification, /jobs/dashboard all load
```

---

## ⚠️ CRITICAL RULES

```
DO NOT change any className, style, padding, margin, color, fontSize,
width, height, border-radius, or any visual property.

DO NOT rewrite or improve JSX structure.

Your job is COPY + WIRE only:
  1. Copy JSX exactly as-is from drivershub source
  2. Fix import paths
  3. Replace mock data with real API hooks
  4. Fix hrefs
  5. Remove AppLayout/Navbar/Footer/BottomNav only
```

---

## ⚠️ TRANSLATIONS

drivershub has NO i18n — all Arabic text is hardcoded.
Keep all hardcoded Arabic strings exactly as-is.
Do NOT add useTranslations() or t('key') calls.

---

## SOURCE FILES (already extracted — read directly)

```
_merge_src/drivershub/app/onboarding/page.tsx
_merge_src/drivershub/app/verification/page.tsx
_merge_src/drivershub/app/dashboard/page.tsx
_merge_src/drivershub/app/dashboard/components/MyPostsList.tsx
_merge_src/drivershub/app/dashboard/components/MyProposalsList.tsx
_merge_src/drivershub/app/dashboard/components/StatsRow.tsx
```

---

## STEP 1 — Onboarding page

Read `_merge_src/drivershub/app/onboarding/page.tsx` fully.

Copy to `apps/web/src/app/[locale]/jobs/onboarding/page.tsx`.
Overwrite the existing file — drivershub's design is the target.

Wire real API:
```ts
// Remove: jobsApi.createDriverProfile(), jobsApi.createEmployerProfile()
// Replace with:
import { useCreateDriverProfile, useCreateEmployerProfile } from '@/lib/api/jobs'
```

Read `apps/web/src/lib/api/jobs.ts` for exact hook signatures.

---

## STEP 2 — Verification page

Read `_merge_src/drivershub/app/verification/page.tsx` fully.

Copy to `apps/web/src/app/[locale]/jobs/verification/page.tsx`.
Overwrite the existing file.

Wire real API:
```ts
// Remove: jobsApi.submitVerification()
// Replace with:
import { useSubmitVerification } from '@/lib/api/jobs'
```

If `useSubmitVerification` does not exist in `lib/api/jobs.ts` — use `useCreateVerification`
or the closest available hook. Read the file first.

---

## STEP 3 — Dashboard components

Read each file then copy — do NOT modify JSX or styles:

```
_merge_src/drivershub/app/dashboard/components/MyPostsList.tsx
  → apps/web/src/features/jobs/components/MyPostsList.tsx

_merge_src/drivershub/app/dashboard/components/MyProposalsList.tsx
  → apps/web/src/features/jobs/components/MyProposalsList.tsx

_merge_src/drivershub/app/dashboard/components/StatsRow.tsx
  → apps/web/src/features/jobs/components/DashboardStatsRow.tsx
```

Fix imports in each:
```ts
// REMOVE:
import AppIcon from '@/components/ui/AppIcon'   → replace with lucide-react
import AppImage from '@/components/ui/AppImage'  → replace with next/image <Image>

// Wire real API where used:
jobsApi.* → equivalent hooks from '@/lib/api/jobs'
```

---

## STEP 4 — Dashboard page

Read `_merge_src/drivershub/app/dashboard/page.tsx` fully.

Copy to `apps/web/src/app/[locale]/jobs/dashboard/page.tsx` (create file — it doesn't exist).

Remove: `<AppLayout>`, `<Navbar>`, `<Footer>`, `<BottomNav>`.
Keep everything else exactly as-is.

Fix component imports:
```ts
'../components/MyPostsList'    →  '@/features/jobs/components/MyPostsList'
'../components/MyProposalsList' → '@/features/jobs/components/MyProposalsList'
'../components/StatsRow'       →  '@/features/jobs/components/DashboardStatsRow'
```

Wire real API:
```ts
// Remove: jobsApi.*
// Replace with hooks from '@/lib/api/jobs':
jobsApi.myJobs()         → useMyJobs()
jobsApi.myApplications() → useMyApplications()
```

Fix hrefs:
```
"/my-posts"      →  "/jobs/my"
"/my-proposals"  →  "/jobs/my-proposals"
"/browse-jobs"   →  "/jobs/browse"
"/jobs/new"      →  "/jobs/new"
"/drivers"       →  "/jobs/drivers"
```

---

## STEP 5 — SubNavBar

Open `apps/web/src/components/layout/SubNavBar.tsx`.

Add `/jobs/dashboard` to JOBS_LINKS:
```tsx
{ href: '/jobs/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
```

The full JOBS_LINKS should be:
```tsx
const JOBS_LINKS = [
  { href: '/jobs',              label: 'الوظائف',       icon: Briefcase },
  { href: '/jobs/browse',       label: 'تصفح الوظائف',  icon: Briefcase },
  { href: '/jobs/my',           label: 'إعلاناتي',      icon: FileText },
  { href: '/jobs/my-proposals', label: 'عروضي',          icon: MessageSquare },
  { href: '/jobs/dashboard',    label: 'لوحة التحكم',   icon: LayoutDashboard },
  { href: '/jobs/drivers',      label: 'السائقون',       icon: Users },
]
```

---

## STEP 6 — Verify

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

0 errors required.

Visual checks:
1. `/jobs/onboarding` — drivershub onboarding UI ✓
2. `/jobs/verification` — drivershub verification UI ✓
3. `/jobs/dashboard` — stats row + my posts + my proposals ✓
4. SubNavBar shows "لوحة التحكم" link on /jobs/* routes ✓
