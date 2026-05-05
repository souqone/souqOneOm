# SouqOne — Shared Systems Audit
> Read-only audit. Do NOT modify any file.

## GOAL
Audit the entire codebase and identify every system that currently exists
in duplicate (once per entity) and should be unified into a single shared system.

Produce a report at `docs/shared-systems-audit.md`.

---

## STEP 1 — Read these backend files first

```bash
# DTOs and entities
find apps/api/src -name "*.dto.ts" | sort
find apps/api/src -name "*.entity.ts" | sort

# Controllers
find apps/api/src -name "*.controller.ts" | sort

# Services
find apps/api/src -name "*.service.ts" | sort

# Prisma schema
cat apps/api/prisma/schema.prisma
```

Focus on these modules:
- `apps/api/src/bookings/`
- `apps/api/src/favorites/`
- `apps/api/src/notifications/`
- `apps/api/src/payments/`
- `apps/api/src/reviews/`
- `apps/api/src/uploads/`
- `apps/api/src/cars/`
- `apps/api/src/buses/`
- `apps/api/src/equipment/`
- `apps/api/src/operators/`
- `apps/api/src/services/`
- `apps/api/src/parts/`
- `apps/api/src/jobs/`
- `apps/api/src/transport/`

---

## STEP 2 — Read these frontend files

```bash
# Pages
find apps/web/src/app -name "page.tsx" | sort

# Hooks
find apps/web/src/features -name "*.ts" -path "*/hooks/*" | sort
find apps/web/src/features -name "use*.ts" | sort
find apps/web/src/features -name "use*.tsx" | sort

# Components likely duplicated
find apps/web/src -name "*booking*" -o -name "*Booking*" | sort
find apps/web/src -name "*favorite*" -o -name "*Favorite*" | sort
find apps/web/src -name "*notification*" -o -name "*Notification*" | sort
find apps/web/src -name "*payment*" -o -name "*Payment*" | sort
find apps/web/src -name "*review*" -o -name "*Review*" | sort
```

---

## STEP 3 — Produce `docs/shared-systems-audit.md`

### Section 1 — Entity Inventory

List all entities/listing types in the system:
| Entity | Backend Module | Frontend Feature | Has Add | Has Edit | Has Detail Page |
|--------|---------------|-----------------|---------|----------|-----------------|
| car | cars/ | features/cars/ | ✅/❌ | ✅/❌ | ✅/❌ |
| bus | ... | ... | ... | ... | ... |
| equipment | ... | ... | ... | ... | ... |
| part | ... | ... | ... | ... | ... |
| service | ... | ... | ... | ... | ... |
| operator | ... | ... | ... | ... | ... |
| job | ... | ... | ... | ... | ... |
| transport | ... | ... | ... | ... | ... |

---

### Section 2 — Duplicated Systems (the main finding)

For each system below, document:
- How many times it's duplicated
- What's different between each copy
- What's identical

#### 2.1 Bookings
- Does each entity have its own booking endpoints? List them.
- Is there a single `/bookings` table in Prisma or multiple?
- Frontend: is there one bookings page or multiple?
- What fields differ between booking types?

#### 2.2 Favorites
- Does each entity have its own favorites endpoint? List them.
- Prisma: one `Favorite` model or multiple?
- Frontend: one favorites page or per-entity?

#### 2.3 Notifications
- One notifications system or per-entity?
- What notification types exist? List all.
- Frontend: one notifications page or multiple?

#### 2.4 Payments
- Is Thawani integrated once or per-entity?
- What's the payment flow for each entity?
- One `Payment` table or multiple?

#### 2.5 Reviews/Ratings
- Per-entity or shared?
- One `Review` model in Prisma?
- Frontend: how are reviews shown?

#### 2.6 Image Upload
- Does each entity have its own upload endpoint? List all upload endpoints.
- Is there a shared upload service or per-entity?

#### 2.7 Search
- MeiliSearch integration — is it per-entity or unified?
- What entities are indexed? Which are missing?

---

### Section 3 — Recommended Shared Architecture

#### Backend Recommendations

For each duplicated system, recommend:

**Option A — Polymorphic (one table, entityType field)**
```
Booking {
  id
  entityType: enum (CAR, BUS, EQUIPMENT, SERVICE, OPERATOR, TRANSPORT)
  entityId: String
  userId
  ...shared fields...
}
```
Pros/cons for this codebase.

**Option B — Keep separate tables, add shared service layer**
```
BookingsService.findAll(userId) → queries all tables, merges results
```
Pros/cons for this codebase.

Recommend which fits better and why, based on the current Prisma schema.

#### Frontend Recommendations

List every page/component that should be unified:

| Current (duplicated) | Should become |
|---------------------|---------------|
| /cars/[id]/book + /buses/[id]/book | /bookings/new?entity=car&id=X |
| CarFavoriteButton + BusFavoriteButton | `<FavoriteButton entityType="car" entityId={id} />` |
| ... | ... |

Proposed shared pages:
- `/bookings` — all user bookings, tabbed by type
- `/favorites` — all favorites, tabbed by type  
- `/notifications` — single notification center
- `/payments` — payment history

Proposed shared components:
```
features/shared/
  components/
    FavoriteButton.tsx     — entityType + entityId props
    BookingCard.tsx        — renders any booking type
    NotificationItem.tsx   — renders any notification
    ReviewCard.tsx         — renders any review
    PriceDisplay.tsx       — unified price formatting
    ListingBadge.tsx       — unified status badges
  hooks/
    useBookings.ts         — fetches all bookings
    useFavorites.ts        — fetches all favorites
    useNotifications.ts    — fetches all notifications
```

---

### Section 4 — Priority Matrix

| System | Current State | Effort to Unify | Impact | Priority |
|--------|--------------|-----------------|--------|----------|
| Favorites | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Bookings | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Notifications | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Payments | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Image Upload | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Search | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |
| Reviews | ... | Low/Med/High | Low/Med/High | P1/P2/P3 |

---

### Section 5 — What's Already Shared (keep as-is)

List patterns that are already correctly unified and should NOT be changed.

---

## RULES
- Read-only — do NOT modify any existing file
- Quote actual code, not descriptions
- Read each file fully before documenting
- Check BOTH `apps/api/src/` and `apps/web/src/`
