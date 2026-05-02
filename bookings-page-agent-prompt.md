# Agent Prompt — Bookings Page
# `/bookings` — Next.js 15 App Router + Tailwind v4 + shadcn/ui

---

## Context

SouqOne — Omani marketplace.
The Bookings page is a **dual-role** page — the same URL serves two completely
different user perspectives:

| Role | Sees |
|------|------|
| 🧳 Renter | Bookings they made on others' listings |
| 🏠 Owner | Bookings made on their own listings |

The page supports **4 listing types**: car, bus, equipment, transport.
Each has 5 possible booking statuses with different available actions per role.

This page is **auth-protected** — always behind `<AuthGuard />`.

---

## 1. File Structure

```
app/[locale]/bookings/
  └── page.tsx                          ← Server Component shell

components/bookings/
  ├── BookingsPageClient.tsx            ← "use client" — main shell
  ├── BookingsRoleToggle.tsx            ← Renter / Owner toggle
  ├── BookingsStatsBar.tsx              ← 3-cell summary (upcoming/active/completed)
  ├── BookingsFilterTabs.tsx            ← Horizontal filter: الكل/قادمة/جارية/منتهية/ملغية
  ├── BookingsList.tsx                  ← Filtered list of BookingCards
  ├── BookingsListSkeleton.tsx          ← 3 card skeletons
  ├── BookingCard.tsx                   ← Single booking — handles all statuses + roles
  ├── BookingCardSkeleton.tsx
  ├── BookingActiveHighlight.tsx        ← Desktop sidebar: active booking spotlight card
  ├── BookingPendingOwnerAlert.tsx      ← Desktop sidebar: pending requests alert
  ├── BookingRateModal.tsx              ← shadcn Dialog — rating submission
  └── empty/
      └── BookingsEmptyState.tsx        ← Empty state per tab + role
```

---

## 2. Color System (Tailwind v4 — semantic tokens only)

```
NEVER hardcode hex. NEVER use gray-* directly.

Backgrounds:
  bg-background                  ← page
  bg-surface-container-lowest    ← card
  bg-surface-container-low       ← input / hover
  bg-surface-container-high      ← skeleton / chip bg
  bg-primary/8                   ← brand tint

Text:
  text-on-surface                ← primary
  text-on-surface-variant        ← secondary / captions
  text-primary                   ← brand (links, prices, active)
  text-on-primary                ← text on filled button
  text-error                     ← cancel / reject / danger

Status semantic colors:
  PENDING   → bg-yellow-50  text-yellow-700  border-yellow-200
  CONFIRMED → bg-green-50   text-green-700   border-green-200
  ACTIVE    → bg-primary/10 text-primary     border-primary/20
  COMPLETED → bg-surface-container-high  text-on-surface-variant  border-outline-variant/20
  CANCELLED → bg-error/10   text-error        border-error/20
```

---

## 3. Constants (create once — import everywhere)

```ts
// lib/constants/bookings.ts

export const BOOKING_STATUS_CONFIG = {
  PENDING: {
    labelKey:  'bookingPending',
    dotColor:  'bg-yellow-400',
    badgeColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon:      'schedule',
  },
  CONFIRMED: {
    labelKey:  'bookingConfirmed',
    dotColor:  'bg-green-400',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    icon:      'check_circle',
  },
  ACTIVE: {
    labelKey:  'bookingActive',
    dotColor:  'bg-primary',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    icon:      'radio_button_checked',
  },
  COMPLETED: {
    labelKey:  'bookingCompleted',
    dotColor:  'bg-on-surface-variant/30',
    badgeColor: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20',
    icon:      'task_alt',
  },
  CANCELLED: {
    labelKey:  'bookingCancelled',
    dotColor:  'bg-error',
    badgeColor: 'bg-error/10 text-error border-error/20',
    icon:      'cancel',
  },
} as const

export const LISTING_TYPE_CONFIG = {
  LISTING:   { icon: 'directions_car', labelKey: 'typeCar',       badgeColor: 'bg-primary/10 text-primary border-primary/20' },
  BUS:       { icon: 'directions_bus', labelKey: 'typeBus',       badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  EQUIPMENT: { icon: 'construction',   labelKey: 'typeEquipment', badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  TRANSPORT: { icon: 'local_shipping', labelKey: 'typeTransport', badgeColor: 'bg-red-500/10 text-red-600 border-red-200' },
} as const

export const BOOKING_TABS = [
  { key: 'all',       labelKey: 'tabAll',       statuses: null },
  { key: 'upcoming',  labelKey: 'tabUpcoming',  statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'active',    labelKey: 'tabActive',    statuses: ['ACTIVE'] },
  { key: 'completed', labelKey: 'tabCompleted', statuses: ['COMPLETED'] },
  { key: 'cancelled', labelKey: 'tabCancelled', statuses: ['CANCELLED'] },
] as const
```

---

## 4. Role Detection

```ts
// The user can be both a renter AND an owner
// Role toggle is a UI preference stored in local state only

type BookingRole = 'renter' | 'owner'

// API hooks:
const { data: renterBookings } = useMyBookings()   // bookings I made
const { data: ownerBookings }  = useMyListingBookings()  // bookings on my listings
```

---

## 5. BookingCard — Complete Spec

The card handles all 5 statuses × 2 roles = 10 visual states.

```tsx
// BookingCard.tsx
interface BookingCardProps {
  booking: Booking
  role: BookingRole
  onRate: (booking: Booking) => void
  onConfirm?: (bookingId: string) => void
  onReject?: (bookingId: string) => void
  onCancel?: (bookingId: string) => void
  onChat: (userId: string) => void
}

export function BookingCard({ booking, role, onRate, onConfirm, onReject, onCancel, onChat }: BookingCardProps) {
  const st = BOOKING_STATUS_CONFIG[booking.status]
  const lt = LISTING_TYPE_CONFIG[booking.listingType]
  const isOwner = role === 'owner'
  const other = isOwner ? booking.renter : booking.owner

  return (
    <div className={`bg-surface-container-lowest rounded-2xl border shadow-sm overflow-hidden
                    transition-all hover:shadow-lg hover:shadow-black/5
                    ${booking.status === 'ACTIVE' ? 'border-primary/20' : 'border-outline-variant/15'}`}>

      {/* Active top bar */}
      {booking.status === 'ACTIVE' && (
        <div className="h-0.5 bg-gradient-to-l from-primary/60 to-primary" />
      )}

      <div className="p-4">

        {/* ── Section 1: Listing info ── */}
        <div className="flex items-start gap-3 mb-3">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-xl bg-surface-container-low border border-outline-variant/10
                         flex items-center justify-center flex-shrink-0 overflow-hidden">
            {booking.listing.images?.[0]
              ? <Image src={getImageUrl(booking.listing.images[0].url)}
                  alt={booking.listing.title} width={56} height={56} className="object-cover w-full h-full" />
              : <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">{lt.icon}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-on-surface text-[13px] leading-tight truncate">
                  {booking.listing.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className={`text-[9px] ${lt.badgeColor}`}>
                    <span className="material-symbols-outlined text-[10px] mr-0.5">{lt.icon}</span>
                    {tp(lt.labelKey)}
                  </Badge>
                  <span className="text-[10px] text-on-surface-variant/50 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">location_on</span>
                    {booking.listing.governorate}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={`${st.badgeColor} flex-shrink-0 text-[9px]`}>
                {tp(st.labelKey)}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Section 2: Dates + Price ── */}
        <div className="flex items-center justify-between bg-surface-container-low
                       rounded-xl px-3 py-2 mb-3 border border-outline-variant/[0.06]">
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-on-surface-variant/40">calendar_month</span>
            <span className="font-medium">{formatDate(booking.startDate, locale)}</span>
            <span className="text-on-surface-variant/30">←</span>
            <span className="font-medium">{formatDate(booking.endDate, locale)}</span>
            <span className="text-on-surface-variant/40">
              ({booking.totalDays} {tp('days')})
            </span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-black text-primary text-[13px]">
              {Number(booking.totalPrice).toLocaleString('ar-OM')}
            </span>
            <span className="text-[10px] text-primary/60">{tp('currencyOMR')}</span>
          </div>
        </div>

        {/* ── Section 3: Other party ── */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#0B2447]
                           flex items-center justify-center text-on-primary font-semibold text-xs overflow-hidden">
              {other?.avatarUrl
                ? <Image src={getImageUrl(other.avatarUrl)} alt={other.displayName} fill className="object-cover" />
                : (other?.displayName || other?.username || '?')[0]?.toUpperCase()
              }
            </div>
            {other?.isVerified && (
              <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-primary rounded-full
                             border border-background flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[6px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-on-surface">
              {other?.displayName || other?.username}
            </span>
            <span className="text-[10px] text-on-surface-variant/50 mr-1.5">
              · {isOwner ? tp('renter') : tp('owner')}
            </span>
          </div>
          <button onClick={() => onChat(other?.id)}
            aria-label={tp('chat')}
            className="w-7 h-7 rounded-lg bg-surface-container-low border border-outline-variant/15
                      flex items-center justify-center text-on-surface-variant/40
                      hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
            <span className="material-symbols-outlined text-base">chat</span>
          </button>
        </div>

        {/* ── Section 4: Context messages ── */}
        {/* Renter message — shown to owner on PENDING */}
        {isOwner && booking.status === 'PENDING' && booking.renterNote && (
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl px-3 py-2 mb-3">
            <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
              "{booking.renterNote}"
            </p>
          </div>
        )}

        {/* Cancel reason — both roles */}
        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-error/5 border border-error/15 rounded-xl px-3 py-2 mb-3">
            <p className="text-[10px] text-error/70 flex items-start gap-1">
              <span className="material-symbols-outlined text-[12px] mt-0.5">info</span>
              {tp('cancelReason')}: {booking.cancellationReason}
            </p>
          </div>
        )}

        {/* ── Section 5: Actions (role × status matrix) ── */}
        <BookingCardActions
          booking={booking}
          isOwner={isOwner}
          onRate={onRate}
          onConfirm={onConfirm}
          onReject={onReject}
          onCancel={onCancel}
        />
      </div>
    </div>
  )
}
```

---

## 6. BookingCardActions — Role × Status Matrix

```tsx
// Separate component for clarity
function BookingCardActions({ booking, isOwner, onRate, onConfirm, onReject, onCancel }) {
  const base = "flex-1 h-9 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"

  /* ── RENTER ACTIONS ── */
  if (!isOwner) {
    if (booking.status === 'PENDING') return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onCancel(booking.id)}
          className={`${base} border-outline-variant/20 text-on-surface-variant
                     hover:text-error hover:border-error/20 hover:bg-error/5`}>
          {tp('cancelBooking')}
        </Button>
      </div>
    )

    if (booking.status === 'CONFIRMED') return (
      <div className="flex gap-2">
        <Button variant="outline" asChild className={`${base} border-primary/20 text-primary bg-primary/5 hover:bg-primary/8`}>
          <Link href={`/bookings/${booking.id}`}>
            <span className="material-symbols-outlined text-base">receipt_long</span>
            {tp('viewDetails')}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => onCancel(booking.id)}
          className={`${base} border-outline-variant/20 text-on-surface-variant
                     hover:text-error hover:border-error/20 hover:bg-error/5`}>
          {tp('cancel')}
        </Button>
      </div>
    )

    if (booking.status === 'ACTIVE') return (
      <div className="flex gap-2">
        <Button className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20 hover:brightness-105`}>
          <span className="material-symbols-outlined text-base">chat</span>
          {tp('contactOwner')}
        </Button>
        <Button variant="outline" asChild className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant">
          <Link href={`/bookings/${booking.id}`}>
            <span className="material-symbols-outlined text-base">receipt_long</span>
          </Link>
        </Button>
      </div>
    )

    if (booking.status === 'COMPLETED' && !booking.renterRating) return (
      <Button onClick={() => onRate(booking)}
        className={`${base} w-full bg-yellow-50 border border-yellow-200 text-yellow-700
                   hover:bg-yellow-100 transition-all`}>
        <span className="material-symbols-outlined text-base text-yellow-500">star</span>
        {tp('rateExperience')}
      </Button>
    )

    if (booking.status === 'COMPLETED' && booking.renterRating) return (
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant/50">
        <span className="material-symbols-outlined text-base text-yellow-400"
          style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        {tp('rated')} — {booking.renterRating}/5
      </div>
    )

    return null
  }

  /* ── OWNER ACTIONS ── */
  if (booking.status === 'PENDING') return (
    <div className="flex gap-2">
      <Button onClick={() => onConfirm(booking.id)}
        className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20 hover:brightness-105`}>
        <span className="material-symbols-outlined text-base">check</span>
        {tp('confirmBooking')}
      </Button>
      <Button variant="outline" onClick={() => onReject(booking.id)}
        className={`${base} border-outline-variant/20 text-on-surface-variant
                   hover:text-error hover:border-error/20 hover:bg-error/5`}>
        {tp('reject')}
      </Button>
    </div>
  )

  if (booking.status === 'ACTIVE') return (
    <div className="flex gap-2">
      <Button className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20`}>
        <span className="material-symbols-outlined text-base">chat</span>
        {tp('contactRenter')}
      </Button>
      <Button variant="outline" asChild className="w-9 h-9 rounded-xl border-outline-variant/20">
        <Link href={`/bookings/${booking.id}`}>
          <span className="material-symbols-outlined text-base text-on-surface-variant">receipt_long</span>
        </Link>
      </Button>
    </div>
  )

  if (booking.status === 'COMPLETED' && !booking.ownerRating) return (
    <Button onClick={() => onRate(booking)}
      className={`${base} w-full bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100`}>
      <span className="material-symbols-outlined text-base text-yellow-500">star</span>
      {tp('rateRenter')}
    </Button>
  )

  return null
}
```

---

## 7. BookingRateModal

```tsx
// shadcn Dialog
<Dialog open={!!ratingBooking} onOpenChange={() => setRatingBooking(null)}>
  <DialogContent className="rounded-3xl border-outline-variant/15 p-6 max-w-sm" dir="rtl">
    <DialogHeader>
      <DialogTitle className="font-semibold text-on-surface text-lg text-center">
        {tp('rateTitle')}
      </DialogTitle>
      <DialogDescription className="text-on-surface-variant text-sm text-center">
        {ratingBooking?.listing.title}
      </DialogDescription>
    </DialogHeader>

    {/* Stars */}
    <div className="flex justify-center gap-2 my-4">
      {[1,2,3,4,5].map(s => (
        <button key={s}
          onClick={() => setRating(s)}
          onMouseEnter={() => setHoverRating(s)}
          onMouseLeave={() => setHoverRating(0)}
          className="text-4xl transition-all active:scale-90"
          aria-label={`${s} ${tp('stars')}`}>
          <span className={`material-symbols-outlined text-4xl transition-colors
            ${s <= (hoverRating || rating) ? 'text-yellow-400' : 'text-on-surface-variant/20'}`}
            style={{ fontVariationSettings: s <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0" }}>
            star
          </span>
        </button>
      ))}
    </div>

    {/* Optional comment */}
    <Textarea
      value={comment} onChange={e => setComment(e.target.value)}
      placeholder={tp('rateCommentPlaceholder')}
      rows={3}
      className="rounded-xl bg-surface-container-low border-outline-variant/15 text-sm
                 focus:ring-2 focus:ring-primary/15 resize-none"
    />

    <DialogFooter className="flex-col gap-2 mt-4">
      <Button onClick={handleSubmitRating} disabled={rating === 0 || isSubmitting}
        className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold
                   shadow-md shadow-primary/20 disabled:opacity-50">
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {tp('submitRating')}
      </Button>
      <DialogClose asChild>
        <Button variant="ghost" className="w-full h-10 rounded-2xl text-on-surface-variant">
          {tp('cancel')}
        </Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 8. BookingActiveHighlight (Desktop Sidebar)

```tsx
// Shown when there's an ACTIVE booking
<div className="relative bg-gradient-to-br from-primary to-[#0B2447] rounded-2xl p-4 text-on-primary overflow-hidden">
  {/* Texture */}
  <div className="absolute inset-0 opacity-[0.06]" {/* checkerboard */} />

  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="text-on-primary/70 text-[10px] font-bold uppercase tracking-wider">
        {tp('activeNow')}
      </span>
    </div>

    <p className="font-semibold text-on-primary text-[13px] mb-1 leading-tight">
      {activeBooking.listing.title}
    </p>

    <div className="flex items-center gap-1.5 text-on-primary/60 text-[10px] mb-3">
      <span className="material-symbols-outlined text-xs">calendar_month</span>
      {formatDate(activeBooking.startDate, locale)}
      {' → '}
      {formatDate(activeBooking.endDate, locale)}
    </div>

    <div className="flex items-baseline gap-1 mb-4">
      <span className="font-black text-on-primary text-2xl">
        {Number(activeBooking.totalPrice).toLocaleString('ar-OM')}
      </span>
      <span className="text-on-primary/50 text-[11px]">{tp('currencyOMR')}</span>
    </div>

    <Button asChild size="sm"
      className="w-full h-9 rounded-xl bg-on-primary/15 text-on-primary text-[11px] font-semibold
                border border-on-primary/20 hover:bg-on-primary/20 transition-all backdrop-blur-sm">
      <Link href={`/bookings/${activeBooking.id}`}>
        {tp('viewDetails')}
        <span className="material-symbols-outlined text-base mr-1">chevron_left</span>
      </Link>
    </Button>
  </div>
</div>
```

---

## 9. BookingsEmptyState

```tsx
// Per-tab empty state
const EMPTY_CONFIGS = {
  renter: {
    all:       { icon: 'calendar_month', titleKey: 'emptyAllRenter',       descKey: 'emptyAllRenterDesc',       href: '/' },
    upcoming:  { icon: 'event_upcoming', titleKey: 'emptyUpcomingRenter',  descKey: 'emptyUpcomingDesc',        href: '/' },
    active:    { icon: 'directions_car', titleKey: 'emptyActiveRenter',    descKey: 'emptyActiveDesc',          href: null },
    completed: { icon: 'task_alt',       titleKey: 'emptyCompletedRenter', descKey: 'emptyCompletedDesc',       href: null },
    cancelled: { icon: 'cancel',         titleKey: 'emptyCancelledRenter', descKey: 'emptyCancelledDesc',       href: '/' },
  },
  owner: {
    all:       { icon: 'calendar_month', titleKey: 'emptyAllOwner',        descKey: 'emptyAllOwnerDesc',        href: null },
    upcoming:  { icon: 'event_upcoming', titleKey: 'emptyUpcomingOwner',   descKey: 'emptyUpcomingOwnerDesc',   href: null },
    active:    { icon: 'directions_car', titleKey: 'emptyActiveOwner',     descKey: 'emptyActiveOwnerDesc',     href: null },
    completed: { icon: 'task_alt',       titleKey: 'emptyCompletedOwner',  descKey: 'emptyCompletedOwnerDesc',  href: null },
    cancelled: { icon: 'cancel',         titleKey: 'emptyCancelledOwner',  descKey: 'emptyCancelledOwnerDesc',  href: null },
  },
}

<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6" role="status">
  <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
    <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">{config.icon}</span>
  </div>
  <div>
    <p className="text-on-surface font-semibold text-[14px]">{tp(config.titleKey)}</p>
    <p className="text-on-surface-variant text-[12px] mt-1">{tp(config.descKey)}</p>
  </div>
  {config.href && (
    <Button asChild className="rounded-full bg-primary text-on-primary px-6 h-10">
      <Link href={config.href}>{tp('browseListings')}</Link>
    </Button>
  )}
</div>
```

---

## 10. Optimistic Updates

All mutations must be optimistic — update UI first, revert on error:

```ts
// Confirm booking (owner)
const handleConfirm = async (bookingId: string) => {
  const prev = queryClient.getQueryData(['ownerBookings'])
  queryClient.setQueryData(['ownerBookings'], (old: any) =>
    old?.map(b => b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b)
  )
  try {
    await confirmBooking(bookingId)
    queryClient.invalidateQueries({ queryKey: ['ownerBookings'] })
  } catch {
    queryClient.setQueryData(['ownerBookings'], prev)
    toast.error(tp('errorConfirm'))
  }
}

// Cancel booking (renter)
const handleCancel = async (bookingId: string) => {
  const prev = queryClient.getQueryData(['renterBookings'])
  queryClient.setQueryData(['renterBookings'], (old: any) =>
    old?.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)
  )
  try {
    await cancelBooking(bookingId)
    queryClient.invalidateQueries({ queryKey: ['renterBookings'] })
  } catch {
    queryClient.setQueryData(['renterBookings'], prev)
    toast.error(tp('errorCancel'))
  }
}
```

---

## 11. Full Layout Shell

```tsx
// BookingsPageClient.tsx
<AuthGuard>
  <Navbar />
  <div className="min-h-screen bg-background" dir="rtl">

    {/* Mobile layout — single column */}
    <div className="md:hidden">
      <BookingsRoleToggle role={role} onChange={setRole} />
      <BookingsStatsBar bookings={currentBookings} />
      <BookingsFilterTabs tab={tab} onChange={setTab} bookings={currentBookings} />
      <main className="px-3 pt-3 pb-24 space-y-3" id="main-content">
        {isLoading
          ? <BookingsListSkeleton />
          : <BookingsList bookings={filtered} role={role} onRate={setRatingBooking}
              onConfirm={handleConfirm} onReject={handleReject}
              onCancel={handleCancel} onChat={handleChat}
            />
        }
      </main>
    </div>

    {/* Desktop layout — sidebar + main */}
    <div className="hidden md:block">
      <div className="max-w-5xl mx-auto px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 space-y-4 sticky top-20 h-fit">
          <BookingsRoleToggle role={role} onChange={setRole} />
          <BookingsStatsBar bookings={currentBookings} variant="vertical" />
          {activeBooking && <BookingActiveHighlight booking={activeBooking} />}
          {role === 'owner' && pendingCount > 0 && (
            <BookingPendingOwnerAlert count={pendingCount} onTabChange={setTab} />
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 pb-8" id="main-content">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-semibold text-on-surface text-xl">
              {role === 'renter' ? tp('myBookings') : tp('bookingsOnMyListings')}
            </h1>
          </div>
          <BookingsFilterTabs tab={tab} onChange={setTab} bookings={currentBookings} variant="pills" />
          <div className="mt-4 space-y-3">
            {isLoading
              ? <BookingsListSkeleton />
              : <BookingsList bookings={filtered} role={role} onRate={setRatingBooking}
                  onConfirm={handleConfirm} onReject={handleReject}
                  onCancel={handleCancel} onChat={handleChat}
                />
            }
          </div>
        </main>
      </div>
    </div>
  </div>

  {/* Rating modal */}
  <BookingRateModal
    booking={ratingBooking}
    role={role}
    onClose={() => setRatingBooking(null)}
    onSubmit={handleRating}
  />

  <Footer className="hidden md:block" />
</AuthGuard>
```

---

## 12. Server Component

```tsx
// app/[locale]/bookings/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { BookingsPageClient } from '@/components/bookings/BookingsPageClient'

export default async function BookingsPage() {
  const session = await getServerSession()
  if (!session) redirect(`/auth/login?from=/bookings`)
  return <BookingsPageClient />
}

export const metadata = {
  title: 'حجوزاتي | سوق وان',
  description: 'تابع حجوزاتك وإدارتها',
}
```

---

## 13. i18n Keys

```
myBookings / bookingsOnMyListings
bookingPending / bookingConfirmed / bookingActive / bookingCompleted / bookingCancelled
tabAll / tabUpcoming / tabActive / tabCompleted / tabCancelled
typeCar / typeBus / typeEquipment / typeTransport
renter / owner / days / currencyOMR / activeNow
cancelBooking / confirmBooking / reject / cancel / viewDetails
contactOwner / contactRenter
rateExperience / rateRenter / rated / rateTitle / rateCommentPlaceholder / submitRating
cancelReason / cancelReason
emptyAllRenter / emptyAllOwner / emptyUpcomingRenter / emptyUpcomingOwner
emptyActiveRenter / emptyActiveOwner / emptyCompletedRenter / emptyCompletedOwner
emptyCancelledRenter / emptyCancelledOwner / emptyAllRenterDesc / (... + Desc variants)
browseListings / errorConfirm / errorCancel / stars
```

---

## 14. Spacing Reference

```
Page max-width:      max-w-5xl
Mobile padding:      px-3
Desktop padding:     px-6
Bottom clearance:    pb-24 mobile / pb-8 desktop
Sidebar width:       w-72
Card radius:         rounded-2xl
Action buttons:      h-9 rounded-xl (min-h-11 touch target)
Modal radius:        rounded-3xl
```

---

## 15. Hard Rules

- ❌ No constants inline — import from `lib/constants/bookings.ts`
- ❌ No `gray-*` colors — semantic tokens only
- ❌ No hardcoded Arabic — i18n keys only
- ❌ Never show owner actions to renter and vice versa
- ❌ Never show Rate button if already rated
- ❌ Never show Cancel after ACTIVE status
- ❌ No blocking UI on mutations — always optimistic
- ❌ Footer `hidden md:block`
- ❌ `pb-24` on mobile main always
- ✅ `dir="rtl"` on root wrapper
- ✅ All action buttons: `min-h-11 min-w-11` touch target
- ✅ Skeleton for every async section
- ✅ Active booking always visible in desktop sidebar
- ✅ Run `npx tsc --noEmit` after completion
