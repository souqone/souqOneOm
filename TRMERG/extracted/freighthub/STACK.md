# FreightHub — Stack Documentation

## Chosen Stack & Justification

### Framework: Next.js 15 with App Router
- **Why:** Server Components reduce JS bundle size for listing pages; App Router enables per-route loading UI and streaming; built-in image optimization for carrier avatars and cargo photos.
- **Alternative considered:** Remix — rejected due to less mature ecosystem for Arabic RTL and fewer deployment options in the Gulf region.

### Language: TypeScript (strict mode)
- **Why:** Zero `any` policy enforced. Strict typing catches route/API mismatches at compile time, critical for a marketplace where data integrity matters.

### Styling: Tailwind CSS v4
- **Why:** v4's CSS-based configuration (`@theme {}`) eliminates the JavaScript config file, reducing build complexity. The new engine is 5x faster for full builds. Native logical CSS properties (`ps`, `pe`) pair perfectly with RTL-first layouts.
- **Key decision:** All design tokens defined in `globals.css` under `@theme {}` — no `tailwind.config.js` required.

### Font: Almarai (Google Fonts)
- **Why:** Only Google Font that was designed natively for both Arabic and Latin scripts by the same type designer. Weights 400/700/800 cover all UI hierarchy needs. Non-negotiable for a Gulf-region product.
- **Implementation:** Loaded via `next/font/google` for automatic subsetting and zero layout shift.

### State Management: TanStack Query v5 + Zustand
- **TanStack Query v5** handles all server state (requests, quotes, carriers) with automatic caching, background refetch, and loading/error states. The object-based API (`useQuery({ queryKey, queryFn })`) is cleaner than v4.
- **Zustand** handles client state (auth mock, UI state like filter sheets). Lightweight alternative to Redux for this scope.

### Form Handling: React Hook Form + Zod
- **Why:** The 5-step wizard requires per-step validation without re-rendering the entire form. RHF's `trigger()` enables field-level validation on step advance. Zod schemas are reusable for both client validation and (future) API request typing.

### Icons: Lucide React
- **Why:** Tree-shakeable, consistent stroke weight, excellent RTL compatibility. Every icon used is imported individually.

### Animations: Framer Motion
- **Why:** The 5-step wizard requires smooth slide transitions between steps. Framer Motion's `AnimatePresence` and `motion.div` handle enter/exit animations cleanly with SSR compatibility.

### Toast Notifications: Sonner
- **Why:** Lightweight, beautiful, RTL-compatible toast library. Native support for `direction: rtl` via `toastOptions.style`.

---

## Project Architecture Decisions

### RTL-First
- `dir="rtl"` on `<html>` element in `layout.tsx`
- All padding/margin uses logical properties: `ps` (padding-start), `pe` (padding-end)
- Route visualization (origin → destination) uses RTL-appropriate arrow direction

### API Layer Design
- All API calls isolated in `src/features/transport/api.ts`
- Mock implementations use realistic delays (300–800ms) to simulate network latency
- Every function has a `// BACKEND INTEGRATION POINT` comment indicating where the real HTTP call goes
- Function signatures are stable — swapping mock → real only requires changing the function body

### Component Architecture
- Server Components by default; `'use client'` only where hooks or event handlers are needed
- Screen components decomposed: each section is its own file
- Shared UI primitives in `src/components/layout/` and `src/features/transport/components/`

### Mock Data Standards
- 20 transport requests across all statuses and service types
- 10 carrier profiles with realistic Arabic names and bios
- 15 quotes and 5 bookings
- All entity IDs use prefixed strings: `req-001`, `carrier-002`, `quote-003`
- All `.map()` calls use `key={item.id}` — never `key={index}`

---

## Future Integration Checklist

When connecting a real backend:

1. Set `NEXT_PUBLIC_API_URL` in `.env` to your API base URL
2. Replace each function body in `src/features/transport/api.ts` with a `fetch()` or `axios` call
3. Add proper JWT token handling (replace `useAuth()` mock in `src/lib/auth.ts`)
4. Add `next-auth` or a custom auth provider for session management
5. Replace `dicebear.com` avatar URLs with your media storage URLs
6. Enable ISR or SSR on listing pages for SEO (currently CSR for simplicity)