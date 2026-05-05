# Transport Merge — freighthub → SouqOne

## ⚠️ CRITICAL RULES — READ BEFORE ANYTHING ELSE

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
  5. Remove Navbar/Footer/HeroSection only

If you are tempted to "improve" the design — STOP. Copy it exactly.
```

---

## CONTEXT

- **freighthub** source: `/tmp/freighthub3/freighthub/src/`
- **SouqOne** target: `apps/web/src/`
- freighthub has better UI — we want it exactly as-is
- freighthub uses mock data — replace with SouqOne's real `transportApi`

---

## READ FIRST

```
SouqOne real API:
- apps/web/src/features/transport/api.ts       ← real API, keep untouched
- apps/web/src/features/transport/types.ts
- apps/web/src/features/transport/constants.ts
- apps/web/src/lib/auth.ts (lines 99-147)      ← apiFetch + apiRequest

freighthub source pages:
- /tmp/freighthub3/freighthub/src/app/page.tsx
- /tmp/freighthub3/freighthub/src/app/browse-transport-requests/
- /tmp/freighthub3/freighthub/src/app/create-transport-request/
- /tmp/freighthub3/freighthub/src/app/requests/[id]/page.tsx
- /tmp/freighthub3/freighthub/src/app/my-requests/page.tsx
- /tmp/freighthub3/freighthub/src/app/my-quotes/page.tsx
- /tmp/freighthub3/freighthub/src/app/bookings/[id]/page.tsx
- /tmp/freighthub3/freighthub/src/app/carriers/register/page.tsx
- /tmp/freighthub3/freighthub/src/app/carriers/dashboard/page.tsx
- /tmp/freighthub3/freighthub/src/app/carriers/[id]/page.tsx
- /tmp/freighthub3/freighthub/src/app/components/ (all)
- /tmp/freighthub3/freighthub/src/features/transport/components/ (all)
```

---

## STEP 1 — Copy ALL components exactly as-is

Copy every file below. Do NOT modify the JSX or styles. Only fix imports.

```
/tmp/freighthub3/freighthub/src/app/components/HowItWorks.tsx
  → apps/web/src/features/transport/components/HowItWorks.tsx

/tmp/freighthub3/freighthub/src/app/components/ServiceTypesGrid.tsx
  → apps/web/src/features/transport/components/ServiceTypesGrid.tsx

/tmp/freighthub3/freighthub/src/app/components/StatsBar.tsx
  → apps/web/src/features/transport/components/StatsBar.tsx

/tmp/freighthub3/freighthub/src/app/components/LatestRequests.tsx
  → apps/web/src/features/transport/components/LatestRequests.tsx

/tmp/freighthub3/freighthub/src/app/components/CarrierCTA.tsx
  → apps/web/src/features/transport/components/CarrierCTA.tsx

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/components/FilterSidebar.tsx
  → apps/web/src/features/transport/components/FilterSidebar.tsx

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/components/BrowseContent.tsx
  → apps/web/src/features/transport/components/BrowseContent.tsx

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/components/RequestsGrid.tsx
  → apps/web/src/features/transport/components/RequestsGrid.tsx

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/components/MobileFilterSheet.tsx
  → apps/web/src/features/transport/components/MobileFilterSheet.tsx

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/components/ActiveFilterChips.tsx
  → apps/web/src/features/transport/components/ActiveFilterChips.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/CreateRequestWizard.tsx
  → apps/web/src/features/transport/components/CreateRequestWizard.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/Step1ServiceType.tsx
  → apps/web/src/features/transport/components/Step1ServiceType.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/Step2Route.tsx
  → apps/web/src/features/transport/components/Step2Route.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/Step3Cargo.tsx
  → apps/web/src/features/transport/components/Step3Cargo.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/Step4Timing.tsx
  → apps/web/src/features/transport/components/Step4Timing.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/Step5Review.tsx
  → apps/web/src/features/transport/components/Step5Review.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/components/WizardProgress.tsx
  → apps/web/src/features/transport/components/WizardProgress.tsx

/tmp/freighthub3/freighthub/src/features/transport/components/TransportRequestCard.tsx
  → apps/web/src/features/transport/components/TransportRequestCard.tsx

/tmp/freighthub3/freighthub/src/features/transport/components/RequestCardSkeleton.tsx
  → apps/web/src/features/transport/components/RequestCardSkeleton.tsx
```

---

## STEP 2 — Copy pages exactly as-is, fix hrefs only

```
/tmp/freighthub3/freighthub/src/app/page.tsx
  → apps/web/src/app/[locale]/transport/page.tsx
  ⚠️ REMOVE: <Navbar>, <Footer>, <HeroSection> imports and usages
  ⚠️ Keep everything else exactly as-is

/tmp/freighthub3/freighthub/src/app/browse-transport-requests/page.tsx
  → apps/web/src/app/[locale]/transport/browse/page.tsx

/tmp/freighthub3/freighthub/src/app/create-transport-request/page.tsx
  → apps/web/src/app/[locale]/transport/new/page.tsx

/tmp/freighthub3/freighthub/src/app/requests/[id]/page.tsx
  → apps/web/src/app/[locale]/transport/requests/[id]/page.tsx

/tmp/freighthub3/freighthub/src/app/my-requests/page.tsx
  → apps/web/src/app/[locale]/transport/my-requests/page.tsx

/tmp/freighthub3/freighthub/src/app/my-quotes/page.tsx
  → apps/web/src/app/[locale]/transport/my-quotes/page.tsx

/tmp/freighthub3/freighthub/src/app/bookings/[id]/page.tsx
  → apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx

/tmp/freighthub3/freighthub/src/app/carriers/register/page.tsx
  → apps/web/src/app/[locale]/transport/carriers/register/page.tsx

/tmp/freighthub3/freighthub/src/app/carriers/dashboard/page.tsx
  → apps/web/src/app/[locale]/transport/carriers/dashboard/page.tsx

/tmp/freighthub3/freighthub/src/app/carriers/[id]/page.tsx
  → apps/web/src/app/[locale]/transport/carriers/[id]/page.tsx
```

In EVERY page, do these find+replace (nothing else):
```
"/browse-transport-requests"  →  "/transport/browse"
"/create-transport-request"   →  "/transport/new"
"/requests/"                  →  "/transport/requests/"
"/my-requests"                →  "/transport/my-requests"
"/my-quotes"                  →  "/transport/my-quotes"
"/bookings/"                  →  "/transport/bookings/"
"/carriers/"                  →  "/transport/carriers/"
```

---

## STEP 3 — Replace mock data with real API (no design changes)

In EVERY copied file, replace:
```ts
// REMOVE this import entirely:
import { MOCK_... } from '@/lib/mock-data'

// REMOVE delay() calls entirely

// REPLACE freighthub's transportApi import with SouqOne's:
import { transportApi } from '@/features/transport/api'
```

SouqOne's `transportApi` has the same function names — no logic changes needed.

---

## STEP 4 — Fix import paths only

In every copied file:
```ts
'@/features/transport/types'     → unchanged (same path)
'@/features/transport/constants' → unchanged (same path)
'@/lib/utils'                    → '@/lib/utils' (verify cn() exists)

// REMOVE these imports entirely (SouqOne layout handles them):
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { HeroSection } from '@/app/components/HeroSection'
```

---

## STEP 5 — Merge constants and types (ADD only, never remove)

Compare freighthub constants with SouqOne's `apps/web/src/features/transport/constants.ts`
Add any missing entries. Do NOT touch existing ones.

Same for `types.ts` — add missing types, keep existing.

---

## DO NOT TOUCH
- `apps/web/src/features/transport/api.ts` — real API, do not modify
- Any className, style, or visual property anywhere
- SouqOne's navbar, footer, hero section
- Any existing SouqOne shell components

---

## VERIFY
```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```
0 errors required.

Check visually:
1. `/transport` — freighthub's sections visible, SouqOne navbar on top
2. `/transport/new` — exact same wizard as freighthub
3. `/transport/browse` — exact same browse page as freighthub
4. `/transport/carriers/dashboard` — loads correctly
5. No rocket.new scripts in page source
