# Jobs Architecture Audit (Verified via Code)

## 1. Data Layer (Prisma)
- **Files:** `apps/api/prisma/schema.prisma`
- **Observations:**
  - Strict separation of profiles: `DriverProfile` and `EmployerProfile` are distinct models linked 1-to-1 to `User` (`schema.prisma`).
  - Job ownership is tied directly to `userId` on the `DriverJob` model, not to the profiles. However, service logic enforces profile existence (`apps/api/src/jobs/jobs.service.ts:88-91`).
  - Data privacy control: `DriverProfile.contactPhone` is nullable.

## 2. API Layer & Security
- **Endpoints:** `apps/api/src/jobs/jobs.controller.ts`
- **Observations:**
  - Heavy use of NestJS standard routing and DTO validation.
  - Data Leak Protection implemented: `driver-profile.service.ts` uses two different select objects: `PUBLIC_USER_SELECT` (Line 13) without phone number, and `PRIVATE_USER_SELECT` (Line 23) with phone number.
  - Rate limiting is applied selectively: `@Throttle({ default: { limit: 10, ttl: 60000 } })` is strictly applied to the `POST /jobs/:id/apply` endpoint (`jobs.controller.ts:200`) to prevent application spamming.
  - Caching mechanism used extensively via Redis (`jobs.service.ts:155`, `217`) for listing and detail views to optimize performance.
  - IP masking detection: View counts check `x-forwarded-for` header to get the real client IP for accurate rate limiting (`jobs.controller.ts:181-183`).

## 3. Client Architecture (Frontend)
- **Observations:**
  - **God Components (Anti-pattern):** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx` handles complex conditional rendering for two distinct profile forms within a single 658-line file.
  - **Logic Bleed into UI:** `apps/web/src/app/[locale]/jobs/dashboard/page.tsx` manually transforms API response structures in two massive `useMemo` blocks (Lines 56-96 and 98-138) instead of relying on a dedicated adapter or selector.
  - **State Management:** Dashboard manages active role and status filters via simple `useState` (`dashboard/page.tsx:39-40`), but uses an effect to set the initial role after data loading (`dashboard/page.tsx:44-49`). This causes a delay in UI readiness.

## 4. Hardcoded Content (I18n Bypass)
- **Observations:**
  - The module completely bypasses `next-intl` localization for massive amounts of configuration data.
  - `apps/web/src/features/jobs/constants.ts:107` defines a `STRINGS` object with over 50 hardcoded Arabic phrases.
  - Form UI components hardcode titles and labels directly in the render function:
    - `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:311`: `{ n: 1, label: 'الرخصة' }`
    - `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:372`: `<span className="text-sm font-bold text-on-surface">الخبرة والمركبة</span>`
    - `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:174`: `<h1>لا يوجد بروفايل</h1>`
    - `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:191`: `{showEmployer ? 'إدارة إعلاناتك والعروض المقدمة' : 'متابعة عروضك وحالتها'}`

## UNVERIFIED Assumptions
None. Everything is documented with exact file paths and line numbers.
