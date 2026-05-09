---
name: SouqOne
description: >
  The Editorial Marketplace — an Arabic-first, RTL automotive & logistics
  marketplace for Oman. Connects buyers, sellers, carriers, employers and
  job-seekers across cars, buses, equipment, transport, spare parts, and
  driver jobs. Branding conveys institutional authority and trustworthiness
  through deep navy + royal blue, with an energetic orange accent.

colors:
  # ── Primary — Deep Authoritative Blue ──
  primary: "#004ac6"
  on-primary: "#ffffff"
  primary-container: "#2563eb"
  on-primary-container: "#ffffff"
  primary-fixed: "#dbeafe"
  primary-fixed-dim: "#3b82f6"
  on-primary-fixed: "#001d5c"
  on-primary-fixed-variant: "#003a9e"

  # ── Secondary — Slate (subtle UI chrome) ──
  secondary: "#475569"
  on-secondary: "#ffffff"
  secondary-container: "#e2e8f0"
  on-secondary-container: "#334155"
  secondary-fixed: "#cbd5e1"
  secondary-fixed-dim: "#94a3b8"
  on-secondary-fixed: "#0f172a"
  on-secondary-fixed-variant: "#2a3a52"

  # ── Tertiary — Warm Orange (high-energy accent) ──
  tertiary: "#E8781E"
  on-tertiary: "#ffffff"
  tertiary-container: "#FFF7ED"
  on-tertiary-container: "#9A3412"
  tertiary-fixed: "#FFEDD5"
  tertiary-fixed-dim: "#FB923C"
  on-tertiary-fixed: "#431A00"
  on-tertiary-fixed-variant: "#C2410C"

  # ── Brand extras ──
  brand-navy: "#0B2447"
  brand-amber: "#E8781E"
  brand-green: "#16a34a"
  price-green: "#16a34a"

  # ── Error ──
  error: "#dc2626"
  on-error: "#ffffff"
  error-container: "#fef2f2"
  on-error-container: "#991b1b"

  # ── Surfaces — Light Mode (cool gray with blue tint) ──
  background: "#F5F7FA"
  on-background: "#111827"
  surface: "#F5F7FA"
  surface-dim: "#EBEEF3"
  surface-bright: "#FCFDFE"
  surface-container-lowest: "#FAFBFC"
  surface-container-low: "#EEF0F5"
  surface-container: "#F0F2F6"
  surface-container-high: "#E3E7ED"
  surface-container-highest: "#D6DBE3"
  surface-variant: "#ECF0F5"
  surface-tint: "#004ac6"
  on-surface: "#111827"
  on-surface-variant: "#4B5563"

  # ── Outline ──
  outline: "#9CA3AF"
  outline-variant: "#E2E6EC"

  # ── Inverse ──
  inverse-surface: "#0f172a"
  inverse-on-surface: "#f1f5f9"
  inverse-primary: "#60a5fa"

  # ── Dark Mode Overrides (Deep Navy) ──
  dark-primary: "#60a5fa"
  dark-primary-container: "#1e40af"
  dark-background: "#060e1e"
  dark-surface: "#0a1628"
  dark-surface-dim: "#060e1e"
  dark-surface-bright: "#1e2e48"
  dark-surface-container-lowest: "#060e1e"
  dark-surface-container-low: "#0c1628"
  dark-surface-container: "#0f1a2e"
  dark-surface-container-high: "#162240"
  dark-surface-container-highest: "#1e2e4a"
  dark-surface-variant: "#1a2844"
  dark-on-surface: "#e2e8f0"
  dark-on-surface-variant: "#94a3b8"
  dark-outline: "#475569"
  dark-outline-variant: "#334155"
  dark-price-green: "#34d399"

typography:
  font-headline: "'Almarai', sans-serif"
  font-body: "'Almarai', sans-serif"
  font-weights:
    light: 300
    regular: 400
    bold: 700
    black: 800
  scale:
    xs:   "10px"
    sm:   "11px"
    base: "12px"
    md:   "13px"
    lg:   "14px"
    xl:   "16px"
    2xl:  "17px"
    3xl:  "20px"
    hero-sm: "24px"
    hero-md: "30px"
    hero-lg: "36px"
  line-height-body: 1.7
  line-height-heading: 1.4
  rtl: true
  direction: rtl

radii:
  sm:  "4px"
  md:  "12px"
  lg:  "12px"
  xl:  "12px"
  2xl: "12px"
  3xl: "16px"
  4xl: "16px"
  5xl: "16px"
  full: "9999px"

spacing:
  base-unit: "4px"
  page-max-width: "1280px"   # max-w-7xl
  page-padding-x-sm: "12px"  # px-3
  page-padding-x-md: "24px"  # px-6
  page-padding-x-lg: "40px"  # px-10

elevation:
  card: "0 1px 3px rgba(15,23,42,0.06)"
  card-hover: "0 8px 24px rgba(15,23,42,0.06)"
  ambient: "0 8px 24px rgba(15,23,42,0.06)"
  dark-card-hover: "0 8px 32px rgba(96,165,250,0.06)"
  focus-ring: "0 0 0 2px rgba(0,74,198,0.25)"
  focus-ring-dark: "0 0 0 2px rgba(96,165,250,0.30)"

motion:
  # Micro-interactions
  slide-up:
    duration: "300ms"
    easing: "ease-out"
    from: "translateY(1rem) + opacity:0"
    to: "translateY(0) + opacity:1"
  page-enter:
    duration: "350ms"
    easing: "ease-out"
    from: "translateY(20px) + opacity:0"
  hero-entrance:
    duration: "600ms"
    keyframes: "scale(0.92) translateY(12px) blur(8px) → scale(1) translateY(0) blur(0)"
  hero-float:
    duration: "3s"
    easing: "ease-in-out"
    loop: infinite
    lift: "6px"
  auth-modal:
    duration: "280ms"
    easing: "cubic-bezier(0.32, 0.72, 0, 1)"
    mobile: "slideUp from bottom"
    desktop: "fade + translateY(20px)"
  skeleton-shimmer:
    duration: "1.5s"
    easing: "linear"
    loop: infinite
    pattern: "200% background-position sweep"
  dropdown-in:
    duration: "200ms"
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    from: "translateY(-6px) + opacity:0"
  card-enter:
    duration: "220ms"
    easing: "ease-out"
    from: "translateY(8px) + opacity:0"
  pulse-ring:
    duration: "2s"
    easing: "ease-out"
    loop: infinite
    scale-to: 1.9
  heart-pop:
    duration: "300ms"
    keyframes: "scale(1) → scale(1.35) → scale(0.9) → scale(1.15) → scale(1)"
  marquee:
    duration: "60s"
    easing: "linear"
    loop: infinite
  reduced-motion: "disable all non-essential animations"

icons:
  library: "Material Symbols Outlined"
  font-variation-settings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
  filled-variation: "'FILL' 1"
  vertical-align: "middle"

layout:
  navbar-top-height: "56px"
  navbar-bottom-height: "46px"
  navbar-total-height: "102px"
  bottom-nav-height: "80px"         # mobile only, < 1024px
  bottom-nav-content-padding: "80px"
  sidebar-width: "288px"            # w-72
  sidebar-sticky-top: "80px"        # top-20

components:
  card:
    bg-light: "surface-container-lowest"
    bg-dark: "surface-container"
    border: "border-outline-variant/10"
    radius: "rounded-2xl"
    shadow: "shadow-sm"
    hover-shadow: "shadow-lg shadow-black/[0.06]"
    hover-border: "border-outline-variant/20"
    padding: "p-4 md:p-5"

  glass-card:
    background: "rgba(255,255,255,0.80)"
    backdrop-filter: "blur(12px)"
    border: "1px solid rgba(226,232,240,0.15)"
    dark-background: "surface-container"
    dark-border: "rgba(148,163,184,0.12)"

  glass-nav:
    desktop-background: "linear-gradient(135deg, rgba(245,247,250,0.85), rgba(235,240,251,0.82), rgba(240,242,246,0.85))"
    desktop-backdrop: "blur(24px) saturate(1.4)"
    desktop-border: "rgba(255,255,255,0.5)"
    mobile-background: "surface"
    dark-desktop-background: "linear-gradient(135deg, rgba(12,15,26,0.88), rgba(16,21,40,0.85), rgba(14,18,32,0.88))"

  button-primary:
    background: "linear-gradient(135deg, #004ac6, #2563eb)"
    color: "#ffffff"
    radius: "0.75rem"
    dark-background: "linear-gradient(135deg, #2563eb, #3b82f6)"
    dark-glow: "0 0 20px rgba(59,130,246,0.2)"

  button-brand:
    background: "linear-gradient(135deg, #e54d00, #fe5e00, #ff7a2e)"
    color: "#ffffff"
    radius: "0.75rem"
    shadow: "0 2px 8px rgba(254,94,0,0.25)"

  button-success:
    background: "linear-gradient(135deg, #059669, #10b981)"
    color: "#ffffff"
    radius: "0.75rem"

  button-danger:
    background: "#dc2626"
    color: "#ffffff"
    radius: "0.75rem"

  badge-verified:
    background: "primary-container"
    color: "on-primary-fixed"
    padding: "0.15rem 0.6rem"
    font-size: "0.7rem"
    font-weight: 900
    text-transform: "uppercase"
    radius: "4px"

  auth-input:
    height: "34px"
    background: "#fafafa"
    border: "0.5px solid #e0e0e0"
    radius: "10px"
    padding-inline: "12px"
    font-size: "12px"
    focus-border: "#1a3a8f"

  skeleton:
    background: "linear-gradient(90deg, surface-container 25%, surface-container-high 50%, surface-container 75%)"
    animation: "shimmer 1.5s infinite"
---

# SouqOne — Design System

## Brand Identity

SouqOne ("سوق وان") is an Arabic-first, RTL-native marketplace operating in Oman. The brand voice is **authoritative yet accessible** — a trusted institutional partner rather than a casual consumer app. Deep navy and royal blue anchor the identity in trust and professionalism, while warm orange injects urgency and energy wherever conversion matters (CTAs, price highlights, featured badges).

## Color System

The palette uses **Material Design 3 role semantics** layered over a custom Oman-market color scheme.

### Light Mode — Editorial Canvas
The default surface is a cool blue-tinted near-white (`#F5F7FA`) rather than pure white, giving the page a calm editorial quality. Surface layers stack from `lowest` → `low` → `container` → `high` → `highest` in ascending warmth, creating natural hierarchy without heavy shadows.

### Dark Mode — Deep Navy Immersion
Dark mode drops into deep navy (`#060e1e` background), entirely avoiding the generic charcoal/gray dark modes common in consumer apps. The experience feels like a premium dashboard or editorial night mode — almost subaquatic. The primary accent shifts from royal blue to blue-400 (`#60a5fa`) to maintain contrast on dark backgrounds.

### Accent Usage
- **Royal Blue (`#004ac6`)** — primary actions, active states, brand recognition
- **Deep Navy (`#0B2447`)** — hero gradients, footer, overlay backdrops
- **Orange (`#E8781E`)** — urgent CTAs, brand-flavor buttons, sale/hot badges
- **Price Green (`#16a34a`)** — salary figures, positive status, success states

## Typography

The **Almarai** typeface (Google Fonts, Arabic subset) is used exclusively across the entire product — both Arabic and English content. This ensures consistent letter-spacing and RTL rendering without typeface context-switching. Available weights: 300 (light), 400 (regular), 700 (bold), 800 (black/display).

Text scale does not map to named semantic sizes in the traditional sense. Instead, inline `text-[Npx]` values are used for surgical precision, clustered around:
- **9–11px** — metadata, labels, captions, filter chips
- **12–13px** — body copy, card content, button labels
- **14–16px** — section headings, emphasized text
- **24–40px** — hero headlines (responsive, `text-2xl` → `text-4xl`)

**Black (800)** weight is used liberally for numbers, prices, and key data points to make scannable metrics pop against body copy.

## Spacing & Layout

The page layout is max-width-capped at **1280px** (`max-w-7xl`) with horizontal gutters of 12px (mobile) → 24px (tablet) → 40px (desktop). The RTL document flow means all logical properties (`ps`/`pe`, `ms`/`me`, `start`/`end`) are preferred over physical (`pl`/`pr`).

The navbar is two-tiered at a fixed combined height of **102px**: a 56px brand/auth tier on top and a 46px navigation links tier below. On mobile (< 1024px), the glass effect is dropped for a solid surface nav to avoid performance issues on lower-end devices.

A persistent **bottom navigation bar** (80px) occupies the bottom of the screen on mobile, so all `<main>` elements carry `padding-bottom: 80px` unless opted out with `.no-bottom-pad`.

## Border Radius

Radii follow a **deliberately compressed scale** — `md` through `2xl` all resolve to `12px`, and `3xl`–`5xl` to `16px`. This means most cards, inputs, buttons, and panels share the same apparent roundness, creating visual cohesion. Only `sm` (4px) diverges for dense metadata badges. Pill shapes (`rounded-full`) are reserved for user avatars, status indicators, and count badges.

## Elevation & Depth

Depth is expressed primarily through **border opacity** rather than aggressive shadow stacking. The default card border is `border-outline-variant/10` (very faint), which lifts to `/20` on hover. Actual box-shadows are soft and low-contrast (`shadow-sm` default, `shadow-lg` on hover) so they recede into the blue-tinted surfaces naturally.

The glassmorphism layer (`glass-card`, `glass-nav`) uses `backdrop-blur(12–24px)` with semi-transparent fills. This is desktop-only for the navbar; mobile falls back to solid surface to protect performance.

## Iconography

All icons come from **Material Symbols Outlined** loaded via Google Fonts CDN. The variation axis defaults are: FILL=0, wght=400, GRAD=0, opsz=24. Filled variants (`'FILL' 1`) are used selectively for active/selected states and important call-to-action icons (verified badges, send buttons). Icons are `vertical-align: middle` to sit correctly in Arabic text runs.

## Motion & Animation

Motion serves two purposes: **orientation** (where am I, what just changed) and **delight** (heartbeat on favorite, float on hero CTA). The timing philosophy is:

- **Entrances** are quick (200–350ms) with slight upward travel (`translateY`), never bouncy
- **Hero elements** use a cinematic entrance: scale-up from 0.92 + blur dissolve (600ms)
- **Skeleton loading** uses a horizontal shimmer sweep (1.5s linear, infinite)
- **Auth bottom sheet** on mobile uses a custom spring (`cubic-bezier(0.32, 0.72, 0, 1)`) that feels native on iOS/Android
- **Marquee** carousels run at 60s for a slow, editorial feel rather than a scrolling ticker

All non-essential animations respect `prefers-reduced-motion` and are disabled entirely.

## RTL-First Design

The entire layout is built RTL-first, serving Arabic as the primary locale. Key conventions:

- `dir="rtl"` is set on `<html>` for Arabic; `dir="ltr"` for English — no per-component toggling needed
- Directional icons (chevrons, arrows) use `.icon-flip` to mirror automatically when locale is LTR
- Marquee animations have a separate `marquee-rtl` keyframe for the Arabic direction
- Arabic placeholder text in inputs maintains `direction: rtl; text-align: right` via a global rule even in `dir="auto"` inputs

## Component Patterns

### Cards
The canonical listing card uses `bg-surface-container-lowest` with a faint `border-outline-variant/10` border, `rounded-2xl`, and `shadow-sm`. Hover lifts the shadow to `shadow-lg` and brightens the border to `/20`. Padding is `p-4` (mobile) / `p-5` (desktop). Cards are fully self-contained with avatar, meta-chips, salary/price, and role-aware action buttons at the bottom.

### Filter Sidebar
Desktop sidebar is `w-72` (288px), sticky at `top-20`, inside a card container. Filter sections use uppercase 11px labels. Dropdowns (`<select>`) use `rounded-xl` with the standard surface-container-low fill. Toggle buttons use a `grid grid-cols-2` layout for compact two-per-row display.

### Buttons
Buttons use gradient fills (`linear-gradient(135deg, ...)`) rather than flat colors, giving a subtle sense of dimensionality. The primary gradient goes `#004ac6` → `#2563eb`. Dark mode adds a soft glow shadow instead of a gradient shift. All buttons use `border-radius: 0.75rem` (12px) for consistency with card corners.

### Skeleton Loading
Skeletons use the `skeleton-pulse` utility — a 200%-wide background gradient that slides across in 1.5s. In dark mode the gradient colors shift to `surface-container` tones.

### Glass Navigation
The navbar uses triple-stop gradients in light mode to blend into the blue-tinted canvas without a hard edge. Saturate(1.4) intensifies the frosted-glass effect. On dark, the gradient uses very low alpha navy values so star/content layers bleed through subtly.

### Auth Flows
The auth sheet (mobile) slides up from the bottom with a native-feeling spring curve. On desktop it centers as a modal with a fade + small translateY entrance. A drag handle (`36×4px`, `#e0e0e0`) is shown on mobile but hidden on desktop. Input height is fixed at 34–36px for tight vertical rhythm in the 3-section registration form.

### Safe Areas
The layout uses CSS `env(safe-area-inset-*)` for iPhone notch/Dynamic Island (`.safe-area-top`) and home-indicator clearance (`.safe-area-bottom`), ensuring content is never obscured on modern iOS devices.
