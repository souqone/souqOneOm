# 010 — Polymorphic Audit: Full Inventory for `cleanupPolymorphicOrphans` Redesign

**Date:** 2026-09-07
**Category:** A — Read-Only / Audit

---

## 1. Every Model With entityType + entityId

### Raw grep output (exit code 0)

```
317:   entityType String // LISTING | SPARE_PART | CAR_SERVICE | JOB
332:   @@index([entityType, entityId])
417:   entityType String @default("LISTING") // LISTING | JOB | SPARE_PART | CAR_SERVICE
426:   @@unique([userId, entityType, entityId])
428:   @@index([entityType, entityId])
1499: enum ReviewEntityType {
1514:   entityType ReviewEntityType
1528:   @@unique([reviewerId, entityType, entityId])
1530:   @@index([entityType, entityId])
1592:   entityType String? // e.g. LISTING, BUS_LISTING
1853:   entityType  String
```

---

## Model 1 — Conversation (table: conversations)

```prisma
model Conversation {
  id         String  @id @default(cuid())
  entityType String  // LISTING | SPARE_PART | CAR_SERVICE | JOB
  entityId   String  // ID of the related entity — NOT nullable
  listingId  String?
  listing    Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
  ...
  @@index([entityType, entityId])
  @@map("conversations")
}
```

Purpose: Chat thread opened by a user on any entity type.
Note: entityId is NOT nullable. listingId FK has ON DELETE CASCADE (covers LISTING only).
Children (ConversationParticipant, Message) cascade automatically.

---

## Model 2 — Favorite (table: favorites)

```prisma
model Favorite {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(..., onDelete: Cascade)
  entityType String  @default("LISTING") // LISTING | JOB | SPARE_PART | CAR_SERVICE
  entityId   String  // NOT nullable
  listingId  String?
  listing    Listing? @relation(..., onDelete: Cascade)
  @@unique([userId, entityType, entityId])
  @@index([entityType, entityId])
  @@map("favorites")
}
```

Purpose: User bookmarked any entity type.
Note: Same dual-track pattern — listingId FK CASCADE covers LISTING only.

---

## Model 3 — Review (table: reviews)

```prisma
enum ReviewEntityType {
  LISTING
  BUS_LISTING
  EQUIPMENT_LISTING
  OPERATOR_LISTING
  DRIVER_PROFILE
  EMPLOYER_PROFILE
  CARRIER_PROFILE
}

model Review {
  id         String           @id @default(cuid())
  entityType ReviewEntityType // TYPED ENUM — not raw String
  entityId   String           // NOT nullable
  reviewerId String
  reviewer   User @relation("ReviewsGiven",    ..., onDelete: Cascade)
  revieweeId String
  reviewee   User @relation("ReviewsReceived", ..., onDelete: Cascade)
  reply      ReviewReply?     // children cascade automatically
  @@unique([reviewerId, entityType, entityId])
  @@index([entityType, entityId])
  @@map("reviews")
}
```

Purpose: Customer review on any rated entity.
CRITICAL: entityType is a TYPED ENUM (ReviewEntityType), not String. Cleanup
function must cast: `entityType as ReviewEntityType` or `as any`.
ReviewReply has ON DELETE CASCADE from Review — auto-cleaned on Review delete.

---

## Model 4 — Payment (table: payments)

```prisma
model Payment {
  ...
  entityType String? // e.g. LISTING, BUS_LISTING — NULLABLE
  entityId   String?                               // NULLABLE
  metadata   Json?
  ...
  @@map("payments")
}
```

Purpose: Payment/subscription record optionally tied to an entity.
INTENTIONAL EXCLUSION: Financial audit trail — must be preserved even after entity deletion.
Both fields are nullable. Not appropriate for cleanupPolymorphicOrphans.

---

## Model 5 — OutboxEvent (table: outbox_events)

```prisma
model OutboxEvent {
  id         String   @id @default(cuid())
  entityType String
  entityId   String
  action     String   // UPSERT | DELETE
  status     String   @default("PENDING")
  ...
  @@map("outbox_events")
}
```

Purpose: Search-sync outbox — queued events to push UPSERT/DELETE to search engine.
INTENTIONAL EXCLUSION: The action=DELETE row IS the cleanup signal for the search index.
Deleting it would break search-sync. The relay reads it, cleans the index, marks processed.

---

## 2. Cleanup Coverage Matrix

| Model       | In cleanupPolymorphicOrphans? | Other deleteMany path       | FK CASCADE?                  | Status                  |
|-------------|-------------------------------|-----------------------------|-----------------------------|-------------------------|
| Favorite    | YES (line 38)                 | favorites.service.ts:38 per-id toggle | listingId FK (partial) | COVERED for non-LISTING |
| Conversation| YES (line 39)                 | None by entityType          | listingId FK (partial)      | COVERED for non-LISTING |
| Review      | NO                            | None anywhere               | None on entityId            | ORPHANED — MUST FIX     |
| Payment     | NO                            | None by entityType          | userId FK only              | INTENTIONAL EXCLUSION   |
| OutboxEvent | NO                            | None by entityType          | None                        | INTENTIONAL EXCLUSION   |

---

## 3. All Call Sites of cleanupPolymorphicOrphans

### Raw output (exit code 0)

```
buses.service.ts:430           await this.prisma.cleanupPolymorphicOrphans('BUS_LISTING', id);
base-listing.service.ts:314    await this.prisma.cleanupPolymorphicOrphans(this.config.entityType, ...);
equipment-listings.service.ts:377  await this.prisma.cleanupPolymorphicOrphans('EQUIPMENT_LISTING', id);
admin-jobs.service.ts:152      await this.prisma.cleanupPolymorphicOrphans('JOB', jobId);
jobs.service.ts:404            await this.prisma.cleanupPolymorphicOrphans('JOB', id);
listings.service.ts:561        await this.prisma.cleanupPolymorphicOrphans('LISTING', id);
operators.service.ts:400       await this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', ...);
parts.service.ts:289           await this.prisma.cleanupPolymorphicOrphans('SPARE_PART', id);
```

### Regression targets — all 8 must be retested after fix

| File                          | entityType          | Vertical         |
|-------------------------------|---------------------|------------------|
| base-listing.service.ts:314   | dynamic (config)    | Base (multi)     |
| listings.service.ts:561       | LISTING             | Listings         |
| parts.service.ts:289          | SPARE_PART          | Spare Parts      |
| buses.service.ts:430          | BUS_LISTING         | Buses            |
| equipment-listings.service.ts:377 | EQUIPMENT_LISTING | Equipment      |
| jobs.service.ts:404           | JOB                 | Jobs             |
| admin-jobs.service.ts:152     | JOB                 | Jobs (admin)     |
| operators.service.ts:400      | OPERATOR_LISTING    | Operators        |

Test mock files that must also be updated: buses.service.spec.ts, admin-jobs.service.spec.ts,
jobs.service.spec.ts, listings.service.spec.ts, operators.service.spec.ts,
services.service.spec.ts, search-outbox.integration.spec.ts

---

## 4. FK-Level CASCADE Analysis

### Raw migration output (exit code 0)

```sql
-- conversations_listingId_fkey (migration.sql:241)
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- conversation_participants_conversationId_fkey (migration.sql:247)
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- messages_conversationId_fkey (migration.sql:253)
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- favorites_userId_fkey (migration.sql:256)
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- favorites_listingId_fkey (migration.sql:259)
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

No CASCADE found touching "reviews" in any migration (zero hits, exit code 0).

### Double-cleanup risk assessment: NONE

The listingId FK CASCADE on favorites/conversations covers ONLY rows where
listingId IS NOT NULL. cleanupPolymorphicOrphans uses entityType/entityId which
are separate columns — zero row overlap. Safe to run both paths simultaneously.

---

## Actionable Fix Summary

### Only one addition required to cleanupPolymorphicOrphans

```typescript
// ADD this to the transaction array in prisma.service.ts:
this.review.deleteMany({
  where: { entityType: entityType as ReviewEntityType, entityId }
})
```

Note: ReviewEntityType enum must be imported from @prisma/client.
ReviewReply auto-cascades — no separate cleanup needed.

### Do NOT add

- Payment — financial audit trail, preserve always
- OutboxEvent — action=DELETE row is the search cleanup mechanism itself

---

## Files Inspected

- apps/api/prisma/schema.prisma (lines 314-334, 411-430, 1499-1533, 1570-1609, 1851-1865)
- apps/api/src/prisma/prisma.service.ts (lines 35-49)
- apps/api/src/favorites/favorites.service.ts (line 38)
- apps/api/prisma/migrations/migration.sql (CASCADE audit)
- apps/api/src/buses/buses.service.ts (line 430)
- apps/api/src/listings/base-listing.service.ts (line 314)
- apps/api/src/equipment-listings/equipment-listings.service.ts (line 377)
- apps/api/src/jobs/admin-jobs.service.ts (line 152)
- apps/api/src/jobs/jobs.service.ts (line 404)
- apps/api/src/listings/listings.service.ts (line 561)
- apps/api/src/operators/operators.service.ts (line 400)
- apps/api/src/parts/parts.service.ts (line 289)
