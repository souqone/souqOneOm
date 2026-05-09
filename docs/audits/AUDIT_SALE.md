# Sale Page Unified Audit Report
**Date:** April 24, 2026  
**Auditor:** Senior Engineer  
**Scope:** Unified Sale Detail Page (`/sale/[type]/[id]`)

---

## Executive Summary

This audit covers the unified sale detail page that handles 5 listing types: `car`, `bus`, `equipment`, `part`, and `service`. The system uses a transformer pattern to normalize different API responses into a unified `UnifiedListing` type.

---

## القسم: CAR

### A) API Fields

| Field name في الـ API | النوع | موجود في UnifiedListing | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ | `listing.id` |
| `title` | string | ✅ | `listing.title` |
| `description` | string | ✅ | `listing.description` |
| `price` | string | ✅ | `listing.price` (parsed to number) |
| `currency` | string | ✅ | `listing.currency` |
| `isPriceNegotiable` | boolean | ✅ | `listing.negotiable` |
| `condition` | string | ✅ | `listing.condition` |
| `governorate` | string | ✅ | `listing.governorate` |
| `city` | string | ✅ | `listing.city` |
| `make` | string | ✅ | `carData.brand` |
| `model` | string | ✅ | `carData.model` |
| `year` | number | ✅ | `carData.year` |
| `mileage` | number | ✅ | `carData.mileage` |
| `fuelType` | string | ✅ | `carData.fuelType` |
| `transmission` | string | ✅ | `carData.transmission` |
| `bodyType` | string | ✅ | `carData.bodyType` |
| `exteriorColor` | string | ✅ | `carData.exteriorColor` |
| `interior` | string | ✅ | `carData.interiorColor` |
| `engineSize` | string | ✅ | `carData.engine` |
| `horsepower` | number | ✅ | `carData.horsepower` |
| `doors` | number | ✅ | `carData.doors` |
| `seats` | number | ✅ | `carData.seats` |
| `driveType` | string | ✅ | `carData.driveType` |
| `features` | string[] | ✅ | `carData.features` |
| `seller` | object | ✅ | `listing.seller` (normalized) |
| `latitude` | number | ✅ | `listing.location.lat` |
| `longitude` | number | ✅ | `listing.location.lng` |
| `viewCount` | number | ✅ | `listing.views` |
| `status` | string | ✅ | `listing.status` |
| `listingType` | enum | ✅ | `listing.listingType` |
| `createdAt` | string | ✅ | `listing.createdAt` |
| `images` | object[] | ✅ | `listing.images` (normalized URLs) |
| `slug` | string | ❌ | Not mapped to unified |
| `isPremium` | boolean | ❌ | Not mapped to unified |
| `featuredUntil` | string | ❌ | Not mapped to unified |
| `dailyPrice/weeklyPrice/monthlyPrice` | string | ❌ | Not mapped (rental only) |
| `minRentalDays` | number | ❌ | Not mapped (rental only) |
| `depositAmount` | string | ❌ | Not mapped (rental only) |
| `kmLimitPerDay` | number | ❌ | Not mapped (rental only) |
| `withDriver` | boolean | ❌ | Not mapped (rental only) |
| `deliveryAvailable` | boolean | ❌ | Not mapped (rental only) |
| `insuranceIncluded` | boolean | ❌ | Not mapped (rental only) |
| `cancellationPolicy` | string | ❌ | Not mapped (rental only) |
| `availableFrom/availableTo` | string | ❌ | Not mapped (rental only) |

### B) UI Sections

| Section | موجود في الـ Shell | بيعرض data صح | المشكلة |
|---|---|---|---|
| Photo Gallery | ✅ | ✅ | No issues |
| Title + Meta | ✅ | ✅ | No issues |
| Seller Row | ✅ | ✅ | No issues |
| Highlights | ✅ | ✅ | Shows condition + negotiable |
| Specs Grid (4 cards) | ✅ | ✅ | year, mileage, engine, horsepower |
| Details Table | ✅ | ✅ | All fields rendering correctly |
| Features | ✅ | ✅ | `carData.features` displayed |
| Description | ✅ | ✅ | No issues |
| Map | ✅ | ✅ | Shows if location exists |
| Ratings | ❌ | — | Section not implemented |
| Things to Know | ❌ | — | Section not implemented |
| Price Card | ✅ | ✅ | Full functionality |
| Similar Items | ✅ | ✅ | Uses `useListings` hook |
| Mobile CTA Bar | ✅ | ✅ | All 3 buttons work |

### C) SPECS_CONFIG Audit

| SpecField | key صح؟ | field موجود في API؟ | بيظهر صح؟ |
|---|---|---|---|
| `carData.year` | ✅ | ✅ | ✅ |
| `carData.mileage` | ✅ | ✅ | ✅ |
| `carData.engine` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `carData.horsepower` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `carData.exteriorColor` | ✅ | ✅ | ✅ (table) |
| `carData.interiorColor` | ✅ | ✅ | ✅ (table, key is `interior` in API) |
| `carData.fuelType` | ✅ | ✅ | ✅ (table) |
| `carData.transmission` | ✅ | ✅ | ✅ (table) |
| `carData.bodyType` | ✅ | ✅ | ✅ (table) |
| `carData.driveType` | ✅ | ✅ | ✅ (table) |
| `carData.doors` | ✅ | ✅ | ✅ (table) |
| `carData.seats` | ✅ | ✅ | ✅ (table) |
| `condition` | ✅ | ✅ | ✅ (table) |
| `governorate` | ✅ | ✅ | ✅ (table) |

### D) المشاكل المكتشفة

1. **Missing rental fields in transformer** — Car rental fields (dailyPrice, weeklyPrice, etc.) are not mapped but they're only relevant for rental listings which redirect to `/rental/car/[id]` anyway.

---

## القسم: BUS

### A) API Fields

| Field name في الـ API | النوع | موجود في UnifiedListing | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ | `listing.id` |
| `title` | string | ✅ | `listing.title` |
| `description` | string | ✅ | `listing.description` |
| `price` | string | ✅ | `listing.price` (parsed to number) |
| `currency` | string | ✅ | `listing.currency` |
| `isPriceNegotiable` | boolean | ✅ | `listing.negotiable` |
| `condition` | string | ✅ | `listing.condition` |
| `governorate` | string | ✅ | `listing.governorate` |
| `city` | string | ✅ | `listing.city` |
| `busType` | string | ✅ | `busData.busType` |
| `capacity` | number | ✅ | `busData.capacity` |
| `make` | string | ✅ | `busData.brand` |
| `model` | string | ✅ | `busData.model` |
| `year` | number | ✅ | `busData.year` |
| `mileage` | number | ✅ | `busData.mileage` |
| `fuelType` | string | ✅ | `busData.fuelType` |
| `transmission` | string | ✅ | `busData.transmission` |
| `plateNumber` | string | ✅ | `busData.plateNumber` |
| `contractType` | string | ✅ | `busData.contractType` |
| `contractClient` | string | ✅ | `busData.contractClient` |
| `contractMonthly` | string | ✅ | `busData.contractMonthly` |
| `contractDuration` | number | ✅ | `busData.contractDuration` |
| `contractExpiry` | string | ✅ | `busData.contractExpiry` |
| `profitMargin` | string | ✅ | `busData.profitMargin` (parsed to number) |
| `features` | string[] | ✅ | `busData.features` |
| `user` | object | ✅ | `listing.seller` (normalized) |
| `contactPhone` | string | ✅ | Used in seller normalization |
| `whatsapp` | string | ✅ | Used in seller normalization |
| `latitude` | number | ✅ | `listing.location.lat` |
| `longitude` | number | ✅ | `listing.location.lng` |
| `viewCount` | number | ✅ | `listing.views` |
| `status` | string | ✅ | `listing.status` |
| `busListingType` | string | ✅ | `listing.listingType` |
| `createdAt` | string | ✅ | `listing.createdAt` |
| `images` | object[] | ✅ | `listing.images` (normalized URLs) |
| `dailyPrice` | string | ❌ | Not mapped (rental only) |
| `monthlyPrice` | string | ❌ | Not mapped (rental only) |
| `minRentalDays` | number | ❌ | Not mapped (rental only) |
| `withDriver` | boolean | ❌ | Not mapped (rental only) |
| `deliveryAvailable` | boolean | ❌ | Not mapped (rental only) |
| `depositAmount` | string | ❌ | Not mapped (rental only) |
| `kmLimitPerDay` | number | ❌ | Not mapped (rental only) |
| `insuranceIncluded` | boolean | ❌ | Not mapped (rental only) |
| `requestPassengers` | number | ❌ | Not mapped (request only) |
| `requestRoute` | string | ❌ | Not mapped (request only) |
| `requestSchedule` | string | ❌ | Not mapped (request only) |

### B) UI Sections

| Section | موجود في الـ Shell | بيعرض data صح | المشكلة |
|---|---|---|---|
| Photo Gallery | ✅ | ✅ | No issues |
| Title + Meta | ✅ | ✅ | No issues |
| Seller Row | ✅ | ✅ | No issues |
| Highlights | ✅ | ✅ | Contract highlights show correctly |
| Specs Grid (4 cards) | ✅ | ⚠️ | **Only 4 visible but config has 7 fields** |
| Details Table | ✅ | ✅ | Contract fields display correctly |
| Features | ✅ | ✅ | `busData.features` displayed |
| Description | ✅ | ✅ | No issues |
| Map | ✅ | ✅ | Shows if location exists |
| Ratings | ❌ | — | Section not implemented |
| Things to Know | ❌ | — | Section not implemented |
| Price Card | ✅ | ✅ | Full functionality |
| Similar Items | ✅ | ⚠️ | Uses `useBusListings` — may need verification |
| Mobile CTA Bar | ✅ | ✅ | All 3 buttons work |

### C) SPECS_CONFIG Audit

| SpecField | key صح؟ | field موجود في API؟ | بيظهر صح؟ |
|---|---|---|---|
| `busData.year` | ✅ | ✅ | ✅ |
| `busData.capacity` | ✅ | ✅ | ✅ |
| `busData.busType` | ✅ | ✅ | ✅ |
| `busData.brand` | ✅ | ✅ | ✅ |
| `busData.model` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `busData.contractType` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `busData.profitMargin` | ✅ | ✅ | ✅ (hideIfEmpty, parsed to number) |

**⚠️ ISSUE:** Bus config has 7 `specsFields` but the grid only shows max 4 cards (grid is `grid-cols-4`). With `hideIfEmpty` on model, contractType, and profitMargin, usually only 4 show: year, capacity, busType, brand.

### D) المشاكل المكتشفة

1. **BUS SPECS CONFIG OVERFLOW** — Bus has 7 specsFields but grid only shows 4. The extra fields (model, contractType, profitMargin) with `hideIfEmpty: true` may never appear if data is missing.

2. **Similar Items API** — Uses `useBusListings` which should work, but needs end-to-end verification.

3. **ContractDetails hardcoded strings** — Lines 31-35 and 66, 73 in ContractDetails.tsx have hardcoded Arabic strings without translations:
   ```tsx
   busData.contractType === 'SCHOOL' ? 'عقد مدرسي' : 
   ```

4. **Missing contractMonthly label translation** — Line 65 uses hardcoded `'القيمة الشهرية'` instead of translation key.

5. **Missing contractExpiry label translation** — Line 72 uses hardcoded `'تاريخ الانتهاء'` instead of translation key.

---

## القسم: EQUIPMENT

### A) API Fields

| Field name في الـ API | النوع | موجود في UnifiedListing | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ | `listing.id` |
| `title` | string | ✅ | `listing.title` |
| `description` | string | ✅ | `listing.description` |
| `price` | string | ✅ | `listing.price` (parsed to number) |
| `currency` | string | ✅ | `listing.currency` |
| `isPriceNegotiable` | boolean | ✅ | `listing.negotiable` |
| `condition` | string | ✅ | `listing.condition` |
| `governorate` | string | ✅ | `listing.governorate` |
| `city` | string | ✅ | `listing.city` |
| `equipmentType` | string | ✅ | `equipmentData.category` AND `equipmentData.equipmentType` |
| `make` | string | ✅ | `equipmentData.brand` |
| `model` | string | ✅ | `equipmentData.model` |
| `year` | number | ✅ | `equipmentData.year` |
| `capacity` | string | ✅ | `equipmentData.capacity` |
| `power` | string | ✅ | `equipmentData.power` |
| `weight` | string | ✅ | `equipmentData.weight` |
| `hoursUsed` | number | ✅ | `equipmentData.hoursUsed` |
| `features` | string[] | ✅ | `equipmentData.features` |
| `user` | object | ✅ | `listing.seller` (normalized) |
| `contactPhone` | string | ✅ | Used in seller normalization |
| `whatsapp` | string | ✅ | Used in seller normalization |
| `latitude` | number | ✅ | `listing.location.lat` |
| `longitude` | number | ✅ | `listing.location.lng` |
| `viewCount` | number | ✅ | `listing.views` |
| `status` | string | ✅ | `listing.status` |
| `listingType` | string | ✅ | `listing.listingType` |
| `createdAt` | string | ✅ | `listing.createdAt` |
| `images` | object[] | ✅ | `listing.images` (normalized URLs) |
| `dailyPrice` | string | ❌ | Not mapped (rental only) |
| `weeklyPrice` | string | ❌ | Not mapped (rental only) |
| `monthlyPrice` | string | ❌ | Not mapped (rental only) |
| `minRentalDays` | number | ❌ | Not mapped (rental only) |
| `withOperator` | boolean | ❌ | Not mapped (rental only) |
| `deliveryAvailable` | boolean | ❌ | Not mapped (rental only) |
| `insuranceIncluded` | boolean | ❌ | Not mapped (rental only) |
| `depositAmount` | string | ❌ | Not mapped (rental only) |
| `kmLimitPerDay` | number | ❌ | Not mapped (rental only) |

### B) UI Sections

| Section | موجود في الـ Shell | بيعرض data صح | المشكلة |
|---|---|---|---|
| Photo Gallery | ✅ | ✅ | No issues |
| Title + Meta | ✅ | ✅ | No issues |
| Seller Row | ✅ | ✅ | No issues |
| Highlights | ✅ | ⚠️ | Rental highlights conditional on rental fields that aren't mapped |
| Specs Grid (4 cards) | ✅ | ⚠️ | 6 fields but only 4 show (2+ have hideIfEmpty) |
| Details Table | ✅ | ✅ | All fields display correctly |
| Features | ✅ | ✅ | `equipmentData.features` displayed |
| Description | ✅ | ✅ | No issues |
| Map | ✅ | ✅ | Shows if location exists |
| Ratings | ❌ | — | Section not implemented |
| Things to Know | ❌ | — | Section not implemented |
| Price Card | ✅ | ✅ | Full functionality |
| Similar Items | ✅ | ⚠️ | Uses `useEquipmentListings` — needs verification |
| Mobile CTA Bar | ✅ | ✅ | All 3 buttons work |

### C) SPECS_CONFIG Audit

| SpecField | key صح؟ | field موجود في API؟ | بيظهر صح؟ |
|---|---|---|---|
| `equipmentData.year` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `equipmentData.hoursUsed` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `equipmentData.capacity` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `equipmentData.power` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `equipmentData.brand` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `equipmentData.model` | ✅ | ✅ | ✅ (hideIfEmpty) |

**⚠️ ISSUE:** Equipment has 6 `specsFields` with ALL having `hideIfEmpty: true`. In practice, only fields with data will show. If only 2 have data, only 2 cards appear (grid will look uneven).

### D) المشاكل المكتشفة

1. **EQUIPMENT RENTAL HIGHLIGHTS BROKEN** — The highlight fields for `withOperator`, `deliveryAvailable`, and `insuranceIncluded` depend on rental fields that are NOT mapped in the transformer:
   ```ts
   // In specs.config.ts lines 159-171
   condition: (d) => d.equipmentData?.withOperator === true, // ❌ withOperator not mapped!
   ```
   These rental fields are not included in `transformEquipment()` — they only exist on rental listings which redirect away.

2. **Similar Items API mismatch** — `SimilarItems.tsx` line 34 uses `useEquipmentListings` but passes params as `{ limit, governorate }`. The API may need different param names.

---

## القسم: PART

### A) API Fields

| Field name في الـ API | النوع | موجود في UnifiedListing | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ | `listing.id` |
| `title` | string | ✅ | `listing.title` |
| `description` | string | ✅ | `listing.description` |
| `price` | string | ✅ | `listing.price` (parsed to number) |
| `currency` | string | ✅ | `listing.currency` |
| `isPriceNegotiable` | boolean | ✅ | `listing.negotiable` |
| `condition` | string | ✅ | `listing.condition` |
| `governorate` | string | ✅ | `listing.governorate` |
| `city` | string | ✅ | `listing.city` |
| `partCategory` | string | ✅ | `partData.category` |
| `partNumber` | string | ✅ | `partData.partNumber` |
| `compatibleMakes` | string[] | ✅ | `partData.compatibility` |
| `compatibleModels` | string[] | ✅ | `partData.compatibleModels` |
| `yearFrom` | number | ✅ | Used in `partData.yearRange` calculation |
| `yearTo` | number | ✅ | Used in `partData.yearRange` calculation |
| `isOriginal` | boolean | ✅ | `partData.isOriginal` |
| `seller` | object | ✅ | `listing.seller` (normalized) |
| `contactPhone` | string | ✅ | Used in seller normalization |
| `whatsapp` | string | ✅ | Used in seller normalization |
| `latitude` | number | ✅ | `listing.location.lat` |
| `longitude` | number | ✅ | `listing.location.lng` |
| `viewCount` | number | ✅ | `listing.views` |
| `status` | string | ✅ | `listing.status` |
| `createdAt` | string | ✅ | `listing.createdAt` |
| `images` | object[] | ✅ | `listing.images` (normalized URLs) |

### B) UI Sections

| Section | موجود في الـ Shell | بيعرض data صح | المشكلة |
|---|---|---|---|
| Photo Gallery | ✅ | ✅ | No issues |
| Title + Meta | ✅ | ✅ | No issues |
| Seller Row | ✅ | ✅ | No issues |
| Highlights | ✅ | ✅ | Shows condition + negotiable |
| Specs Grid (4 cards) | ✅ | ⚠️ | **Only 4 fields but grid expects 4** |
| Details Table | ✅ | ✅ | All fields display correctly |
| Features | ❌ | — | Parts don't have features field in transformer |
| Description | ✅ | ✅ | No issues |
| Map | ✅ | ✅ | Shows if location exists |
| Ratings | ❌ | — | Section not implemented |
| Things to Know | ❌ | — | Section not implemented |
| Price Card | ✅ | ✅ | Full functionality |
| Similar Items | ✅ | ⚠️ | Uses `useParts` — needs verification |
| Mobile CTA Bar | ✅ | ✅ | All 3 buttons work |

### C) SPECS_CONFIG Audit

| SpecField | key صح؟ | field موجود في API؟ | بيظهر صح؟ |
|---|---|---|---|
| `partData.category` | ✅ | ✅ | ✅ |
| `partData.brand` | ✅ | ❌ | **API doesn't have brand for parts!** |
| `partData.partNumber` | ✅ | ✅ | ✅ (hideIfEmpty) |
| `condition` | ✅ | ✅ | ✅ |

**🚨 CRITICAL ISSUE:** `partData.brand` key in specs config expects `brand` field but the API response for parts doesn't include a brand/make field! Looking at `SparePartItem` interface, there's no `make` or `brand` field.

### D) المشاكل المكتشفة

1. **🚨 PART BRAND FIELD DOESN'T EXIST** — The config defines `partData.brand` (line 194) but `SparePartItem` API type has no brand field. This card will always be empty/hidden.

2. **Features section never shows for parts** — The features check in `SalePageShell.tsx` (lines 478-484) looks for `listing.partData?.features` but `PartSpecificData` interface doesn't include `features` and the transformer doesn't map it.

---

## القسم: SERVICE

### A) API Fields

| Field name في الـ API | النوع | موجود في UnifiedListing | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ | `listing.id` |
| `title` | string | ✅ | `listing.title` |
| `description` | string | ✅ | `listing.description` |
| `serviceType` | string | ✅ | `serviceData.serviceType` |
| `providerType` | string | ✅ | `serviceData.providerType` |
| `providerName` | string | ❌ | Not mapped to unified |
| `specializations` | string[] | ✅ | `serviceData.features` |
| `priceFrom` | string | ✅ | `listing.price` (uses priceFrom only) |
| `priceTo` | string | ❌ | Not used (price range not supported) |
| `currency` | string | ✅ | `listing.currency` |
| `isHomeService` | boolean | ✅ | `serviceData.homeService` |
| `workingHoursOpen` | string | ✅ | Used in `serviceData.workingHours` |
| `workingHoursClose` | string | ✅ | Used in `serviceData.workingHours` |
| `workingDays` | string[] | ❌ | Not mapped to unified |
| `governorate` | string | ✅ | `listing.governorate` |
| `city` | string | ✅ | `listing.city` |
| `address` | string | ❌ | Not mapped to unified |
| `latitude` | number | ✅ | `listing.location.lat` |
| `longitude` | number | ✅ | `listing.location.lng` |
| `contactPhone` | string | ✅ | Used in seller normalization |
| `whatsapp` | string | ✅ | Used in seller normalization |
| `website` | string | ❌ | Not mapped to unified |
| `viewCount` | number | ✅ | `listing.views` |
| `status` | string | ✅ | `listing.status` |
| `createdAt` | string | ✅ | `listing.createdAt` |
| `images` | object[] | ✅ | `listing.images` (normalized URLs) |
| `user` | object | ✅ | `listing.seller` (normalized) |

### B) UI Sections

| Section | موجود في الـ Shell | بيعرض data صح | المشكلة |
|---|---|---|---|
| Photo Gallery | ✅ | ✅ | No issues |
| Title + Meta | ✅ | ✅ | No issues |
| Seller Row | ✅ | ✅ | No issues |
| Highlights | ✅ | ✅ | Verified provider + home service |
| Specs Grid (4 cards) | ✅ | ⚠️ | **Only 2 fields defined, grid looks empty** |
| Details Table | ✅ | ✅ | All fields display correctly |
| Features | ✅ | ⚠️ | Shows specializations as features |
| Description | ✅ | ✅ | No issues |
| Map | ✅ | ✅ | Shows if location exists |
| Ratings | ❌ | — | Section not implemented |
| Things to Know | ❌ | — | Section not implemented |
| Price Card | ✅ | ⚠️ | Shows priceFrom only, priceTo ignored |
| Similar Items | ✅ | ⚠️ | Uses `useCarServices` — needs verification |
| Mobile CTA Bar | ✅ | ✅ | All 3 buttons work |

### C) SPECS_CONFIG Audit

| SpecField | key صح؟ | field موجود في API؟ | بيظهر صح؟ |
|---|---|---|---|
| `serviceData.serviceType` | ✅ | ✅ | ✅ |
| `serviceData.providerType` | ✅ | ✅ | ✅ (hideIfEmpty) |

**⚠️ ISSUE:** Service only has 2 `specsFields` — the grid will show only 2 cards, leaving 2 empty slots in the 4-card grid.

### D) المشاكل المكتشفة

1. **SERVICE SPECS GRID UNDERFLOW** — Only 2 fields defined but grid shows 4 columns. Visual imbalance.

2. **Price range not displayed** — Services have `priceFrom` and `priceTo` but unified only shows `priceFrom`. Users can't see the price range.

3. **Missing fields not mapped:**
   - `providerName` — Could be used instead of user's displayName
   - `workingDays` — Not displayed anywhere
   - `address` — Not displayed (only governorate/city shown)
   - `website` — Not displayed

4. **Condition hardcoded** — Line 328 in `useUnifiedListing.ts`:
   ```ts
   condition: 'متاح', // Services don't have a condition field
   ```
   This hardcoded Arabic string should come from translations.

---

## ملخص نهائي — جدول المقارنة

| القسم | Photo | Specs | Price Card | Similar | مشاكل |
|---|---|---|---|---|---|
| car | ✅ | ✅ | ✅ | ✅ | 0 |
| bus | ✅ | ⚠️ | ✅ | ⚠️ | 5 |
| equipment | ✅ | ⚠️ | ✅ | ⚠️ | 2 |
| part | ✅ | ❌ | ✅ | ⚠️ | 2 |
| service | ✅ | ⚠️ | ⚠️ | ⚠️ | 4 |

---

## أكبر 3 مشاكل تحتاج إصلاح فوري

### 🔴 1. PART BRAND FIELD DOESN'T EXIST (Critical)
**Location:** `apps/web/src/features/sale/config/specs.config.ts:194`

**Problem:** The config references `partData.brand` but `SparePartItem` API has no brand field.

**Fix:** Remove the brand field from parts specs config or add brand to the parts API/DB schema.

```ts
// Remove this from specs.config.ts line 194:
{ key: 'partData.brand', label: t('specBrand'), icon: 'Tag', format: 'text', hideIfEmpty: true },
```

---

### 🔴 2. EQUIPMENT RENTAL HIGHLIGHTS BROKEN (High)
**Location:** `apps/web/src/features/sale/config/specs.config.ts:154-184` + `useUnifiedListing.ts:203-257`

**Problem:** Rental-related highlight conditions reference fields that aren't mapped:
- `withOperator` not in transformer
- `deliveryAvailable` not in transformer  
- `insuranceIncluded` not in transformer

**Fix:** Either:
- Option A: Remove these rental highlights from sale config (rental listings redirect anyway)
- Option B: Map these fields in transformer (they exist in API but are empty for sale listings)

---

### 🔴 3. ContractDetails.tsx Hardcoded Arabic Strings (Medium)
**Location:** `apps/web/src/features/sale/components/ContractDetails.tsx:31-35, 65-66, 72-73, 87-88, 141-142`

**Problem:** Multiple hardcoded Arabic strings without translation keys:
```tsx
// Lines 31-35
busData.contractType === 'SCHOOL' ? 'عقد مدرسي' : 
busData.contractType === 'COMPANY' ? 'عقد شركة' :
...

// Lines 65-66
label: 'القيمة الشهرية',

// Lines 72-73  
label: 'تاريخ الانتهاء',

// Lines 87-88
<h3 className="...">تفاصيل العقد</h3>
<p className="...">معلومات العقد وشروطه</p>

// Lines 141-142
<p className="...">للاستفسار عن تفاصيل العقد</p>
<p className="...">تواصل مع البائع للحصول على معلومات كاملة</p>
```

**Fix:** Add all strings to `ar.json` and `en.json` translation files and use `t()` function.

---

## الـ Fields الناقصة في الـ Transformers

### Missing in `transformBus`:
| Field | Reason |
|---|---|
| `dailyPrice` | Rental only — OK to skip |
| `monthlyPrice` | Rental only — OK to skip |
| `minRentalDays` | Rental only — OK to skip |
| `withDriver` | Rental only — OK to skip |
| `deliveryAvailable` | Rental only — OK to skip |
| `depositAmount` | Rental only — OK to skip |
| `kmLimitPerDay` | Rental only — OK to skip |
| `insuranceIncluded` | Rental only — OK to skip |

### Missing in `transformEquipment`:
| Field | Reason |
|---|---|
| `dailyPrice` | Rental only — OK to skip |
| `weeklyPrice` | Rental only — OK to skip |
| `monthlyPrice` | Rental only — OK to skip |
| `minRentalDays` | Rental only — OK to skip |
| `withOperator` | Rental only — OK to skip |
| `deliveryAvailable` | Rental only — OK to skip |
| `insuranceIncluded` | Rental only — OK to skip |
| `depositAmount` | Rental only — OK to skip |
| `kmLimitPerDay` | Rental only — OK to skip |

### Missing in `transformService` (should be added):
| Field | Impact |
|---|---|
| `priceTo` | Price range not shown to users |
| `workingDays` | Can't show business days |
| `address` | Can't show full address |
| `website` | Can't link to service website |
| `providerName` | Shows user name instead of business name |

---

## الـ Sections الفارغة بسبب null data

### Sections that may be hidden:

| Section | Condition | Affected Types |
|---|---|---|
| Specs Grid | Hidden if all `specsFields` have `hideIfEmpty: true` and no data | equipment (most fields), part (brand always hidden) |
| Highlights | Hidden if `highlightFields` array is empty after `condition` filter | None currently |
| Details Table | Hidden if all `tableFields` have `hideIfEmpty: true` and no data | Unlikely |
| Features | Hidden if no features array | part (never shows), service (shows specializations) |
| Contract Details | Hidden if `listing.type !== 'bus' \|\| !listing.busData?.contractType` | car, equipment, part, service |
| Map | Hidden if `!listing.location` | All types if no coordinates |
| Description | Hidden if `!listing.description` | All types if no description |

---

## Additional Findings

### UI/UX Issues

1. **SellerRow shows memberSince but not listing count** — `UnifiedSeller` has `listingCount?: number` but it's never populated in `normalizeSeller()`.

2. **Status check uses hardcoded values** — `SalePageShell.tsx:314`:
   ```tsx
   !['ACTIVE', 'AVAILABLE'].includes(listing.status.toUpperCase())
   ```
   Should check type-specific status values.

3. **Service condition hardcoded** — `useUnifiedListing.ts:328`:
   ```tsx
   condition: 'متاح', // Hardcoded Arabic
   ```

### Performance Issues

1. **SimilarItems fetches on every render** — No caching strategy for similar listings.

2. **Empty-string pattern in hooks** — Calling all 5 hooks with empty strings causes unnecessary overhead.

### Type Safety Issues

1. **ListingItem vs unified type mismatch** — `listingType` is optional in API but required in unified.

2. **Currency defaults** — No fallback if currency is missing from API.

---

## Recommendations Priority

| Priority | Issue | Effort |
|---|---|---|
| 🔴 P0 | Remove non-existent `partData.brand` from config | 5 min |
| 🔴 P0 | Fix hardcoded strings in ContractDetails.tsx | 30 min |
| 🔴 P0 | Remove or fix equipment rental highlights | 15 min |
| 🟡 P1 | Add missing service fields to transformer | 1 hour |
| 🟡 P1 | Fix service specs grid underflow | 30 min |
| 🟡 P1 | Fix bus specs overflow (reduce fields) | 15 min |
| 🟢 P2 | Add `listingCount` to seller normalization | 30 min |
| 🟢 P2 | Implement missing sections (Ratings, Things to Know) | 4 hours |
| 🟢 P2 | Add translations for service condition | 10 min |

---

**End of Audit Report**
