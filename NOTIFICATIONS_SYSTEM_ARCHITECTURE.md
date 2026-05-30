# NOTIFICATIONS SYSTEM ARCHITECTURE

> **Role:** Staff Software Architect — Event-Driven Systems  
> **Scope:** Full-stack analysis — Database · API · Backend Services · WebSocket Gateway · Web Push · Frontend Hooks · UI Components  
> **Based on:** Actual code traversal (not filenames alone)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Tables](#2-database-tables)
3. [Notification Types (Enum)](#3-notification-types-enum)
4. [Notification Payload Structure](#4-notification-payload-structure)
5. [How Notifications Are Created](#5-how-notifications-are-created)
6. [How Notifications Are Stored](#6-how-notifications-are-stored)
7. [How Notifications Are Fetched](#7-how-notifications-are-fetched)
8. [How Notifications Are Marked as Read](#8-how-notifications-are-marked-as-read)
9. [Deletion & Retention Policy](#9-deletion--retention-policy)
10. [Real-Time vs Polling](#10-real-time-vs-polling)
11. [All Events That Create Notifications](#11-all-events-that-create-notifications)
12. [Recipient Mapping](#12-recipient-mapping)
13. [Notification Services (Backend)](#13-notification-services-backend)
14. [Notification APIs](#14-notification-apis)
15. [Notification Hooks (Frontend)](#15-notification-hooks-frontend)
16. [Notification Components (Frontend)](#16-notification-components-frontend)
17. [End-to-End Flow Map](#17-end-to-end-flow-map)
18. [Web Push Architecture](#18-web-push-architecture)
19. [Gaps & Observations](#19-gaps--observations)

---

## 1. System Overview

The notification system is a **multi-channel, event-driven pipeline** with three delivery channels:

| Channel | Mechanism | When Used |
|---|---|---|
| **WebSocket** | Socket.IO `/chat` namespace, room `user:{userId}` | User is online at creation time |
| **Web Push** | VAPID + `web-push` library → Service Worker | User has subscribed, regardless of online status |
| **REST Polling** | `GET /notifications/unread-count` every 30s | Fallback badge count sync |

The system does **not** use message queues (no BullMQ, no Kafka). Notifications are created synchronously inside service calls, persisted to PostgreSQL, then fan out to WebSocket and Web Push immediately.

```
Triggering Event
       │
       ▼
  Service calls NotificationsService.create()
       │
       ├──► prisma.notification.create()  →  PostgreSQL
       │
       ├──► EventEmitter2.emit('notification.created')
       │         └──► ChatGateway.onNotificationCreated()
       │                   └──► Redis: isUserOnline?
       │                             ├── YES → Socket.IO emit('notification') to room user:{userId}
       │                             └── NO  → (no WS delivery; polling/push handles it)
       │
       └──► PushService.sendToUser()
                 └──► web-push.sendNotification() → Browser Push API → Service Worker
```

---

## 2. Database Tables

### `notifications` table

```prisma
model Notification {
  id        String           @id @default(cuid())
  type      NotificationType               -- enum (23 values)
  title     String                         -- display title (Arabic)
  body      String                         -- display body (Arabic)
  data      Json?                          -- contextual IDs (requestId, bookingId, jobId, etc.)
  isRead    Boolean          @default(false)
  userId    String
  user      User             @relation(...)
  createdAt DateTime         @default(now())

  @@index([userId])                        -- fast user lookup
  @@index([isRead])                        -- fast unread filter
  @@index([createdAt])                     -- ordered listing + retention filter
  @@map("notifications")
}
```

**Important:** There is **no `updatedAt`** field — `isRead` updates never need a timestamp. There is **no `deletedAt`** — no soft delete.

### `push_subscriptions` table

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  endpoint  String   @unique                -- browser push endpoint URL
  p256dh    String                          -- encryption key
  auth      String                          -- auth secret
  userId    String
  user      User     @relation(...)
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("push_subscriptions")
}
```

One user can have **multiple subscriptions** (different devices/browsers). When a push returns HTTP 410 or 404, the endpoint is automatically cleaned up.

---

## 3. Notification Types (Enum)

Defined in `apps/api/prisma/schema.prisma` as `NotificationType`, and mirrored in `apps/web/src/lib/constants/notifications.ts` as `NOTIFICATION_TYPE_CONFIG`.

| Type | Domain | Who Receives | i18n labelKey |
|---|---|---|---|
| `MESSAGE` | Chat | Conversation participant | `notifTypeMessage` |
| `LISTING_SOLD` | Marketplace | Listing owner | `notifTypeSold` |
| `LISTING_FAVORITED` | Marketplace | Listing owner | `notifTypeFavorite` |
| `PRICE_DROP` | Marketplace | Favorited listing watcher | `notifTypePriceDrop` |
| `SYSTEM` | Platform | Various | `notifTypeSystem` |
| `JOB_APPLICATION` | Jobs | Job employer | `notifTypeJobApplication` |
| `JOB_APPLICATION_ACCEPTED` | Jobs | Job applicant | `notifTypeJobAccepted` |
| `JOB_APPLICATION_REJECTED` | Jobs | Job applicant | `notifTypeJobRejected` |
| `JOB_RECOMMENDATION` | Jobs | Driver/applicant | `notifTypeJobRecommendation` |
| `REVIEW_RECEIVED` | Reviews | Reviewee (any domain) | `notifTypeOther` *(no dedicated key)* |
| `PAYMENT_SUCCESS` | Payments | Payer | `notifTypeOther` |
| `SUBSCRIPTION_ACTIVATED` | Payments | Subscriber | `notifTypeOther` |
| `FEATURED_EXPIRED` | Payments | Listing owner | `notifTypeOther` |
| `LISTING_CREATED` | Listings | Listing creator | `notifTypeOther` |
| `LISTING_UPDATED` | Listings | Listing owner | `notifTypeOther` |
| `LISTING_DELETED` | Listings | Listing owner | `notifTypeOther` |
| `LISTING_STATUS_CHANGED` | Listings | Listing owner | `notifTypeOther` |
| `TRANSPORT_QUOTE_RECEIVED` | Transport | Shipper | `notifTypeTransport` |
| `TRANSPORT_QUOTE_ACCEPTED` | Transport | Carrier | `notifTypeTransport` |
| `TRANSPORT_QUOTE_REJECTED` | Transport | Carrier | `notifTypeTransport` |
| `TRANSPORT_BOOKING_CONFIRMED` | Transport | Shipper | `notifTypeTransport` |
| `TRANSPORT_BOOKING_CANCELLED` | Transport | Counterpart | `notifTypeTransport` |
| `TRANSPORT_REQUEST_CLOSED` | Transport | Carrier | `notifTypeTransport` |
| `TRANSPORT_REQUEST_CANCELLED` | Transport | Carrier (quote holders) | `notifTypeTransport` |
| `TRANSPORT_REQUEST_EXPIRED` | Transport | Shipper | `notifTypeTransport` |

**Note:** `FEATURED_EXPIRED` exists in the enum but has **no code path** that creates it. It is unused.

---

## 4. Notification Payload Structure

### API Response Object (`NotificationItem`)

```typescript
interface NotificationItem {
  id:        string;                      // cuid
  type:      string;                      // NotificationType enum value
  title:     string;                      // pre-rendered Arabic title
  body:      string;                      // pre-rendered Arabic body
  data:      Record<string, any> | null;  // navigation data (IDs)
  isRead:    boolean;
  createdAt: string;                      // ISO 8601
}
```

### `data` field contents by type

| Type | `data` Fields |
|---|---|
| `TRANSPORT_QUOTE_RECEIVED` | `{ requestId, quoteId }` |
| `TRANSPORT_QUOTE_ACCEPTED` | `{ requestId, bookingId }` |
| `TRANSPORT_QUOTE_REJECTED` | `{ requestId }` |
| `TRANSPORT_BOOKING_CONFIRMED` | `{ bookingId }` |
| `TRANSPORT_BOOKING_CANCELLED` | `{ bookingId }` |
| `TRANSPORT_REQUEST_CLOSED` | `{ bookingId }` |
| `TRANSPORT_REQUEST_CANCELLED` | `{ requestId }` |
| `TRANSPORT_REQUEST_EXPIRED` | `{ requestId }` |
| `SYSTEM` (new transport request) | `{ requestId }` |
| `SYSTEM` (request re-opened) | `{ requestId }` |
| `JOB_APPLICATION` | `{ jobId, applicationId }` |
| `JOB_APPLICATION_ACCEPTED` | `{ jobId, applicationId }` |
| `JOB_APPLICATION_REJECTED` | `{ jobId, applicationId }` |
| `REVIEW_RECEIVED` (transport) | `{ bookingId, rating }` |
| `REVIEW_RECEIVED` (general) | `{ reviewId, entityType, entityId }` |
| `PAYMENT_SUCCESS` | `{ paymentId }` |
| `SUBSCRIPTION_ACTIVATED` | `{ plan }` |
| `LISTING_CREATED/UPDATED/DELETED` | `{ entityType, listingId }` |
| `SYSTEM` (driver verification) | `{ verificationId }` |
| `MESSAGE` | `{ conversationId }` |

---

## 5. How Notifications Are Created

### Entry Point: `NotificationsService.create(dto)`

File: `apps/api/src/notifications/notifications.service.ts`

```typescript
async create(dto: CreateNotificationDto) {
  // 1. Persist to DB
  const notification = await this.prisma.notification.create({ data: { ... } });

  // 2. Get unread count for badge update
  const unreadCount = await this.getUnreadCount(dto.userId);

  // 3. Fire internal event → ChatGateway picks it up for WebSocket delivery
  this.events.emit(NOTIFICATION_EVENTS.CREATED, {
    userId: dto.userId,
    notification,
    unreadCount: unreadCount.count,
  });

  // 4. Web Push (fire-and-forget, errors are swallowed)
  await this.pushService.sendToUser(dto.userId, { ... });

  return notification;
}
```

### Two paths to `create()`

#### Path A — Direct service call (10 callers)

Services inject `NotificationsService` and call `.create()` directly inside their business logic:

| Caller Service | File |
|---|---|
| `TransportRequestService` | `transport-request.service.ts` |
| `TransportQuoteService` | `transport-quote.service.ts` |
| `TransportBookingService` | `transport-booking.service.ts` |
| `TransportExpiryService` | `transport-expiry.service.ts` |
| `TransportReviewService` | `transport-review.service.ts` |
| `JobsService` | `jobs.service.ts` |
| `DriverVerificationService` | `driver-verification.service.ts` |
| `ReviewsService` | `reviews.service.ts` |
| `PaymentActivationService` | `payment-activation.service.ts` |

#### Path B — Event listener (listings only)

`ListingNotificationListener` uses `@OnEvent()` decorator to react to `EventEmitter2` events:

```typescript
// apps/api/src/common/listeners/listing-notification.listener.ts
@OnEvent(LISTING_EVENTS.CREATED)    → type: 'LISTING_CREATED'
@OnEvent(LISTING_EVENTS.UPDATED)    → type: 'LISTING_UPDATED'
@OnEvent(LISTING_EVENTS.DELETED)    → type: 'LISTING_DELETED'
@OnEvent(LISTING_EVENTS.STATUS_CHANGED) → type: 'LISTING_STATUS_CHANGED'
```

Events are emitted by services that call `this.events.emit(LISTING_EVENTS.CREATED, payload)`.

---

## 6. How Notifications Are Stored

```
Service Layer
     │
     ▼
NotificationsService.create(dto)
     │
     ▼
prisma.notification.create({
  data: {
    type:   dto.type,      // enum
    title:  dto.title,     // Arabic string
    body:   dto.body,      // Arabic string
    userId: dto.userId,    // FK → users.id
    data:   dto.data,      // JSON blob or undefined
  }
})
     │
     ▼
PostgreSQL `notifications` table
  - isRead defaults to false
  - createdAt defaults to now()
  - no expiry / TTL in DB itself
```

**Retention:** `findAll` filters `createdAt > (now - 90 days)` but `getUnreadCount` has **no retention filter** (intentional — badge shows all unread ever).

---

## 7. How Notifications Are Fetched

### Backend — `NotificationsService.findAll()`

```typescript
findAll(userId, page = 1, limit = 20, filter?: 'all' | 'unread')
  → WHERE userId = ? AND createdAt > (now - 90d) [AND isRead = false if filter='unread']
  → ORDER BY createdAt DESC
  → SKIP (page-1)*limit  TAKE limit
  → returns { items[], meta: { total, page, limit, totalPages } }
```

### Frontend — Two fetch strategies

#### Mobile: Infinite Scroll
```typescript
useInfiniteQuery({
  queryKey: ['notifications', 'infinite', filter],
  queryFn: ({ pageParam }) => apiRequest(`/notifications?page=${pageParam}&limit=20`),
  getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? page+1 : undefined,
})
```

#### Desktop: Paginated
```typescript
useNotifications(page)  // wraps useQuery(['notifications', page])
  → GET /notifications?page={page}&limit=20
```

#### Unread Count Badge: Polling
```typescript
useUnreadCount()  // useQuery with refetchInterval: 30_000
  → GET /notifications/unread-count  (every 30 seconds)
```

---

## 8. How Notifications Are Marked as Read

### Single notification

**API:** `PATCH /notifications/:id/read`

**Backend:**
```typescript
markAsRead(id, userId) {
  // 1. Ownership check (findFirst with userId guard)
  // 2. Early return if already read (no DB write)
  // 3. prisma.notification.update({ data: { isRead: true } })
}
```

**Frontend — Optimistic Update:**
```typescript
// NotificationsPageClient.tsx - handleClick()
// 1. Immediately update local cache (no loading spinner):
queryClient.setQueryData(['notifications', 'infinite', filter], (old) => {
  // map over pages, set matching item.isRead = true
})
queryClient.setQueryData(['unread-count'], (old) => ({ count: max(0, old.count - 1) }))
// 2. Fire API mutation (backend confirms)
markRead.mutate(n.id)
```

### Mark all as read

**API:** `PATCH /notifications/read-all`

**Backend:**
```typescript
markAllAsRead(userId) {
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}
```

**Frontend — Optimistic Update:**
```typescript
// handleMarkAll()
queryClient.setQueryData(['unread-count'], { count: 0 })
// map all items in all pages → isRead: true
markAllRead.mutate()
```

---

## 9. Deletion & Retention Policy

| Feature | Status |
|---|---|
| Single delete | ❌ No endpoint exists |
| Bulk delete | ❌ No endpoint exists |
| Archive / soft-delete | ❌ Not implemented |
| Hard retention cutoff (DB) | ❌ No DB-level TTL or cron |
| Soft retention (API) | ✅ 90-day window on `findAll` only |
| Unread count retention | ❌ None — counts ALL unread ever |

**Practical behavior:** Notifications older than 90 days are invisible in the UI list but still exist in the database. The unread count badge still counts them if they were never marked read.

---

## 10. Real-Time vs Polling

### Real-Time: Socket.IO WebSocket

**Namespace:** `/chat`  
**Room per user:** `user:{userId}` — client joins this room on connection  
**Event name emitted to client:** `notification`

**Flow:**
```
NotificationsService.create()
  └─► EventEmitter2.emit('notification.created', { userId, notification, unreadCount })
          └─► ChatGateway.onNotificationCreated()   [@OnEvent handler]
                    └─► redis.exists(`user:online:${userId}`)
                              ├── true  → server.to(`user:${userId}`).emit('notification', notification)
                              └── false → no WS delivery (Web Push covers offline users)
```

**Online detection:** When a socket connects, `redis.set('user:online:{userId}', '1', 600)` is called (TTL 600s). A `ping/pong` handler refreshes it. On disconnect, the key is deleted.

**Multi-instance support:** Chat messages use Redis Pub/Sub (`chat:message` channel) for horizontal scaling. However, notification WS delivery does **not** use Redis Pub/Sub — it relies on `server.to(room).emit()` directly. This means **notifications are only delivered via WS if the user's socket is on the same API instance**. On multi-pod deployments, Web Push is the reliable fallback.

### Polling: Badge Count

```typescript
useUnreadCount()  →  refetchInterval: 30_000ms
  GET /notifications/unread-count
  → returns { count: number }
```

This is the safety net: even if WebSocket delivery misses (offline, multi-pod), the badge syncs within 30 seconds.

### Summary

| Scenario | Delivery Mechanism |
|---|---|
| User online, same server instance | WebSocket (`notification` event) |
| User online, different server instance | Polling (30s) + Web Push |
| User offline, push subscribed | Web Push → Service Worker |
| User offline, no push subscription | Next page load polling |

---

## 11. All Events That Create Notifications

### Transport Domain

| Triggering Event | Type Created | Recipient | Trigger Location |
|---|---|---|---|
| Carrier submits quote | `TRANSPORT_QUOTE_RECEIVED` | Shipper | `TransportQuoteService.submitQuote()` |
| Shipper accepts quote | `TRANSPORT_QUOTE_ACCEPTED` | Carrier (winner) | `TransportQuoteService.sendAcceptanceNotifications()` |
| Shipper accepts quote | `TRANSPORT_QUOTE_REJECTED` | All other carriers | `TransportQuoteService.sendAcceptanceNotifications()` |
| Carrier starts loading | `TRANSPORT_BOOKING_CONFIRMED` | Shipper | `TransportBookingService.confirmStart()` |
| Shipper marks complete | `TRANSPORT_REQUEST_CLOSED` | Carrier | `TransportBookingService.complete()` |
| Shipper cancels booking | `TRANSPORT_BOOKING_CANCELLED` | Carrier | `TransportBookingService.cancel()` |
| Carrier cancels booking | `TRANSPORT_BOOKING_CANCELLED` | Shipper | `TransportBookingService.cancel()` |
| Carrier cancels booking | `SYSTEM` "طلبك متاح مجدداً" | Shipper | `TransportBookingService.cancel()` |
| Shipper cancels request | `TRANSPORT_REQUEST_CANCELLED` | All quote carriers | `TransportRequestService.cancel()` |
| New request created | `SYSTEM` "طلب نقل جديد" | Up to 30 nearby carriers | `TransportRequestService.notifyNearbyCarriers()` |
| Cron: request expires | `TRANSPORT_REQUEST_EXPIRED` | Shipper | `TransportExpiryService.expireOldRequests()` (daily 3AM) |
| Shipper rates carrier | `REVIEW_RECEIVED` | Carrier | `TransportReviewService.createReview()` |

### Jobs Domain

| Triggering Event | Type Created | Recipient | Trigger Location |
|---|---|---|---|
| Driver applies to job | `JOB_APPLICATION` | Employer | `JobsService.applyToJob()` |
| Employer accepts application | `JOB_APPLICATION_ACCEPTED` | Applicant | `JobsService.updateApplicationStatus()` |
| Employer rejects application | `JOB_APPLICATION_REJECTED` | Applicant | `JobsService.updateApplicationStatus()` |
| Applicant withdraws | `JOB_APPLICATION` "سحب طلب" | Employer | `JobsService.withdrawApplication()` |
| Admin approves verification | `SYSTEM` "تم التوثيق" | Driver | `DriverVerificationService.processDecision()` |
| Admin rejects verification | `SYSTEM` "رُفض التوثيق" | Driver | `DriverVerificationService.processDecision()` |

### Reviews Domain

| Triggering Event | Type Created | Recipient | Trigger Location |
|---|---|---|---|
| Any review submitted | `REVIEW_RECEIVED` | Reviewee | `ReviewsService.create()` |

### Payments Domain

| Triggering Event | Type Created | Recipient | Trigger Location |
|---|---|---|---|
| Payment webhook success | `PAYMENT_SUCCESS` | Payer | `PaymentActivationService.notifyPaymentSuccess()` |
| Subscription activated | `SUBSCRIPTION_ACTIVATED` | Subscriber | `PaymentActivationService.activateSubscription()` |

### Listings Domain (Event-Driven)

| Triggering Event | Type Created | Recipient | Trigger Location |
|---|---|---|---|
| `listing.created` event | `LISTING_CREATED` | Listing owner | `ListingNotificationListener` |
| `listing.updated` event | `LISTING_UPDATED` | Listing owner | `ListingNotificationListener` |
| `listing.deleted` event | `LISTING_DELETED` | Listing owner | `ListingNotificationListener` |
| `listing.status_changed` event | `LISTING_STATUS_CHANGED` | Listing owner | `ListingNotificationListener` |

---

## 12. Recipient Mapping

```
NotificationType              │ Recipient
──────────────────────────────┼──────────────────────────────────────────────────
TRANSPORT_QUOTE_RECEIVED      │ TransportRequest.userId (shipper)
TRANSPORT_QUOTE_ACCEPTED      │ TransportQuote.carrier.userId (winning carrier)
TRANSPORT_QUOTE_REJECTED      │ TransportQuote.carrier.userId (losing carriers) ×N
TRANSPORT_BOOKING_CONFIRMED   │ TransportRequest.userId (shipper)
TRANSPORT_BOOKING_CANCELLED   │ The OTHER party (if shipper cancels → carrier; if carrier cancels → shipper)
TRANSPORT_REQUEST_CLOSED      │ TransportQuote.carrier.userId (carrier)
TRANSPORT_REQUEST_CANCELLED   │ All pending quote carriers ×N
TRANSPORT_REQUEST_EXPIRED     │ TransportRequest.userId (shipper)
SYSTEM (new request nearby)   │ Up to 30 CarrierProfile.userId (by governorate+serviceType match)
SYSTEM (carrier cancelled)    │ TransportRequest.userId (shipper)
SYSTEM (verification)         │ DriverProfile.userId
JOB_APPLICATION               │ DriverJob.userId (employer)
JOB_APPLICATION_ACCEPTED      │ JobApplication.applicantId
JOB_APPLICATION_REJECTED      │ JobApplication.applicantId
REVIEW_RECEIVED               │ dto.revieweeId (shipper rating carrier, or any general review target)
PAYMENT_SUCCESS               │ Payment.userId
SUBSCRIPTION_ACTIVATED        │ userId from payment session
LISTING_CREATED/UPDATED/etc.  │ ListingEventPayload.userId (listing owner)
```

---

## 13. Notification Services (Backend)

### `NotificationsService`
`apps/api/src/notifications/notifications.service.ts`

| Method | Description |
|---|---|
| `create(dto)` | Persist + emit WS event + send Web Push |
| `findAll(userId, page, limit, filter)` | Paginated list with 90-day retention |
| `getUnreadCount(userId)` | Badge count (no retention filter) |
| `markAsRead(id, userId)` | Single mark with ownership check |
| `markAllAsRead(userId)` | Bulk mark (updateMany) |

### `PushService`
`apps/api/src/notifications/push.service.ts`

| Method | Description |
|---|---|
| `getPublicKey()` | Return VAPID public key for client subscription |
| `subscribe(userId, subscription)` | Upsert browser subscription to DB |
| `unsubscribe(endpoint, userId)` | Delete subscription from DB |
| `sendToUser(userId, payload)` | Find all subscriptions, fan out via `web-push.sendNotification()`, auto-clean expired endpoints (410/404) |

### `ChatGateway` (WS delivery)
`apps/api/src/chat/chat.gateway.ts`

| Method | Description |
|---|---|
| `onNotificationCreated(payload)` | `@OnEvent('notification.created')` → check Redis online → `server.to('user:{userId}').emit('notification', notification)` |
| `sendNotification(userId, notification)` | Direct send (available for imperative calls) |
| `isUserOnline(userId)` | `redis.exists('user:online:{userId}')` |

### `ListingNotificationListener`
`apps/api/src/common/listeners/listing-notification.listener.ts`

Bridges listing domain events to notification creation. Only handles `CAR_SERVICE` entity type with Arabic label, falls back to `"إعلان"` for all others.

### `TransportExpiryService`
`apps/api/src/transport/transport-expiry.service.ts`

Cron job: `@Cron(CronExpression.EVERY_DAY_AT_3AM)`  
Marks expired `OPEN`/`QUOTED` requests as `EXPIRED`, flushes Redis cache, fires `TRANSPORT_REQUEST_EXPIRED` notifications to each shipper.

---

## 14. Notification APIs

Base URL: `/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ JWT | List paginated notifications. Query: `page`, `limit`, `filter=all|unread` |
| `GET` | `/unread-count` | ✅ JWT | Returns `{ count: number }`. Used for polling badge. |
| `PATCH` | `/:id/read` | ✅ JWT | Mark single notification as read (ownership enforced) |
| `PATCH` | `/read-all` | ✅ JWT | Mark all user notifications as read |
| `GET` | `/push/vapid-key` | ❌ Public | Return VAPID public key for browser push subscription |
| `POST` | `/push/subscribe` | ✅ JWT | Register browser push subscription |
| `POST` | `/push/unsubscribe` | ✅ JWT | Remove browser push subscription |

**Missing APIs (not implemented):**
- `DELETE /notifications/:id` — no single delete
- `DELETE /notifications` — no bulk delete
- `GET /notifications/:id` — no single fetch (page fetches list)

---

## 15. Notification Hooks (Frontend)

All in `apps/web/src/lib/api/notifications.ts`:

```typescript
useNotifications(page = 1)
  // → GET /notifications?page={page}&limit=20
  // queryKey: ['notifications', page]

useUnreadCount()
  // → GET /notifications/unread-count
  // queryKey: ['unread-count']
  // refetchInterval: 30_000 ms  ← polling

useMarkNotificationRead()
  // → PATCH /notifications/:id/read
  // onSuccess: invalidates ['notifications'] and ['unread-count']

useMarkAllNotificationsRead()
  // → PATCH /notifications/read-all
  // onSuccess: invalidates ['notifications'] and ['unread-count']
```

Additional hook in `apps/web/src/hooks/use-push-notifications.ts`:

```typescript
usePushNotifications()
  // Returns: { status, isSubscribed, subscribe(), unsubscribe() }
  // subscribe():
  //   1. Notification.requestPermission()
  //   2. GET /notifications/push/vapid-key
  //   3. navigator.serviceWorker.ready → pushManager.subscribe()
  //   4. POST /notifications/push/subscribe
  // unsubscribe():
  //   1. pushManager.getSubscription() → sub.unsubscribe()
  //   2. POST /notifications/push/unsubscribe
```

---

## 16. Notification Components (Frontend)

### Navbar Bell — `NotificationDropdown`
`apps/web/src/components/layout/navbar/notification-dropdown.tsx`

- Shows bell icon with red badge (`unreadCount > 9 ? '9+' : count`)
- Dropdown shows last N notifications (whatever `useNotifications(1)` returns: 20 items max)
- Clicking an item: marks read + navigates (only `MESSAGE` type has explicit navigation; others close dropdown)
- "View all" link → `/notifications`
- Desktop only (`hidden lg:block`)

### Full Notifications Page — `NotificationsPageClient`
`apps/web/src/features/notifications/components/NotificationsPageClient.tsx`

Two layouts driven by CSS breakpoint (`md:`):

**Mobile:** `useInfiniteQuery` → infinite scroll, grouped by date  
**Desktop:** 3-column layout:
- Left: `NotificationsDesktopSidebar` — stats, filter, type breakdown
- Center: `NotificationsList` — paginated cards
- Right: `NotificationsDesktopDetailPanel` — selected notification detail

Both layouts use **optimistic updates** for read state (no spinner on mark-read).

### `NotificationCard`
`apps/web/src/features/notifications/components/NotificationCard.tsx`

Uses `getNotifConfig(type)` to resolve:
- Icon (Lucide component)
- Color scheme (`bg`, `text`, `strip`, `border`)
- Label key for i18n badge
- `navigateTo(data)` — derives URL from `data` payload

### `PushNotificationBanner`
`apps/web/src/components/push-notification-banner.tsx`

Shown on notifications page. States:
1. Hidden if: not authenticated, push unsupported, already denied, VAPID not configured
2. "Enable Push" CTA if not subscribed
3. "Push Enabled ✓" if already subscribed

---

## 17. End-to-End Flow Map

### Full flow: Carrier submits quote → Shipper gets notified

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRIGGER                                                                      │
│  Carrier calls POST /transport/requests/:id/quotes                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BACKEND SERVICE: TransportQuoteService.submitQuote()                         │
│  1. Validate: no duplicate, request is OPEN/QUOTED, carrier profile exists   │
│  2. prisma.transportQuote.create()                                           │
│  3. prisma.transportRequest.update({ status: 'QUOTED' })  [if was OPEN]     │
│  4. invalidateRequestCache(requestId)  → Redis del                           │
│  5. this.notifications.create({                                              │
│       type: 'TRANSPORT_QUOTE_RECEIVED',                                      │
│       title: 'عرض سعر جديد',                                                │
│       body: `وصلك عرض بسعر ${price} ر.ع.`,                                  │
│       userId: request.userId,   ← SHIPPER                                   │
│       data: { requestId, quoteId }                                           │
│     })                                                                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NotificationsService.create()                                                │
│  Step 1 → prisma.notification.create()  →  PostgreSQL notifications table   │
│  Step 2 → getUnreadCount(shipperId)     →  fresh badge count                │
│  Step 3 → EventEmitter2.emit('notification.created', { userId, notification })│
│  Step 4 → PushService.sendToUser(shipperId, payload)  [async, fire-forget]  │
└──────────┬────────────────────────────────┬────────────────────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐      ┌──────────────────────────────────────────────┐
│ WebSocket Path        │      │ Web Push Path                                │
│                       │      │                                              │
│ ChatGateway           │      │ prisma.pushSubscription.findMany(shipperId)  │
│ @OnEvent handler      │      │   → for each endpoint:                       │
│                       │      │     webPush.sendNotification(sub, payload)   │
│ redis.exists(         │      │   → auto-delete 410/404 endpoints            │
│  'user:online:        │      │         │                                    │
│   {shipperId}')       │      │         ▼                                    │
│      │                │      │ Browser Push API                             │
│   true? false?        │      │   → Service Worker (sw.js)                   │
│      │       │        │      │   → Browser notification popup               │
│      ▼       ▼        │      └──────────────────────────────────────────────┘
│  emit()  (skip)       │
│ 'notification'        │
│ to room               │
│ 'user:{shipperId}'    │
└──────────┬────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND: Socket.IO client receives 'notification' event                     │
│  → Should update unread badge + show toast                                  │
│  (exact client-side WS handler not found in navbar/notifications code)      │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │  + every 30 seconds regardless:
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ useUnreadCount() polling  →  GET /notifications/unread-count                 │
│  → React Query updates badge count in navbar bell                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Web Push Architecture

```
User visits /notifications
     │
     ▼
PushNotificationBanner renders
     │
     ▼
usePushNotifications() checks:
  - serviceWorker in navigator? (browser support)
  - PushManager in window?
  - Notification.permission?
  - GET /notifications/push/vapid-key → key configured?
     │
     ▼ User clicks "Enable"
     │
     ▼
Notification.requestPermission()
     │
     ▼
navigator.serviceWorker.register('/sw.js')
     │
     ▼
reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: vapidPublicKey
})
     │
     ▼
POST /notifications/push/subscribe
  { endpoint, keys: { p256dh, auth } }
     │
     ▼
PushService.subscribe(userId, subscription)
  → prisma.pushSubscription.upsert({ where: { endpoint } })
     │
     ▼
Later — notification.create() called
  → PushService.sendToUser(userId)
     → find all subscriptions for userId
     → web-push.sendNotification(sub, JSON.stringify({
         title, body, icon, badge, url, tag, renotify, data
       }))
     │
     ▼
Browser Push API → Service Worker (sw.js)
  → 'push' event → showNotification()
  → 'notificationclick' event → window.open(url)
```

**VAPID config:**
- `VAPID_PUBLIC_KEY` env var
- `VAPID_PRIVATE_KEY` env var
- `VAPID_SUBJECT` env var (defaults to `mailto:admin@souqone.com`)
- If keys missing or invalid → push silently disabled (no errors to users)

---

## 19. Gaps & Observations

### 🔴 Critical

| # | Issue | Location |
|---|---|---|
| 1 | **No delete/archive API** — notifications accumulate forever in DB | `NotificationsController` |
| 2 | **WS notification delivery doesn't use Redis Pub/Sub** — on multi-pod deployments, only the pod holding the user's socket delivers. Other pods call `EventEmitter2.emit()` but their `ChatGateway.server.to()` doesn't reach sockets on other pods | `ChatGateway.onNotificationCreated()` |
| 3 | **Unread count badge ignores 90-day retention** — a user with old unread notifications will see a badge count that doesn't match what's visible in the list | `getUnreadCount()` vs `findAll()` |

### 🟡 Medium

| # | Issue | Location |
|---|---|---|
| 4 | **`FEATURED_EXPIRED` type exists in enum but is never emitted** — no cron or service creates it | `schema.prisma`, `PaymentActivationService` |
| 5 | **No client-side WebSocket handler for 'notification' event found** — the server emits it but no `socket.on('notification', ...)` was found in navbar/hooks code (may be missing or in an unread file) | Frontend WebSocket integration |
| 6 | **`WithdrawApplication` reuses `JOB_APPLICATION` type** instead of a dedicated `JOB_APPLICATION_WITHDRAWN` type — employer gets the same notification type for new applications and withdrawals | `JobsService.withdrawApplication()` |
| 7 | **`REVIEW_RECEIVED` navigateTo returns null** — no navigation config in `NOTIFICATION_TYPE_CONFIG` | `notifications.ts` constants |

### 🟢 Well Done

| # | Observation |
|---|---|
| 1 | **Optimistic UI updates** for mark-read eliminate loading states entirely |
| 2 | **Auto-cleanup of expired push subscriptions** (410/404) keeps the subscriptions table lean |
| 3 | **Ownership enforcement** on `markAsRead` prevents cross-user reads |
| 4 | **`Promise.allSettled`** used for batch notifications (nearby carriers, bulk expiry) — one failure doesn't block others |
| 5 | **Push errors are swallowed gracefully** with logger.error — a broken Push service doesn't break notification persistence |
| 6 | **90-day retention on `findAll`** prevents unbounded pagination for power users |
