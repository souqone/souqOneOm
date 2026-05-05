# Agent Prompt — Profile Page (Next.js + Tailwind v4 + shadcn/ui)

---

## Context

You are building the **ProfilePage** (`/profile`) for **SouqOne** — an Omani vehicle
marketplace. The page is **mobile-first**, uses **Tailwind v4** semantic tokens,
**shadcn/ui** primitives, and must reuse:

- **`<UnifiedCard />`** — for listing cards (exact same card used across the platform)
- **`<ListingCard />`** — for compact row-style listing display
- **`<VerifiedBadge />`** — the blue "موثق ✓" shield badge from the seller cards

The app has a **fixed bottom navigation bar** (83px including safe area).
All scrollable content must account for this with `pb-24` on mobile.

The page is **auth-protected** — always behind `<AuthGuard />`.
Written in **Next.js App Router** with TypeScript and `next-intl` for i18n.

---

## 1. File Structure to Create

```
app/[locale]/
└── profile/
    └── page.tsx                          ← Server Component + AuthGuard

components/
└── profile/
    ├── ProfilePageClient.tsx             ← "use client" — main shell
    ├── ProfileHero.tsx                   ← Cover + Avatar + Name + Stats + Pills
    ├── ProfileHeroSkeleton.tsx           ← Loading skeleton for hero
    ├── ProfileNavTabs.tsx                ← Horizontal scroll tabs (mobile) / Sidebar nav (desktop)
    ├── ProfileNavTabsSkeleton.tsx
    ├── ProfileOverviewTab.tsx            ← Default tab: recent listings + settings cards
    ├── ProfileListingsTab.tsx            ← Full listings grid using <UnifiedCard />
    ├── ProfileListingsTabSkeleton.tsx    ← 4 card skeletons
    ├── ProfileBookingsTab.tsx            ← Bookings list (summary cards)
    ├── ProfileBookingsTabSkeleton.tsx
    ├── ProfileSettingsCard.tsx           ← Reusable settings row card
    └── ProfileVerificationStatus.tsx    ← Verification pills row
```

---

## 2. Color System (Tailwind v4 — semantic tokens only)

```
NEVER use hardcoded hex values or gray-* classes directly.

Backgrounds:
  bg-background                ← page bg (#f4f6fb equivalent)
  bg-surface-container-lowest  ← card bg (white)
  bg-surface-container-low     ← hover state
  bg-surface-container-high    ← skeleton base / muted areas
  bg-primary/10                ← brand tint backgrounds

Text:
  text-on-surface              ← primary text
  text-on-surface-variant      ← secondary / captions
  text-primary                 ← brand blue (links, active states, prices)
  text-error                   ← danger / delete / logout

Border:
  border-outline-variant/15    ← default card border
  border-outline-variant/30    ← hover border
  border-primary/30            ← active / focused border

Brand buttons:
  bg-primary                   ← filled CTA
  text-on-primary              ← text on filled button
  shadow-primary/20            ← brand shadow

Danger:
  bg-error/5                   ← danger hover bg
  text-error
  border-error/30
```

---

## 3. Cards — Use Existing Components (Do NOT recreate)

### UnifiedCard
Import and use as-is for the listings grid:
```tsx
import { UnifiedCard } from "@/features/listings/components/UnifiedCard"

// Pass all props from API response directly
<UnifiedCard
  item={listing}
  listingType={listing.listingType}  // "SALE" | "RENT" | "SERVICE" | "TRANSPORT"
/>
```

### ListingCard (compact row)
Use for the "آخر إعلاناتي" section in the overview tab:
```tsx
import { ListingCard } from "@/features/ads/components/ListingCard"

<ListingCard
  item={listing}
  showActions     // shows edit + delete buttons
  onEdit={() => router.push(`/edit-listing/car/${listing.id}`)}
  onDelete={() => handleDelete(listing.id)}
/>
```

### VerifiedBadge
Use the exact same badge component used in UnifiedCard and seller cards:
```tsx
import { VerifiedBadge } from "@/components/verified-badge"

// Renders: blue shield + "موثق" text
<VerifiedBadge />
```

---

## 4. Listing Type Badges (mirror UnifiedCard exactly)

```tsx
import { Badge } from "@/components/ui/badge"

// These MUST match what's used inside UnifiedCard:
<Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">بيع</Badge>
<Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">إيجار</Badge>
<Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">خدمة</Badge>
<Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">نقل</Badge>

// Status badges:
<Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">نشط</Badge>
<Badge variant="outline" className="bg-surface-container-high text-on-surface-variant border-outline-variant/20">منتهي</Badge>
<Badge variant="outline" className="bg-error/10 text-error border-error/20">تم البيع</Badge>
```

---

## 5. Skeleton Rules

- Import: `import { Skeleton } from "@/components/ui/skeleton"`
- Base: always `bg-surface-container-high` — NEVER `bg-gray-200`
- Match exact dimensions of real elements
- Skeleton files are SEPARATE — never mixed into real component files
- Wrapper: `role="status" aria-label="جاري التحميل"` + children `aria-hidden="true"`

```tsx
// ProfileHeroSkeleton.tsx
export function ProfileHeroSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      {/* Cover */}
      <div className="h-36 bg-surface-container-high animate-pulse" aria-hidden="true" />
      {/* Avatar */}
      <div className="px-4 -mt-10 pb-4 bg-surface-container-lowest" aria-hidden="true">
        <Skeleton className="w-20 h-20 rounded-2xl border-4 border-background" />
        <Skeleton className="h-5 w-44 rounded-full mt-4" />
        <Skeleton className="h-3 w-28 rounded-full mt-2" />
        <Skeleton className="h-3 w-36 rounded-full mt-2" />
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        {/* Pills */}
        <div className="flex gap-2 mt-4">
          {[60, 72, 56].map((w, i) => (
            <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Bottom Navigation — Safe Area Calculation

The app has a fixed bottom nav bar. Content must not be hidden behind it.

```
Bottom bar height:    ~56px
iOS safe area:        ~27px (home indicator)
Total:                ~83px

Required padding:     pb-24  (96px — 13px breathing room)
```

Apply to the **main scrollable content wrapper**:
```tsx
<main className="pb-24 md:pb-8" id="main-content">
  {/* content */}
</main>
```

The "إضافة إعلان" floating button in the bottom bar is already handled by the
global layout — do NOT add it inside ProfilePage.

---

## 7. All States to Handle

### 7.1 Loading
```tsx
// Show skeletons — do not block page render
<ProfileHeroSkeleton />
<ProfileNavTabsSkeleton />
{/* tab content skeleton */}
<ProfileListingsTabSkeleton />  // 4 UnifiedCard skeletons
```

### 7.2 Error
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
    <span className="material-symbols-outlined text-error text-3xl">error</span>
  </div>
  <h2 className="text-on-surface font-bold text-lg">حدث خطأ</h2>
  <p className="text-on-surface-variant text-sm">تعذر تحميل بيانات حسابك</p>
  <Button variant="outline" onClick={refetch} className="rounded-full px-6">
    إعادة المحاولة
  </Button>
</div>
```

### 7.3 Empty Listings Tab
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
    <span className="material-symbols-outlined text-primary text-3xl">inventory_2</span>
  </div>
  <p className="text-on-surface font-bold">{tp('profileNoListings')}</p>
  <p className="text-on-surface-variant text-sm">{tp('profileNoListingsDesc')}</p>
  <Button asChild className="rounded-full bg-primary text-on-primary px-6">
    <Link href="/add-listing">{tp('profileAddFirst')}</Link>
  </Button>
</div>
```

### 7.4 Empty Bookings Tab
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
    <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
  </div>
  <p className="text-on-surface font-bold">لا توجد حجوزات</p>
  <p className="text-on-surface-variant text-sm">حجوزاتك القادمة ستظهر هنا</p>
</div>
```

### 7.5 Unauthenticated (should not reach — AuthGuard handles)
```tsx
// Handled by <AuthGuard /> wrapper — page.tsx redirects before render
// If reached, show login prompt:
<div className="flex flex-col items-center justify-center min-h-screen gap-4">
  <p className="text-on-surface font-bold">تسجيل الدخول مطلوب</p>
  <Button asChild className="bg-primary text-on-primary rounded-full px-6">
    <Link href="/auth/login">تسجيل الدخول</Link>
  </Button>
</div>
```

---

## 8. Component Specs

### ProfileHero.tsx
Props:
```ts
interface ProfileHeroProps {
  user: {
    displayName?: string
    username: string
    avatarUrl?: string
    isVerified: boolean
    governorate?: string
    bio?: string
    createdAt: string
    phone?: string
    email: string
  }
  stats: {
    listingsCount: number
    rating: number        // 0–5
    responseRate: number  // 0–100
  }
  onAvatarClick: () => void
  avatarUploading: boolean
}
```

Layout — Mobile:
```tsx
<div>
  {/* Cover banner */}
  <div className="relative h-36 bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] overflow-hidden">
    {/* Checkerboard texture overlay — matches existing Navbar style */}
    <div className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: "url(\"data:image/svg+xml,...\")",
        backgroundSize: "30px 30px"
      }}
    />
    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent" />
  </div>

  {/* Avatar — floats over cover bottom edge */}
  <div className="px-4 -mt-10 bg-surface-container-lowest pb-4">
    <div className="flex items-end justify-between">
      {/* Avatar button */}
      <button onClick={onAvatarClick} disabled={avatarUploading}
        className="relative w-20 h-20 rounded-2xl border-4 border-background shadow-xl overflow-hidden group flex-shrink-0">
        {user.avatarUrl
          ? <Image src={getImageUrl(user.avatarUrl)} alt={user.displayName || user.username} fill className="object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-primary to-[#0B2447] flex items-center justify-center text-on-primary font-black text-3xl">
              {(user.displayName || user.username)[0]?.toUpperCase()}
            </div>
        }
        {/* Camera overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {avatarUploading
            ? <span className="material-symbols-outlined text-white text-xl animate-spin">progress_activity</span>
            : <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
          }
        </div>
      </button>

      {/* Edit profile button — top right */}
      <Link href="/profile/settings"
        className="h-9 px-4 rounded-full border border-outline-variant/30 text-on-surface-variant text-xs font-medium flex items-center gap-1.5 hover:border-primary/30 hover:text-primary transition-all">
        <span className="material-symbols-outlined text-sm">edit</span>
        تعديل الملف
      </Link>
    </div>

    {/* Name + VerifiedBadge */}
    <div className="flex items-center gap-2 mt-3">
      <h1 className="text-[18px] font-semibold text-on-surface">
        {user.displayName || user.username}
      </h1>
      {user.isVerified && <VerifiedBadge />}
    </div>

    {/* Username + member since */}
    <p className="text-[12px] text-on-surface-variant mt-0.5">
      @{user.username} · عضو منذ {new Date(user.createdAt).getFullYear()}
    </p>

    {/* Location */}
    {user.governorate && (
      <p className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-1">
        <span className="material-symbols-outlined text-xs">location_on</span>
        {resolveLocationLabel(user.governorate, locale)}
      </p>
    )}

    {/* Bio */}
    {user.bio && (
      <p className="text-[12px] text-on-surface-variant mt-2 leading-relaxed">{user.bio}</p>
    )}

    {/* Stats grid */}
    <div className="grid grid-cols-3 gap-2 mt-4">
      {[
        { label: "إعلان", value: stats.listingsCount },
        { label: "تقييم", value: `${stats.rating}★` },
        { label: "استجابة", value: `${stats.responseRate}%` },
      ].map(s => (
        <div key={s.label} className="bg-surface-container-low rounded-xl p-3 text-center">
          <p className="text-[18px] font-semibold text-on-surface">{s.value}</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wide">{s.label}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

Layout — Desktop (md+):
- Cover height: `h-44`
- Avatar: `w-24 h-24` positioned inside a left sidebar card
- Stats: vertical list instead of grid
- Bio visible in sidebar
- Edit button: inside sidebar card

### ProfileNavTabs.tsx

Mobile — horizontal scroll tabs (sticky below header):
```tsx
<div className="sticky top-14 z-10 bg-background border-b border-outline-variant/20">
  <div className="flex overflow-x-auto scrollbar-none">
    {TABS.map(tab => (
      <button key={tab.key} onClick={() => setActive(tab.key)}
        className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 flex-shrink-0 transition-all -mb-px ${
          active === tab.key
            ? "border-primary text-primary"
            : "border-transparent text-on-surface-variant hover:text-on-surface"
        }`}>
        <span className="material-symbols-outlined text-base">{tab.icon}</span>
        {tab.label}
        {tab.count != null && tab.count > 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            active === tab.key
              ? "bg-primary/10 text-primary"
              : "bg-surface-container-high text-on-surface-variant"
          }`}>{tab.count}</span>
        )}
      </button>
    ))}
  </div>
</div>
```

Desktop — left sidebar nav:
```tsx
// hidden on mobile, block on md+
<aside className="hidden md:block w-64 flex-shrink-0">
  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden sticky top-14">
    {TABS.map(tab => (
      <button key={tab.key} onClick={() => setActive(tab.key)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-outline-variant/10 last:border-0 transition-all ${
          active === tab.key
            ? "bg-primary/5 text-primary"
            : "text-on-surface-variant hover:bg-surface-container-low"
        }`}>
        <span className="material-symbols-outlined text-base">{tab.icon}</span>
        <span className="flex-1 text-right font-medium">{tab.label}</span>
        {tab.count != null && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            active === tab.key ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
          }`}>{tab.count}</span>
        )}
        <span className="material-symbols-outlined text-sm text-on-surface-variant/40">chevron_left</span>
      </button>
    ))}
    {/* Logout */}
    <button onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface-variant hover:text-error hover:bg-error/5 transition-all border-t border-outline-variant/10">
      <span className="material-symbols-outlined text-base">logout</span>
      <span className="flex-1 text-right">تسجيل الخروج</span>
    </button>
  </div>
</aside>
```

Tabs config:
```ts
const TABS = [
  { key: "overview",  label: "نظرة عامة", icon: "grid_view",     count: null },
  { key: "listings",  label: "إعلاناتي",  icon: "list_alt",      count: user.listingsCount },
  { key: "bookings",  label: "حجوزاتي",   icon: "calendar_month", count: bookingsCount },
  { key: "settings",  label: "الإعدادات", icon: "manage_accounts", count: null },
  { key: "security",  label: "الأمان",    icon: "lock",           count: null },
]
```

### ProfileOverviewTab.tsx

Sections:
1. Quick add listing button (full width)
2. "آخر إعلاناتي" — last 3 listings using `<ListingCard showActions />`
3. Settings cards grid — 3 cards: المعلومات الشخصية / بيانات التواصل / الأمان

```tsx
// Settings card — ProfileSettingsCard.tsx
interface ProfileSettingsCardProps {
  icon: string          // material symbol name
  label: string
  description: string
  href: string
}

<Link href={href}
  className="flex items-center gap-3 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:shadow-sm transition-all group">
  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
    <span className="material-symbols-outlined text-primary text-base">{icon}</span>
  </div>
  <div className="flex-1">
    <p className="text-[13px] font-medium text-on-surface">{label}</p>
    <p className="text-[11px] text-on-surface-variant mt-0.5">{description}</p>
  </div>
  <span className="material-symbols-outlined text-on-surface-variant/40 text-base">chevron_left</span>
</Link>
```

### ProfileListingsTab.tsx
```tsx
// Grid of UnifiedCard — same as browse pages
<div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
  {listings.map(listing => (
    <div key={listing.id} className="relative">
      <UnifiedCard item={listing} listingType={listing.listingType} />
      {/* Edit / Delete overlay buttons */}
      <div className="absolute top-2 left-2 flex gap-1.5 z-10">
        <Link href={`/edit-listing/car/${listing.id}`}
          className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shadow-sm">
          <span className="material-symbols-outlined text-base">edit</span>
        </Link>
        <button
          onClick={() => handleDelete(listing.id)}
          className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm">
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  ))}
</div>
```

### ProfileVerificationStatus.tsx
```tsx
// Pills row — below hero
<div className="flex gap-2 flex-wrap px-4 py-3">
  {/* Phone */}
  {user.phone
    ? <VerifiedPill label="رقم الجوال مُفعَّل" verified />
    : <VerifiedPill label="أضف رقم الجوال" verified={false} onClick={() => router.push("/profile/settings")} />
  }
  {/* Email */}
  {user.isVerified
    ? <VerifiedPill label="حساب موثّق" verified />
    : <VerifiedPill label="تحقق من البريد" verified={false} />
  }
  {/* Location */}
  {user.governorate && (
    <VerifiedPill label={resolveLocationLabel(user.governorate, locale)} verified />
  )}
</div>

// VerifiedPill — inline component:
function VerifiedPill({ label, verified, onClick }: { label: string; verified: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border cursor-default ${
        verified
          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          : "bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-primary/40 cursor-pointer transition-colors"
      }`}>
      <span className="material-symbols-outlined text-xs"
        style={verified ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        {verified ? "check_circle" : "radio_button_unchecked"}
      </span>
      {label}
    </span>
  )
}
```

---

## 9. Full Page Layout Shell

```tsx
// ProfilePageClient.tsx
<AuthGuard>
  <Navbar />
  <div className="min-h-screen bg-background">

    {/* Mobile: single column */}
    {/* Desktop: sidebar + main */}

    <ProfileHero user={user} stats={stats} {...avatarProps} />
    <ProfileVerificationStatus user={user} />

    {/* Mobile tabs */}
    <ProfileNavTabs
      active={activeTab}
      onChange={setActiveTab}
      counts={{ listings: listingsCount, bookings: bookingsCount }}
      className="md:hidden"
    />

    {/* Desktop layout */}
    <div className="md:flex md:flex-row-reverse md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">

      {/* Desktop sidebar nav */}
      <ProfileNavTabs
        active={activeTab}
        onChange={setActiveTab}
        counts={{ listings: listingsCount, bookings: bookingsCount }}
        variant="sidebar"
        className="hidden md:block"
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-8" id="main-content">
        {activeTab === "overview"  && <ProfileOverviewTab user={user} listings={recentListings} />}
        {activeTab === "listings"  && (isListingsLoading ? <ProfileListingsTabSkeleton /> : <ProfileListingsTab listings={allListings} />)}
        {activeTab === "bookings"  && (isBookingsLoading ? <ProfileBookingsTabSkeleton /> : <ProfileBookingsTab bookings={bookings} />)}
        {activeTab === "settings"  && <ProfileSettingsTab user={user} />}
        {activeTab === "security"  && <ProfileSecurityTab />}
      </main>
    </div>
  </div>
  <Footer className="hidden md:block" />
</AuthGuard>
```

---

## 10. Server Component

```tsx
// app/[locale]/profile/page.tsx
import { Metadata } from "next"
import { ProfilePageClient } from "@/components/profile/ProfilePageClient"

export const metadata: Metadata = {
  title: "حسابي",
  description: "إدارة حسابك وإعلاناتك",
}

export default function ProfilePage() {
  // Data is fetched client-side via useMe() hook
  // Server component just renders the shell
  return <ProfilePageClient />
}
```

---

## 11. i18n Keys to Use

All text from `tp('...')` — `useTranslations('pages')`:

```
profileAddListing        ← "إضافة إعلان"
profileAddNewListing     ← "إعلان جديد"
profileNoListings        ← "لا توجد إعلانات"
profileNoListingsDesc
profileAddFirst
profileDeleteConfirm     ← confirm dialog text
profileStatusActive      ← "نشط"
profilePersonalInfo      ← "المعلومات الشخصية"
profileChangePassword    ← "الأمان"
profileStatsListings     ← "إعلان"
profileStatsFavorites    ← "مفضلة"
profileTabListings       ← "إعلاناتي"
profileTabFavorites      ← "مفضلتي"
profileSaveChanges
profileCancel
profileError
profilePasswordChanged
```

---

## 12. Spacing Reference (Mobile)

```
Navbar height:          56px  (top: sticky)
Bottom bar height:      56px
iOS safe area bottom:   ~27px
Total bottom clearance: ~83px → use pb-24 (96px) on main

Hero cover:             h-36
Avatar:                 w-20 h-20, border-4, -mt-10 (floats over cover)
Section gaps:           gap-3 between cards
Card padding:           p-3 (compact) / p-4 (standard)
Card border radius:     rounded-2xl
Page horizontal padding: px-4
```

---

## 13. Hard Rules — Do NOT Violate

- ❌ Do NOT recreate UnifiedCard or ListingCard — import and use as-is
- ❌ Do NOT recreate VerifiedBadge — import from `@/components/verified-badge`
- ❌ Do NOT create new badge variants — use existing ones from UnifiedCard
- ❌ Do NOT use `gray-*` colors — semantic tokens only
- ❌ Do NOT mix skeleton JSX into real component files
- ❌ Do NOT hardcode Arabic text in reusable components — use i18n keys
- ❌ Do NOT fetch data in the Server Component — all data via React Query hooks
- ❌ Do NOT add a floating "+" button — it's handled by the global bottom nav
- ❌ Do NOT show Footer on mobile — `className="hidden md:block"`
- ❌ Do NOT use inline styles except for the texture overlay backgroundImage
- ❌ Do NOT forget `pb-24` on mobile main — content gets hidden behind bottom bar
- ❌ Do NOT use `flex-wrap` on nav tabs — horizontal scroll only
