# Agent Prompt — Seller Page Skeleton (Next.js + Tailwind v4 + shadcn/ui)

---

## Context

You are building the **SellerPage** (`/seller/[id]`) for a marketplace platform
similar to Dubizzle. The page is **mobile-first**, uses **Tailwind v4** utility
classes, **shadcn/ui** primitives, and must consume the existing **`<UnifiedCard />`**
component for all listing cards. The page is written in **Next.js App Router**
with TypeScript.

---

## 1. File Structure to Create

```
app/
└── seller/
    └── [id]/
        └── page.tsx                  ← Server Component (data fetch + passes to client)

components/
└── seller/
    ├── SellerPageClient.tsx          ← "use client" — main shell
    ├── SellerHero.tsx                ← Avatar + stats + CTAs
    ├── SellerHeroSkeleton.tsx        ← Loading state of hero
    ├── SellerTabs.tsx                ← Tabs controller (listings / reviews / info)
    ├── SellerListingsTab.tsx         ← Grid of <UnifiedCard />
    ├── SellerListingsTabSkeleton.tsx ← Grid of card skeletons
    ├── SellerReviewsTab.tsx          ← Rating summary + review list
    ├── SellerReviewsTabSkeleton.tsx  ← Skeleton for reviews
    ├── SellerInfoTab.tsx             ← Static seller info rows
    ├── SellerInfoTabSkeleton.tsx     ← Skeleton for info rows
    ├── SellerSidebar.tsx             ← Desktop sticky CTA sidebar
    └── SellerSidebarSkeleton.tsx     ← Skeleton for sidebar
```

---

## 2. Color System Rules (Tailwind v4)

Use **only** the following semantic tokens from the project's Tailwind v4 config.
Do not hardcode hex values. Do not use arbitrary color values like `bg-[#123]`.

```
Backgrounds:
  bg-background          ← page background
  bg-surface             ← card / panel background
  bg-surface-raised      ← elevated card (e.g. sidebar)
  bg-muted               ← subtle section background (e.g. skeleton base)

Text:
  text-foreground        ← primary text
  text-muted-foreground  ← secondary / caption text
  text-brand             ← primary brand color (buttons, active tabs, links)
  text-destructive       ← red / danger (report button)

Border:
  border-border          ← default border
  border-brand           ← brand-colored border (outlined buttons)

Brand:
  bg-brand               ← filled brand button
  bg-brand/10            ← brand tint (badge backgrounds, hero gradient)
  text-brand-foreground  ← text on filled brand buttons

States:
  bg-destructive/10      ← danger badge tint
  text-destructive
```

---

## 3. Badges & Capsules (mirror UnifiedCard exactly)

All badges MUST match the exact variant system used inside `<UnifiedCard />`.
Import the badge from shadcn: `import { Badge } from "@/components/ui/badge"`.

```tsx
// Listing type badges
<Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
  بيع
</Badge>

<Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
  إيجار
</Badge>

<Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
  خدمة
</Badge>

<Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
  نقل
</Badge>

// Seller status capsule
<Badge variant="secondary" className="bg-brand/10 text-brand rounded-full px-3">
  محقق ✓
</Badge>

// Online indicator capsule
<Badge variant="outline" className="rounded-full border-green-300 bg-green-500/10 text-green-600 text-xs gap-1">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
  متاح الآن
</Badge>
```

---

## 4. Skeleton Rules

- Use `<Skeleton />` from shadcn: `import { Skeleton } from "@/components/ui/skeleton"`
- Skeleton base: `bg-muted` — do NOT use `bg-gray-200`
- Every skeleton must match the **exact dimensions** of the real element it replaces
- Animate with the default shadcn pulse — do not add custom animations
- Skeleton components are **separate files** (e.g. `SellerHeroSkeleton.tsx`) —
  never mix skeleton JSX with real content JSX in the same return

```tsx
// Example — SellerHeroSkeleton.tsx
export function SellerHeroSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-5 pb-4 bg-brand/5">
      <Skeleton className="w-20 h-20 rounded-2xl" />
      <Skeleton className="h-5 w-36 rounded-full" />
      <Skeleton className="h-4 w-24 rounded-full" />
      <div className="flex gap-6 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-6 w-10 rounded" />
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full mt-2">
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="w-11 h-11 rounded-xl" />
      </div>
    </div>
  );
}
```

---

## 5. All Page States to Handle

### 5.1 Loading State
- Show `<SellerHeroSkeleton />` in place of hero
- Show `<SellerListingsTabSkeleton />` (6 card skeletons in a grid)
- Show `<SellerSidebarSkeleton />` on desktop
- Tabs bar still renders but is disabled (`pointer-events-none opacity-50`)

### 5.2 Error State
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-3xl">
    ⚠️
  </div>
  <h2 className="text-foreground font-bold text-lg">حدث خطأ</h2>
  <p className="text-muted-foreground text-sm">
    تعذر تحميل صفحة البائع. يرجى المحاولة مرة أخرى.
  </p>
  <Button variant="outline" onClick={retry} className="rounded-full px-6">
    إعادة المحاولة
  </Button>
</div>
```

### 5.3 Not Found State
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="text-6xl">🔍</div>
  <h2 className="text-foreground font-bold text-lg">البائع غير موجود</h2>
  <p className="text-muted-foreground text-sm">
    ربما تم حذف هذا الحساب أو الرابط غير صحيح.
  </p>
  <Button asChild className="rounded-full bg-brand text-brand-foreground px-6">
    <Link href="/">العودة للرئيسية</Link>
  </Button>
</div>
```

### 5.4 Empty Listings Tab
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">
    📭
  </div>
  <p className="text-foreground font-bold">لا توجد إعلانات</p>
  <p className="text-muted-foreground text-sm">لم يقم هذا البائع بنشر أي إعلانات بعد</p>
</div>
```

### 5.5 Empty Reviews Tab
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">
    ⭐
  </div>
  <p className="text-foreground font-bold">لا توجد تقييمات بعد</p>
  <p className="text-muted-foreground text-sm">كن أول من يقيّم هذا البائع</p>
</div>
```

### 5.6 Suspended / Banned Seller
```tsx
// Banner above hero
<div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center gap-3">
  <span className="text-destructive text-xl">🚫</span>
  <p className="text-destructive text-sm font-bold">
    هذا الحساب موقوف مؤقتاً ولا يمكن التواصل معه
  </p>
</div>
```

---

## 6. Component Specs

### SellerHero.tsx
Props:
```ts
interface SellerHeroProps {
  seller: {
    id: string
    name: string
    avatarUrl?: string
    isVerified: boolean
    isOnline: boolean
    memberSince: string       // formatted: "يناير 2022"
    rating: number            // 0-5
    reviewCount: number
    listingsCount: number
    responseRate: number      // 0-100
    isSuspended?: boolean
  }
  onMessage: () => void
  onCall: () => void
  onShare: () => void
  onSave: () => void
  isSaved: boolean
}
```

Layout rules:
- Mobile: `flex-col items-center text-center`
- Desktop (md+): `flex-row items-start gap-5`
- CTA buttons: visible on mobile below stats, `md:hidden` (sidebar handles desktop)
- Avatar: `w-20 h-20 rounded-2xl`, fallback = first letter on `bg-brand/20 text-brand`
- Verified badge: absolute bottom-left of avatar, `bg-green-400 rounded-full w-6 h-6`
- Online dot: next to name, `w-2 h-2 rounded-full bg-green-500` when `isOnline`
- Stats row: 3 items (rating / listings count / response rate) separated by `w-px bg-border`

### SellerTabs.tsx
Use shadcn `<Tabs>` primitive:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
```
- Default value: `"listings"`
- `TabsList`: `w-full grid grid-cols-3 rounded-none bg-background`
- `TabsTrigger`: `rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none`
- Sticky: `sticky top-14 z-10 bg-background border-b border-border`
- Show count in parens when loaded: `إعلاناته (150)` — omit count when `isLoading`

### SellerListingsTab.tsx
- Render `<UnifiedCard />` for each listing — pass all props from API as-is
- Grid: `grid grid-cols-1 gap-3 p-4` mobile, `md:grid-cols-2` desktop
- "Load more" button at bottom: `<Button variant="outline" className="w-full rounded-xl mt-2">`
- Handle empty state (section 5.4 above)

### SellerReviewsTab.tsx
Two sections:
1. Rating summary card: overall score + star breakdown bars
2. List of review cards: avatar initial + name + date + star row + text
- Rating bars use `bg-brand` for fill, `bg-muted` for track
- Review card: `bg-surface border border-border rounded-2xl p-4`

### SellerSidebar.tsx (desktop only — `hidden md:block`)
```tsx
<aside className="hidden md:block w-72 flex-shrink-0 p-4 sticky top-14 h-fit">
  <div className="bg-surface-raised border border-border rounded-2xl p-4 space-y-3">
    <h3 className="font-bold text-foreground">تواصل مع البائع</h3>

    <Button className="w-full rounded-xl bg-brand text-brand-foreground" onClick={onMessage}>
      💬 إرسال رسالة
    </Button>

    <Button variant="outline" className="w-full rounded-xl border-brand text-brand" onClick={onCall}>
      📞 اتصال مباشر
    </Button>

    <Button variant="ghost" className="w-full rounded-xl" onClick={onShare}>
      🔗 مشاركة الصفحة
    </Button>

    <Separator />

    <p className="text-muted-foreground text-xs text-center">
      🟢 متاح الآن — يرد خلال أقل من ساعة
    </p>
  </div>

  <button className="w-full mt-3 text-destructive text-xs py-2 hover:underline">
    ⚠️ الإبلاغ عن هذا البائع
  </button>
</aside>
```

---

## 7. Responsive Layout Shell

```tsx
// SellerPageClient.tsx
<div className="min-h-screen bg-background" dir="rtl">
  {/* Sticky header */}
  <header className="sticky top-0 z-20 bg-background border-b border-border h-14 flex items-center justify-between px-4">
    <BackButton />
    <span className="font-bold text-foreground text-base">صفحة البائع</span>
    <SaveButton isSaved={isSaved} onToggle={handleSave} />
  </header>

  {seller?.isSuspended && <SuspendedBanner />}

  <div className="md:flex md:flex-row-reverse md:max-w-5xl md:mx-auto">
    {/* Desktop sidebar */}
    <aside className="hidden md:block md:w-72 md:flex-shrink-0 p-4">
      {isLoading ? <SellerSidebarSkeleton /> : <SellerSidebar {...sidebarProps} />}
    </aside>

    {/* Main content */}
    <main className="flex-1 min-w-0" id="main-content">
      {isLoading ? <SellerHeroSkeleton /> : <SellerHero {...heroProps} />}
      <SellerTabs isLoading={isLoading} seller={seller} />
    </main>
  </div>
</div>
```

---

## 8. Server Component & Metadata

```tsx
// app/seller/[id]/page.tsx
import { notFound } from "next/navigation"
import { getSellerById } from "@/lib/api/sellers"
import { SellerPageClient } from "@/components/seller/SellerPageClient"

export default async function SellerPage({
  params,
}: {
  params: { id: string }
}) {
  const seller = await getSellerById(params.id).catch(() => null)
  if (!seller) notFound()
  return <SellerPageClient initialSeller={seller} />
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const seller = await getSellerById(params.id).catch(() => null)
  return {
    title: seller ? `${seller.name} — إعلانات البائع` : "بائع غير موجود",
    description: seller
      ? `تصفح ${seller.listingsCount} إعلان من ${seller.name}`
      : "",
  }
}
```

---

## 9. Accessibility & UX Rules

- All interactive elements: `min-h-11 min-w-11` (touch target)
- Icon-only buttons must have `aria-label` in Arabic
- `<main>` has `id="main-content"`
- Skeleton wrappers: `role="status" aria-label="جاري التحميل"` + children `aria-hidden="true"`
- Empty state divs: `role="status"`
- All images: meaningful `alt` — avatar fallback renders first letter, not `<img>`
- Tab order follows RTL reading order (right to left)

---

## 10. Hard Rules — Do NOT Violate

- ❌ No `gray-*` colors — semantic tokens only
- ❌ No new badge styles — copy UnifiedCard badge variants exactly
- ❌ No skeleton JSX mixed into real component files
- ❌ No arbitrary spacing `px-[value]` — use Tailwind scale
- ❌ No data fetching in Client Components — Server Component passes `initialData`
- ❌ No `useEffect` for initial load — use `initialSeller` prop
- ❌ No multi-column layout on mobile — single column always
- ❌ No hardcoded Arabic strings in reusable components — props or i18n keys
- ❌ No inline styles — Tailwind classes only
