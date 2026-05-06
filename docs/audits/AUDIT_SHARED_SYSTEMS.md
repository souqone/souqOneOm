# SouqOne — Shared Systems Audit
> Generated: 2026-05-04 | Read-only audit — no files modified.

---

## Section 1 — Entity Inventory

| Entity | Backend Module | Frontend Feature | Has Add | Has Edit | Has Detail Page |
|--------|---------------|-----------------|---------|----------|-----------------|
| car (listing) | `listings/`, `cars/` | `features/ads/forms/CarForm` | ✅ | ✅ | ✅ `/sale/[type]/[id]` |
| bus | `buses/` | `features/ads/forms/BusForm` | ✅ | ✅ | ✅ `/sale/[type]/[id]` |
| equipment | `equipment/` | `features/ads/forms/EquipmentForm` | ✅ | ✅ | ✅ `/equipment/` |
| operator | `equipment/operators`, `operators/` | `features/ads/forms/OperatorForm` | ✅ | ✅ | ✅ `/equipment/operators/[id]` |
| part | `parts/` | `features/ads/forms/PartForm` | ✅ | ✅ | ✅ `/sale/[type]/[id]` |
| service | `services/` | `features/ads/forms/ServiceForm` | ✅ | ✅ | ✅ `/sale/[type]/[id]` |
| job | `jobs/` | `features/jobs/` | ✅ | ✅ | ✅ `/jobs/[id]` |
| transport | `transport/` | `features/transport/` | ✅ (wizard) | ❌ | ✅ `/transport/requests/[id]` |

**Image support per entity:**

| Entity | Image Table | Upload Endpoint |
|--------|------------|-----------------|
| car/listing | `listing_images` | `POST /uploads/listings/:id/images` |
| bus | `bus_listing_images` | `POST /uploads/buses/:id/images` |
| equipment | `equipment_listing_images` | `POST /uploads/equipment/:id/images` |
| part | `spare_part_images` | `POST /uploads/parts/:id/images` |
| service | `car_service_images` | `POST /uploads/services/:id/images` |
| operator | ❌ none | ❌ none |
| job | ❌ none | ❌ none |
| transport | ❌ none | ❌ none |

---

## Section 2 — Duplicated Systems

---

### 2.1 Bookings

**State: ✅ Already unified (rental) + ⚠️ Separate silo for transport**

**Single `Booking` table** handles CAR, BUS, EQUIPMENT via polymorphic `entityType` field:

```prisma
// apps/api/prisma/schema.prisma:206-261
model Booking {
  entityType         String             @default("CAR") // CAR, BUS, EQUIPMENT
  listingId          String?
  busListingId       String?
  equipmentListingId String?
  ...
}
```

`BookingEntityResolverService` dispatches on `entityType`:
```ts
// apps/api/src/bookings/booking-entity-resolver.service.ts:28-94
async resolve(entityType: string, entityId: string) {
  switch (entityType) {
    case 'CAR':       // → prisma.listing
    case 'BUS':       // → prisma.busListing
    case 'EQUIPMENT': // → prisma.equipmentListing
  }
}
```

Single controller: `POST /bookings`, `GET /bookings/my`, `GET /bookings/received`

**Separate transport booking silo:**
```prisma
// apps/api/prisma/schema.prisma:1765-1782
model TransportBooking {   // completely separate table
  requestId String @unique
  quoteId   String @unique
  status    TransportRequestStatus
  ...
}
```
Routes: `PATCH /transport/bookings/:id/start|complete|cancel` via `transport.controller.ts`

**Frontend:** Single `/bookings` page with `BookingsPageClient` handles CAR/BUS/EQUIPMENT. Transport has its own separate `/transport/bookings/[id]` page.

**What differs between types:**
- CAR: has `depositAmount`, `weeklyPrice`, `cancellationPolicy`, `insuranceSelected`
- BUS: no `weeklyPrice`, no `depositAmount`
- EQUIPMENT: has `weeklyPrice`, no `depositAmount`
- TRANSPORT: completely different model — quote/accept flow, not date-range rental

**What is identical:**
- `startDate`, `endDate`, `totalDays`, `totalPrice`, `currency`, `status`, `notes`

---

### 2.2 Favorites

**State: ✅ Already fully unified**

Single `Favorite` table with polymorphic `entityType`:
```prisma
// apps/api/prisma/schema.prisma:380-399
model Favorite {
  entityType String @default("LISTING") // LISTING | JOB | SPARE_PART | CAR_SERVICE | BUS_LISTING | EQUIPMENT_LISTING | OPERATOR_LISTING
  entityId   String
  @@unique([userId, entityType, entityId])
}
```

Single controller handles all types:
```ts
// apps/api/src/favorites/favorites.controller.ts:13-20
@Post(':entityType/:entityId')
toggle(@Param('entityType') entityType, @Param('entityId') entityId, ...) {
  return this.favoritesService.toggle(entityType, entityId, user.sub);
}
```

Single frontend component:
```tsx
// apps/web/src/components/favorite-button.tsx:8-12
interface FavoriteButtonProps {
  entityType: EntityType;
  entityId: string;
}
```

Single React hook: `useToggleFavorite()` in `lib/api/favorites.ts` — uses `POST /favorites/:entityType/:entityId`.

**Gap:** `EntityType` in frontend (`lib/api/favorites.ts:5-13`) does NOT include `TRANSPORT_REQUEST` or `CARRIER_PROFILE`. Those entities cannot currently be favorited.

---

### 2.3 Notifications

**State: ✅ Already fully unified**

Single `Notification` table with `NotificationType` enum (21 types):
```prisma
// apps/api/prisma/schema.prisma:843-867
enum NotificationType {
  MESSAGE | LISTING_SOLD | LISTING_FAVORITED | PRICE_DROP | SYSTEM
  BOOKING_REQUEST | BOOKING_CONFIRMED | BOOKING_REJECTED | BOOKING_CANCELLED | BOOKING_COMPLETED | RETURN_REMINDER
  JOB_APPLICATION | JOB_APPLICATION_ACCEPTED | JOB_APPLICATION_REJECTED
  REVIEW_RECEIVED | PAYMENT_SUCCESS | SUBSCRIPTION_ACTIVATED | FEATURED_EXPIRED
  LISTING_CREATED | LISTING_UPDATED | LISTING_DELETED | LISTING_STATUS_CHANGED
  JOB_RECOMMENDATION
}
```

Single `NotificationsService.create()` used by all modules. Delivery via:
1. DB persistence (`prisma.notification.create`)
2. WebSocket via `EventEmitter2` → `ChatGateway`
3. Web Push via `PushService`

Single frontend: `/notifications` page with 8 components in `features/notifications/components/`.

**Gap:** No dedicated transport notification types (e.g., `TRANSPORT_QUOTE_RECEIVED`, `TRANSPORT_BOOKING_ACCEPTED`). The transport module calls `notifications.create({ type: 'SYSTEM', ... })` as a workaround. The `NotificationType` enum would need new entries to give transport notifications proper routing.

---

### 2.4 Payments

**State: ✅ Already unified (monetization layer)**

Single `Payment` table with `PaymentType` (FEATURED | SUBSCRIPTION):
```prisma
// apps/api/prisma/schema.prisma:1548-1580
model Payment {
  type       PaymentType   // FEATURED | SUBSCRIPTION
  entityType String?       // e.g. LISTING, BUS_LISTING
  entityId   String?
  ...
}
```

Thawani integrated once in `ThawaniService`. Single `PaymentsController`:
- `POST /payments/featured` — boost any listing type
- `POST /payments/subscribe` — user subscription plans
- `GET /payments/verify/:sessionId` — webhook/verify
- `GET /payments/my` — payment history

**Scope note:** This is platform monetization, NOT transactional settlement. There is no payment flow for:
- Completing a rental booking (total price is stored but not collected via Thawani)
- Transport booking payment (carrier gets paid outside the platform)
- Equipment hire payment

This is an intentional design choice (C2C marketplace) but should be documented.

---

### 2.5 Reviews / Ratings

**State: ✅ Already unified**

Single `Review` table with `ReviewEntityType` enum:
```prisma
// apps/api/prisma/schema.prisma:1470-1478
enum ReviewEntityType {
  LISTING | BUS_LISTING | EQUIPMENT_LISTING | BOOKING
  OPERATOR_LISTING | DRIVER_PROFILE | EMPLOYER_PROFILE
}
```

Single `ReviewsController`: `POST /reviews`, `GET /reviews`, `GET /reviews/summary/:userId`, `POST /reviews/:id/reply`

Frontend: shared `review-card.tsx`, `review-form.tsx`, `review-summary.tsx` in `components/reviews/`.

**Gap:** `CARRIER_PROFILE` is missing from `ReviewEntityType`. `CarrierProfile` has `averageRating + reviewCount` fields but those are never populated — no review can target a carrier. This is a dead feature.

---

### 2.6 Image Upload

**State: ⚠️ Upload is unified, attachment is NOT**

**Shared upload endpoint** (all entities use this first step):
```ts
// apps/api/src/uploads/uploads.controller.ts:29-33
@Post()  // POST /uploads → { url, key }
async uploadFile(@UploadedFile() file) {
  return this.uploadsService.uploadFile(file);  // → Cloudinary
}
```

**Per-entity image attachment endpoints** (5 duplicates):
```
POST /uploads/listings/:id/images   → ListingImage table
POST /uploads/parts/:id/images      → SparePartImage table
POST /uploads/services/:id/images   → CarServiceImage table
POST /uploads/buses/:id/images      → BusListingImage table
POST /uploads/equipment/:id/images  → EquipmentListingImage table
```

**5 identical image tables in schema:**
```prisma
model ListingImage        { id url isPrimary order listingId ... }
model SparePartImage      { id url isPrimary order sparePartId ... }
model CarServiceImage     { id url isPrimary order carServiceId ... }
model BusListingImage     { id url isPrimary order busListingId ... }
model EquipmentListingImage { id url isPrimary order equipmentListingId ... }
```

All 5 have **identical columns**: `id`, `url`, `isPrimary`, `order`, FK to parent, `createdAt`. The only difference is the FK column name.

**Missing:** `OperatorListing`, `DriverJob`, transport entities have no image support at all.

---

### 2.7 Search

**State: ⚠️ Partially unified — 3 of 5 indexed entities missing from reindex**

Meilisearch configured with 5 indexes:
```ts
// apps/api/src/search/search.service.ts:11-17
export const INDEXES = {
  LISTINGS: 'listings',
  PARTS: 'parts',
  SERVICES: 'services',
  JOBS: 'jobs',
  BUSES: 'buses',
} as const;
```

`reindexAll()` only syncs listings, parts, and services:
```ts
// apps/api/src/search/search.service.ts:315-408
async reindexAll() {
  // ── Listings ──  ✅
  // ── Parts ──     ✅
  // ── Services ──  ✅
  // MISSING: jobs, buses, equipment, operators, transport
}
```

**Entities not indexed in Meilisearch at all:**
- `EquipmentListing` — no index, no `indexDocument` calls in equipment services
- `OperatorListing` — no index
- `TransportRequest` — no index
- `CarrierProfile` — no index

**Per-entity indexing inconsistency:** `buses.service.ts`, `jobs.service.ts` likely call `indexDocument` on create/update since they have an index configured, but `reindexAll` won't sync them on a cold start.

---

## Section 3 — Recommended Shared Architecture

### Backend Recommendations

#### 3.1 Image Tables → Single `EntityImage` (Option A — Polymorphic)

**Current:** 5 duplicate tables × identical schema  
**Recommended:** One polymorphic table

```prisma
model EntityImage {
  id         String   @id @default(cuid())
  url        String
  isPrimary  Boolean  @default(false)
  order      Int      @default(0)
  entityType String   // LISTING | BUS_LISTING | EQUIPMENT_LISTING | SPARE_PART | CAR_SERVICE
  entityId   String
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@map("entity_images")
}
```

Single upload attachment endpoint:
```
POST /uploads/:entityType/:entityId/images
DELETE /uploads/:entityType/images/:imageId
PATCH /uploads/:entityType/:entityId/images/reorder
```

**Why Option A fits here:** Image records have no behaviour differences between types. Pure data. Migration is a rename + data move with no logic change.

**Effort:** Medium (schema migration + update 5 service files + 5 frontend upload hooks).

---

#### 3.2 Transport Notifications → Add Types to Enum

**Current:** Transport uses `type: 'SYSTEM'` for all notifications  
**Recommended:** Extend `NotificationType` enum

```prisma
enum NotificationType {
  // ... existing ...
  TRANSPORT_QUOTE_RECEIVED
  TRANSPORT_QUOTE_ACCEPTED
  TRANSPORT_BOOKING_STARTED
  TRANSPORT_BOOKING_COMPLETED
}
```

**Effort:** Low — add 4 enum values + update `transport-request.service.ts` / `transport-booking.service.ts`.

---

#### 3.3 Review Entity Types → Add CARRIER_PROFILE

**Current:** `ReviewEntityType` missing `CARRIER_PROFILE`; `CarrierProfile.averageRating` never populated  
**Recommended:**

```prisma
enum ReviewEntityType {
  // ... existing ...
  CARRIER_PROFILE
}
```

Add in `reviews.service.ts`:
```ts
if (dto.entityType === 'CARRIER_PROFILE') {
  await this.recalculateCarrierProfileRating(dto.entityId);
}
```

**Effort:** Low.

---

#### 3.4 Search Reindex → Cover All Entities

Fix `reindexAll()` to include jobs, buses, equipment (and optionally operators, transport):

```ts
// Add indexes
export const INDEXES = {
  ...existing,
  EQUIPMENT: 'equipment',
  OPERATORS: 'operators',
} as const;

// Add to reindexAll():
// ── Jobs ──
// ── Buses ──
// ── Equipment ──
```

**Effort:** Low-Medium — add index configs + reindex blocks for missing entities.

---

### Frontend Recommendations

#### Already Shared (status quo)

| Component | File | Covers |
|-----------|------|--------|
| `FavoriteButton` | `components/favorite-button.tsx` | All entity types via `entityType` prop |
| `BookingsPageClient` | `features/bookings/components/` | CAR / BUS / EQUIPMENT |
| `useUnifiedBooking` | `features/rental/hooks/useUnifiedBooking.ts` | Wraps `useCreateBooking` with entity type mapping |
| `review-card/form/summary` | `components/reviews/` | All review entity types |
| `NotificationsPageClient` | `features/notifications/components/` | All notification types |

#### Should Be Unified / Fixed

| Current (duplicated or missing) | Recommended |
|----------------------------------|-------------|
| `/transport/bookings/[id]` uses `BookingDetailShell` (separate) | Add `entityType: 'TRANSPORT'` support to shared `BookingCard` for cross-listing in `/bookings` page |
| No favorites for `TRANSPORT_REQUEST` or `CARRIER_PROFILE` | Add those entity types to `EntityType` union in `lib/api/favorites.ts` |
| 5 separate per-entity image upload hooks in frontend forms | One `useEntityImageUpload(entityType, entityId)` hook |
| Transport has no notification type → UI can't route notification clicks | Add transport notification types, update `NotificationCard` link resolver |

---

## Section 4 — Priority Matrix

| System | Current State | Effort to Unify | Impact | Priority |
|--------|--------------|-----------------|--------|----------|
| **Notifications** — add transport types | Transport uses SYSTEM type | **Low** | **High** — proper routing, click-through | **P1** |
| **Reviews** — add CARRIER_PROFILE | Dead `averageRating` field on CarrierProfile | **Low** | **High** — completes transport marketplace | **P1** |
| **Search** — fix reindexAll + add equipment/operators indexes | Missing entities on cold start | **Low** | **High** — search correctness | **P1** |
| **Favorites** — add transport entity types to frontend | Backend already supports; frontend type union incomplete | **Low** | **Medium** — UX completeness | **P2** |
| **Image Tables** — consolidate 5 → 1 polymorphic | 5 identical tables | **Medium** | **Medium** — schema simplicity, enables operator/job/transport images | **P2** |
| **Payments** — transactional booking settlement | No flow exists; by design (C2C) | **High** | **High** (business model decision) | **P3** |
| **Bookings** — merge TransportBooking into Booking table | Fundamentally different flow (quote→accept vs. date-range) | **High** | **Low** — different UX intent | **P3** (not recommended) |

---

## Section 5 — What's Already Shared (keep as-is)

These systems are correctly unified and **should NOT be changed**:

- **`BaseListingService`** (`common/services/base-listing.service.ts`) — abstract base for all listing CRUD. Handles Redis caching, Meilisearch indexing, viewCount, event emission. Services (`services.service.ts`, `operators.service.ts`, `parts.service.ts`, etc.) extend it.

- **`Favorite` table + `FavoritesService` + `FavoriteButton`** — fully polymorphic, works for all 7 entity types today.

- **`Notification` table + `NotificationsService`** — single table, all modules call `notifications.create()`. WebSocket + Push delivery in one place.

- **`Payment` / `Thawani`** — one integration for platform monetization. No need to duplicate per entity type.

- **`Review` table + `ReviewsService`** — single polymorphic table covering 7 entity types. `review-card/form/summary` components are shared.

- **`POST /uploads`** — single raw upload endpoint (→ Cloudinary). All frontend forms call this first step identically.

- **`Booking` table (rental)** — polymorphic for CAR/BUS/EQUIPMENT with `entityType` + `BookingEntityResolverService`. `BookingsPageClient` and `BookingCard` are shared components.

- **`useUnifiedBooking` / `useUnifiedRentalListing` / `useUnifiedAvailability`** — hooks abstract the entity type mapping for the rental flow.

- **`FavoritesProvider`** — global context caches all favorite IDs for O(1) "is favorited" checks. Used by `FavoriteButton` everywhere.

- **`SearchService` / `GET /search`** — unified multi-index search across all 5 configured indexes via MeiliSearch multi-search API.

---

## Summary: What Needs Action

| # | Action | Files to Change | Risk |
|---|--------|----------------|------|
| 1 | Add `TRANSPORT_QUOTE_RECEIVED` etc. to `NotificationType` enum + update transport services | `schema.prisma`, `transport-request.service.ts`, `transport-booking.service.ts`, `notifications.constants.ts` | Low |
| 2 | Add `CARRIER_PROFILE` to `ReviewEntityType` + wire `recalculateCarrierProfileRating` | `schema.prisma`, `reviews.service.ts` | Low |
| 3 | Fix `reindexAll()` to include jobs + buses + add equipment/operators indexes | `search.service.ts` | Low |
| 4 | Add `TRANSPORT_REQUEST`, `CARRIER_PROFILE` to frontend `EntityType` union | `lib/api/favorites.ts` | Low |
| 5 | Consolidate 5 image tables → `EntityImage` polymorphic table | `schema.prisma`, `uploads.controller.ts`, `upload-image-manager.service.ts`, 5 frontend form hooks | Medium |
