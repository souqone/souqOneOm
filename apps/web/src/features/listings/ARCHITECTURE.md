# Listings Feature — Architecture

## Audit Summary (Apr 2026)

### Current State

| Page | Hook | Filter Params (UI) | Filter Params (API-only gap) | Sort UI |
|------|------|--------------------|-------------------------------|---------|
| `/listings` | `useListings` + `useSearch` (Meili) | search, make, model, yearMin/Max, priceMin/Max, fuelType (multi), transmission, condition, bodyType, governorate, listingType, mileageMax | — | ✅ createdAt, price, year, mileage, viewCount |
| `/buses` | `useBusListings` | busListingType, governorate | search, busType, make, minCapacity/maxCapacity, minPrice/maxPrice, sort | ❌ |
| `/equipment` | `useEquipmentListings` + `useEquipmentRequests` + `useOperatorListings` | equipmentType, listingType, governorate | search, sortBy | ❌ |
| `/parts` | `useParts` | partCategory (via ListingPageShell) | condition, make, minPrice/maxPrice | ❌ |
| `/services` | `useCarServices` | serviceType (via ListingPageShell) | providerType, isHomeService, governorate | ❌ |
| `/transport` | `useTransportServices` | governorate | search, transportType, providerType | ❌ |

### Existing Cards

| Component | Used By | Key Fields Displayed |
|-----------|---------|----------------------|
| `VehicleCard` (`features/ads/components/vehicle-card.tsx`) | `/listings` | title, price/dailyPrice, make+model+year, condition badge, listingType, governorate, createdAt, fav button |
| `BusCard` (inline `buses/page.tsx`) | `/buses` | title, price/dailyPrice/monthlyPrice, busListingType badge, governorate, createdAt |
| `EquipmentCard` (inline `equipment/page.tsx`) | `/equipment` | title, price/dailyPrice, listingType badge, governorate, createdAt |
| `PartCard` (inline `parts/page.tsx`) | `/parts` | title, price, condition badge, isOriginal badge, governorate |
| Service card (inline `services/page.tsx`) | `/services` | title, priceFrom-priceTo, serviceType badge, isHomeService badge, providerName, governorate |
| `GenericListingCard` (`components/generic-listing-card.tsx`) | `/transport` | title, price, governorate, createdAt, description |

### API DTOs — Supported Query Params

**`/listings`** (`QueryListingsDto`):
`page`, `limit`, `search`, `make`, `model`, `yearMin`, `yearMax`, `priceMin`, `priceMax`,
`fuelType`, `transmission`, `condition`, `bodyType`, `governorate`, `status`, `listingType`,
`sortBy` (createdAt|price|year|mileage|viewCount), `sortOrder` (asc|desc), `sellerId`

**`/buses`** (`QueryBusListingsDto`):
`page`, `limit`, `search`, `busListingType`, `busType`, `make`, `governorate`,
`minPrice`, `maxPrice`, `minCapacity`, `maxCapacity`,
`sort` (newest|price_asc|price_desc), `userId`

**`/equipment`** (`QueryEquipmentListingsDto`):
`page`, `limit`, `equipmentType`, `listingType`, `governorate`, `search`, `sortBy`, `userId`

**`/parts`** (`QueryPartsDto`):
`page`, `limit`, `search`, `partCategory`, `condition`, `make`, `governorate`,
`minPrice`, `maxPrice`, `sellerId`

**`/services`** (`QueryServicesDto`):
`page`, `limit`, `search`, `serviceType`, `providerType`, `governorate`, `isHomeService`, `userId`

**`/transport`** (`QueryTransportDto`):
`page`, `limit`, `search`, `transportType`, `providerType`, `governorate`, `userId`

---

## Target File Structure

```
apps/web/src/
├── app/[locale]/browse/
│   └── [category]/
│       └── page.tsx              ← الصفحة الموحدة (7 أقسام من ملف واحد)
└── features/listings/
    ├── ARCHITECTURE.md           ← هذا الملف
    ├── types/
    │   ├── category.types.ts     ← ListingCategory, CategoryMeta, CATEGORY_META
    │   ├── unified-item.types.ts ← UnifiedListingItem, Badge, DetailItem
    │   └── filters.types.ts      ← FilterField, FilterType, ActiveFilters
    ├── config/
    │   ├── categories.config.ts  ← إعدادات كل قسم (normalizer fn + hookFactory)
    │   └── filters.config.ts     ← تعريف فلاتر كل قسم
    ├── hooks/
    │   ├── useUnifiedListings.ts ← hook موحد يختار الـ API hook الصح حسب الـ category
    │   └── useFilterState.ts     ← إدارة الفلاتر في URL params
    ├── components/
    │   ├── ListingsPageShell.tsx  ← هيكل الصفحة الكامل
    │   ├── FilterBar.tsx          ← Airbnb-style horizontal filter bar
    │   ├── FilterDropdown.tsx     ← Portal dropdown لكل فلتر
    │   ├── FilterSheet.tsx        ← Mobile bottom sheet للفلاتر
    │   ├── ActiveFilters.tsx      ← Chips للفلاتر النشطة مع X لكل chip
    │   ├── UnifiedCard.tsx        ← الكارد الموحد (يعرض UnifiedListingItem)
    │   ├── UnifiedCardSkeleton.tsx← Skeleton لكل كارد
    │   ├── SortDropdown.tsx       ← Sort options حسب الـ category
    │   ├── ResultsMeta.tsx        ← "١٢٣ نتيجة" + active filter count
    │   └── EmptyState.tsx         ← Empty state مع اقتراحات
    └── utils/
        └── filter-helpers.ts      ← buildQueryParams, parseUrlFilters, normalizeItem fns
```

---

## Data Flow

```
URL params (/browse/cars?make=Toyota&priceMax=5000)
    ↓
useFilterState.ts  →  parses URL → ActiveFilters object
    ↓
useUnifiedListings.ts  →  picks correct hook by category → builds API params
    ↓
API (NestJS)  →  returns paginated items
    ↓
normalizeItem()  →  converts any raw item → UnifiedListingItem
    ↓
UnifiedCard.tsx  →  renders from UnifiedListingItem (consistent UI for all 7 types)
```

---

## Design Decisions

1. **Single page `browse/[category]/page.tsx`** — replaces 7 separate pages. Old pages stay alive for backward-compat redirects.
2. **`UnifiedListingItem`** — all 7 API shapes normalize to one type. Normalizers live in `categories.config.ts`.
3. **Filter config per category** — `filters.config.ts` exports `CATEGORY_FILTERS: Record<ListingCategory, FilterField[]>`. The UI reads this; no hardcoded filter lists.
4. **`useUnifiedListings`** — internally calls the correct hook (`useBusListings`, `useTransportServices`, etc.) based on `category` param. Returns `{ items: UnifiedListingItem[], meta, isLoading, isError }`.
5. **Sort** — only `/listings` has full sort on API. Others get `sort: newest` only until API DTOs are extended.
6. **`primary: true` filters** → shown directly in FilterBar. `primary: false` → collapsed under "المزيد" button.
