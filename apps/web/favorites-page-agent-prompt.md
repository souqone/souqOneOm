# Agent Prompt — Favorites Page Skeleton (Next.js + Tailwind v4 + shadcn/ui)

---

## Context

You are building the **FavoritesPage** (`/profile/favorites`) for a marketplace
platform. The page is **mobile-first**, uses **Tailwind v4** semantic color tokens,
**shadcn/ui** primitives, and renders listing cards via the existing **`<UnifiedCard />`**
component. Written in **Next.js App Router** with TypeScript.

The favorites list is **user-specific** — always behind auth guard.
The page supports **multi-category favorites** (cars, buses, equipment, jobs, transport)
displayed together or filtered by category.

---

## 1. File Structure to Create

```
app/
└── profile/
    └── favorites/
        └── page.tsx                      ← Server Component

components/
└── favorites/
    ├── FavoritesPageClient.tsx           ← "use client" — main shell
    ├── FavoritesCategoryFilter.tsx       ← Horizontal scroll filter tabs
    ├── FavoritesCategoryFilterSkeleton.tsx
    ├── FavoritesGrid.tsx                 ← Grid of <UnifiedCard /> with remove button
    ├── FavoritesGridSkeleton.tsx         ← Grid of card skeletons
    ├── FavoritesEmptyState.tsx           ← Empty / no results state
    └── FavoritesBulkActions.tsx          ← Select all / delete selected bar
```

---

## 2. Color System Rules (Tailwind v4)

Use **only** these semantic tokens — no hardcoded hex, no arbitrary values.

```
Backgrounds:
  bg-background          ← page background
  bg-surface             ← card / panel background
  bg-muted               ← skeleton base, filter pill inactive

Text:
  text-foreground        ← primary text
  text-muted-foreground  ← captions, counts, inactive tabs
  text-brand             ← active filter, link, count badge
  text-destructive       ← remove / delete actions

Border:
  border-border          ← default border
  border-brand           ← active filter pill border

Brand:
  bg-brand               ← filled buttons
  bg-brand/10            ← active filter pill background
  text-brand-foreground  ← text on filled brand bg

Danger:
  bg-destructive/10      ← remove button hover / bulk delete tint
  text-destructive
  border-destructive/20
```

---

## 3. Badges & Capsules (mirror UnifiedCard exactly)

```tsx
import { Badge } from "@/components/ui/badge"

// Category filter pills — inactive
<Badge variant="outline" className="rounded-full bg-muted text-muted-foreground border-border cursor-pointer whitespace-nowrap">
  الكل
</Badge>

// Category filter pills — active
<Badge variant="outline" className="rounded-full bg-brand/10 text-brand border-brand cursor-pointer whitespace-nowrap">
  سيارات
</Badge>

// Count badge on filter pill
<Badge variant="secondary" className="rounded-full bg-brand/10 text-brand text-xs px-1.5 py-0 min-w-4 h-4 ml-1">
  24
</Badge>

// Listing type badges (same as UnifiedCard)
<Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">بيع</Badge>
<Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">إيجار</Badge>
<Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">خدمة</Badge>
<Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">نقل</Badge>

// Listing status badge (e.g. sold / expired)
<Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
  تم البيع
</Badge>

<Badge variant="outline" className="bg-muted text-muted-foreground border-border">
  منتهي
</Badge>
```

---

## 4. Skeleton Rules

- Use `<Skeleton />` from shadcn: `import { Skeleton } from "@/components/ui/skeleton"`
- Base color: `bg-muted` only — never `bg-gray-200`
- Match exact dimensions of real elements
- Default shadcn pulse animation — no custom keyframes
- Separate files for each skeleton — never mixed into real component

```tsx
// FavoritesCategoryFilterSkeleton.tsx
export function FavoritesCategoryFilterSkeleton() {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-hidden">
      {[80, 64, 72, 60, 80].map((w, i) => (
        <Skeleton key={i} className="h-8 rounded-full flex-shrink-0" style={{ width: w }} />
      ))}
    </div>
  )
}

// FavoritesGridSkeleton.tsx
export function FavoritesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-3 flex gap-3">
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-1/3 rounded-full" />
          </div>
          {/* Remove button skeleton */}
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
```

---

## 5. All Page States to Handle

### 5.1 Loading
- Show `<FavoritesCategoryFilterSkeleton />` (pills row)
- Show `<FavoritesGridSkeleton />` (6 card skeletons)
- Header count shows `—` while loading
- Bulk actions bar hidden

### 5.2 Empty — No Favorites Yet
```tsx
// FavoritesEmptyState.tsx — variant="empty"
<div
  role="status"
  aria-label="لا توجد مفضلة"
  className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6"
>
  <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center text-4xl">
    🤍
  </div>
  <h2 className="text-foreground font-bold text-lg">لا توجد مفضلة بعد</h2>
  <p className="text-muted-foreground text-sm max-w-xs">
    اضغط على أيقونة القلب في أي إعلان لحفظه هنا
  </p>
  <Button asChild className="rounded-full bg-brand text-brand-foreground px-6 mt-2">
    <Link href="/">تصفح الإعلانات</Link>
  </Button>
</div>
```

### 5.3 Empty — Filter Has No Results
```tsx
// FavoritesEmptyState.tsx — variant="no-results"
<div
  role="status"
  aria-label="لا توجد نتائج"
  className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
>
  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
    🔍
  </div>
  <p className="text-foreground font-bold">لا توجد مفضلة في هذا القسم</p>
  <button
    onClick={clearFilter}
    className="text-brand text-sm underline underline-offset-2"
  >
    عرض الكل
  </button>
</div>
```

### 5.4 Error State
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-3xl">
    ⚠️
  </div>
  <h2 className="text-foreground font-bold text-lg">حدث خطأ</h2>
  <p className="text-muted-foreground text-sm">
    تعذر تحميل المفضلة. يرجى المحاولة مرة أخرى.
  </p>
  <Button variant="outline" onClick={retry} className="rounded-full px-6">
    إعادة المحاولة
  </Button>
</div>
```

### 5.5 Expired / Sold Listings
- Still render `<UnifiedCard />` normally
- Overlay a `تم البيع` or `منتهي` badge (section 3)
- Dim the card: `opacity-60`
- Remove button still functional
- DO NOT hide these cards — user may want to remove them manually

### 5.6 Bulk Selection Mode (multi-delete)
When user taps "تحديد":
```tsx
// Each card gets a checkbox overlay on top-right corner
<div className="relative">
  <UnifiedCard ... />
  {isSelecting && (
    <button
      onClick={() => toggleSelect(id)}
      className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10
        ${isSelected
          ? "bg-brand border-brand text-brand-foreground"
          : "bg-background border-border"
        }`}
      aria-label={isSelected ? "إلغاء التحديد" : "تحديد"}
    >
      {isSelected && <Check className="w-3 h-3" />}
    </button>
  )}
</div>
```

### 5.7 Unauthenticated
```tsx
// Redirect server-side via middleware
// If somehow reached client-side:
<div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
  <div className="text-5xl">🔐</div>
  <h2 className="text-foreground font-bold text-lg">تسجيل الدخول مطلوب</h2>
  <p className="text-muted-foreground text-sm">سجل دخولك لعرض المفضلة</p>
  <Button asChild className="rounded-full bg-brand text-brand-foreground px-6">
    <Link href="/auth/login">تسجيل الدخول</Link>
  </Button>
</div>
```

---

## 6. Component Specs

### FavoritesPageClient.tsx
State to manage:
```ts
const [activeCategory, setActiveCategory] = useState<string>("all")
const [isSelecting, setIsSelecting]       = useState(false)
const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
const [isLoading, setIsLoading]           = useState(true)
const [error, setError]                   = useState<Error | null>(null)
const [favorites, setFavorites]           = useState<Listing[]>([])
```

Derived values:
```ts
const filtered = activeCategory === "all"
  ? favorites
  : favorites.filter(f => f.category === activeCategory)

const categoryCounts = favorites.reduce((acc, f) => {
  acc[f.category] = (acc[f.category] ?? 0) + 1
  return acc
}, {} as Record<string, number>)
```

Remove favorite optimistic update:
```ts
// Remove immediately from UI, revert on API error
const handleRemove = async (id: string) => {
  const prev = favorites
  setFavorites(f => f.filter(item => item.id !== id))
  try {
    await removeFavorite(id)
  } catch {
    setFavorites(prev)
    toast.error("حدث خطأ أثناء الحذف")
  }
}
```

### FavoritesCategoryFilter.tsx
Props:
```ts
interface FavoritesCategoryFilterProps {
  active: string
  onChange: (category: string) => void
  counts: Record<string, number>   // { all: 48, cars: 24, buses: 8, ... }
}
```

Layout:
- Horizontal scroll: `flex gap-2 overflow-x-auto scrollbar-none px-4 py-3`
- No wrap — pills always in one line
- Active pill: `bg-brand/10 text-brand border-brand`
- Inactive: `bg-muted text-muted-foreground border-border`
- Each pill shows category label + count badge
- Categories: `الكل | سيارات | معدات | حافلات | وظائف | نقل`

### FavoritesGrid.tsx
Props:
```ts
interface FavoritesGridProps {
  listings: Listing[]
  isSelecting: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onRemove: (id: string) => void
}
```

- Grid: `grid grid-cols-1 gap-3 p-4 md:grid-cols-2`
- Each item wraps `<UnifiedCard />` in a `relative` div
- Remove button: absolute `top-2 right-2` (RTL — visual top-left)
  ```tsx
  <button
    onClick={() => onRemove(listing.id)}
    aria-label="إزالة من المفضلة"
    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background border border-border
               flex items-center justify-center text-muted-foreground
               hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20
               transition-all z-10"
  >
    <Heart className="w-4 h-4 fill-current text-destructive" />
  </button>
  ```
- When `listing.status === "sold" || "expired"`: wrap with `opacity-60` + badge overlay

### FavoritesBulkActions.tsx
Shown only when `isSelecting === true` — sticky bottom bar:
```tsx
<div className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border px-4 py-3 flex items-center justify-between gap-3 md:max-w-5xl md:mx-auto">
  <span className="text-muted-foreground text-sm">
    {selectedIds.size === 0
      ? "اختر إعلانات"
      : `تم تحديد ${selectedIds.size}`}
  </span>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={selectAll}
    >
      تحديد الكل
    </Button>
    <Button
      size="sm"
      className="rounded-full bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
      disabled={selectedIds.size === 0}
      onClick={handleBulkDelete}
    >
      حذف ({selectedIds.size})
    </Button>
  </div>
</div>
```

---

## 7. Page Layout Shell

```tsx
// FavoritesPageClient.tsx
<div className="min-h-screen bg-background pb-20" dir="rtl">

  {/* Sticky Header */}
  <header className="sticky top-0 z-20 bg-background border-b border-border h-14 flex items-center justify-between px-4">
    <BackButton />
    <div className="flex items-center gap-2">
      <span className="font-bold text-foreground text-base">المفضلة</span>
      {!isLoading && (
        <Badge variant="secondary" className="bg-brand/10 text-brand rounded-full">
          {favorites.length}
        </Badge>
      )}
    </div>
    <button
      onClick={() => setIsSelecting(s => !s)}
      className="text-brand text-sm font-bold min-h-11 min-w-11 flex items-center justify-center"
      aria-label={isSelecting ? "إلغاء التحديد" : "تحديد"}
    >
      {isSelecting ? "إلغاء" : "تحديد"}
    </button>
  </header>

  {/* Category Filter */}
  {isLoading
    ? <FavoritesCategoryFilterSkeleton />
    : <FavoritesCategoryFilter
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />
  }

  {/* Content */}
  <main id="main-content">
    {isLoading ? (
      <FavoritesGridSkeleton />
    ) : error ? (
      <ErrorState onRetry={refetch} />
    ) : favorites.length === 0 ? (
      <FavoritesEmptyState variant="empty" />
    ) : filtered.length === 0 ? (
      <FavoritesEmptyState variant="no-results" onClear={() => setActiveCategory("all")} />
    ) : (
      <FavoritesGrid
        listings={filtered}
        isSelecting={isSelecting}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onRemove={handleRemove}
      />
    )}
  </main>

  {/* Bulk Actions Bar */}
  {isSelecting && (
    <FavoritesBulkActions
      selectedIds={selectedIds}
      total={filtered.length}
      onSelectAll={selectAll}
      onDelete={handleBulkDelete}
    />
  )}

</div>
```

---

## 8. Server Component

```tsx
// app/profile/favorites/page.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { getFavorites } from "@/lib/api/favorites"
import { FavoritesPageClient } from "@/components/favorites/FavoritesPageClient"

export default async function FavoritesPage() {
  const session = await getServerSession()
  if (!session) redirect("/auth/login?from=/profile/favorites")

  const favorites = await getFavorites(session.userId).catch(() => [])

  return <FavoritesPageClient initialFavorites={favorites} />
}

export const metadata = {
  title: "المفضلة",
  description: "الإعلانات التي حفظتها",
}
```

---

## 9. Optimistic Updates Pattern

All mutations must be **optimistic** — update UI first, revert on error:

```ts
// Remove single
const handleRemove = async (id: string) => {
  const snapshot = favorites
  setFavorites(prev => prev.filter(f => f.id !== id))
  try {
    await api.removeFavorite(id)
  } catch {
    setFavorites(snapshot)
    toast.error("حدث خطأ، أعد المحاولة")
  }
}

// Bulk delete
const handleBulkDelete = async () => {
  const ids = [...selectedIds]
  const snapshot = favorites
  setFavorites(prev => prev.filter(f => !selectedIds.has(f.id)))
  setSelectedIds(new Set())
  setIsSelecting(false)
  try {
    await api.bulkRemoveFavorites(ids)
    toast.success(`تم حذف ${ids.length} إعلانات`)
  } catch {
    setFavorites(snapshot)
    toast.error("حدث خطأ أثناء الحذف")
  }
}
```

---

## 10. Accessibility & UX Rules

- All interactive elements: `min-h-11 min-w-11`
- Remove button: `aria-label="إزالة من المفضلة"`
- Select button: `aria-label="تحديد"` / `aria-label="إلغاء التحديد"`
- Checkbox overlays: `aria-pressed={isSelected}`
- Category filter: `role="tablist"` on wrapper, `role="tab"` on each pill
- Empty states: `role="status"` with descriptive `aria-label`
- Skeleton wrapper: `role="status" aria-label="جاري التحميل"` + children `aria-hidden="true"`
- Bulk bar when visible: `aria-live="polite"` on count span

---

## 11. Hard Rules — Do NOT Violate

- ❌ No `gray-*` colors — semantic tokens only
- ❌ No new badge styles — mirror UnifiedCard variants exactly
- ❌ No skeleton JSX inside real component files
- ❌ No `useEffect` for initial data — use `initialFavorites` prop
- ❌ No data fetching in Client Components
- ❌ No multi-column on mobile — single column always
- ❌ No `flex-wrap` on category filter — horizontal scroll only
- ❌ No hardcoded Arabic strings in reusable components
- ❌ No blocking UI on remove — always optimistic
- ❌ No inline styles — Tailwind only
- ❌ Bulk actions bar must be `fixed bottom-0` — never in flow
