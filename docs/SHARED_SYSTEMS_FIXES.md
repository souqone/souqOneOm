# Shared Systems — 4 Fixes

Read `docs/shared-systems-audit.md` fully before starting.

---

## Fix 1 — Transport Notification Types (P1)

**File:** `apps/api/src/notifications/notification-type.enum.ts` (or wherever `NotificationType` is defined)

Add these values to the `NotificationType` enum:
```ts
TRANSPORT_QUOTE_RECEIVED = 'TRANSPORT_QUOTE_RECEIVED',
TRANSPORT_BOOKING_CONFIRMED = 'TRANSPORT_BOOKING_CONFIRMED',
TRANSPORT_BOOKING_CANCELLED = 'TRANSPORT_BOOKING_CANCELLED',
TRANSPORT_REQUEST_CLOSED = 'TRANSPORT_REQUEST_CLOSED',
```

Then find every place in `apps/api/src/transport/` that calls:
```ts
notificationsService.create({ type: NotificationType.SYSTEM, ... })
```
Replace with the correct specific type from above.

---

## Fix 2 — Carrier Profile Reviews (P1)

**File:** wherever `ReviewEntityType` enum is defined (check `apps/api/src/reviews/`)

Add:
```ts
CARRIER_PROFILE = 'CARRIER_PROFILE',
```

Then find `recalculateCarrierProfileRating` (or similar) in the reviews service —
if it exists but is disconnected, wire it up so it's called after a review is created
for a `CARRIER_PROFILE` entity.

Also add to Prisma schema if `ReviewEntityType` is a Prisma enum:
```prisma
enum ReviewEntityType {
  // existing values...
  CARRIER_PROFILE
}
```
Run `npx prisma generate` after schema change (do NOT run migrate — dev only).

---

## Fix 3 — Search reindexAll (P1)

**File:** `apps/api/src/search/search.service.ts`

Find the `reindexAll()` method and the `INDEXES` config.

Currently only indexes: cars, services, parts (or similar 3).
Add the missing entities:
- `buses` — index all `BusListing` records
- `jobs` — index all `Job` records  
- `operators` — index all `OperatorListing` records
- `equipment` — index all `EquipmentListing` records

Follow the exact same pattern used for the already-indexed entities.
Each entity needs: index name, prisma model, normalizer function (create simple one if missing).

---

## Fix 4 — Frontend EntityType (P2)

**File:** `apps/web/src/lib/api/favorites.ts`

Find the `EntityType` type/enum. Add:
```ts
| 'TRANSPORT_REQUEST'
| 'CARRIER_PROFILE'
```

Also check if `useToggleFavorite` hook or `FavoriteButton` component
needs updating to accept these new types — add them if so.

---

## VERIFY
```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
npx prisma generate --schema=apps/api/prisma/schema.prisma
```
0 errors on all three.
