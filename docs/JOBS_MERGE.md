# Jobs Merge — drivershub → SouqOne

## ⚠️ DO NOT STOP UNTIL ALL 20 ITEMS BELOW ARE CHECKED OFF

This is a complete merge task. Execute every step in order without pausing.
Do not ask for confirmation between steps. Do not stop after one file.
Complete ALL of the following before finishing:

```
COMPONENTS (7 files):
[ ] 1.  features/jobs/components/JobCard.tsx
[ ] 2.  features/jobs/components/JobCardSkeleton.tsx
[ ] 3.  features/jobs/components/DriverCard.tsx
[ ] 4.  features/jobs/components/JobFilterSidebar.tsx   (renamed from FilterSidebar)
[ ] 5.  features/jobs/components/JobEmptyState.tsx      (renamed from EmptyState)
[ ] 6.  features/jobs/components/ProposalCard.tsx
[ ] 7.  features/jobs/components/RatingBadges.tsx

PAGES (4 files):
[ ] 8.  app/[locale]/jobs/page.tsx                      (new landing — from drivershub)
[ ] 9.  app/[locale]/jobs/browse/page.tsx               (moved from jobs/page.tsx)
[ ] 10. app/[locale]/jobs/my-proposals/page.tsx         (new)
[ ] 11. app/[locale]/jobs/drivers/page.tsx              (replaced with richer version)
[ ] 12. app/[locale]/jobs/employers/[id]/page.tsx       (new)

CSS (1 file):
[ ] 13. app/globals.css                                 (add 6 missing classes)

CONSTANTS (1 file):
[ ] 14. lib/constants/jobs.ts                           (merge missing entries)

LAYOUT (1 file):
[ ] 15. app/[locale]/jobs/layout.tsx                    (create if missing)

SUBNAV (1 file):
[ ] 16. components/layout/SubNavBar.tsx                 (uncomment JOBS_LINKS)

VERIFY:
[ ] 17. npx tsc --noEmit — 0 errors
[ ] 18. /jobs loads drivershub landing (hero + jobs + drivers)
[ ] 19. /jobs/browse loads existing browse page
[ ] 20. SubNavBar appears on all /jobs/* routes
```

---

## ⚠️ CRITICAL RULES

```
DO NOT change any className, style, padding, margin, color, fontSize,
width, height, border-radius, or any visual property in ANY component.

DO NOT rewrite or improve any JSX structure.

DO NOT add or remove any HTML elements.

Your job is COPY + WIRE only:
  1. Copy files exactly as-is
  2. Fix import paths
  3. Replace mock data with real API
  4. Fix hrefs
  5. Remove AppLayout/Navbar/Footer/BottomNav only

If you are tempted to "improve" the design — STOP. Copy it exactly.
```

---

## STEP 0 — Extract drivershub source

Before anything else, check if the source folder already exists:

```bash
ls _merge_src/drivershub/app/page.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

If MISSING, extract the zip:
```bash
mkdir -p _merge_src
unzip -o drivershub.zip -d _merge_src/drivershub_zip
# find the src folder inside the extracted zip and copy it
EXTRACTED=$(find _merge_src/drivershub_zip -name "globals.css" -path "*/styles/*" | head -1 | xargs dirname | xargs dirname)
cp -r "$EXTRACTED" _merge_src/drivershub
rm -rf _merge_src/drivershub_zip
echo "Extracted to _merge_src/drivershub/"
ls _merge_src/drivershub/
```

If EXISTS — skip this step entirely and proceed to STEP 1.

---

## CONTEXT

- **drivershub source**: `_merge_src/drivershub/` (relative to SouqOne repo root)
- **SouqOne target**: `apps/web/src/`
- drivershub has the landing page + driver browse UI — we want them exactly as-is
- SouqOne's detail page, new form, my-posts, and drivers/[id] are ALREADY better — skip them

---

## ⚠️ CURRENT STATE — READ BEFORE TOUCHING ANY FILE

**Recent cleanup already done in SouqOne:**
- JobEscrow, JobInvite, JobRecommendation removed from backend + frontend
- `lib/api/jobs.ts` — escrow/invite/recommendation hooks removed
- Dashboard components cleaned (no escrow/invite/recs tabs)
- TypeCheck: 0 errors ✅

**File-by-file decision:**

```
KEEP — do NOT overwrite (SouqOne's versions are richer):
  apps/web/src/app/[locale]/jobs/new/page.tsx
  apps/web/src/app/[locale]/jobs/[id]/          ← full detail + apply flow
  apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx
  apps/web/src/app/[locale]/jobs/drivers/[id]/  ← SouqOne already has this (~353 lines)
  apps/web/src/app/[locale]/jobs/my/            ← SouqOne already has this (287 lines, real API)
  apps/web/src/app/[locale]/edit-listing/job/[id]/page.tsx
  apps/web/src/features/jobs/components/DriverProfileCard.tsx  ← SouqOne's version
  apps/web/src/features/jobs/components/jobs-page-guard.tsx    ← SouqOne-specific

MOVE — preserve content, just change location:
  apps/web/src/app/[locale]/jobs/page.tsx   (968 lines, browse page)
    → apps/web/src/app/[locale]/jobs/browse/page.tsx

ADD from drivershub — these do NOT exist in SouqOne:
  /jobs/page.tsx        ← drivershub landing (hero + stats + latest jobs + drivers grid)
  /jobs/my-proposals/   ← my applications list (SouqOne has no equivalent)
  /jobs/employers/[id]/ ← employer public profile (SouqOne has no equivalent)

REPLACE — drivershub's version is richer:
  apps/web/src/app/[locale]/jobs/drivers/page.tsx
    ← drivershub has 399 lines vs SouqOne's 163 lines — richer filters + grid

SKIP from drivershub — SouqOne already has better:
  _merge_src/drivershub/app/my-posts/page.tsx    ← SouqOne has /jobs/my/ (real API, 287 lines)
  _merge_src/drivershub/app/drivers/[id]/page.tsx ← SouqOne already has richer version
  _merge_src/drivershub/app/dashboard/page.tsx   ← SouqOne dashboards at /dashboard/driver/ and /dashboard/employer/
  _merge_src/drivershub/app/dashboard/components/ ← SouqOne dashboard components are more advanced
```

---

## ⚠️ TRANSLATIONS — IMPORTANT

drivershub has NO i18n system — all Arabic text is hardcoded directly in JSX.
SouqOne uses next-intl with `[locale]` routing and `useTranslations()`.

**Rule: keep all hardcoded Arabic strings exactly as-is. Do NOT convert them to `t('key')` calls.**

The only locale-related change needed in copied pages:
- Add `const { locale } = useParams()` if any `href` needs a locale prefix
- For hrefs like `/jobs/browse` — leave as-is, Next.js middleware handles locale

Do NOT:
- Add `import { useTranslations } from 'next-intl'`
- Wrap any string in `t('...')`
- Create any translation JSON files

---

## READ FIRST

```
SouqOne real API:
- apps/web/src/lib/api/jobs.ts           ← real API hooks, keep untouched
- apps/web/src/lib/auth.ts               ← apiFetch + apiRequest
- apps/web/src/app/globals.css           ← design tokens

drivershub source (all in _merge_src/drivershub/):
- _merge_src/drivershub/app/page.tsx                    ← landing
- _merge_src/drivershub/app/my-proposals/page.tsx
- _merge_src/drivershub/app/drivers/page.tsx
- _merge_src/drivershub/app/employers/[id]/page.tsx
- _merge_src/drivershub/features/jobs/components/ (all)
- _merge_src/drivershub/features/jobs/constants.ts
- _merge_src/drivershub/features/jobs/types.ts
- _merge_src/drivershub/styles/globals.css
```

---

## STEP 1 — Move existing browse page

```bash
# Move SouqOne's current jobs/page.tsx → jobs/browse/page.tsx
# Create the browse/ folder and move the file — do NOT modify its content
mv apps/web/src/app/[locale]/jobs/page.tsx \
   apps/web/src/app/[locale]/jobs/browse/page.tsx
```

---

## STEP 2 — Add missing CSS classes to SouqOne globals

Read `_merge_src/drivershub/styles/globals.css`.

In `apps/web/src/app/globals.css`, check if these classes exist.
ADD any that are missing — copy exact definition from drivershub (do NOT modify existing).

```
.btn-amber
.badge-hiring
.badge-offering
.text-gradient-amber
.font-tabular
.animate-pulse-soft
```

For `.animate-pulse-soft`, if not found in drivershub globals:
```css
.animate-pulse-soft {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

⚠️ **CSS variable naming**: drivershub uses unprefixed variables like `var(--brand-navy)`,
`var(--on-surface)`, `var(--outline-variant)`.
SouqOne uses `var(--color-brand-navy)`, `var(--color-on-surface)`, etc.

When copying CSS class definitions, check every `var(--x)` reference:
- If SouqOne's globals.css defines `--color-x`, replace `var(--x)` → `var(--color-x)`
- Run `grep "^\s*--" apps/web/src/app/globals.css` to see SouqOne's actual variable names

---

## STEP 3 — Copy components exactly as-is

Copy every file below. Do NOT modify JSX or styles. Fix imports only.

```
_merge_src/drivershub/features/jobs/components/JobCard.tsx
  → apps/web/src/features/jobs/components/JobCard.tsx
  ⚠️ Read both versions first.
     drivershub's version shows: badge-hiring/offering, RatingBadges, salary, applications count.
     SouqOne's JobCard is defined INLINE in jobs/page.tsx (not as a separate file).
     Since drivershub's is a standalone component — copy it. It will be used by the new landing page.

_merge_src/drivershub/features/jobs/components/JobCardSkeleton.tsx
  → apps/web/src/features/jobs/components/JobCardSkeleton.tsx
  (only if SouqOne doesn't already have one)

_merge_src/drivershub/features/jobs/components/DriverCard.tsx
  → apps/web/src/features/jobs/components/DriverCard.tsx
  ⚠️ This is for the drivers BROWSE page — needed for /jobs/drivers

_merge_src/drivershub/features/jobs/components/FilterSidebar.tsx
  → apps/web/src/features/jobs/components/JobFilterSidebar.tsx

_merge_src/drivershub/features/jobs/components/EmptyState.tsx
  → apps/web/src/features/jobs/components/JobEmptyState.tsx
  (only if SouqOne doesn't already have a jobs-specific empty state)

_merge_src/drivershub/features/jobs/components/ProposalCard.tsx
  → apps/web/src/features/jobs/components/ProposalCard.tsx

_merge_src/drivershub/features/jobs/components/RatingBadges.tsx
  → apps/web/src/features/jobs/components/RatingBadges.tsx
```

---

## STEP 4 — Add / replace pages from drivershub

```
_merge_src/drivershub/app/page.tsx
  → apps/web/src/app/[locale]/jobs/page.tsx          ← NEW landing page
  ⚠️ REMOVE: <AppLayout>, <Navbar>, <Footer>, <BottomNav>
  ⚠️ Keep everything else exactly as-is

_merge_src/drivershub/app/my-proposals/page.tsx
  → apps/web/src/app/[locale]/jobs/my-proposals/page.tsx

_merge_src/drivershub/app/drivers/page.tsx
  → apps/web/src/app/[locale]/jobs/drivers/page.tsx
  ⚠️ This REPLACES the existing 163-line version — drivershub's is richer (399 lines)
  ⚠️ Read existing file first to confirm no custom logic was added, then overwrite

_merge_src/drivershub/app/employers/[id]/page.tsx
  → apps/web/src/app/[locale]/jobs/employers/[id]/page.tsx

NOTE: Do NOT copy my-posts/page.tsx — SouqOne already has /jobs/my/ (real API, 287 lines).
NOTE: Do NOT copy drivers/[id]/page.tsx — SouqOne already has a richer version.
NOTE: Do NOT copy dashboard/page.tsx — SouqOne dashboards are at /dashboard/driver/ and /dashboard/employer/.
NOTE: Do NOT copy browse-jobs/page.tsx — SouqOne's existing browse is better.
NOTE: Do NOT copy jobs/new/page.tsx — SouqOne's existing create form is better.
NOTE: Do NOT copy job-detail/page.tsx — SouqOne's existing [id]/page.tsx is better.
```

In EVERY newly added/replaced page, do these find+replace (nothing else):
```
"/browse-jobs"       →  "/jobs/browse"
"/jobs/new"          →  "/jobs/new"
"/job-detail"        →  "/jobs/"
"/my-posts"          →  "/jobs/my"
"/my-proposals"      →  "/jobs/my-proposals"
"/dashboard"         →  "/dashboard"
"/drivers/"          →  "/jobs/drivers/"
"/drivers"           →  "/jobs/drivers"
"/employers/"        →  "/jobs/employers/"
```

---

## STEP 5 — Replace mock data with real API

In EVERY newly copied/replaced file:

```ts
// REMOVE entirely:
import { jobsApi } from '@/features/jobs/api'
import { mockJobs, mockDriverProfiles, ... } from '@/features/jobs/mock-data'

// REPLACE with SouqOne's real hooks:
import { useJobs, useJob, useMyJobs, useDrivers, useDriver,
         useMyApplications, useJobApplications, useEmployer } from '@/lib/api/jobs'
```

Read `apps/web/src/lib/api/jobs.ts` for exact hook signatures.
Map drivershub's `jobsApi.*` calls → equivalent SouqOne hooks:

```
jobsApi.getJobs(params)          → useJobs(params)
jobsApi.getDrivers(params)       → useDrivers(params)
jobsApi.myJobs()                 → useMyJobs()
jobsApi.myApplications()         → useMyApplications()
jobsApi.getJobApplications(id)   → useJobApplications(id)
jobsApi.getEmployer(id)          → useEmployer(id)
```

REMOVE all `delay()` calls.
REMOVE all `await jobsApi.*` calls — replace with hook destructuring `{ data, isLoading, error }`.

---

## STEP 6 — Fix import paths

In every copied file:
```ts
// REMOVE (SouqOne layout handles them):
import AppLayout from '@/components/layout/AppLayout'
import Navbar    from '@/components/layout/Navbar'
import Footer    from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import AppIcon   from '@/components/ui/AppIcon'   → replace usages with lucide-react
import AppImage  from '@/components/ui/AppImage'  → replace with next/image <Image>
import AppLogo   from '@/components/ui/AppLogo'   → remove entirely

// RENAME these imports:
'@/features/jobs/components/FilterSidebar'  →  '@/features/jobs/components/JobFilterSidebar'
'@/features/jobs/components/EmptyState'     →  '@/features/jobs/components/JobEmptyState'
```

---

## STEP 7 — Merge constants (ADD only, never remove)

⚠️ SouqOne does NOT have `features/jobs/types.ts` — all types live in `lib/api/jobs.ts`.
⚠️ SouqOne constants live in `lib/constants/jobs.ts` (not `features/jobs/constants.ts`).

Read `_merge_src/drivershub/features/jobs/constants.ts`.
Read `apps/web/src/lib/constants/jobs.ts`.

Add any missing constants from drivershub. Do NOT touch existing entries.
Do NOT create `features/jobs/types.ts` or `features/jobs/constants.ts`.

---

## STEP 8 — Activate SubNavBar entries for jobs

Open `apps/web/src/components/layout/SubNavBar.tsx`.

The JOBS_LINKS and getLinksForPath condition are already defined but commented out.
Uncomment them. Then update the JOBS_LINKS array to match exactly:

```tsx
import { Briefcase, FileText, MessageSquare, LayoutDashboard, Users } from 'lucide-react'

const JOBS_LINKS = [
  { href: '/jobs',              label: 'الوظائف',       icon: Briefcase },
  { href: '/jobs/browse',       label: 'تصفح الوظائف',  icon: Briefcase },
  { href: '/jobs/my',           label: 'إعلاناتي',      icon: FileText },
  { href: '/jobs/my-proposals', label: 'عروضي',          icon: MessageSquare },
  { href: '/dashboard',         label: 'لوحة التحكم',   icon: LayoutDashboard },
  { href: '/jobs/drivers',      label: 'السائقون',       icon: Users },
]
```

Note: dashboard link goes to `/dashboard` (not `/jobs/dashboard`) — SouqOne's dashboards
are at `/dashboard/driver/` and `/dashboard/employer/`, not under `/jobs/`.

In `getLinksForPath` — uncomment the existing line:
```ts
if (pathname.includes('/jobs')) return JOBS_LINKS
```

---

## STEP 9 — Mobile bottom padding

In `apps/web/src/app/[locale]/jobs/layout.tsx`
(create if it doesn't exist — do NOT modify if it exists):

```tsx
export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <div className="pb-[104px] md:pb-0">{children}</div>
}
```

---

## DO NOT TOUCH
- `apps/web/src/lib/api/jobs.ts`
- `apps/web/src/app/[locale]/jobs/new/page.tsx`
- `apps/web/src/app/[locale]/jobs/[id]/`
- `apps/web/src/app/[locale]/jobs/my/`
- `apps/web/src/app/[locale]/jobs/drivers/[id]/`
- `apps/web/src/app/[locale]/edit-listing/job/[id]/page.tsx`
- `apps/web/src/features/dashboard/`
- Any className, style, or visual property
- SouqOne's navbar, footer, any shell component

---

## VERIFY

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
0 errors required.

Check visually:
1. `/jobs`               — drivershub landing: hero + latest jobs + drivers section ✓
2. `/jobs/browse`        — SouqOne's existing browse page (unchanged) ✓
3. `/jobs/new`           — SouqOne's existing create form (unchanged) ✓
4. `/jobs/my`            — SouqOne's existing my-posts page (unchanged) ✓
5. `/jobs/my-proposals`  — my applications from drivershub ✓
6. `/jobs/drivers`       — richer drivers browse from drivershub ✓
7. `/jobs/drivers/[id]`  — SouqOne's existing driver profile (unchanged) ✓
8. `/jobs/employers/[id]`— employer public profile from drivershub ✓
9. `/dashboard`          — SouqOne's existing driver/employer dashboard (unchanged) ✓
10. SubNavBar on all /jobs/* routes ✓
11. No AppLayout wrapping anything ✓

---

## CLEANUP

After merge is confirmed working, delete the source folder:
```bash
rm -rf _merge_src/drivershub
```
