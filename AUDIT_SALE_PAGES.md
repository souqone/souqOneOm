# Audit: Sale Display Pages

## 1. `src/app/[locale]/sale/[type]/[id]/page.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\app\[locale]\sale\[type]\[id]\page.tsx`

### Conditions:
- `if (!apiPath)` → returns fallback metadata
- `try...catch` → on API failure returns fallback metadata

```tsx
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getImageUrl } from '@/lib/image-utils';
import SaleDetailClient from './sale-detail-client';

const API_PATHS: Record<string, string> = {
  car: '/listings',
  bus: '/buses',
  equipment: '/equipment',
  part: '/parts',
  service: '/services',
};

const TYPE_LABELS: Record<string, string> = {
  car: 'سيارة',
  bus: 'باص',
  equipment: 'معدات',
  part: 'قطع غيار',
  service: 'خدمة سيارات',
};

interface OgData {
  title?: string;
  description?: string;
  price?: string | number;
  currency?: string;
  governorate?: string;
  images?: { url: string; isPrimary?: boolean }[];
}

function getPrimaryImage(images?: { url: string; isPrimary?: boolean }[]): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.isPrimary) ?? images[0];
  return getImageUrl(primary?.url) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string; id: string }>;
}): Promise<Metadata> {
  const { locale, type, id } = await params;
  const apiPath = API_PATHS[type];

  if (!apiPath) {
    return { title: 'غير موجود | سوق ون' };
  }

  try {
    const data = await serverFetch<OgData>(`${apiPath}/${id}`, { revalidate: 60 });

    const title = data.title || TYPE_LABELS[type] || 'إعلان';
    const price = data.price ? `${Number(data.price).toLocaleString()} ${data.currency || 'OMR'}` : '';
    const location = data.governorate || '';
    const descParts = [price, location, TYPE_LABELS[type]].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/sale/${type}/${id}`;

    return {
      title: `${title} | سوق ون`,
      description,
      openGraph: {
        type: 'article',
        title,
        description,
        url: pageUrl,
        siteName: 'سوق ون - SouqOne',
        locale: locale === 'ar' ? 'ar_OM' : 'en_OM',
        ...(image ? { images: [{ url: image, width: 800, height: 600, alt: title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return { title: `${TYPE_LABELS[type] || 'إعلان'} | سوق ون` };
  }
}

export default function SalePage() {
  return <SaleDetailClient />;
}
```

---

## 2. `src/app/[locale]/sale/[type]/[id]/sale-detail-client.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\app\[locale]\sale\[type]\[id]\sale-detail-client.tsx`

### Conditions:
- `if (!VALID_TYPES.includes(typeParam))` → `notFound()`
- `if (redirectTo)` → redirect via `router.replace(redirectTo)`
- `if (isLoading || redirectTo)` → show skeleton
- `if (isError || !listing)` → show error state

```tsx
'use client';

import { useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ErrorState } from '@/components/error-state';
import { useUnifiedListing } from '@/features/sale/hooks/useUnifiedListing';
import { getSaleConfig } from '@/features/sale/config/specs.config';
import { SalePageShell } from '@/features/sale/components/SalePageShell';
import type { SaleEntityType } from '@/features/sale/types/unified.types';
import { useTranslations } from 'next-intl';
import { useEnumTranslations } from '@/lib/enum-translations';

const VALID_TYPES: SaleEntityType[] = ['car', 'bus', 'equipment', 'part', 'service'];

function SalePageSkeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-28 lg:pb-16 animate-pulse">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-5" />
        <div className="h-7 w-96 bg-surface-container-high rounded mb-3" />
        <div className="h-4 w-64 bg-surface-container-high rounded mb-6" />
        <div
          className="grid gap-1 rounded-2xl overflow-hidden mb-8"
          style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '185px 185px' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`bg-surface-container-high ${i === 0 ? 'row-span-2' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container-high" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-container-high rounded" />
                <div className="h-3 w-24 bg-surface-container-high rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-container-high rounded-2xl" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-3/4 bg-surface-container-high rounded" />
            </div>
          </div>
          <div className="h-96 bg-surface-container-high rounded-2xl" />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function SaleDetailClient() {
  const params = useParams<{ type: string; id: string }>();
  const { type: typeParam, id } = params;

  if (!VALID_TYPES.includes(typeParam as SaleEntityType)) {
    notFound();
  }
  const type = typeParam as SaleEntityType;

  const router = useRouter();
  const ts = useTranslations('sale');
  const enumT = useEnumTranslations();

  const { listing, isLoading, isError, error, refetch, redirectTo } = useUnifiedListing(type, id);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isLoading || redirectTo) {
    return <SalePageSkeleton />;
  }

  if (isError || !listing) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-5xl mx-auto px-4 md:px-8">
            <ErrorState
              onRetry={() => refetch()}
              message={error?.message || ts('notFound')}
            />
          </main>
        </div>
        <Footer />
      </>
    );
  }

  const config = getSaleConfig(ts, enumT)[type];

  return (
    <>
      <Navbar />
      <SalePageShell listing={listing} config={config} />
      <Footer />
    </>
  );
}
```

---

## 3. `src/features/sale/types/unified.types.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\sale\types\unified.types.ts`

```ts
export type SaleEntityType = 'car' | 'bus' | 'equipment' | 'part' | 'service';

export interface UnifiedSeller {
  id: string;
  name: string;
  image?: string;
  phone?: string;
  whatsapp?: string;
  governorate: string;
  verified: boolean;
  memberSince: string;
  listingCount?: number;
}

export interface UnifiedLocation {
  lat: number;
  lng: number;
  radius?: number;
  distance?: number;
}

export interface CarSpecificData {
  brand: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  engine?: string;
  horsepower?: number;
  doors?: number;
  seats?: number;
  driveType?: string;
  features?: string[];
}

export interface BusSpecificData {
  busType?: string;
  capacity?: number;
  contractType?: string;
  brand?: string;
  year?: number;
  features?: string[];
  contractClient?: string;
  contractDuration?: number;
  profitMargin?: number;
  contractMonthly?: string;
  contractExpiry?: string;
  plateNumber?: string;
  requestPassengers?: number;
  requestRoute?: string;
  requestSchedule?: string;
}

export interface EquipmentSpecificData {
  category?: string;
  brand?: string;
  model?: string;
  year?: number;
  warranty?: string;
  hoursUsed?: number;
  features?: string[];
}

export interface PartSpecificData {
  partNumber?: string;
  category?: string;
  brand?: string;
  compatibility?: string[];
  compatibleModels?: string[];
  yearRange?: string;
  isOriginal?: boolean;
  condition?: string;
}

export interface ServiceSpecificData {
  serviceType?: string;
  providerType?: string;
  homeService?: boolean;
  workingHours?: string;
  features?: string[];
  priceTo?: number;
  providerName?: string;
  workingDays?: string[];
  address?: string;
  website?: string;
}

export interface UnifiedListing {
  id: string;
  type: SaleEntityType;
  title: string;
  description?: string;
  price: number;
  currency: string;
  negotiable: boolean;
  condition: string;
  governorate: string;
  city?: string;
  isPremium?: boolean;
  images: string[];
  seller: UnifiedSeller;
  location?: UnifiedLocation;
  views: number;
  createdAt: string;
  status: string;
  listingType: string;
  carData?: CarSpecificData;
  busData?: BusSpecificData;
  equipmentData?: EquipmentSpecificData;
  partData?: PartSpecificData;
  serviceData?: ServiceSpecificData;
}

export interface UseUnifiedListingResult {
  listing: UnifiedListing | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  redirectTo: string | null;
}
```

---

## 4. `src/features/sale/types/config.types.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\sale\types\config.types.ts`

```ts
import type { SaleEntityType, UnifiedListing } from './unified.types';
import type { EnumTranslations } from '@/lib/enum-translations';

export interface SpecField {
  key: string;
  label: string;
  icon: string;
  format?: 'number' | 'text' | 'boolean' | 'km' | 'year' | 'array' | 'link' | 'enum';
  enumKey?: keyof EnumTranslations;
  unit?: string;
  hideIfEmpty?: boolean;
}

export interface HighlightField {
  icon: string;
  getTitle: (data: UnifiedListing) => string;
  getSub: (data: UnifiedListing) => string;
  condition?: (data: UnifiedListing) => boolean;
}

export type BadgeColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal';

export interface SectionConfig {
  type: SaleEntityType;
  displayName: string;
  icon: string;
  specsFields: SpecField[];
  tableFields: SpecField[];
  highlightFields: HighlightField[];
  badgeColor: BadgeColor;
}
```

---

## 5. Key Conditions in SalePageShell.tsx

**File:** `c:\Users\DELL\Desktop\m\apps\web\src\features\sale\components\SalePageShell.tsx` (729 lines)

| Condition | What it controls |
|---|---|
| `listing.isPremium` | Shows gold premium badge |
| `listing.city \|\| listing.governorate` | Shows location in title section |
| `listing.status not in ['ACTIVE','AVAILABLE']` | Shows red status banner (SOLD/unavailable) |
| `listing.images.length > 0` | Shows photo gallery |
| `isOwner` | Shows edit+delete buttons vs contact buttons (mobile) |
| `listing.seller.phone` | Enables/disables call button |
| `listing.seller.whatsapp` | Enables/disables WhatsApp button |
| `listing.description` | Shows description section |
| `config.specsFields?.length > 0` | Shows specs grid |
| `listing.type === 'bus' && listing.busData?.contractType` | Shows ContractDetails (via ContractDetails component) |
| `config.highlightFields?.length > 0` | Shows highlights dropdown |
| `config.tableFields?.length > 0` | Shows details table dropdown |
| `features.length > 0` (from carData/busData/equipmentData/serviceData) | Shows features/amenities section |
| `listing.location` | Shows map section |
| `distance !== null` | Shows distance from user |
| `showDeleteConfirm` | Shows delete confirmation modal |

## 6. Key Conditions in PriceCard.tsx

| Condition | What it controls |
|---|---|
| `!listing.price \|\| listing.price <= 0` | Shows "Contact for Price" |
| `listing.type === 'service' && listing.serviceData?.priceTo` | Shows price range (from-to) |
| Otherwise | Shows single price |
| `listing.negotiable` | Shows negotiable badge |
| `isOwner && editRoute` | Shows edit+delete buttons |
| `hasPhone && onCall` | Shows call button |
| `hasWhatsApp` | Shows WhatsApp button |
| `seller.image` | Shows avatar image vs initial letter |
| `seller.verified` | Shows verified badge |
| `seller.listingCount !== undefined` | Shows listing count |

## 7. Key Conditions in ContractDetails.tsx

| Condition | What it controls |
|---|---|
| `listing.type !== 'bus' \|\| !listing.busData?.contractType` | Returns null (hides entire component) |
| All contract fields use fallback `notSpecified` | Shows "—" for missing values |

## 8. Redirect Logic in useUnifiedListing.ts

| Type | Condition | Redirect Target |
|---|---|---|
| car | `listingType === 'RENTAL'` | `/rental/car/{id}` |
| bus | `busListingType === 'BUS_RENT'` | `/rental/bus/{id}` |
| equipment | `listingType === 'EQUIPMENT_RENT'` | `/rental/equipment/{id}` |

---

*Full code for SalePageShell.tsx, useUnifiedListing.ts, and specs.config.ts are too large for a single file. See the source files directly.*
