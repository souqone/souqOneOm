# Audit: Rental Display Pages

## 1. `src/app/[locale]/rental/[type]/[id]/page.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\app\[locale]\rental\[type]\[id]\page.tsx`

### Conditions:
- `if (!apiPath)` → returns fallback metadata
- `try...catch` → on API failure returns fallback metadata

```tsx
import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-fetch';
import { getImageUrl } from '@/lib/image-utils';
import RentalDetailClient from './rental-detail-client';

const API_PATHS: Record<string, string> = {
  car: '/listings',
  bus: '/buses',
  equipment: '/equipment',
};

const TYPE_LABELS: Record<string, string> = {
  car: 'سيارة للإيجار',
  bus: 'باص للإيجار',
  equipment: 'معدات للإيجار',
};

interface OgData {
  title?: string;
  description?: string;
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  price?: number;
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

    const title = data.title || TYPE_LABELS[type] || 'إعلان إيجار';
    const priceVal = data.dailyPrice || data.weeklyPrice || data.monthlyPrice || data.price;
    const price = priceVal ? `${Number(priceVal).toLocaleString()} ${data.currency || 'OMR'}` : '';
    const location = data.governorate || '';
    const descParts = [price, location, TYPE_LABELS[type]].filter(Boolean);
    const description = descParts.join(' · ') || title;
    const image = getPrimaryImage(data.images);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://souqone.com';
    const pageUrl = `${appUrl}/${locale}/rental/${type}/${id}`;

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
    return { title: `${TYPE_LABELS[type] || 'إعلان إيجار'} | سوق ون` };
  }
}

export default function RentalPage() {
  return <RentalDetailClient />;
}
```

---

## 2. `src/app/[locale]/rental/[type]/[id]/rental-detail-client.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\app\[locale]\rental\[type]\[id]\rental-detail-client.tsx`

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
import {
  useUnifiedRentalListing,
  useUnifiedAvailability,
  useUnifiedBooking,
  getRentalConfig,
  RentalPageShell,
} from '@/features/rental';
import type { RentalEntityType } from '@/features/rental';
import { useTranslations } from 'next-intl';
import { useEnumTranslations } from '@/lib/enum-translations';

const VALID_TYPES: RentalEntityType[] = ['car', 'bus', 'equipment'];

function RentalPageSkeleton() {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-28 lg:pb-16 animate-pulse">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-5" />
        <div className="h-7 w-96 bg-surface-container-high rounded mb-3" />
        <div className="h-4 w-64 bg-surface-container-high rounded mb-6" />
        <div className="grid gap-1 rounded-2xl overflow-hidden mb-8"
          style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '185px 185px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`bg-surface-container-high ${i === 0 ? 'row-span-2' : ''}`} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
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
          </div>
          <div className="h-[500px] bg-surface-container-high rounded-2xl" />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function RentalDetailClient() {
  const params = useParams<{ type: string; id: string }>();
  const { type: typeParam, id } = params;

  if (!VALID_TYPES.includes(typeParam as RentalEntityType)) {
    notFound();
  }
  const type = typeParam as RentalEntityType;

  const router = useRouter();
  const tr = useTranslations('rental');
  const enumT = useEnumTranslations();

  const { listing, isLoading, isError, error, refetch, redirectTo } = useUnifiedRentalListing(type, id);
  const { unavailableDates } = useUnifiedAvailability(type, id);
  const { book, isPending: isBookingPending } = useUnifiedBooking(type);

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isLoading || redirectTo) {
    return <RentalPageSkeleton />;
  }

  if (isError || !listing) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-28">
          <main className="max-w-5xl mx-auto px-4 md:px-8">
            <ErrorState onRetry={() => refetch()} message={error?.message || tr('notFound')} />
          </main>
        </div>
        <Footer />
      </>
    );
  }

  const config = getRentalConfig(tr, enumT)[type];

  return (
    <>
      <Navbar />
      <RentalPageShell
        listing={listing}
        config={config}
        unavailableDates={unavailableDates}
        onBook={book}
        isBookingPending={isBookingPending}
      />
      <Footer />
    </>
  );
}
```

---

## 3. `src/features/rental/types/unified-rental.types.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\types\unified-rental.types.ts`

```ts
export type RentalEntityType = 'car' | 'bus' | 'equipment';

export interface UnifiedRentalSeller {
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

export interface RentalCarData {
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

export interface RentalBusData {
  busType?: string;
  capacity?: number;
  brand?: string;
  year?: number;
  features?: string[];
  plateNumber?: string;
}

export interface RentalEquipmentData {
  category?: string;
  brand?: string;
  model?: string;
  year?: number;
  hoursUsed?: number;
  features?: string[];
}

export interface UnifiedRentalListing {
  id: string;
  type: RentalEntityType;
  title: string;
  description?: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency: string;
  condition: string;
  governorate: string;
  city?: string;
  images: string[];
  seller: UnifiedRentalSeller;
  location?: { lat: number; lng: number };
  views: number;
  createdAt: string;
  status: string;
  listingType: string;
  availableFrom?: string;
  availableTo?: string;
  minRentalDays?: number;
  depositRequired?: boolean;
  depositAmount?: number;
  deliveryAvailable?: boolean;
  insuranceIncluded?: boolean;
  driverIncluded?: boolean;
  carData?: RentalCarData;
  busData?: RentalBusData;
  equipmentData?: RentalEquipmentData;
}

export const BOOKING_ENTITY_TYPE: Record<RentalEntityType, string> = {
  car: 'LISTING',
  bus: 'BUS_LISTING',
  equipment: 'EQUIPMENT_LISTING',
};
```

---

## 4. `src/features/rental/types/config.types.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\types\config.types.ts`

```ts
import type { SpecField } from '@/features/sale/types/config.types';
import type { UnifiedRentalListing, RentalEntityType } from './unified-rental.types';

export type RentalSpecField = SpecField;

export interface RentalHighlightField {
  icon: string;
  getTitle: (data: UnifiedRentalListing) => string;
  getSub: (data: UnifiedRentalListing) => string;
  condition?: (data: UnifiedRentalListing) => boolean;
}

export type RentalBadgeColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal';

export interface RentalSectionConfig {
  type: RentalEntityType;
  displayName: string;
  icon: string;
  specsFields: RentalSpecField[];
  tableFields: RentalSpecField[];
  highlightFields: RentalHighlightField[];
  badgeColor: RentalBadgeColor;
}
```

---

## 5. `src/features/rental/hooks/useUnifiedRentalListing.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\hooks\useUnifiedRentalListing.ts`

### Conditions:
- `isRentalListing(type, raw)` checks if listing is truly a rental
- `getSaleRedirect(type, raw)` returns redirect URL if it's actually a sale listing
- Type-specific transform: `transformToUnifiedRental` switches on `type`

```ts
'use client';

import { useMemo } from 'react';
import { useListing } from '@/lib/api/listings';
import { useBusListing } from '@/lib/api/buses';
import { useEquipmentListing } from '@/lib/api/equipment';
import type { ListingItem } from '@/lib/api/listings';
import type { BusListingItem } from '@/lib/api/buses';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import { getImageUrl } from '@/lib/image-utils';
import type {
  RentalEntityType,
  UnifiedRentalListing,
  UnifiedRentalSeller,
  RentalCarData,
  RentalBusData,
  RentalEquipmentData,
} from '../types/unified-rental.types';

function isValidPrice(value: unknown): value is number {
  if (typeof value === 'number') return !Number.isNaN(value) && value >= 0;
  if (typeof value === 'string') {
    const num = Number(value);
    return !Number.isNaN(num) && num >= 0;
  }
  return false;
}

function parsePrice(value: unknown): number {
  if (!isValidPrice(value)) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function normalizeSeller(
  seller: unknown,
  fallbackGovernorate: string | null | undefined,
  contactOverride?: { phone?: string | null; whatsapp?: string | null },
): UnifiedRentalSeller {
  const s = seller as Record<string, unknown> | undefined | null;
  const governorate = (s?.governorate as string) || fallbackGovernorate || '';
  const name = (s?.displayName as string) || (s?.username as string) || 'مستخدم';
  const createdAt = s?.createdAt as string | undefined;
  const phone = contactOverride?.phone || (s?.phone as string) || undefined;
  const whatsapp = contactOverride?.whatsapp || contactOverride?.phone || (s?.whatsapp as string) || (s?.phone as string) || undefined;

  const countObj = s?._count as Record<string, number> | undefined;
  const listingCount = countObj?.listings ?? countObj?.listing ?? (s?.listingCount as number) ?? undefined;

  return {
    id: (s?.id as string) || '',
    name,
    image: (s?.avatarUrl as string) || undefined,
    phone: phone || undefined,
    whatsapp: whatsapp || undefined,
    governorate,
    verified: Boolean(s?.isVerified),
    memberSince: createdAt || new Date().toISOString(),
    listingCount,
  };
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img === 'string') return getImageUrl(img) || '';
      if (img && typeof img === 'object') {
        const url = (img as Record<string, unknown>).url;
        return getImageUrl(url as string) || '';
      }
      return '';
    })
    .filter((url): url is string => url.length > 0);
}

function isRentalListing(type: RentalEntityType, raw: unknown): boolean {
  if (type === 'car') {
    return (raw as ListingItem).listingType === 'RENTAL';
  }
  if (type === 'bus') {
    return (raw as BusListingItem).busListingType === 'BUS_RENT';
  }
  if (type === 'equipment') {
    return (raw as EquipmentListingItem).listingType === 'EQUIPMENT_RENT';
  }
  return false;
}

function getSaleRedirect(type: RentalEntityType, raw: unknown): string | null {
  if (type === 'car') {
    const item = raw as ListingItem;
    if (item.listingType !== 'RENTAL') return `/sale/car/${item.id}`;
  }
  if (type === 'bus') {
    const item = raw as BusListingItem;
    if (item.busListingType !== 'BUS_RENT') return `/sale/bus/${item.id}`;
  }
  if (type === 'equipment') {
    const item = raw as EquipmentListingItem;
    if (item.listingType !== 'EQUIPMENT_RENT') return `/sale/equipment/${item.id}`;
  }
  return null;
}

function transformCarRental(raw: ListingItem): UnifiedRentalListing {
  const carData: RentalCarData = {
    brand: raw.make,
    model: raw.model,
    year: raw.year,
    mileage: raw.mileage ?? undefined,
    fuelType: raw.fuelType ?? undefined,
    transmission: raw.transmission ?? undefined,
    bodyType: raw.bodyType ?? undefined,
    exteriorColor: raw.exteriorColor ?? undefined,
    interiorColor: raw.interior ?? undefined,
    engine: raw.engineSize ?? undefined,
    horsepower: raw.horsepower ?? undefined,
    doors: raw.doors ?? undefined,
    seats: raw.seats ?? undefined,
    driveType: raw.driveType ?? undefined,
    features: raw.features.length > 0 ? raw.features : undefined,
  };

  const seller = normalizeSeller(raw.seller, raw.governorate);
  const images = normalizeImages(raw.images);

  return {
    id: raw.id,
    type: 'car',
    title: raw.title,
    description: raw.description,
    dailyPrice: parsePrice(raw.rentalDailyPrice ?? raw.price),
    weeklyPrice: raw.rentalWeeklyPrice ? parsePrice(raw.rentalWeeklyPrice) : undefined,
    monthlyPrice: raw.rentalMonthlyPrice ? parsePrice(raw.rentalMonthlyPrice) : undefined,
    currency: raw.currency,
    condition: raw.condition || '',
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude != null && raw.longitude != null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: 'RENTAL',
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    minRentalDays: raw.minRentalDays ?? undefined,
    depositRequired: raw.depositRequired ?? undefined,
    depositAmount: raw.depositAmount ? parsePrice(raw.depositAmount) : undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    driverIncluded: raw.driverIncluded ?? undefined,
    carData,
  };
}

function transformBusRental(raw: BusListingItem): UnifiedRentalListing {
  const busData: RentalBusData = {
    busType: raw.busType,
    capacity: raw.capacity,
    brand: raw.make,
    year: raw.year,
    features: raw.features.length > 0 ? raw.features : undefined,
    plateNumber: raw.plateNumber ?? undefined,
  };

  const seller = normalizeSeller(raw.user, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp });
  const images = normalizeImages(raw.images);

  return {
    id: raw.id,
    type: 'bus',
    title: raw.title,
    description: raw.description,
    dailyPrice: parsePrice(raw.rentalDailyPrice ?? raw.price),
    weeklyPrice: raw.rentalWeeklyPrice ? parsePrice(raw.rentalWeeklyPrice) : undefined,
    monthlyPrice: raw.rentalMonthlyPrice ? parsePrice(raw.rentalMonthlyPrice) : undefined,
    currency: raw.currency,
    condition: raw.condition,
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude != null && raw.longitude != null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: 'BUS_RENT',
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    minRentalDays: raw.minRentalDays ?? undefined,
    depositRequired: raw.depositRequired ?? undefined,
    depositAmount: raw.depositAmount ? parsePrice(raw.depositAmount) : undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    driverIncluded: raw.driverIncluded ?? undefined,
    busData,
  };
}

function transformEquipmentRental(raw: EquipmentListingItem): UnifiedRentalListing {
  const equipmentData: RentalEquipmentData = {
    category: raw.equipmentType,
    brand: raw.make,
    model: raw.model,
    year: raw.year,
    hoursUsed: raw.hoursUsed ?? undefined,
    features: raw.features.length > 0 ? raw.features : undefined,
  };

  const seller = normalizeSeller(raw.user, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp });
  const images = normalizeImages(raw.images);

  return {
    id: raw.id,
    type: 'equipment',
    title: raw.title,
    description: raw.description,
    dailyPrice: parsePrice(raw.rentalDailyPrice ?? raw.price),
    weeklyPrice: raw.rentalWeeklyPrice ? parsePrice(raw.rentalWeeklyPrice) : undefined,
    monthlyPrice: raw.rentalMonthlyPrice ? parsePrice(raw.rentalMonthlyPrice) : undefined,
    currency: raw.currency,
    condition: raw.condition,
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude != null && raw.longitude != null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: 'EQUIPMENT_RENT',
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    minRentalDays: raw.minRentalDays ?? undefined,
    depositRequired: raw.depositRequired ?? undefined,
    depositAmount: raw.depositAmount ? parsePrice(raw.depositAmount) : undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    driverIncluded: raw.driverIncluded ?? undefined,
    equipmentData,
  };
}

function transformToUnifiedRental(type: RentalEntityType, raw: unknown): UnifiedRentalListing | null {
  if (!raw) return null;
  try {
    switch (type) {
      case 'car':
        return transformCarRental(raw as ListingItem);
      case 'bus':
        return transformBusRental(raw as BusListingItem);
      case 'equipment':
        return transformEquipmentRental(raw as EquipmentListingItem);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to transform ${type} rental:`, error);
    return null;
  }
}

export function useUnifiedRentalListing(type: RentalEntityType, id: string) {
  const carQuery = useListing(type === 'car' ? id : '');
  const busQuery = useBusListing(type === 'bus' ? id : '');
  const equipmentQuery = useEquipmentListing(type === 'equipment' ? id : '');

  const rawData = useMemo<unknown>(() => {
    switch (type) {
      case 'car': return carQuery.data;
      case 'bus': return busQuery.data;
      case 'equipment': return equipmentQuery.data;
      default: return null;
    }
  }, [type, carQuery.data, busQuery.data, equipmentQuery.data]);

  const isLoading = useMemo<boolean>(() => {
    switch (type) {
      case 'car': return carQuery.isLoading;
      case 'bus': return busQuery.isLoading;
      case 'equipment': return equipmentQuery.isLoading;
      default: return false;
    }
  }, [type, carQuery.isLoading, busQuery.isLoading, equipmentQuery.isLoading]);

  const error = useMemo<Error | null>(() => {
    const e = { car: carQuery.error, bus: busQuery.error, equipment: equipmentQuery.error }[type] || null;
    return e instanceof Error ? e : null;
  }, [type, carQuery.error, busQuery.error, equipmentQuery.error]);

  const isError = error !== null;

  const listing = useMemo<UnifiedRentalListing | null>(() => {
    if (!rawData) return null;
    if (!isRentalListing(type, rawData)) return null;
    return transformToUnifiedRental(type, rawData);
  }, [type, rawData]);

  const redirectTo = useMemo<string | null>(() => {
    if (!rawData) return null;
    return getSaleRedirect(type, rawData);
  }, [type, rawData]);

  const refetch = useMemo<() => void>(() => {
    return () => {
      switch (type) {
        case 'car': void carQuery.refetch(); break;
        case 'bus': void busQuery.refetch(); break;
        case 'equipment': void equipmentQuery.refetch(); break;
      }
    };
  }, [type, carQuery.refetch, busQuery.refetch, equipmentQuery.refetch]);

  return { listing, isLoading, isError, error, refetch, redirectTo };
}
```

---

## 6. `src/features/rental/hooks/useUnifiedAvailability.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\hooks\useUnifiedAvailability.ts`

```ts
import { useMemo } from 'react';
import { useBookingAvailability } from '@/lib/api/bookings';
import { BOOKING_ENTITY_TYPE } from '../types/unified-rental.types';
import type { RentalEntityType } from '../types/unified-rental.types';

export function useUnifiedAvailability(type: RentalEntityType, entityId: string) {
  const bookingType = BOOKING_ENTITY_TYPE[type];
  const { data, isLoading, error } = useBookingAvailability(bookingType, entityId);

  const unavailableDates = useMemo<string[]>(() => {
    if (!data || !Array.isArray(data)) return [];
    const dates: string[] = [];
    for (const range of data) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      const current = new Date(start);
      while (current <= end) {
        dates.push(
          `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
        );
        current.setDate(current.getDate() + 1);
      }
    }
    return dates;
  }, [data]);

  return { unavailableDates, isLoading, error };
}
```

---

## 7. `src/features/rental/hooks/useUnifiedBooking.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\hooks\useUnifiedBooking.ts`

```ts
import { useCreateBooking } from '@/lib/api/bookings';
import { BOOKING_ENTITY_TYPE } from '../types/unified-rental.types';
import type { RentalEntityType } from '../types/unified-rental.types';

export function useUnifiedBooking(type: RentalEntityType) {
  const bookingType = BOOKING_ENTITY_TYPE[type];
  const mutation = useCreateBooking();

  const book = async (id: string, startDate: string, endDate: string) => {
    return mutation.mutateAsync({
      entityType: bookingType,
      entityId: id,
      startDate,
      endDate,
    });
  };

  return { book, isPending: mutation.isPending, isError: mutation.isError, error: mutation.error };
}
```

---

## 8. `src/features/rental/hooks/useRentalAvailability.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\hooks\useRentalAvailability.ts`

```ts
import { useBookingAvailability } from '@/lib/api/bookings';
import { BOOKING_ENTITY_TYPE } from '../types/unified-rental.types';
import type { RentalEntityType } from '../types/unified-rental.types';

export function useRentalAvailability(type: RentalEntityType, entityId: string) {
  const bookingType = BOOKING_ENTITY_TYPE[type];
  return useBookingAvailability(bookingType, entityId);
}
```

---

## 9. `src/features/rental/config/rental.config.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\config\rental.config.ts`

### Conditions:
- Each `highlightField` has optional `condition` function
- `hideIfEmpty: true` on many fields

```ts
import type { RentalEntityType, UnifiedRentalListing } from '../types/unified-rental.types';
import type { RentalSectionConfig } from '../types/config.types';
import type { EnumTranslations } from '@/lib/enum-translations';

export function getNestedValue(obj: UnifiedRentalListing, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

export function getRentalConfig(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  enumT?: EnumTranslations
): Record<RentalEntityType, RentalSectionConfig> {
  return {
    car: {
      type: 'car',
      displayName: t('configCar'),
      icon: 'Car',
      specsFields: [
        { key: 'carData.year', label: t('specYear'), icon: 'Calendar', format: 'year' },
        { key: 'carData.mileage', label: t('specMileage'), icon: 'Gauge', format: 'km', unit: t('unitKm') },
        { key: 'carData.engine', label: t('specEngine'), icon: 'Cog', format: 'text', hideIfEmpty: true },
        { key: 'carData.transmission', label: t('specTransmission'), icon: 'Settings', format: 'enum', enumKey: 'transmission', hideIfEmpty: true },
      ],
      tableFields: [
        { key: 'carData.exteriorColor', label: t('specExteriorColor'), icon: 'Palette', hideIfEmpty: true },
        { key: 'carData.interiorColor', label: t('specInteriorColor'), icon: 'Palette', hideIfEmpty: true },
        { key: 'carData.fuelType', label: t('specFuelType'), icon: 'Fuel', format: 'enum', enumKey: 'fuelType', hideIfEmpty: true },
        { key: 'carData.bodyType', label: t('specBodyType'), icon: 'Car', format: 'enum', enumKey: 'bodyType', hideIfEmpty: true },
        { key: 'carData.driveType', label: t('specDriveType'), icon: 'Navigation', format: 'enum', enumKey: 'driveType', hideIfEmpty: true },
        { key: 'carData.doors', label: t('specDoors'), icon: 'DoorOpen', hideIfEmpty: true },
        { key: 'carData.seats', label: t('specSeats'), icon: 'Users', hideIfEmpty: true },
        { key: 'condition', label: t('specCondition'), icon: 'Star', format: 'enum', enumKey: 'condition' },
        { key: 'governorate', label: t('specGovernorate'), icon: 'MapPin' },
        { key: 'city', label: t('specCity'), icon: 'Building2', hideIfEmpty: true },
      ],
      highlightFields: [
        {
          icon: 'ShieldCheck',
          getTitle: (d) => t('highlightCondition', { condition: enumT?.condition?.[d.condition as keyof typeof enumT.condition] ?? d.condition }),
          getSub: (d) => (d.condition === 'NEW' ? t('highlightCarNew') : t('highlightCarUsed')),
        },
        {
          icon: 'Truck',
          getTitle: (d) => (d.deliveryAvailable ? t('highlightDeliveryAvail') : t('highlightNoDelivery')),
          getSub: (d) => (d.deliveryAvailable ? t('highlightDeliverySub') : t('highlightNoDeliverySub')),
        },
        {
          icon: 'Shield',
          getTitle: (d) => (d.insuranceIncluded ? t('highlightInsurance') : t('highlightNoInsurance')),
          getSub: (d) => (d.insuranceIncluded ? t('highlightInsuranceSub') : t('highlightNoInsuranceSub')),
        },
      ],
      badgeColor: 'blue',
    },

    bus: {
      type: 'bus',
      displayName: t('configBus'),
      icon: 'Bus',
      specsFields: [
        { key: 'busData.year', label: t('specYear'), icon: 'Calendar', format: 'year' },
        { key: 'busData.capacity', label: t('specCapacity'), icon: 'Users', format: 'number', unit: t('unitPassenger') },
        { key: 'busData.busType', label: t('specBusType'), icon: 'Bus', format: 'enum', enumKey: 'busType' },
        { key: 'busData.brand', label: t('specBrand'), icon: 'Tag', format: 'text' },
      ],
      tableFields: [
        { key: 'busData.brand', label: t('specBrand'), icon: 'Tag' },
        { key: 'busData.year', label: t('specYear'), icon: 'Calendar' },
        { key: 'busData.plateNumber', label: t('specPlateNumber'), icon: 'Hash', hideIfEmpty: true },
        { key: 'condition', label: t('specCondition'), icon: 'Star', format: 'enum', enumKey: 'condition' },
        { key: 'governorate', label: t('specGovernorate'), icon: 'MapPin' },
        { key: 'city', label: t('specCity'), icon: 'Building2', hideIfEmpty: true },
      ],
      highlightFields: [
        {
          icon: 'ShieldCheck',
          getTitle: (d) => t('highlightCondition', { condition: enumT?.condition?.[d.condition as keyof typeof enumT.condition] ?? d.condition }),
          getSub: () => t('highlightBusChecked'),
        },
        {
          icon: 'Truck',
          getTitle: (d) => (d.deliveryAvailable ? t('highlightDeliveryAvail') : t('highlightNoDelivery')),
          getSub: (d) => (d.deliveryAvailable ? t('highlightDeliverySub') : t('highlightNoDeliverySub')),
        },
        {
          icon: 'UserCheck',
          getTitle: (d) => (d.driverIncluded ? t('highlightDriverIncluded') : t('highlightNoDriver')),
          getSub: (d) => (d.driverIncluded ? t('highlightDriverSub') : t('highlightNoDriverSub')),
        },
      ],
      badgeColor: 'orange',
    },

    equipment: {
      type: 'equipment',
      displayName: t('configEquipment'),
      icon: 'Wrench',
      specsFields: [
        { key: 'equipmentData.year', label: t('specYear'), icon: 'Calendar', format: 'year', hideIfEmpty: true },
        { key: 'equipmentData.brand', label: t('specBrand'), icon: 'Tag', format: 'text', hideIfEmpty: true },
        { key: 'equipmentData.category', label: t('specCategory'), icon: 'Grid', format: 'enum', enumKey: 'equipmentType' },
        { key: 'condition', label: t('specCondition'), icon: 'Star', format: 'enum', enumKey: 'condition' },
      ],
      tableFields: [
        { key: 'equipmentData.brand', label: t('specBrand'), icon: 'Tag', hideIfEmpty: true },
        { key: 'equipmentData.model', label: t('specModel'), icon: 'Box', hideIfEmpty: true },
        { key: 'equipmentData.category', label: t('specCategory'), icon: 'Grid' },
        { key: 'equipmentData.hoursUsed', label: t('specHoursUsed'), icon: 'Clock', hideIfEmpty: true },
        { key: 'condition', label: t('specCondition'), icon: 'Star', format: 'enum', enumKey: 'condition' },
        { key: 'governorate', label: t('specGovernorate'), icon: 'MapPin' },
        { key: 'city', label: t('specCity'), icon: 'Building2', hideIfEmpty: true },
      ],
      highlightFields: [
        {
          icon: 'ShieldCheck',
          getTitle: (d) => t('highlightCondition', { condition: enumT?.condition?.[d.condition as keyof typeof enumT.condition] ?? d.condition }),
          getSub: (d) =>
            d.equipmentData?.hoursUsed
              ? t('highlightHoursUsed', { hours: d.equipmentData.hoursUsed })
              : t('highlightEquipmentUsed'),
        },
        {
          icon: 'Truck',
          getTitle: (d) => (d.deliveryAvailable ? t('highlightDeliveryAvail') : t('highlightNoDelivery')),
          getSub: (d) => (d.deliveryAvailable ? t('highlightDeliverySub') : t('highlightNoDeliverySub')),
        },
      ],
      badgeColor: 'teal',
    },
  };
}
```

---

## 10. `src/features/rental/components/RentalBookingCard.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\components\RentalBookingCard.tsx`

### Conditions:
- Renders `PricingTabs` only if pricing data exists
- Renders `RentalCalendar` with availability constraints
- "Book Now" button: disabled if no dates selected, if user is owner, or if booking pending
- Shows `PriceBreakdown` only when both dates selected

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useToast } from '@/components/toast';
import type { UnifiedRentalListing } from '../types/unified-rental.types';
import { RentalCalendar } from './RentalCalendar';
import { PricingTabs } from './PricingTabs';
import { PriceBreakdown } from './PriceBreakdown';
import { toYMD } from '../utils/date-helpers';

interface RentalBookingCardProps {
  listing: UnifiedRentalListing;
  unavailableDates: string[];
  onBook: (id: string, startDate: string, endDate: string) => Promise<unknown>;
  isBookingPending?: boolean;
}

export function RentalBookingCard({ listing, unavailableDates, onBook, isBookingPending }: RentalBookingCardProps) {
  const t = useTranslations('rental');
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const { addToast } = useToast();

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const isOwner = !!(user && listing.seller.id === user.id);

  const handleDateSelect = useCallback((date: Date) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
    } else {
      if (date > checkIn) {
        setCheckOut(date);
      } else {
        setCheckIn(date);
        setCheckOut(null);
      }
    }
  }, [checkIn, checkOut]);

  const handleBook = useCallback(async () => {
    if (!checkIn || !checkOut) return;
    requireAuth(async () => {
      try {
        await onBook(listing.id, toYMD(checkIn), toYMD(checkOut));
        addToast('success', t('bookingSuccess'));
        setCheckIn(null);
        setCheckOut(null);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : t('bookingError'));
      }
    }, t('loginToBook'));
  }, [checkIn, checkOut, listing.id, onBook, requireAuth, addToast, t]);

  return (
    <div className="hidden lg:block sticky top-5">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="h-[3px] w-full bg-primary" />
        <div className="p-5 flex flex-col gap-4">

          {/* Pricing Tabs */}
          <PricingTabs
            dailyPrice={listing.dailyPrice}
            weeklyPrice={listing.weeklyPrice}
            monthlyPrice={listing.monthlyPrice}
            currency={listing.currency}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Calendar */}
          <RentalCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            onDateSelect={handleDateSelect}
            unavailableDates={unavailableDates}
            availableFrom={listing.availableFrom}
            availableTo={listing.availableTo}
            minRentalDays={listing.minRentalDays}
          />

          {/* Price Breakdown */}
          {checkIn && checkOut && (
            <PriceBreakdown
              checkIn={checkIn}
              checkOut={checkOut}
              dailyPrice={listing.dailyPrice}
              weeklyPrice={listing.weeklyPrice}
              monthlyPrice={listing.monthlyPrice}
              currency={listing.currency}
              activeTab={activeTab}
            />
          )}

          {/* Deposit Info */}
          {listing.depositRequired && listing.depositAmount && (
            <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-sm">info</span>
              {t('depositRequired', { amount: listing.depositAmount, currency: listing.currency })}
            </div>
          )}

          {/* Book Button */}
          <button
            onClick={handleBook}
            disabled={!checkIn || !checkOut || isOwner || isBookingPending}
            className="w-full h-12 rounded-xl bg-primary text-on-primary text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isBookingPending ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : isOwner ? (
              t('cannotBookOwn')
            ) : !checkIn || !checkOut ? (
              t('selectDates')
            ) : (
              t('bookNow')
            )}
          </button>

          {/* Cancellation Policy */}
          <p className="text-[11px] text-on-surface-variant text-center">
            {t('cancellationPolicy')}
          </p>

        </div>
      </div>
    </div>
  );
}
```

---

## 11. `src/features/rental/components/RentalCalendar.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\components\RentalCalendar.tsx`

### Conditions:
- `isPast` — greys out past dates
- `isUnavailable` — marks booked dates
- `isBeforeAvailableFrom` / `isAfterAvailableTo` — range constraints
- `isBelowMinRental` — shows visual warning for dates below min rental days
- Hover state for range preview

*(Full 273-line file — see source directly)*

---

## 12. `src/features/rental/components/PricingTabs.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\components\PricingTabs.tsx`

### Conditions:
- Only renders tabs for prices that exist (`dailyPrice`, `weeklyPrice`, `monthlyPrice`)
- If only one price exists, shows it directly without tabs

```tsx
'use client';

import { useTranslations } from 'next-intl';

interface PricingTabsProps {
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency: string;
  activeTab: 'daily' | 'weekly' | 'monthly';
  onTabChange: (tab: 'daily' | 'weekly' | 'monthly') => void;
}

export function PricingTabs({
  dailyPrice,
  weeklyPrice,
  monthlyPrice,
  currency,
  activeTab,
  onTabChange,
}: PricingTabsProps) {
  const t = useTranslations('rental');

  const tabs = [
    { key: 'daily' as const, price: dailyPrice, label: t('daily') },
    ...(weeklyPrice ? [{ key: 'weekly' as const, price: weeklyPrice, label: t('weekly') }] : []),
    ...(monthlyPrice ? [{ key: 'monthly' as const, price: monthlyPrice, label: t('monthly') }] : []),
  ];

  if (tabs.length === 1) {
    return (
      <div className="text-center py-2">
        <span className="text-[28px] font-bold text-red-600" dir="ltr">
          {dailyPrice.toLocaleString('en-US')}
        </span>
        <span className="text-[13px] text-on-surface-variant ms-1.5">{currency}</span>
        <span className="text-[12px] text-on-surface-variant ms-1">/ {t('perDay')}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex rounded-xl bg-surface-container-high/50 p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="text-center py-3">
        <span className="text-[28px] font-bold text-red-600" dir="ltr">
          {(tabs.find((t) => t.key === activeTab)?.price ?? dailyPrice).toLocaleString('en-US')}
        </span>
        <span className="text-[13px] text-on-surface-variant ms-1.5">{currency}</span>
        <span className="text-[12px] text-on-surface-variant ms-1">
          / {activeTab === 'monthly' ? t('perMonth') : activeTab === 'weekly' ? t('perWeek') : t('perDay')}
        </span>
      </div>
    </div>
  );
}
```

---

## 13. `src/features/rental/components/PriceBreakdown.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\components\PriceBreakdown.tsx`

### Conditions:
- Only renders if `nights > 0` and `subtotal > 0`
- Calculation prioritizes weekly/monthly prices when applicable

```tsx
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { diffDays } from '../utils/date-helpers';

interface PriceBreakdownProps {
  checkIn: Date;
  checkOut: Date;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency: string;
  activeTab: 'daily' | 'weekly' | 'monthly';
}

export function PriceBreakdown({
  checkIn,
  checkOut,
  dailyPrice,
  weeklyPrice,
  monthlyPrice,
  currency,
  activeTab,
}: PriceBreakdownProps) {
  const t = useTranslations('rental');

  const { subtotal, breakdown } = useMemo(() => {
    const nights = diffDays(checkIn, checkOut);
    if (nights <= 0) return { subtotal: 0, breakdown: '' };

    if (activeTab === 'monthly' && monthlyPrice) {
      const months = Math.ceil(nights / 30);
      return { subtotal: months * monthlyPrice, breakdown: `${t('monthlyPrice')} x ${months} ${t('months')}` };
    }
    if (activeTab === 'weekly' && weeklyPrice) {
      const weeks = Math.ceil(nights / 7);
      return { subtotal: weeks * weeklyPrice, breakdown: `${t('weeklyPrice')} x ${weeks} ${t('weeks')}` };
    }
    return { subtotal: nights * dailyPrice, breakdown: `${t('dailyPrice')} x ${nights} ${t('days')}` };
  }, [checkIn, checkOut, dailyPrice, weeklyPrice, monthlyPrice, activeTab, t]);

  if (subtotal <= 0) return null;

  return (
    <div className="border-t border-outline-variant/20 pt-3 space-y-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-on-surface-variant">{breakdown}</span>
        <span className="font-medium text-on-surface" dir="ltr">
          {subtotal.toLocaleString('en-US')} {currency}
        </span>
      </div>
      <div className="flex items-center justify-between text-[14px] font-bold border-t border-outline-variant/20 pt-2">
        <span className="text-on-surface">{t('total')}</span>
        <span className="text-red-600" dir="ltr">
          {subtotal.toLocaleString('en-US')} {currency}
        </span>
      </div>
    </div>
  );
}
```

---

## 14. `src/features/rental/components/SimilarRentals.tsx`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\components\SimilarRentals.tsx`

### Conditions:
- Fetches based on `RentalEntityType` (car/bus/equipment)
- Filters out current listing
- Prioritizes same governorate
- Hides entirely if no similar items

*(Full 150-line file — see source directly)*

---

## 15. `src/features/rental/utils/date-helpers.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\utils\date-helpers.ts`

```ts
export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const DAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDate(d: Date): string {
  return `${d.getDate()} / ${d.getMonth() + 1} / ${d.getFullYear()}`;
}

export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}
```

---

## 16. `src/features/rental/index.ts`
**Path:** `c:\Users\DELL\Desktop\m\apps\web\src\features\rental\index.ts`

```ts
// Types
export type {
  RentalEntityType,
  UnifiedRentalListing,
  UnifiedRentalSeller,
  RentalCarData,
  RentalBusData,
  RentalEquipmentData,
} from './types/unified-rental.types';
export { BOOKING_ENTITY_TYPE } from './types/unified-rental.types';

export type {
  RentalSpecField,
  RentalHighlightField,
  RentalBadgeColor,
  RentalSectionConfig,
} from './types/config.types';

// Config
export { getRentalConfig, getNestedValue } from './config/rental.config';

// Hooks
export { useUnifiedRentalListing } from './hooks/useUnifiedRentalListing';
export { useRentalAvailability } from './hooks/useRentalAvailability';
export { useUnifiedAvailability } from './hooks/useUnifiedAvailability';
export { useUnifiedBooking } from './hooks/useUnifiedBooking';

// Components
export { RentalCalendar } from './components/RentalCalendar';
export { RentalBookingCard } from './components/RentalBookingCard';
export { PricingTabs } from './components/PricingTabs';
export { PriceBreakdown } from './components/PriceBreakdown';
export { RentalPageShell } from './components/RentalPageShell';
```

---

## Key Conditions Summary — RentalPageShell.tsx (754 lines)

| Condition | What it controls |
|---|---|
| `listing.images.length > 0` | Shows photo gallery |
| `listing.city \|\| listing.governorate` | Shows location in title section |
| `listing.status not in ['ACTIVE','AVAILABLE']` | Shows status banner |
| `isOwner` | Shows edit/delete vs contact/book buttons |
| `listing.seller.phone` | Enables call button |
| `listing.seller.whatsapp` | Enables WhatsApp button |
| `listing.description` | Shows description section |
| `config.specsFields?.length > 0` | Shows specs grid |
| `config.highlightFields?.length > 0` | Shows highlights |
| `config.tableFields?.length > 0` | Shows details table |
| `features.length > 0` | Shows features section |
| `listing.minRentalDays` | Shows minimum rental days info |
| `listing.depositRequired && listing.depositAmount` | Shows deposit info |
| `listing.deliveryAvailable` | Shows delivery badge |
| `listing.insuranceIncluded` | Shows insurance badge |
| `listing.driverIncluded` | Shows driver badge |
| `reviewSummary exists and has reviews` | Shows ratings section |
| `listing.location` | Shows map section |
| `checkIn && checkOut` | Shows price breakdown |

## Redirect Logic — useUnifiedRentalListing.ts

| Type | Condition | Redirect Target |
|---|---|---|
| car | `listingType !== 'RENTAL'` | `/sale/car/{id}` |
| bus | `busListingType !== 'BUS_RENT'` | `/sale/bus/{id}` |
| equipment | `listingType !== 'EQUIPMENT_RENT'` | `/sale/equipment/{id}` |
