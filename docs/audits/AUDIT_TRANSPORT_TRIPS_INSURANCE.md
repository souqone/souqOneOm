# Audit Report: Transport / Trips / Insurance — Full Dependency Check

> Generated: 2026-05-01
> Purpose: Pre-deletion impact analysis
> ❌ No files were changed or deleted during this audit

---

## Executive Summary

| Service | Backend Status | Frontend Pages | DB Tables | Add-Listing Form | Cross-Deps |
|---------|---------------|----------------|-----------|-----------------|------------|
| **Transport** | ✅ ACTIVE (full module) | ❌ No page | 2 tables | ❌ No form | HIGH |
| **Trips** | ⚠️ 410 GONE (stub) | ❌ No page | 2 tables | ❌ No form | MEDIUM |
| **Insurance** | ⚠️ 410 GONE (stub) | ❌ No page | 2 tables | ❌ No form | LOW |

---

## 1. Backend (apps/api)

### 1.1 Transport Module — `src/transport/` (6 files, ACTIVE)

| File | Status | Lines |
|------|--------|-------|
| `transport.module.ts` | Active — imports PrismaModule, exports TransportService | 13 |
| `transport.controller.ts` | Active — 7 endpoints (CRUD + my + slug + status) | 63 |
| `transport.service.ts` | Active — extends BaseListingService, full CRUD + MeiliSearch + Redis | 78 |
| `transport.service.spec.ts` | Active — 4 test cases | 93 |
| `dto/create-transport.dto.ts` | Active — 15 fields with validation | 93 |
| `dto/query-transport.dto.ts` | Active — search + filters | 33 |

**API Endpoints (active):**
- `POST /transport` — create (auth)
- `GET /transport` — list all
- `GET /transport/my` — user's listings (auth)
- `GET /transport/slug/:slug` — by slug
- `GET /transport/:id` — by ID
- `PATCH /transport/:id/status` — toggle (auth)
- `PATCH /transport/:id` — update (auth)
- `DELETE /transport/:id` — delete (auth)

### 1.2 Trips Module — `src/trips/` (6 files, DEPRECATED STUB)

| File | Status | Lines |
|------|--------|-------|
| `trips.module.ts` | Stub — only provides controller | 8 |
| `trips.controller.ts` | **410 Gone** stub — all routes return GoneException | 19 |
| `trips.service.ts` | Dead code — 1-line comment | 3 |
| `trips.service.spec.ts` | Placeholder test — `expect(true).toBe(true)` | 7 |
| `dto/create-trip.dto.ts` | Dead code — full DTO (118 lines) still present | 118 |
| `dto/query-trips.dto.ts` | Dead code — query DTO still present | 33 |

### 1.3 Insurance Module — `src/insurance/` (6 files, DEPRECATED STUB)

| File | Status | Lines |
|------|--------|-------|
| `insurance.module.ts` | Stub — only provides controller | 8 |
| `insurance.controller.ts` | **410 Gone** stub — all routes return GoneException | 19 |
| `insurance.service.ts` | Dead code — 1-line comment | 3 |
| `insurance.service.spec.ts` | Placeholder test — `expect(true).toBe(true)` | 7 |
| `dto/create-insurance.dto.ts` | Dead code — full DTO (77 lines) still present | 77 |
| `dto/query-insurance.dto.ts` | Dead code — query DTO still present | 29 |

---

## 2. Database (Prisma Schema)

### 2.1 Models (6 models, 3 pairs)

| Model | Table Name | Fields | Relations |
|-------|-----------|--------|-----------|
| `TransportService` | `transport_services` | 19 fields | → User, TransportImage[], Booking[] |
| `TransportImage` | `transport_images` | 6 fields | → TransportService |
| `TripService` | `trip_services` | 23 fields | → User, TripImage[], Booking[] |
| `TripImage` | `trip_images` | 6 fields | → TripService |
| `InsuranceOffer` | `insurance_offers` | 18 fields | → User, InsuranceImage[] |
| `InsuranceImage` | `insurance_images` | 6 fields | → InsuranceOffer |

### 2.2 Enums (4 enums)

| Enum | Values | Used By |
|------|--------|---------|
| `TransportType` | CARGO, FURNITURE, DELIVERY, HEAVY_TRANSPORT, TRUCK_RENTAL, OTHER_TRANSPORT | TransportService |
| `PricingType` | FIXED, PER_KM, PER_TRIP, HOURLY, NEGOTIABLE_PRICE | TransportService |
| `TripType` | BUS_SUBSCRIPTION, SCHOOL_TRANSPORT, TOURISM, CORPORATE, CARPOOLING | TripService |
| `ScheduleType` | SCHEDULE_DAILY, SCHEDULE_WEEKLY, SCHEDULE_MONTHLY, ONE_TIME | TripService |
| `InsuranceType` | CAR_COMPREHENSIVE, CAR_THIRD_PARTY, MARINE_INSURANCE, FINANCING, LEASE | InsuranceOffer |

### 2.3 Foreign Key Relations from Other Models

**User model (schema line ~52-57):**
```
transportServices TransportService[] @relation("UserTransportServices")
tripServices      TripService[]      @relation("UserTripServices")
insuranceOffers   InsuranceOffer[]   @relation("UserInsuranceOffers")
```

**Booking model (schema line 207-268):**
```
entityType         String  @default("CAR") // CAR, BUS, EQUIPMENT, TRANSPORT, TRIP
transportServiceId String?
transportService   TransportService? @relation(...)
tripServiceId      String?
tripService        TripService?      @relation(...)
@@index([transportServiceId])
@@index([tripServiceId])
```

**Favorite model (schema line 388-407):**
```
entityType String @default("LISTING") // LISTING | JOB | SPARE_PART | CAR_SERVICE | TRANSPORT | TRIP | INSURANCE
```
(Polymorphic — no direct FK, just entityType + entityId)

**Notification model:**
- No direct FK to these services
- `data` field (Json?) may contain entity references

### 2.4 Migrations

Only 2 migrations exist — both are monolithic:
- `20260404060452_car_one` — initial schema (contains all models)
- `20260404092506_add_google_oauth`

**No dedicated transport/trips/insurance migrations** — they're all in the initial migration.

---

## 3. Backend Cross-References (outside own modules)

### 3.1 `app.module.ts`
```typescript
import { TransportModule } from './transport/transport.module';
import { TripsModule } from './trips/trips.module';
import { InsuranceModule } from './insurance/insurance.module';
// All three imported in @Module imports array
```

### 3.2 `bookings/` (4 files)

| File | References |
|------|-----------|
| `create-booking.dto.ts` | `@IsIn(['CAR', 'BUS', 'EQUIPMENT', 'TRANSPORT', 'TRIP'])` |
| `bookings.repository.ts` | `transportService` and `tripService` in include/select objects, entity-to-FK mapping |
| `bookings.service.ts` | `booking.transportService` / `booking.tripService` title fallback |
| `booking-entity-resolver.service.ts` | `case 'TRANSPORT'` and `case 'TRIP'` entity resolution |
| `booking-notification.service.ts` | `TRANSPORT: 'خدمة نقل'`, `TRIP: 'رحلة'` labels |

### 3.3 `uploads/` (3 files)

| File | References |
|------|-----------|
| `uploads.controller.ts` | `POST transport/:transportId/images`, `POST trips/:tripId/images`, `POST insurance/:insuranceId/images` |
| `uploads.service.ts` | `addImageToTransport()`, `addImageToTrip()`, `addImageToInsurance()` |
| `upload-image-manager.service.ts` | Full implementations of image CRUD for all 3 services |

### 3.4 `search/` (3 files)

| File | References |
|------|-----------|
| `search.service.ts` | `INDEXES.TRANSPORT`, transport MeiliSearch config + reindex logic, `case 'transport'` in price sort |
| `reindex.standalone.ts` | Full reindex logic for transport, trips, insurance (queries Prisma, pushes to MeiliSearch) |
| `search-query.dto.ts` | `@IsIn([...'transport', 'trips', 'insurance'...])` |
| `synonyms.ts` | `'نقل': ['شحن', 'transport', 'shipping']`, `'تأمين': ['insurance']` |

### 3.5 `users/users.service.ts`
- User listing counts include `transportServices` and `tripServices` and `insuranceOffers`

### 3.6 `chat/chat.service.ts`
- Contains `TRANSPORT` reference (entity type resolution for chat context)

### 3.7 `favorites/favorites.service.spec.ts`
- Mock includes `transportService`, `tripService`, `insuranceOffer` Prisma delegates

### 3.8 `common/` (4 files)

| File | References |
|------|-----------|
| `services/base-listing.service.ts` | Comment: "Services, Transport, Trips, Insurance" |
| `listeners/listing-notification.listener.ts` | `TRANSPORT`, `TRIP`, `INSURANCE` entity labels |
| `events/listing.events.ts` | Entity types include `TRANSPORT`, `TRIP`, `INSURANCE` |

---

## 4. Frontend (apps/web)

### 4.1 Route Pages

**❌ No dedicated route pages exist for transport, trips, or insurance.**

- No `app/[locale]/transport/` directory
- No `app/[locale]/trips/` directory
- No `app/[locale]/insurance/` directory

### 4.2 Add-Listing Forms

**❌ No add-listing forms exist for transport, trips, or insurance.**

- `add-listing/` only has: car, bus, equipment, operator, parts, service
- The main `add-listing/page.tsx` has NO references to transport/trips/insurance

### 4.3 Feature Components

**❌ No feature folders exist for transport, trips, or insurance.**

- No `features/transport/`
- No `features/trips/`
- No `features/insurance/`

### 4.4 API Hooks (`src/lib/api/`)

**❌ No dedicated API hooks for transport, trips, or insurance.**

The only "insurance" matches in API hooks are `insuranceIncluded` (a field on car/bus/equipment listings — **unrelated** to InsuranceOffer).

### 4.5 Frontend Cross-References

| File | Type | Reference |
|------|------|-----------|
| `components/layout/navbar.tsx` | Navigation | `transportRequests` label for bus contracts (`/browse/buses?busListingType=BUS_CONTRACT`) — **NOT actual transport service** |
| `features/listings/config/search-engine.config.ts` | Search | `transport` as SearchCategory + MeiliEntityType, detail URL `/transport/${id}`, filter config |
| `features/listings/hooks/useGlobalSearch.ts` | Search | `transport` → `services` fallback mapping for UI |
| `features/listings/hooks/useItemTransformers.ts` | Listings | `insuranceIncluded` field on car/bus/equipment (unrelated to InsuranceOffer) |
| `app/[locale]/bookings/[id]/page.tsx` | Bookings | `insuranceSelected` badge display (booking field, not insurance service) |
| `app/[locale]/bookings/page.tsx` | Bookings | "GROUPED TRIPS LIST" — just a section label for booking groups |

### 4.6 Navbar Reference Detail

The navbar reference at line 47 is:
```typescript
{ href: '/browse/buses?busListingType=BUS_CONTRACT', label: t('transportRequests'), ... }
```
This is a **bus contract** link using the label "transportRequests" — it navigates to the buses browse page, NOT to a transport service page.

---

## 5. Translations

### 5.1 Transport-related keys (ar.json + en.json)

**In `nav` namespace:**
- `transportRequests` — "طلبات نقل" / "Transport Requests" (used for bus contracts in navbar)
- `transportRequestsDesc` — "عقود نقل موظفين وطلاب"
- `transport` — "نقل" / "Transport"
- `navTransportPlaceholder` — "ابحث عن خدمة نقل..."

**In `home` namespace:**
- `catTransport` — "نقل" / "Transport"
- `catTransportDesc` — "بضائع وأثاث" / "Cargo & furniture"

**In `listings` namespace:**
- `transportTitle` — "خدمات النقل"
- `transportSubtitle` — "نقل بضائع · نقل ركاب · خدمات لوجستية"
- `transportNoListings` — "لا توجد خدمات نقل حالياً"
- `transportCargo`, `transportFurniture`, `transportDelivery`, `transportHeavy`, `transportTruckRental`, `transportOther` (6 keys)
- `sfGrpTransport`, `sfRowTrType`, `sfPlaceholderAllTrTypes` (search filter keys)
- `sfTrCargo`, `sfTrFurniture`, `sfTrDelivery`, `sfTrHeavy`, `sfTrTruckRental`, `sfTrOther` (filter option keys)
- `sectionTransport` — "نقل"
- `enumHeavyTransport`, `enumOtherTransport`
- Various license keys: `sfLicTransport`, `enumLicenseTransport`, `jobsLicenseTransport`, `jobDetailLicTransport`, `licenseTransport`

**Trip-related keys:**
- `perTrip` — "للرحلة" / "per trip"
- `pricingPerTrip` — "لكل رحلة"
- `busScheduleOneTrip` — "رحلة واحدة"

**Insurance-related keys:**
- `fullInsurance` — "تأمين شامل" / "Full insurance" (car rental field)
- `lfInsuranceIncluded` — "تأمين شامل" (car listing form)
- `busLabelInsurance` — "تأمين مشمول" (bus form)
- `eqLabelInsurance` — "تأمين مشمول" (equipment form)
- `bookingDetailInsurance` — "تأمين شامل" (booking detail)

**In `search` namespace:**
- `catTransport` — "نقل"

### 5.2 Key Count Summary

| Category | Dedicated Keys | Shared/Ambiguous Keys |
|----------|---------------|----------------------|
| Transport service | ~18 keys | ~8 keys (license types, bus labels) |
| Trip service | ~0 dedicated keys | ~3 shared keys (perTrip, schedule) |
| Insurance service | ~0 dedicated keys | ~5 shared keys (insuranceIncluded on other forms) |

---

## 6. Database Records

⚠️ **Cannot run SQL queries** — Docker containers are not verified as running. The tables to check:

```sql
SELECT COUNT(*) FROM "transport_services";
SELECT COUNT(*) FROM "transport_images";
SELECT COUNT(*) FROM "trip_services";
SELECT COUNT(*) FROM "trip_images";
SELECT COUNT(*) FROM "insurance_offers";
SELECT COUNT(*) FROM "insurance_images";
SELECT COUNT(*) FROM "bookings" WHERE "entityType" IN ('TRANSPORT', 'TRIP');
SELECT COUNT(*) FROM "favorites" WHERE "entityType" IN ('TRANSPORT', 'TRIP', 'INSURANCE');
```

Run these manually to confirm record counts.

---

## 7. SEO / Sitemap / Robots

- **No `sitemap.ts` or `next-sitemap.config.js` found** in apps/web
- **No `robots.txt` found** in apps/web
- **No SEO config files** reference transport/trips/insurance

---

## 8. Risk Assessment

### If you DELETE Transport:

| Impact Area | Risk | Details |
|-------------|------|---------|
| **Prisma Schema** | 🔴 HIGH | Must remove `TransportService`, `TransportImage` models + 3 enums (`TransportType`, `PricingType` — shared!) + relations from User, Booking |
| **Booking model** | 🔴 HIGH | Must remove `transportServiceId` FK + `TRANSPORT` from entityType + update booking-entity-resolver + repository includes |
| **app.module.ts** | 🟡 MEDIUM | Remove TransportModule import |
| **Search/MeiliSearch** | 🟡 MEDIUM | Remove `INDEXES.TRANSPORT`, transport reindex, search-engine.config.ts category, synonyms |
| **Uploads** | 🟡 MEDIUM | Remove transport image endpoints + service methods + manager methods |
| **Users service** | 🟡 MEDIUM | Remove `transportServices` from listing count |
| **Chat service** | 🟡 LOW | Remove TRANSPORT entity case |
| **Frontend search** | 🟡 MEDIUM | Remove `transport` from SearchCategory, CATEGORY_TO_ENTITY, filter config, detail URL builder |
| **Translations** | 🟢 LOW | ~18 keys to remove (some shared with bus contracts) |
| **DB Migration** | 🔴 HIGH | Need migration to drop tables + columns |
| **Existing data** | ❓ UNKNOWN | Check record counts first |

### If you DELETE Trips:

| Impact Area | Risk | Details |
|-------------|------|---------|
| **Prisma Schema** | 🔴 HIGH | Must remove `TripService`, `TripImage` + 2 enums (`TripType`, `ScheduleType`) + relations from User, Booking |
| **Booking model** | 🔴 HIGH | Must remove `tripServiceId` FK + `TRIP` from entityType |
| **app.module.ts** | 🟢 LOW | Remove TripsModule import (already a stub) |
| **Search/MeiliSearch** | 🟡 MEDIUM | Remove trips reindex block |
| **Uploads** | 🟡 MEDIUM | Remove trip image endpoints |
| **Backend service code** | 🟢 LOW | Already deprecated (dead code) |
| **Frontend** | 🟢 LOW | No pages, no forms, no hooks |
| **Translations** | 🟢 LOW | ~3 shared keys only |
| **DB Migration** | 🔴 HIGH | Need migration to drop tables |

### If you DELETE Insurance:

| Impact Area | Risk | Details |
|-------------|------|---------|
| **Prisma Schema** | 🟡 MEDIUM | Must remove `InsuranceOffer`, `InsuranceImage` + `InsuranceType` enum. No FK from Booking. |
| **app.module.ts** | 🟢 LOW | Remove InsuranceModule import (already a stub) |
| **Search/MeiliSearch** | 🟡 MEDIUM | Remove insurance reindex block |
| **Uploads** | 🟡 MEDIUM | Remove insurance image endpoints |
| **Favorites** | 🟡 LOW | Remove `INSURANCE` from entityType values |
| **Backend service code** | 🟢 LOW | Already deprecated (dead code) |
| **Frontend** | 🟢 LOW | No pages, no forms, no hooks. `insuranceIncluded` on listings is UNRELATED. |
| **Translations** | 🟢 LOW | 0 dedicated keys |
| **DB Migration** | 🟡 MEDIUM | Need migration to drop tables |

---

## 9. Summary File Count

| Service | Backend Files | Frontend Files | DB Models | DB Enums | Translation Keys | Cross-ref Files |
|---------|--------------|----------------|-----------|----------|-----------------|----------------|
| **Transport** | 6 | 0 pages, 0 forms | 2 | 3 (TransportType, PricingType shared) | ~18 dedicated + ~8 shared | 12 files |
| **Trips** | 6 (mostly dead) | 0 pages, 0 forms | 2 | 2 (TripType, ScheduleType) | ~3 shared | 8 files |
| **Insurance** | 6 (mostly dead) | 0 pages, 0 forms | 2 | 1 (InsuranceType) | ~5 shared | 6 files |
| **TOTAL** | **18** | **0** | **6** | **5-6** | **~34** | **~15 unique** |

---

## 10. Recommendation

### Easiest to delete (lowest risk): **Insurance** → **Trips** → **Transport**

1. **Insurance** — Already 410 Gone, no FK from Booking, no frontend pages/forms. Safest to remove first.
2. **Trips** — Already 410 Gone, has Booking FK but likely 0 bookings. Second safest.
3. **Transport** — **STILL ACTIVE** with full CRUD + MeiliSearch indexing + 4 test cases. Has the most cross-dependencies. Consider converting to 410 Gone stub first (like Trips/Insurance), then deleting in a subsequent PR.

### ⚠️ Critical Note on `PricingType` Enum
`PricingType` (FIXED, PER_KM, PER_TRIP, HOURLY, NEGOTIABLE_PRICE) is only used by `TransportService`. If you delete Transport, you can safely delete this enum too.

### ⚠️ Booking Table Cleanup
Before deleting, you MUST:
1. Check if any bookings exist with `entityType = 'TRANSPORT'` or `'TRIP'`
2. If yes, decide: delete them or migrate them
3. Remove the FK columns from the Booking model in a migration
