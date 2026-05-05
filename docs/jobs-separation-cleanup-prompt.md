# Agent Prompt — Cleanup After Jobs Separation
# اقرأ الملفات أولاً — لا تحذف أي حاجة قبل التحقق

---

## Context

تم فصل Jobs من `ListingShellPage` وبناء `/jobs` كـ domain مستقل.
هذا البرومبت للتنظيف فقط — لا features جديدة.

---

## Step 1 — TypeScript Check أولاً

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -50
```

صلّح **كل** الـ type errors قبل ما تكمل.
أي error بيظهر في الـ listing shell بعد حذف jobs — صلّحه.

---

## Step 2 — ESLint على الملفات المتأثرة

```bash
cd apps/web
npx eslint \
  src/features/listings/types/category.types.ts \
  src/features/listings/config/categories.config.ts \
  src/features/listings/config/filters.config.ts \
  src/features/listings/hooks/useUnifiedListings.ts \
  src/features/listings/components/ListingsPageShell.tsx \
  src/features/jobs/components/JobCard.tsx \
  src/app/[locale]/jobs/page.tsx \
  --max-warnings 0
```

صلّح كل `no-unused-vars` و `no-unused-imports`.
لا تستخدم `// eslint-disable`.

---

## Step 3 — تحقق من Dead Imports في jobs/page.tsx

```bash
grep -n "UnifiedCard\|useItemTransformers\|transformJob" \
  apps/web/src/app/[locale]/jobs/page.tsx
```

**المتوقع:** لا نتائج.
لو ظهر أي منهم — احذفه.

---

## Step 4 — تحقق من Dead References لـ jobs في Shell

```bash
# تحقق إن jobs اتشالت من كل الملفات الأربعة
grep -n "'jobs'" \
  apps/web/src/features/listings/types/category.types.ts \
  apps/web/src/features/listings/config/categories.config.ts \
  apps/web/src/features/listings/config/filters.config.ts \
  apps/web/src/features/listings/hooks/useUnifiedListings.ts \
  apps/web/src/features/listings/components/ListingsPageShell.tsx
```

**المتوقع:** لا نتائج في الملفات دي.
لو ظهر أي reference — احذفه.

---

## Step 5 — تحقق إن normalizeJob لسه موجودة

```bash
grep -n "normalizeJob" \
  apps/web/src/features/listings/config/categories.config.ts
```

**المتوقع:** الـ function موجودة لكن مش في NORMALIZERS map.

```
✅ صح:
function normalizeJob(raw: any): UnifiedListingItem { ... }  ← موجودة
NORMALIZERS = { cars: ..., buses: ..., equipment: ... }     ← بدون jobs

❌ غلط:
NORMALIZERS = { ..., jobs: normalizeJob }  ← لو لسه موجودة احذفها
```

---

## Step 6 — تحقق من Home Page Jobs Section

```bash
grep -n "normalizeJob\|transformJob\|jobs" \
  apps/web/src/features/home/components/jobs-section.tsx \
  apps/web/src/app/[locale]/page.tsx
```

**المتوقع:** الـ home page لسه بتستخدم jobs data — ده طبيعي ومتأثرش.
لو في error في home page بسبب الفصل — صلّح بدون ما تمس الـ feature.

---

## Step 7 — تحقق من Redirect

```bash
cat apps/web/src/app/[locale]/browse/jobs/page.tsx
```

**المتوقع:**
```tsx
import { redirect } from 'next/navigation';
export default function BrowseJobsRedirect() {
  redirect('/jobs');
}
```

لو الملف مش موجود — اعمله.

---

## Step 8 — تحقق من Breadcrumb

```bash
grep -n "browse/jobs" \
  apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx
```

**المتوقع:** لا نتائج.
لو ظهر — استبدله بـ `/jobs`.

---

## Step 9 — Dead Links Scan

```bash
# ابحث عن أي link لـ /browse/jobs في كل الـ codebase
grep -rn "browse/jobs" \
  apps/web/src \
  --include="*.tsx" \
  --include="*.ts"
```

**المتوقع:** نتيجة واحدة بس — الـ redirect file نفسه.
أي نتيجة تانية — استبدلها بـ `/jobs`.

---

## Step 10 — Final Build Check

```bash
cd apps/web
npx next build --no-lint 2>&1 | grep -E "Error|error" | head -20
```

**المتوقع:** لا errors.
لو في errors — صلّحها قبل ما تكمل.

---

## Step 11 — Commit

```bash
git add -A
git commit -m "feat(jobs): separate jobs domain from ListingShellPage

- Remove jobs from ListingCategory, VALID_CATEGORIES, CATEGORY_META
- Remove jobs from NORMALIZERS (keep normalizeJob fn for home section)
- Remove jobs from FILTERS_CONFIG, useUnifiedListings
- Remove Briefcase icon from ListingsPageShell CATEGORY_ICON
- Add JobCard with role-aware actions + verified badge
- Replace UnifiedCard with JobCard in /jobs page
- Add redirect /browse/jobs → /jobs
- Fix breadcrumb in job-detail-client.tsx"
```

---

## Hard Rules

- ❌ لا تحذف `normalizeJob()` الـ function نفسها
- ❌ لا تعدل `jobs-section.tsx` أو home page
- ❌ لا تستخدم `// eslint-disable`
- ❌ لا تكمل لو في TypeScript errors
- ✅ كل خطوة لها grep للتحقق — استخدمه فعلاً
- ✅ Commit واحد في الآخر بعد ما كل حاجة شغالة
