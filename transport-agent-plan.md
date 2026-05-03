# Transport Marketplace — Frontend Build Plan

You are an expert Next.js 15 + TypeScript developer working on **SouqOne** (سوق وان).

Before writing any code, read these files carefully to understand the existing patterns:

```
apps/web/src/features/listings/components/ListingsPageShell.tsx
apps/web/src/app/[locale]/sale/[type]/[id]/sale-detail-client.tsx
apps/web/src/features/listings/components/ListingCard.tsx
```

Then read the full spec from this file:
```
transport-frontend-prompt-v2.md
```

---

## Your Mission

Build the Transport Marketplace frontend in **5 phases**, one phase at a time.

After completing each phase:
1. Run `npm run typecheck` — fix ALL errors before moving on
2. Report what was built and confirm it's clean
3. Wait — do NOT start the next phase automatically

---

## Phase 1 — Foundation

**What to build:**
- `apps/web/src/features/transport/types.ts`
- `apps/web/src/features/transport/constants.ts`
- `apps/web/src/features/transport/api.ts`
- Translation keys → add `"transport"` namespace to `apps/web/src/messages/ar.json`
- `apps/web/src/app/[locale]/transport/layout.tsx`

**Success criteria:**
- `npm run typecheck` passes with zero errors
- No Arabic hardcoded strings anywhere

---

## Phase 2 — Shared Components

**What to build:**

```
apps/web/src/features/transport/components/
  ├── TransportRequestCard.tsx
  ├── ServiceTypeSelector.tsx
  ├── RouteMapClient.tsx
  ├── RouteMap.tsx          ← dynamic import wrapper (ssr: false)
  ├── RequestStatusTimeline.tsx
  ├── QuoteCard.tsx
  └── BookingActions.tsx
```

**Rules:**
- Follow `ListingCard.tsx` patterns exactly for `TransportRequestCard`
- Leaflet only via `dynamic import + ssr: false`
- All text from `useTranslations('transport')`
- CSS variables only — no hex colors

**Success criteria:**
- `npm run typecheck` passes
- Each component has proper TypeScript interfaces
- No `any` types

---

## Phase 3 — Browse & Landing Pages

**What to build:**

1. `/transport` — Landing page
   - Hero (navy background)
   - Service types grid (6 types)
   - Latest 6 requests
   - Carrier CTA section

2. `/transport/browse` — `TransportBrowseShell.tsx`
   - **Copy layout structure from `ListingsPageShell.tsx`**
   - Sidebar filters (desktop) + FAB (mobile)
   - `TransportRequestCard` list
   - Load more button
   - Empty states (with/without filters)
   - URL params for filters

**Success criteria:**
- `npm run typecheck` passes
- Browse page matches `ListingsPageShell` layout structure
- Mobile FAB works

---

## Phase 4 — Core Flow Pages

**What to build:**

1. `/transport/new` — Multi-step request creation
   - 5-step flow with Framer Motion transitions
   - Progress bar
   - Step components: ServiceType → Route → Cargo → Timing → Review
   - On submit: `transportApi.createRequest()` → redirect to request detail

2. `/transport/requests/[id]` — Request detail
   - **Follow `sale-detail-client.tsx` pattern exactly**
   - Server component page with metadata
   - Client component with skeleton → error → content
   - Two-column layout (details + sidebar)
   - Sidebar adapts by user role (owner / carrier / visitor)
   - Quote submission form for carriers
   - Quote list with accept button for owners

3. `/transport/bookings/[id]` — Booking detail
   - Status timeline
   - Trip + quote details
   - `BookingActions` by role

**Success criteria:**
- `npm run typecheck` passes
- Full flow works: create request → view detail → submit quote → accept → view booking

---

## Phase 5 — Profile & Management Pages

**What to build:**

1. `/transport/carrier/register` — Carrier registration form
2. `/transport/carrier/dashboard` — Carrier dashboard with availability toggle + stats
3. `/transport/carrier/[id]` — Public carrier profile
4. `/transport/my-requests` — Shipper's request list with filter tabs
5. `/transport/my-quotes` — Carrier's quote list with filter tabs
6. Navbar link → add "النقل والشحن" to navbar

**Success criteria:**
- `npm run typecheck` passes
- All pages are accessible and mobile-responsive
- Navbar link works

---

## Global Rules (apply to every phase)

- **Zero hardcoded Arabic text** — all strings from `useTranslations('transport')`
- **Zero hex colors** — CSS variables only (`bg-surface-container`, `text-on-surface`, etc.)
- **Zero `any`** in TypeScript
- **RTL always** — no hardcoded `ltr`
- **Leaflet** only with `dynamic import + ssr: false`
- **Loading skeletons** on every async operation (use `animate-pulse` like in `sale-detail-client.tsx`)
- **Error states** using existing `<ErrorState />` component
- **Mobile-first** — every page works on mobile

---

## Start Now

Begin with **Phase 1**.

Read the reference files first, then build. Report when Phase 1 is complete and typecheck is clean.
