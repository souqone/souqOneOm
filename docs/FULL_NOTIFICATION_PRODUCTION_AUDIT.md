# FULL_NOTIFICATION_PRODUCTION_AUDIT.md
> Senior QA Engineer + Staff Architect audit — SouqOne notification system  
> Date: 2026-05-30 | Reviewer: Claude (Staff Architect / Senior QA)

---

## Executive Summary

The notification system has **27 confirmed bugs** across correctness, UX, performance, and security dimensions.  
Two of them are **Critical** — they make core features silently broken in production today.  
Eight are **High** — they create wrong user experiences and data inconsistencies.  
Seven are **Medium** — they degrade reliability or UX noticeably.  
Ten are **Low** — dead code, minor UX gaps, and future maintenance debt.

---

## Severity Classification

| Severity | Count | Definition |
|---|---|---|
| 🔴 Critical | 2 | Core feature broken silently; data incorrect in production now |
| 🟠 High | 8 | Wrong behavior visible to users; business-logic or data integrity risk |
| 🟡 Medium | 7 | Degraded UX, reliability, or locale correctness |
| 🔵 Low | 10 | Dead types, minor inconsistencies, future debt |

---

## 🔴 CRITICAL

---

### C-1 — Unread filter parameter mismatch: filter never works on mobile

**Category**: Mark-As-Read Bugs / Cache Invalidation  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` line 50  
- `apps/api/src/notifications/notifications.controller.ts` line 38  

**Description**  
The mobile infinite-scroll query sends `?unread=true` as the query parameter:
```typescript
// NotificationsPageClient.tsx line 50
`/notifications?page=${pageParam}&limit=20${filter === 'unread' ? '&unread=true' : ''}`
```
But the API controller listens for `?filter=unread`:
```typescript
// notifications.controller.ts line 38
@Query('filter') filter?: 'all' | 'unread'
```
The parameter `unread=true` is silently ignored. The `findAll()` method always receives `filter === undefined`, so `where` never includes `isRead: false`. Selecting "غير مقروءة / Unread" on mobile shows **all** notifications.

**Reproduce**
1. Authenticate as any user. Ensure ≥ 5 unread and ≥ 5 read notifications exist.
2. Open `/notifications` on a mobile viewport (< 768 px).
3. Tap the "غير مقروءة" button.
4. Observe: read notifications still appear — the list is identical to the "الكل" view.
5. Inspect network: request contains `?unread=true`, response total equals full total.

**Expected**: Only unread notifications returned.  
**Fix**: Change the mobile query string to `?filter=unread` to match the controller parameter.

---

### C-2 — LISTING_FAVORITED bypasses the entire notification pipeline

**Category**: Missing Notifications / Real-time Sync Bugs  
**Files**:  
- `apps/api/src/favorites/favorites.service.ts` lines 51–59  

**Description**  
Every other notification path calls `this.notifications.create()` which triggers:
1. `EventEmitter2` → `notification.created` event  
2. `ChatGateway.onNotificationCreated()` → Redis publish → WebSocket push to online users  
3. `PushService.sendToUser()` → Web Push to offline/background users  

`favorites.service.ts` calls `this.prisma.notification.create()` **directly**:
```typescript
// favorites.service.ts lines 51–59
await this.prisma.notification.create({
  data: {
    type: 'LISTING_FAVORITED',
    ...
  },
});
```
Result: the listing owner never receives a real-time bell-badge increment, no WebSocket event fires, no push notification sends. The row lands in the database but the user has no idea they were favorited until they manually refresh the notifications page at least 30 seconds later (next poll cycle).

**Reproduce**
1. User A posts a car listing. User A is online (navbar visible).
2. User B favorites User A's listing.
3. Observe User A's navbar bell badge: count does NOT increment.
4. Open browser console: no `notification` socket event received.
5. Check phone: no Web Push notification.
6. Wait 30 s for poll: badge updates to show the notification.

**Expected**: Real-time badge increment, push notification sent.

---

## 🟠 HIGH

---

### H-1 — Desktop filter permanently broken: unread mode shows all notifications

**Category**: Mark-As-Read Bugs / Unread Count Bugs  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` line 62  
- `apps/web/src/lib/api/notifications.ts` — `useNotifications` hook  

**Description**  
The desktop paginated query is:
```typescript
// NotificationsPageClient.tsx line 62
const desktopQuery = useNotifications(desktopPage);
```
`useNotifications(page)` hardcodes the URL as `/notifications?page=${page}&limit=20` with no filter parameter. The `filter` state from `useState` is read by the hero and sidebar UI elements but **never passed to the desktop query**. Clicking "Unread" on desktop has zero effect on the data fetched.

**Reproduce**
1. On a desktop viewport (≥ 768 px), open `/notifications`.
2. Mark several notifications as read. Confirm ≥ 3 read and ≥ 1 unread.
3. Click "غير مقروءة" filter.
4. Observe: the notification list is identical to the "الكل" view; read notifications remain visible.

**Fix**: Add `filter` param to `useNotifications`, pass `filter` state to `desktopQuery`.

---

### H-2 — Desktop pagination doesn't reset when filter changes

**Category**: Cache Invalidation Bugs / Stale Notifications  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` lines 39, 62, 258  

**Description**  
`desktopPage` is independent state that never resets when `filter` changes. If the user has navigated to page 3 of their "All" notifications, then switches to "Unread", the query fires as page 3 of unread notifications. If the user has fewer than 40 unread notifications, they see an empty state (or a partial result) instead of page 1.

**Reproduce**
1. Desktop viewport, user has > 40 notifications total.
2. Navigate to page 3 via the pagination buttons.
3. Switch to "Unread" filter.
4. Observe: page 3 of unread is requested; if < 40 unread exist, the list is empty even though page 1 would have results.

**Fix**: Add `useEffect(() => setDesktopPage(1), [filter])`.

---

### H-3 — Notification dropdown: only MESSAGE type triggers navigation

**Category**: Navigation Bugs / Broken Notification Links  
**Files**:  
- `apps/web/src/components/layout/navbar/notification-dropdown.tsx` lines 52–56  

**Description**  
```typescript
onClick={() => {
  if (!n.isRead) onMarkRead(n.id);
  close();
  if (n.type === 'MESSAGE' && n.data?.conversationId) {
    router.push(`/messages/${n.data.conversationId}`);  // only for MESSAGE
  }
  // all other types: just close, no navigation
}}
```
A user receives a `TRANSPORT_QUOTE_RECEIVED`, `JOB_APPLICATION`, or `FEATURED_EXPIRED` notification in the dropdown. Clicking it marks it as read and closes the menu — but navigates nowhere. The user has no idea where to go to act on the notification. They must manually open the relevant section.

**Reproduce**
1. Have carrier submit a quote. Shipper is online.
2. Shipper receives `TRANSPORT_QUOTE_RECEIVED` in navbar dropdown.
3. Shipper clicks the notification.
4. Observe: dropdown closes, page stays on `/`. No navigation to the transport request.

**Fix**: Use `getNotifConfig(n.type).navigateTo(n.data)` (same as the full notifications page does) to derive the navigation target.

---

### H-4 — Double notification for subscription payments

**Category**: Notification Spam  
**Files**:  
- `apps/api/src/payments/payments.service.ts` lines 359–364  
- `apps/api/src/payments/payment-activation.service.ts` lines 58–65, 71–79  

**Description**  
When a `SUBSCRIPTION` payment succeeds, `payments.service.ts` calls both:
```typescript
await this.activation.activateSubscription(userId, plan, paymentId);
// → fires SUBSCRIPTION_ACTIVATED notification

await this.activation.notifyPaymentSuccess(payment);
// → fires PAYMENT_SUCCESS notification
```
The user receives two notifications within milliseconds for a single action.  
For `FEATURED` payments, only `notifyPaymentSuccess` fires (correct — one notification).  
The inconsistency means subscription buyers are spammed; featured buyers are not.

**Reproduce**
1. Initiate and complete a SUBSCRIPTION payment (any plan).
2. Check the buyer's notifications page.
3. Observe: two new notifications — "تم تفعيل الاشتراك" and "تمت عملية الدفع بنجاح" — both for the same transaction.

**Fix**: Remove `notifyPaymentSuccess` call for SUBSCRIPTION type, or remove `SUBSCRIPTION_ACTIVATED` and use only `PAYMENT_SUCCESS` with a subscription-specific body.

---

### H-5 — LISTING_SOLD is a dead notification type: never emitted

**Category**: Missing Notifications / Dead Notification Types  
**Files**:  
- `apps/api/prisma/schema.prisma` — `NotificationType.LISTING_SOLD`  
- `apps/web/src/lib/constants/notifications.ts` — `LISTING_SOLD` config present  
- `apps/api/src/listings/listings.service.ts` — no `LISTING_SOLD` emit  
- `apps/api/src/common/services/base-listing.service.ts` — no `LISTING_SOLD` emit  

**Description**  
`LISTING_SOLD` exists in the enum and has a full frontend config entry (green icon, navigates to `/sale/car/{listingId}`). However, the `base-listing.service.ts` only emits `LISTING_EVENTS.CREATED`, `UPDATED`, `DELETED`, `STATUS_CHANGED`. When a seller marks their car as SOLD, `STATUS_CHANGED` fires — not `LISTING_SOLD`. The seller receives "تم تغيير حالة إعلان" (generic status change) rather than a meaningful "تم بيع سيارتك 🎉".

This is also true for bus/equipment listings.

**Reproduce**
1. Create a car listing. Change its status to SOLD via the seller dashboard.
2. Check the seller's notifications.
3. Observe: a generic "LISTING_STATUS_CHANGED" notification arrives. `LISTING_SOLD` never fires. The config entry and green "sold" icon are unreachable in production.

---

### H-6 — Carrier review: duplicate REVIEW_RECEIVED via two independent code paths

**Category**: Duplicate Notifications / Recipient Bugs  
**Files**:  
- `apps/api/src/transport/transport-review.service.ts` lines 87–93  
- `apps/api/src/reviews/reviews.service.ts` lines 71–77  

**Description**  
Carrier-profile reviews can be created via:
1. `POST /transport/bookings/:id/review` → `TransportReviewService.createReview()` → fires `REVIEW_RECEIVED`
2. `POST /reviews` → `ReviewsService.create()` → fires `REVIEW_RECEIVED`

Both paths create a `Review` row and both notify the carrier independently. If a frontend bug, API client, or integration test calls both endpoints for the same booking (different `entityId` values because path 1 uses `bookingId` and path 2 uses the carrier profile ID as `entityId`), the carrier receives two `REVIEW_RECEIVED` notifications for the same review event.

The unique constraint exists at the review record level but uses different `entityId` values per path, so two distinct records can coexist.

**Reproduce**
1. Complete a transport booking between Carrier A and Shipper B.
2. As Shipper B, POST `{ rating: 5, comment: "..." }` to `/transport/bookings/:id/review`.
3. Immediately POST `{ rating: 5, revieweeId: carrierUserId, entityType: 'CARRIER_PROFILE', entityId: '<carrier profile id>' }` to `/reviews`.
4. Check Carrier A's notifications: two "تقييم جديد" notifications.

---

### H-7 — Mark-read optimistic update only covers mobile infinite query

**Category**: Mark-As-Read Bugs / Real-time Sync Bugs  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` lines 103–122  

**Description**  
`handleClick` applies an optimistic update to `['notifications', 'infinite', filter]` (the mobile query) but not to `['notifications', desktopPage]`. On desktop, clicking a notification navigates away immediately. When the user returns to the notifications page, the server mutation has completed and React Query's `onSuccess` invalidates `['notifications']`. But between click and return, the desktop list still shows the notification as unread. If the user stays on the page (e.g., uses the detail panel), the card remains visually unread until the server round-trip completes.

**Reproduce**
1. Desktop viewport, notification list has ≥ 1 unread notification.
2. Click an unread notification.
3. Observe: the detail panel opens (if no navigation), but the card in the list still has the blue unread dot. It takes ~200–500 ms for the dot to disappear (server round-trip).

---

### H-8 — Push notification tag collision silences all but the latest notification

**Category**: Mobile Notification Issues / Notification Spam  
**Files**:  
- `apps/api/src/notifications/push.service.ts` lines 83–84  

**Description**  
```typescript
tag: `souqone-${userId}`,
renotify: true,
```
`tag` causes the OS to replace any existing notification from the same tag. With `renotify: true`, a sound/vibration fires again but the **previous notification is permanently removed** from the notification tray. If a user receives:
- 09:01 — "عرض سعر جديد: 150 ر.ع."
- 09:02 — "تقديم جديد على وظيفتك"

The first notification vanishes silently when the second arrives. On a busy day (carrier + job poster), the user misses all but the last notification in their tray.

**Reproduce**
1. Subscribe to push notifications on a mobile browser.
2. As another account, trigger two notifications for the same user within 60 seconds.
3. Check the OS notification tray: only the second notification is visible; the first is gone.

**Fix**: Use `tag: \`souqone-${userId}-${Date.now()}\`` or `tag: \`souqone-${notifType}-${entityId}\`` to allow multiple notifications to coexist.

---

## 🟡 MEDIUM

---

### M-1 — Push notifications always deep-link to `/notifications`, never to content

**Category**: Navigation Bugs / Mobile Notification Issues  
**Files**:  
- `apps/api/src/notifications/notifications.service.ts` lines 42–48  

**Description**  
```typescript
await this.pushService.sendToUser(dto.userId, {
  url: '/notifications',  // hardcoded for ALL types
  ...
});
```
A user taps "عرض سعر جديد" in the OS notification tray. Expected behavior: open the specific transport request. Actual behavior: opens `/notifications`, where the user must then find and click the notification to navigate further. Two extra taps for every push notification.

**Fix**: Pass `navigateTo(data)` result as `url` when creating the notification, or store the navigation URL in the notification `data` field and use it in `sendToUser`.

---

### M-2 — SYSTEM notifications have no navigation target: actionable events go dead

**Category**: Navigation Bugs / Broken Notification Links  
**Files**:  
- `apps/api/src/transport/transport-booking.service.ts` lines 195–201  
- `apps/web/src/lib/constants/notifications.ts` — `SYSTEM` config `navigateTo: () => null`  

**Description**  
When a carrier cancels a booking, the shipper receives:
```typescript
{
  type: 'SYSTEM',
  title: 'طلبك متاح مجدداً',
  body: 'ألغى الناقل الحجز — طلبك الآن مفتوح لاستقبال عروض جديدة',
  data: { requestId: booking.requestId },
}
```
This is highly actionable — the shipper needs to review their request and accept new quotes. But `SYSTEM` type `navigateTo` always returns `null`. Clicking this notification in the dropdown or notifications page does nothing.

The same problem applies to driver-verification approval/rejection (`driver-verification.service.ts` line 105) — the user can't tap through to check their verification status.

**Reproduce**
1. Carrier cancels an in-progress booking.
2. Shipper receives "طلبك متاح مجدداً" notification.
3. Click it on the notifications page.
4. Observe: no navigation. No indication where to go.

**Fix**: Use `TRANSPORT_REQUEST_CANCELLED` type (which navigates to bookings) or a dedicated type that uses `data.requestId` for navigation.

---

### M-3 — Desktop sidebar stats ignore the active filter

**Category**: Unread Count Bugs / Stale Notifications  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` lines 87–94, 220  

**Description**  
The sidebar displays:
- **Total**: `desktopMeta?.total ?? desktopNotifs.length`  
- **Unread**: `unreadCount` (from `useUnreadCount()`)  

Both values are pulled from the unfiltered dataset. When filter is set to "Unread Only":
- "Total" still shows the full notification count, not the unread-only total.  
- `typeBreakdown` is computed from `desktopNotifs` which (due to H-1) also ignores the filter.

The sidebar tells the user "47 notifications, 3 unread" while the list supposedly shows only unread — a contradiction that erodes trust.

---

### M-4 — `typeBreakdown` computed from page 1 only; misrepresents distribution

**Category**: Stale Notifications  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx` lines 88–94  

**Description**  
```typescript
const typeBreakdown = useMemo(() => {
  const map = new Map<string, number>();
  for (const n of desktopNotifs) { ... }  // only 20 items from page 1
  ...
}, [desktopNotifs]);
```
A user with 200 notifications will see a type breakdown based on only the 20 most-recent ones. If all `JOB_APPLICATION` notifications are older than 20 notifications, the sidebar shows 0 job applications — hiding real data.

---

### M-5 — REVIEW_RECEIVED: `bookingId` missing from general reviews service

**Category**: Navigation Bugs  
**Files**:  
- `apps/api/src/reviews/reviews.service.ts` line 71–77  
- `apps/web/src/lib/constants/notifications.ts` — `REVIEW_RECEIVED.navigateTo`  

**Description**  
`ReviewsService` fires:
```typescript
data: { reviewId: review.id, entityType: dto.entityType, entityId: dto.entityId }
// no bookingId
```
`REVIEW_RECEIVED` navigation logic:
```typescript
navigateTo: (d) => {
  if (d?.bookingId) return `/transport/bookings/${d.bookingId}`;
  if (d?.entityType === 'DRIVER_PROFILE') return '/jobs';
  return '/notifications';  // ← fallback for carrier reviews via general endpoint
},
```
Carrier reviews created through the general `/reviews` endpoint always fall to `/notifications` — a dead end. Only the transport-specific endpoint passes `bookingId`. Two identical review events produce different navigation destinations depending on which API endpoint was used.

---

### M-6 — Notification detail panel date hardcoded to `en-US` locale

**Category**: Mobile Notification Issues / Stale Notifications  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsDesktopDetailPanel.tsx` line 46  

**Description**  
```typescript
{new Date(notification.createdAt).toLocaleString('en-US')}
```
Arabic locale users (locale = `ar`) see dates in English format: "5/30/2026, 2:14:12 PM" instead of "٣٠/٥/٢٠٢٦، ٢:١٤:١٢ م". The rest of the app is fully localized. This is an inconsistency in an otherwise polished UI.

**Fix**: Replace with `useLocale()` → `new Date(notification.createdAt).toLocaleString(locale)`.

---

### M-7 — FEATURED_EXPIRED cron: per-listing error handling absent

**Category**: Notification Performance Issues / Stale Notifications  
**Files**:  
- `apps/api/src/payments/payments-cron.service.ts` — `expireFeaturedListings` method  

**Description**  
```typescript
for (const l of carListings) {
  await this.prisma.listing.update(...);   // can throw
  await this.notifications.create(...);   // can throw
}
```
No `try-catch` wraps individual listing processing. If one `listing.update` throws (e.g., the record was deleted between the `findMany` and the `update`), the entire cron job crashes mid-loop. All remaining listings in that batch are NOT processed: they keep `isPremium: true` forever and never receive the expiry notification.

Compare: `TransportExpiryService` uses `Promise.allSettled` — the right pattern.

**Fix**: Wrap each loop body in `try { ... } catch (err) { this.logger.error(...); }` or use `Promise.allSettled`.

---

## 🔵 LOW

---

### L-1 — `PRICE_DROP`: dead notification type — enum value, config, never emitted

**Category**: Dead Notification Types  
**Files**: `schema.prisma`, `notifications.ts` (config), no service emits it  

**Description**  
`PRICE_DROP` is fully configured with an orange tag icon and navigation to `/sale/car/{listingId}`. But no service ever creates it. When a seller reduces their car price, no price-drop alert fires to users who favorited the listing.

---

### L-2 — LISTING_CREATED/UPDATED/DELETED/STATUS_CHANGED: missing from frontend config

**Category**: Dead Notification Types / Navigation Bugs  
**Files**:  
- `apps/web/src/lib/constants/notifications.ts` — missing entries  
- `apps/api/src/common/listeners/listing-notification.listener.ts` — emits all four  

**Description**  
These four types are actively emitted for every listing mutation (via `base-listing.service.ts`), but they have no entry in `NOTIFICATION_TYPE_CONFIG`. They fall through to `DEFAULT_NOTIF_CONFIG` with a generic bell icon and `navigateTo: () => null`.

Clicking "تم نشر إعلانك بنجاح" from the notifications page does nothing. The user has to manually search for their listing.

**Affected types**: `LISTING_CREATED`, `LISTING_UPDATED`, `LISTING_DELETED`, `LISTING_STATUS_CHANGED`

---

### L-3 — ENTITY_LABELS covers only CAR_SERVICE; all other types say "إعلان"

**Category**: Missing Notifications (context)  
**Files**:  
- `apps/api/src/common/listeners/listing-notification.listener.ts` lines 6–8  

**Description**  
```typescript
const ENTITY_LABELS: Record<string, string> = {
  CAR_SERVICE: 'خدمة سيارات',
};
// label = ENTITY_LABELS[payload.entityType] ?? 'إعلان'
```
A bus listing creation sends: "تم نشر **إعلان** بنجاح" — not "تم نشر **إعلان حافلة** بنجاح". A spare part says "إعلان". Only Car Services get their proper label. All other entity types (LISTING, BUS_LISTING, EQUIPMENT_LISTING, OPERATOR_LISTING, SPARE_PART, JOB) receive the generic "إعلان" fallback.

---

### L-4 — Carrier quote withdrawal: shipper receives no notification

**Category**: Missing Notifications  
**Files**:  
- `apps/api/src/transport/transport-quote.service.ts` — `withdrawQuote` method  

**Description**  
When a carrier withdraws a pending quote, `withdrawQuote` updates the DB and invalidates caches but sends **no notification** to the shipper. The shipper has no idea their prospective carrier dropped out. If the shipper was waiting on that quote to accept it, they'd see it disappear from their list with no explanation.

---

### L-5 — Service worker hardcoded `dir: 'rtl', lang: 'ar'`

**Category**: Mobile Notification Issues  
**Files**:  
- `apps/web/public/sw.js` lines 11–12  

**Description**  
```javascript
dir: 'rtl',
lang: 'ar',
```
These fields affect how the OS renders the push notification body text. English locale users receive push notifications displayed right-to-left with `lang: ar`. On iOS, this can cause visual artifacts in the system notification banner. The service worker has no access to the user's locale preference.

**Fix**: Use `dir: 'auto'` and omit `lang`, or pass the locale in the push payload from the server.

---

### L-6 — Driver verification SYSTEM notification navigates nowhere

**Category**: Navigation Bugs / Dead Notification Types  
**Files**:  
- `apps/api/src/jobs/driver-verification.service.ts` lines 105–111  

**Description**  
Verification approval/rejection sends `type: 'SYSTEM'` with no meaningful `data`. The user gets "تم توثيق حسابك بنجاح ✓" but clicking it does nothing — `SYSTEM` navigates to `null`. There is no link to their driver profile or verification status page.

---

### L-7 — `useNotifications(1)` in navbar creates a separate independent poll

**Category**: Notification Performance Issues  
**Files**:  
- `apps/web/src/components/layout/navbar.tsx` line 68  

**Description**  
```typescript
const { data: notifData } = useNotifications(1);
```
This creates a React Query entry with key `['notifications', 1]`. The notifications page uses `['notifications', 'infinite', filter]` (mobile) or `['notifications', desktopPage]` (desktop). These are **three separate cache keys** with independent polling. When the user marks a notification as read on the full notifications page (which invalidates `['notifications']`), it correctly refetches the navbar's `['notifications', 1]` too — so this is not a data inconsistency. But it means every logged-in user fires an extra background HTTP request every 30 seconds just for the navbar preview. Consider removing the preview and showing only the count, or reusing the infinite query.

---

### L-8 — Notification spam: carriers receive SYSTEM alert for every nearby request

**Category**: Notification Spam  
**Files**:  
- `apps/api/src/transport/transport-request.service.ts` lines 97–103  

**Description**  
When a shipper creates a transport request, all CarrierProfiles in the matching governorate receive a `SYSTEM` "طلب نقل جديد قريب منك" notification. In busy governorates (Muscat), a carrier registered there could receive dozens of these per day — especially if multiple shippers post requests simultaneously. There is no frequency cap, opt-out setting, or batching. This trains users to ignore SYSTEM notifications entirely (notification fatigue).

---

### L-9 — Transport request expiry notification: no request context in body

**Category**: Stale Notifications / Broken Notification Links  
**Files**:  
- `apps/api/src/transport/transport-expiry.service.ts` lines 47–52  

**Description**  
```typescript
body: 'انتهت صلاحية طلب النقل الخاص بك ولم يتم قبول أي عرض',
```
No request description, origin, or destination. A user with three expired requests has three identical notifications and cannot distinguish which is which. Including `request.cargoDescription` or `request.fromGovernorate → request.toGovernorate` in the body would make these actionable.

---

### L-10 — Mobile scroll position not reset when filter switches

**Category**: Mobile Notification Issues  
**Files**:  
- `apps/web/src/features/notifications/components/NotificationsPageClient.tsx`  

**Description**  
When the mobile user is scrolled 80% through "All" notifications and switches to "Unread", the `IntersectionObserver` sentinel is still near the bottom of the previous scroll position. If the "Unread" list is short, the sentinel is immediately visible, triggering `fetchNextPage()` on a nearly-empty first page — a spurious network request. Additionally, the user starts reading from mid-page rather than the top.

**Fix**: Call `window.scrollTo(0, 0)` on filter change.

---

## Summary Table

| ID | Severity | Category | Short Name |
|---|---|---|---|
| C-1 | 🔴 Critical | Filter Broken | Mobile unread filter: `?unread=true` vs `?filter=unread` |
| C-2 | 🔴 Critical | Pipeline Bypass | LISTING_FAVORITED skips WebSocket + Push entirely |
| H-1 | 🟠 High | Filter Broken | Desktop unread filter never passed to query |
| H-2 | 🟠 High | Cache Bug | Desktop pagination doesn't reset on filter change |
| H-3 | 🟠 High | Navigation Dead | Navbar dropdown only navigates for MESSAGE type |
| H-4 | 🟠 High | Spam | PAYMENT_SUCCESS + SUBSCRIPTION_ACTIVATED double-fire |
| H-5 | 🟠 High | Missing Notif | LISTING_SOLD never emitted — dead config entry |
| H-6 | 🟠 High | Duplicate Notif | Carrier review: two code paths both fire REVIEW_RECEIVED |
| H-7 | 🟠 High | Optimistic Bug | Mark-read optimistic update misses desktop query |
| H-8 | 🟠 High | Mobile Spam | Push tag collision — OS tray always has ≤ 1 notification |
| M-1 | 🟡 Medium | Navigation | Push deep-link always `/notifications`, never content |
| M-2 | 🟡 Medium | Navigation Dead | SYSTEM notifications are unclickable / no navigation |
| M-3 | 🟡 Medium | Count Bug | Sidebar stats ignore active filter |
| M-4 | 🟡 Medium | Stale Data | typeBreakdown from page 1 only |
| M-5 | 🟡 Medium | Navigation | REVIEW_RECEIVED missing `bookingId` from general path |
| M-6 | 🟡 Medium | Locale | Detail panel hardcoded `en-US` date format |
| M-7 | 🟡 Medium | Reliability | FEATURED_EXPIRED cron crashes on first failure |
| L-1 | 🔵 Low | Dead Type | PRICE_DROP enum — never emitted |
| L-2 | 🔵 Low | Dead Config | LISTING_CREATED/UPDATED/DELETED/STATUS_CHANGED: no frontend config |
| L-3 | 🔵 Low | Missing Context | Entity labels only cover CAR_SERVICE; rest says "إعلان" |
| L-4 | 🔵 Low | Missing Notif | Quote withdrawal: shipper not notified |
| L-5 | 🔵 Low | Mobile | Service worker hardcoded RTL/AR for all locales |
| L-6 | 🔵 Low | Navigation Dead | Driver verification notification navigates nowhere |
| L-7 | 🔵 Low | Performance | Navbar creates independent 30 s poll for notifications |
| L-8 | 🔵 Low | Spam | Carrier receives SYSTEM notif for every nearby request (no cap) |
| L-9 | 🔵 Low | Context | Transport expiry body has no request description |
| L-10 | 🔵 Low | Mobile UX | Scroll not reset to top on mobile filter change |

---

## Recommended Fix Priority

### Sprint 1 (this week — correctness)
| Priority | Bug | Effort |
|---|---|---|
| 1 | C-1: Fix `?unread=true` → `?filter=unread` | 5 min |
| 2 | C-2: Replace `prisma.notification.create()` with `notificationsService.create()` in favorites | 15 min |
| 3 | H-3: Use `getNotifConfig(n.type).navigateTo(n.data)` in notification dropdown | 20 min |
| 4 | H-4: Remove duplicate subscription notification | 10 min |
| 5 | H-1 + H-2: Add `filter` to `useNotifications`, reset page on filter change | 30 min |

### Sprint 2 (this week — data integrity)
| Priority | Bug | Effort |
|---|---|---|
| 6 | H-8: Fix push notification tag collision | 5 min |
| 7 | M-1: Use `navigateTo` result as push notification URL | 30 min |
| 8 | M-7: Add per-listing try-catch in FEATURED cron | 15 min |
| 9 | M-2: Replace SYSTEM type with actionable types in booking cancel / verification | 30 min |

### Sprint 3 (next week — features + polish)
| Priority | Bug | Effort |
|---|---|---|
| 10 | H-5: Add LISTING_SOLD event emit when status → SOLD | 45 min |
| 11 | L-1: Add PRICE_DROP emit when listing price decreases | 1 h |
| 12 | L-2: Add LISTING_* types to `NOTIFICATION_TYPE_CONFIG` | 30 min |
| 13 | L-4: Send notification to shipper when carrier withdraws quote | 20 min |
| 14 | M-6: Fix locale in detail panel | 5 min |
| 15 | L-3: Expand ENTITY_LABELS to cover all listing types | 15 min |
| 16 | L-5: Use `dir: 'auto'` in service worker | 2 min |
| 17 | L-10: Scroll to top on filter change | 5 min |

---

*Generated by full read of all notification-related source files: `notifications.service.ts`, `notifications.controller.ts`, `push.service.ts`, `chat.gateway.ts`, `favorites.service.ts`, `payment-activation.service.ts`, `payments-cron.service.ts`, `transport-*.service.ts` (5 files), `reviews.service.ts`, `jobs.service.ts`, `listing-notification.listener.ts`, `NotificationsPageClient.tsx`, `NotificationCard.tsx`, `notification-dropdown.tsx`, `NotificationsDesktopSidebar.tsx`, `NotificationsDesktopDetailPanel.tsx`, `navbar.tsx`, `use-push-notifications.ts`, `push-notification-banner.tsx`, `notifications.ts` (api hooks), `notifications.ts` (constants), `sw.js`.*
