# IDE Agent Prompt — Build Transport Frontend from Stitch Designs

## Context

You are building the Transport Marketplace frontend for **SouqOne** (سوق وان).
The designs are already done in Stitch — your job is to convert them into
production-quality Next.js 15 + TypeScript components.

---

## Step 0 — Read Everything First

Before writing any code, read ALL of these:

### Design System
```
stitch_design_system_implementation/souqone/DESIGN.md
```

### HTML Reference Files (read all 10)
```
stitch_design_system_implementation/souqone_landing_page/code.html
stitch_design_system_implementation/souqone_browse_requests/code.html
stitch_design_system_implementation/souqone_request_details/code.html
stitch_design_system_implementation/souqone_create_request_step_1/code.html
stitch_design_system_implementation/souqone_booking_details/code.html
stitch_design_system_implementation/souqone_carrier_dashboard/code.html
stitch_design_system_implementation/souqone_carrier_registration/code.html
stitch_design_system_implementation/souqone_carrier_profile/code.html
stitch_design_system_implementation/souqone_my_requests/code.html
stitch_design_system_implementation/souqone_my_quotes/code.html
```

### Existing Codebase Patterns
```
apps/web/src/features/listings/components/ListingsPageShell.tsx
apps/web/src/app/[locale]/sale/[type]/[id]/sale-detail-client.tsx
apps/web/src/features/listings/components/ListingCard.tsx
apps/web/src/components/layout/navbar.tsx
```

---

## Design System Rules (from DESIGN.md)

Extract these from the HTML Tailwind config and apply everywhere:

**Font:** Almarai — import via Google Fonts CDN in layout
**Direction:** `dir="rtl"` always
**Colors:** Use the exact color tokens from the HTML Tailwind config
**Border Radius:** `rounded-xl` (12px) for cards/inputs, `rounded-full` for badges/pills
**Elevation:** `shadow-sm` default cards, `shadow-lg` on hover
**Icons:** Material Symbols Outlined — `<span className="material-symbols-outlined">`

**Key color tokens (from HTML):**
- `primary` → #004ac6
- `brand-amber` → #E8781E
- `brand-navy` → #0B2447
- `brand-green` → #16a34a
- `surface-container-lowest` → #ffffff
- `surface-container` → #e9edff
- `on-surface` → #141b2b
- `on-surface-variant` → #434654
- `outline-variant` → #c3c6d6

**Button gradients (copy exactly from HTML):**
- Brand/Amber: `linear-gradient(135deg, #e54d00, #fe5e00, #ff7a2e)`
- Primary/Blue: `linear-gradient(135deg, #004ac6, #2563eb)`
- Success: `linear-gradient(135deg, #059669, #10b981)`

---

## Globals Setup

### Add to `apps/web/src/app/globals.css`
Add Almarai font CSS variables to match the design system.

### Add to `apps/web/src/app/[locale]/transport/layout.tsx`
```typescript
export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface" dir="rtl">{children}</div>
}
```

---

## Types & API

Create exactly as specified in `transport-frontend-prompt-v2.md`:
- `apps/web/src/features/transport/types.ts`
- `apps/web/src/features/transport/constants.ts`
- `apps/web/src/features/transport/api.ts`

Add translation keys to `apps/web/src/messages/ar.json` under `"transport"`.

---

## Phase 1 — Shared Components

Create `apps/web/src/features/transport/components/`:

For each component, **extract the exact HTML structure and classes from the reference HTML files** — do not invent new styles.

### `TransportRequestCard.tsx`
Reference: card structure inside `souqone_browse_requests/code.html` and `souqone_my_requests/code.html`
- Extract exact className strings from the HTML
- Convert to TypeScript React component
- Props: `{ request: TransportRequest }`

### `ServiceTypeSelector.tsx`
Reference: grid cards in `souqone_create_request_step_1/code.html`
- Extract the card styles (selected/unselected states)
- Props: `{ value: TransportServiceType | ''; onChange: (v: TransportServiceType) => void }`

### `RouteMap.tsx`
- Wrapper with `dynamic import + ssr: false`
- `RouteMapClient.tsx` — actual Leaflet map
- If no coordinates: show placeholder matching the design

### `RequestStatusTimeline.tsx`
Reference: timeline in `souqone_request_details/code.html` and `souqone_booking_details/code.html`
- Extract exact step indicator styles

### `QuoteCard.tsx`
Reference: quote cards in `souqone_request_details/code.html`
- Props: `{ quote: TransportQuote; isOwner?: boolean; isCarrier?: boolean }`

### `BookingActions.tsx`
Reference: action buttons in `souqone_booking_details/code.html`
- Props: `{ booking: TransportBooking; userRole: 'shipper' | 'carrier' | 'other'; onAction: fn }`

---

## Phase 2 — Pages

For each page:
1. Read the corresponding HTML file
2. Extract the **exact layout structure, classes, and component hierarchy**
3. Convert to Next.js page with proper TypeScript
4. Replace hardcoded Arabic text with `useTranslations('transport')` keys
5. Wire up real API calls from `transportApi`
6. Add proper loading skeleton (copy `animate-pulse` pattern from `sale-detail-client.tsx`)
7. Add error state using existing `<ErrorState />` component

---

### Page 1 — `/transport` (Landing)
**Reference HTML:** `souqone_landing_page/code.html`
**File:** `apps/web/src/app/[locale]/transport/page.tsx`

Extract from HTML:
- Hero section exact gradient and layout
- Service type cards grid
- Request cards section (fetch latest 6 from API)
- Carrier CTA section
- All class names and structure

---

### Page 2 — `/transport/browse`
**Reference HTML:** `souqone_browse_requests/code.html`
**Files:**
- `apps/web/src/app/[locale]/transport/browse/page.tsx`
- `apps/web/src/features/transport/TransportBrowseShell.tsx` (client)

Extract from HTML:
- Sidebar filter structure and classes
- Listing card list structure
- Load more button
- Mobile FAB button (copy from `ListingsPageShell.tsx`)
- Empty state design

Wire up:
- URL search params for filters
- `transportApi.getRequests(params)` for data
- Pagination state

---

### Page 3 — `/transport/requests/[id]`
**Reference HTML:** `souqone_request_details/code.html`
**Files:**
- `apps/web/src/app/[locale]/transport/requests/[id]/page.tsx` (server, metadata)
- `apps/web/src/features/transport/RequestDetailClient.tsx` (client)

Follow **exact same pattern** as `sale-detail-client.tsx`:
```typescript
// page.tsx
export async function generateMetadata({ params }) { ... }
export default function RequestPage() {
  return <RequestDetailClient />
}

// RequestDetailClient.tsx
'use client'
// useParams → fetch → skeleton → error → content
```

Extract from HTML:
- Two-column layout structure
- Route display (from/to)
- RouteMap placement
- Cargo details card
- Sidebar quote section
- All exact class names

Sidebar logic:
- `request.userId === currentUser.id` → show quotes list + accept buttons
- else if has carrier profile → show quote submission form
- else → show "login to submit quote"
- if status = ACCEPTED/IN_PROGRESS/COMPLETED → show accepted quote + booking link

---

### Page 4 — `/transport/new`
**Reference HTML:** `souqone_create_request_step_1/code.html`
**Files:**
- `apps/web/src/app/[locale]/transport/new/page.tsx`
- `apps/web/src/features/transport/CreateRequestFlow.tsx` (client)

Extract from HTML:
- Progress bar exact style
- Step indicator exact style
- Step 1 service type cards (extract selected/unselected classes)

Build all 5 steps matching the design:
1. Service type selection (from HTML)
2. Route (from/to with map)
3. Cargo details
4. Timing + budget
5. Review + submit

Use `AnimatePresence` + `motion.div` from Framer Motion between steps.

---

### Page 5 — `/transport/bookings/[id]`
**Reference HTML:** `souqone_booking_details/code.html`
**File:** `apps/web/src/app/[locale]/transport/bookings/[id]/page.tsx`

Extract from HTML:
- Status header design
- Timeline component
- Trip details card
- Carrier info card with WhatsApp button
- Action buttons (extract exact gradient styles)

---

### Page 6 — `/transport/carrier/register`
**Reference HTML:** `souqone_carrier_registration/code.html`
**File:** `apps/web/src/app/[locale]/transport/carrier/register/page.tsx`

Extract from HTML:
- Form card structure
- Vehicle type multi-select cards
- Service type multi-select cards
- Input field styles
- Submit button gradient

---

### Page 7 — `/transport/carrier/dashboard`
**Reference HTML:** `souqone_carrier_dashboard/code.html`
**File:** `apps/web/src/app/[locale]/transport/carrier/dashboard/page.tsx`

Extract from HTML:
- Availability toggle card exact design
- Stats grid cards
- Nearby requests section
- Recent quotes section

---

### Page 8 — `/transport/carrier/[id]`
**Reference HTML:** `souqone_carrier_profile/code.html`
**File:** `apps/web/src/app/[locale]/transport/carrier/[id]/page.tsx`

Extract from HTML:
- Profile header with banner
- Stats row
- Vehicle/service chips
- Contact sidebar card

---

### Page 9 — `/transport/my-requests`
**Reference HTML:** `souqone_my_requests/code.html`
**File:** `apps/web/src/app/[locale]/transport/my-requests/page.tsx`

Extract from HTML:
- Filter tabs design (active/inactive states)
- Request cards with action buttons
- Empty states

---

### Page 10 — `/transport/my-quotes`
**Reference HTML:** `souqone_my_quotes/code.html`
**File:** `apps/web/src/app/[locale]/transport/my-quotes/page.tsx`

Extract from HTML:
- Filter tabs
- Quote cards (PENDING / ACCEPTED / REJECTED variants)
- Action buttons per status
- Empty state

---

## Phase 3 — Navigation

Add to `apps/web/src/components/layout/navbar.tsx`:
```tsx
<Link href="/transport">النقل والشحن</Link>
```

---

## Execution Order

1. Read ALL HTML files + DESIGN.md (do not skip this)
2. Setup: types + constants + api + translations + layout
3. Shared components (extract from HTML)
4. Pages in order: landing → browse → requests/[id] → new → bookings/[id] → carrier/register → carrier/dashboard → carrier/[id] → my-requests → my-quotes
5. Navbar link
6. `npm run typecheck` — fix ALL errors

---

## Critical Rules

### From Design System
- **Font:** Almarai everywhere — import in layout
- **RTL:** `dir="rtl"` in layout, never hardcode `ltr`
- **Colors:** Use exact CSS class names from the HTML Tailwind config
- **Gradients:** Copy button gradients exactly from HTML (inline style or CSS var)
- **Icons:** `<span className="material-symbols-outlined">icon_name</span>`
- **Radius:** `rounded-xl` cards, `rounded-full` pills/badges

### From Codebase
- **No `any`** in TypeScript
- **No hardcoded Arabic text** — all from `useTranslations('transport')`
- **Skeleton loading** on every async operation (`animate-pulse`)
- **Leaflet** only via `dynamic import + ssr: false`
- **Error state** via existing `<ErrorState />` component
- **Mobile-first** — every page responsive

### HTML Extraction Rule
When converting HTML to React:
- Copy class names exactly — do not simplify or change them
- Convert `class=` to `className=`
- Convert inline `style=""` to `style={{}}`
- Replace hardcoded Arabic text with translation keys
- Replace hardcoded data with real API calls
- Keep all structural `div`s and layout exactly as in HTML
