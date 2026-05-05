# Agent Prompt — Notifications Page (Next.js + Tailwind v4 + shadcn/ui)

---

## Context

You are building the **NotificationsPage** (`/notifications`) for **SouqOne** —
an Omani vehicle marketplace. The page is **mobile-first**, uses **Tailwind v4**
semantic tokens, **shadcn/ui** primitives.

Key behaviors:
- **Mobile** → Infinite Scroll via `useInfiniteQuery`
- **Desktop** → Pagination via `useQuery` + page state
- **14 notification types** — each has a unique icon, color, badge, and side strip
- Marking read is **optimistic** — update UI first, revert on error
- Page is **auth-protected** — redirect if unauthenticated

The app has a **fixed bottom navigation bar** (83px including safe area).
All mobile scrollable content must use `pb-24`.

---

## 1. File Structure to Create

```
app/[locale]/
└── notifications/
    └── page.tsx                            ← Server Component shell

components/
└── notifications/
    ├── NotificationsPageClient.tsx         ← "use client" — main shell
    ├── NotificationsHero.tsx               ← Gradient banner + stats + filter pills
    ├── NotificationsHeroSkeleton.tsx
    ├── NotificationCard.tsx                ← Single notification row (all 14 types)
    ├── NotificationCardSkeleton.tsx        ← Single card skeleton
    ├── NotificationsGroupHeader.tsx        ← Date group label (اليوم / أمس / ...)
    ├── NotificationsList.tsx               ← Mobile: infinite list / Desktop: paginated
    ├── NotificationsListSkeleton.tsx       ← 4 card skeletons
    ├── NotificationsFilterBar.tsx          ← "الكل | غير مقروء" pills + mark all btn
    ├── NotificationsDesktopSidebar.tsx     ← Stats card + filters + type breakdown
    ├── NotificationsDesktopDetailPanel.tsx ← Right panel showing selected notif detail
    └── NotificationsEmptyState.tsx         ← Empty / no results state
```

---

## 2. Color System (Tailwind v4 — semantic tokens only)

```
NEVER hardcode hex. NEVER use gray-* classes.

Backgrounds:
  bg-background                ← page bg
  bg-surface-container-lowest  ← card bg
  bg-surface-container-low     ← hover
  bg-surface-container-high    ← skeleton / muted
  bg-primary/10                ← brand tint

Text:
  text-on-surface              ← primary
  text-on-surface-variant      ← secondary / captions
  text-primary                 ← brand (active states, links)
  text-error                   ← danger

Border:
  border-outline-variant/15    ← default card border
  border-outline-variant/30    ← hover
  border-primary/30            ← active / selected

Brand:
  bg-primary                   ← filled button
  text-on-primary
  shadow-primary/20
```

---

## 3. All 14 Notification Types — Full Config

Define this config object once in `lib/constants/notifications.ts`
and import everywhere. Do NOT duplicate inline.

```ts
// lib/constants/notifications.ts
import {
  MessageCircle, ShoppingBag, Heart, Tag, AlertCircle,
  Calendar, CheckCheck, Briefcase, Bell,
} from "lucide-react"

export const NOTIFICATION_TYPE_CONFIG: Record<string, {
  icon: React.ReactNode
  bg: string
  text: string
  strip: string
  border: string
  label: string        // i18n key → tp(labelKey)
  labelKey: string
  navigateTo: (data: any) => string | null
}> = {
  MESSAGE: {
    icon: <MessageCircle size={16} />,
    bg: "bg-primary/10",
    text: "text-primary",
    strip: "bg-primary",
    border: "border-primary/20",
    label: "رسالة",
    labelKey: "notifTypeMessage",
    navigateTo: (d) => d?.conversationId ? `/messages/${d.conversationId}` : null,
  },
  LISTING_SOLD: {
    icon: <ShoppingBag size={16} />,
    bg: "bg-green-500/10",
    text: "text-green-600",
    strip: "bg-green-500",
    border: "border-green-200",
    label: "بيع",
    labelKey: "notifTypeSold",
    navigateTo: (d) => d?.listingId ? `/sale/car/${d.listingId}` : null,
  },
  LISTING_FAVORITED: {
    icon: <Heart size={16} />,
    bg: "bg-red-500/10",
    text: "text-red-500",
    strip: "bg-red-500",
    border: "border-red-200",
    label: "مفضلة",
    labelKey: "notifTypeFavorite",
    navigateTo: (d) => d?.listingId ? `/sale/car/${d.listingId}` : null,
  },
  PRICE_DROP: {
    icon: <Tag size={16} />,
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    strip: "bg-orange-500",
    border: "border-orange-200",
    label: "انخفاض سعر",
    labelKey: "notifTypePriceDrop",
    navigateTo: (d) => d?.listingId ? `/sale/car/${d.listingId}` : null,
  },
  SYSTEM: {
    icon: <AlertCircle size={16} />,
    bg: "bg-surface-container-high",
    text: "text-on-surface-variant",
    strip: "bg-outline-variant",
    border: "border-outline-variant/30",
    label: "النظام",
    labelKey: "notifTypeSystem",
    navigateTo: () => null,
  },
  BOOKING_REQUEST: {
    icon: <Calendar size={16} />,
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    strip: "bg-blue-500",
    border: "border-blue-200",
    label: "حجز",
    labelKey: "notifTypeBooking",
    navigateTo: () => `/bookings`,
  },
  BOOKING_CONFIRMED: {
    icon: <CheckCheck size={16} />,
    bg: "bg-green-500/10",
    text: "text-green-600",
    strip: "bg-green-500",
    border: "border-green-200",
    label: "حجز",
    labelKey: "notifTypeBooking",
    navigateTo: () => `/bookings`,
  },
  BOOKING_REJECTED: {
    icon: <AlertCircle size={16} />,
    bg: "bg-error/10",
    text: "text-error",
    strip: "bg-error",
    border: "border-error/20",
    label: "حجز",
    labelKey: "notifTypeBooking",
    navigateTo: () => `/bookings`,
  },
  BOOKING_CANCELLED: {
    icon: <AlertCircle size={16} />,
    bg: "bg-orange-500/10",
    text: "text-orange-500",
    strip: "bg-orange-500",
    border: "border-orange-200",
    label: "حجز",
    labelKey: "notifTypeBooking",
    navigateTo: () => `/bookings`,
  },
  BOOKING_COMPLETED: {
    icon: <CheckCheck size={16} />,
    bg: "bg-green-500/10",
    text: "text-green-600",
    strip: "bg-green-500",
    border: "border-green-200",
    label: "حجز",
    labelKey: "notifTypeBooking",
    navigateTo: () => `/bookings`,
  },
  RETURN_REMINDER: {
    icon: <Calendar size={16} />,
    bg: "bg-yellow-500/10",
    text: "text-yellow-600",
    strip: "bg-yellow-500",
    border: "border-yellow-200",
    label: "تذكير",
    labelKey: "notifTypeReminder",
    navigateTo: () => `/bookings`,
  },
  JOB_APPLICATION: {
    icon: <Briefcase size={16} />,
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    strip: "bg-violet-500",
    border: "border-violet-200",
    label: "وظيفة",
    labelKey: "notifTypeJob",
    navigateTo: (d) => d?.jobId ? `/jobs/${d.jobId}` : null,
  },
  JOB_APPLICATION_ACCEPTED: {
    icon: <CheckCheck size={16} />,
    bg: "bg-green-500/10",
    text: "text-green-600",
    strip: "bg-green-500",
    border: "border-green-200",
    label: "وظيفة",
    labelKey: "notifTypeJob",
    navigateTo: (d) => d?.jobId ? `/jobs/${d.jobId}` : null,
  },
  JOB_APPLICATION_REJECTED: {
    icon: <AlertCircle size={16} />,
    bg: "bg-error/10",
    text: "text-error",
    strip: "bg-error",
    border: "border-error/20",
    label: "وظيفة",
    labelKey: "notifTypeJob",
    navigateTo: (d) => d?.jobId ? `/jobs/${d.jobId}` : null,
  },
}

export const DEFAULT_NOTIF_CONFIG = {
  icon: <Bell size={16} />,
  bg: "bg-surface-container-high",
  text: "text-on-surface-variant",
  strip: "bg-outline-variant",
  border: "border-outline-variant/30",
  label: "إشعار",
  labelKey: "notifTypeOther",
  navigateTo: () => null,
}
```

---

## 4. Data Fetching

### Mobile — Infinite Scroll
```ts
// useInfiniteQuery — replaces useNotifications on mobile
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
} = useInfiniteQuery({
  queryKey: ["notifications", filter],
  queryFn: ({ pageParam = 1 }) =>
    api.getNotifications({ page: pageParam, filter }),
  getNextPageParam: (lastPage) =>
    lastPage.meta.currentPage < lastPage.meta.totalPages
      ? lastPage.meta.currentPage + 1
      : undefined,
  initialPageParam: 1,
})

// Flatten all pages into single array
const notifications = data?.pages.flatMap(p => p.items) ?? []
```

### Desktop — Pagination
```ts
// useQuery with page state — keep existing hook
const [page, setPage] = useState(1)
const { data, isLoading, isError } = useNotifications(page)
const notifications = data?.items ?? []
const meta = data?.meta
```

### Unread Count
```ts
// Already in existing code — keep as-is
const { data: unreadData } = useUnreadCount()
const unreadCount = unreadData?.count ?? 0
```

---

## 5. Infinite Scroll Implementation (Mobile)

Use `IntersectionObserver` — no external library:

```tsx
// Inside NotificationsList.tsx (mobile variant)
const sentinelRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    { threshold: 0.1 }
  )
  if (sentinelRef.current) observer.observe(sentinelRef.current)
  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage, fetchNextPage])

return (
  <div>
    {/* Notification groups */}
    {groups.map(group => (
      <div key={group.label}>
        <NotificationsGroupHeader label={group.label} count={group.items.length} />
        {group.items.map(n => <NotificationCard key={n.id} notification={n} onClick={handleClick} />)}
      </div>
    ))}

    {/* Sentinel — triggers next page fetch */}
    <div ref={sentinelRef} className="h-4" />

    {/* Loading more indicator */}
    {isFetchingNextPage && (
      <div className="space-y-2 px-4 pb-4">
        <NotificationCardSkeleton />
        <NotificationCardSkeleton />
      </div>
    )}

    {/* End of list */}
    {!hasNextPage && notifications.length > 0 && (
      <p className="text-center text-on-surface-variant text-xs py-6">
        — وصلت لنهاية الإشعارات —
      </p>
    )}
  </div>
)
```

---

## 6. NotificationCard Component

```tsx
// NotificationCard.tsx
interface NotificationCardProps {
  notification: Notification
  onClick: (n: Notification) => void
  isSelected?: boolean  // desktop only
}

export function NotificationCard({ notification: n, onClick, isSelected }: NotificationCardProps) {
  const cfg = NOTIFICATION_TYPE_CONFIG[n.type] ?? DEFAULT_NOTIF_CONFIG

  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full relative flex items-start gap-3 p-3.5 text-start rounded-xl overflow-hidden border transition-all duration-200 group/item hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
        ${isSelected ? "ring-2 ring-primary/30" : ""}
        ${!n.isRead
          ? "bg-surface-container-lowest border-outline-variant/20 shadow-sm"
          : "bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/25"
        }`}
    >
      {/* Unread side strip — RTL: right side */}
      {!n.isRead && (
        <div className={`absolute top-0 bottom-0 right-0 w-1 ${cfg.strip} rounded-l-sm`} />
      )}

      {/* Icon */}
      <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110 ${cfg.bg}`}>
        <span className={cfg.text}>{cfg.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[13px] font-bold leading-tight ${!n.isRead ? "text-on-surface" : "text-on-surface-variant"}`}>
            {n.title}
          </span>
          {/* Type badge */}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {tp(cfg.labelKey)}
          </span>
          {/* Unread dot */}
          {!n.isRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
          )}
        </div>

        <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${!n.isRead ? "text-on-surface-variant" : "text-on-surface-variant/70"}`}>
          {n.body}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-on-surface-variant/50 font-medium">
            {timeAgo(n.createdAt)}
          </span>
          <span className="text-on-surface-variant/20">·</span>
          <span className={`text-[10px] font-bold group-hover/item:underline transition-colors ${cfg.text}`}>
            {tp('notifViewDetails')}
          </span>
        </div>
      </div>

      {/* Arrow — RTL aware */}
      <ChevronLeft
        size={16}
        className="flex-shrink-0 mt-3 text-on-surface-variant/20 group-hover/item:text-primary transition-all rtl:rotate-0 ltr:rotate-180 group-hover/item:rtl:-translate-x-1"
      />
    </button>
  )
}
```

---

## 7. Skeleton Rules

```tsx
// NotificationCardSkeleton.tsx
export function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-outline-variant/10 bg-surface-container-lowest"
      role="status" aria-hidden="true">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-3.5 w-2/3 rounded-full" />
          <Skeleton className="h-3.5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
        <Skeleton className="h-2.5 w-16 rounded-full" />
      </div>
    </div>
  )
}

// NotificationsListSkeleton.tsx
export function NotificationsListSkeleton() {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="جاري التحميل">
      <Skeleton className="h-4 w-16 rounded-full mb-3" aria-hidden="true" />
      {[...Array(4)].map((_, i) => (
        <NotificationCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

---

## 8. All States to Handle

### 8.1 Loading (initial)
```tsx
<NotificationsHeroSkeleton />   // gradient box with skeleton pills
<NotificationsListSkeleton />   // 4 card skeletons
```

### 8.2 Error
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
  <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
    <AlertCircle className="text-error" size={28} />
  </div>
  <h2 className="text-on-surface font-bold text-lg">حدث خطأ</h2>
  <p className="text-on-surface-variant text-sm">تعذر تحميل الإشعارات</p>
  <Button variant="outline" onClick={refetch} className="rounded-full px-6">
    إعادة المحاولة
  </Button>
</div>
```

### 8.3 Empty — No Notifications
```tsx
<div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6"
  role="status" aria-label="لا توجد إشعارات">
  <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center">
    <BellOff size={36} className="text-on-surface-variant/30" />
  </div>
  <p className="text-on-surface font-bold text-lg">{tp('notifEmpty')}</p>
  <p className="text-on-surface-variant text-sm">{tp('notifEmptyDesc')}</p>
</div>
```

### 8.4 Empty — Unread Filter Active
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
  role="status">
  <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
    <CheckCheck size={24} className="text-green-600" />
  </div>
  <p className="text-on-surface font-bold">{tp('notifNoUnread')}</p>
  <button onClick={() => setFilter('all')}
    className="text-primary text-sm font-bold underline underline-offset-2">
    {tp('notifShowAll')}
  </button>
</div>
```

### 8.5 Loading More (infinite scroll — mobile)
```tsx
// Shown below the list while fetching next page
<div className="space-y-2 px-4">
  <NotificationCardSkeleton />
  <NotificationCardSkeleton />
</div>
```

### 8.6 End of List (infinite scroll — mobile)
```tsx
<p className="text-center text-on-surface-variant/50 text-xs py-8 font-medium">
  — وصلت لنهاية الإشعارات —
</p>
```

### 8.7 Unauthenticated
```tsx
// Redirect in useEffect:
useEffect(() => {
  if (!authLoading && !isAuthenticated) openAuth('login')
}, [authLoading, isAuthenticated, openAuth])
```

---

## 9. Mark as Read — Optimistic Updates

### Mark Single
```ts
const markRead = useMarkNotificationRead()

const handleClick = (n: Notification) => {
  // 1. Navigate
  const path = (NOTIFICATION_TYPE_CONFIG[n.type] ?? DEFAULT_NOTIF_CONFIG).navigateTo(n.data)

  // 2. Mark read optimistically
  if (!n.isRead) {
    // Update React Query cache directly
    queryClient.setQueryData(['notifications'], (old: any) => ({
      ...old,
      pages: old.pages.map((page: any) => ({
        ...page,
        items: page.items.map((item: any) =>
          item.id === n.id ? { ...item, isRead: true } : item
        )
      }))
    }))
    markRead.mutate(n.id) // fire and forget
  }

  // 3. Navigate
  if (path) router.push(path)
}
```

### Mark All Read
```ts
const markAllRead = useMarkAllNotificationsRead()

const handleMarkAll = () => {
  // Optimistic
  queryClient.setQueryData(['notifications'], (old: any) => ({
    ...old,
    pages: old.pages.map((page: any) => ({
      ...page,
      items: page.items.map((item: any) => ({ ...item, isRead: true }))
    }))
  }))
  queryClient.setQueryData(['unreadCount'], { count: 0 })
  markAllRead.mutate()
}
```

---

## 10. Date Grouping

```ts
// lib/utils/group-by-date.ts
export function groupNotificationsByDate(
  notifications: Notification[],
  locale: string,
  tp: any
): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000

  const map = new Map<string, Notification[]>()
  const order: string[] = []

  for (const n of notifications) {
    const d = new Date(n.createdAt).getTime()
    let key: string

    if (d >= today)     key = tp('notifToday')
    else if (d >= yesterday) key = tp('notifYesterday')
    else key = new Date(n.createdAt).toLocaleDateString(
      locale === 'ar' ? 'ar-OM' : 'en-US',
      { day: 'numeric', month: 'long' }
    )

    if (!map.has(key)) { map.set(key, []); order.push(key) }
    map.get(key)!.push(n)
  }

  return order.map(label => ({ label, items: map.get(label)! }))
}
```

---

## 11. Full Page Layout Shell

```tsx
// NotificationsPageClient.tsx
export function NotificationsPageClient() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { openAuth } = useAuthModal()
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) openAuth('login')
  }, [authLoading, isAuthenticated])

  if (authLoading || !isAuthenticated) return <LoadingSpinner />

  return (
    <>
      <Navbar />

      {/* Hero Banner */}
      <NotificationsHero
        unreadCount={unreadCount}
        filter={filter}
        onFilterChange={setFilter}
        onMarkAll={handleMarkAll}
        isMarkingAll={markAllRead.isPending}
      />

      {/* Mobile layout */}
      <main className="md:hidden pb-24 bg-background" id="main-content">
        {isLoading
          ? <NotificationsListSkeleton />
          : <NotificationsList
              groups={groups}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onNotificationClick={handleClick}
            />
        }
      </main>

      {/* Desktop layout — 3 columns */}
      <main className="hidden md:block bg-background pb-8" id="main-content">
        <div className="max-w-6xl mx-auto px-6 py-6 flex gap-5">

          {/* Sidebar */}
          <NotificationsDesktopSidebar
            total={allNotifications.length}
            unread={unreadCount}
            filter={filter}
            onFilterChange={setFilter}
            onMarkAll={handleMarkAll}
            typeBreakdown={typeBreakdown}
          />

          {/* Main list */}
          <div className="flex-1 min-w-0">
            {isLoading
              ? <NotificationsListSkeleton />
              : <>
                  <NotificationsList
                    groups={groups}
                    onNotificationClick={handleClick}
                    selectedId={selectedNotif?.id}
                    variant="desktop"
                  />
                  {/* Pagination */}
                  {meta && meta.totalPages > 1 && (
                    <DesktopPagination
                      currentPage={page}
                      totalPages={meta.totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </>
            }
          </div>

          {/* Detail Panel */}
          <NotificationsDesktopDetailPanel notification={selectedNotif} />
        </div>
      </main>

      <Footer className="hidden md:block" />
    </>
  )
}
```

---

## 12. Desktop Pagination Component

```tsx
// Inside NotificationsPageClient or separate component
function DesktopPagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, i) => i + 1
  )

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        onClick={() => onPageChange(p => Math.max(1, p - 1))}
        disabled={currentPage <= 1}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 hover:text-primary disabled:opacity-30 transition-all">
        <ChevronRight size={16} />
      </button>

      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
            currentPage === p
              ? "bg-primary text-on-primary shadow-sm shadow-primary/20"
              : "bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant hover:border-primary/30 hover:text-primary"
          }`}>
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
        disabled={currentPage >= totalPages}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 hover:text-primary disabled:opacity-30 transition-all">
        <ChevronLeft size={16} />
      </button>
    </div>
  )
}
```

---

## 13. i18n Keys

```
notifTitle           ← "الإشعارات"
notifUnreadSummary   ← "لديك {count} إشعار غير مقروء"
notifAllRead         ← "جميع الإشعارات مقروءة"
notifAll             ← "الكل"
notifUnread          ← "غير مقروء"
notifMarkAllRead     ← "تحديد الكل كمقروء"
notifMarkingRead     ← "جاري..."
notifToday           ← "اليوم"
notifYesterday       ← "أمس"
notifEmpty           ← "لا توجد إشعارات"
notifEmptyDesc       ← "ستظهر إشعاراتك هنا عند وصولها"
notifNoUnread        ← "جميع الإشعارات مقروءة"
notifShowAll         ← "عرض الكل"
notifViewDetails     ← "عرض التفاصيل"
notifTimeNow         ← "الآن"
notifTimeMinutes     ← "منذ {count} د"
notifTimeHours       ← "منذ {count} س"
notifTimeDays        ← "منذ {count} ي"
notifTypeMessage     ← "رسالة"
notifTypeSold        ← "بيع"
notifTypeFavorite    ← "مفضلة"
notifTypePriceDrop   ← "انخفاض سعر"
notifTypeSystem      ← "النظام"
notifTypeBooking     ← "حجز"
notifTypeReminder    ← "تذكير"
notifTypeJob         ← "وظيفة"
notifTypeOther       ← "إشعار"
```

---

## 14. Spacing Reference

```
Navbar:              56px sticky top
Bottom bar (mobile): 83px → pb-24 on main
Hero banner:         gradient, no fixed height
Card padding:        p-3.5
Card border radius:  rounded-xl
Side strip width:    w-1 (right side, RTL)
Page padding:        px-4 (mobile) / px-6 (desktop)
Group gap:           space-y-4 between groups
Card gap:            space-y-2 within group
Desktop max-width:   max-w-6xl mx-auto
Desktop columns:     w-64 sidebar | flex-1 list | w-72 detail
```

---

## 15. Hard Rules — Do NOT Violate

- ❌ No `gray-*` colors — semantic tokens only
- ❌ No inline TYPE_CONFIG — import from `lib/constants/notifications.ts`
- ❌ No external infinite scroll library — use IntersectionObserver only
- ❌ No skeleton JSX mixed into real components
- ❌ No blocking navigation on mark-read — optimistic only
- ❌ No `useEffect` for data fetching — React Query only
- ❌ No Footer on mobile — `className="hidden md:block"`
- ❌ No `pb-8` on mobile main — must be `pb-24`
- ❌ No Pagination on mobile — Infinite Scroll only
- ❌ No Infinite Scroll on desktop — Pagination only
- ❌ No hardcoded Arabic strings — i18n keys only
- ❌ No new navigation routes in TYPE_CONFIG — use existing app routes only
