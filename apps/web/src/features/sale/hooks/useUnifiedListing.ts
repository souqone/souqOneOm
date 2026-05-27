/**
 * Unified data hook for the sale detail page.
 * Aggregates 5 different API hooks and normalizes their responses.
 */

'use client';

import { useMemo } from 'react';
import { useListing } from '@/lib/api/listings';
import { useBusListing } from '@/lib/api/buses';
import { useEquipmentListing } from '@/lib/api/equipment';
import { usePart } from '@/lib/api/parts';
import { useCarService } from '@/lib/api/services';
import type { ListingItem } from '@/lib/api/listings';
import type { BusListingItem } from '@/lib/api/buses';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import type { SparePartItem } from '@/lib/api/parts';
import type { CarServiceItem } from '@/lib/api/services';
import {
  isValidPrice,
  parsePriceRequired as parsePrice,
  normalizeImages,
  normalizeSeller,
} from '@/features/shared/utils/listing-normalizers';
import type {
  SaleEntityType,
  UnifiedListing,
  CarSpecificData,
  BusSpecificData,
  EquipmentSpecificData,
  PartSpecificData,
  ServiceSpecificData,
  UseUnifiedListingResult,
} from '../types/unified.types';

/** Transform car listing API response to UnifiedListing */
function transformCar(raw: ListingItem): UnifiedListing {
  const carData: CarSpecificData = {
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
    price: parsePrice(raw.listingType === 'RENTAL'
      ? (raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
      : raw.price),
    priceLabel: raw.listingType === 'RENTAL'
      ? (raw.dailyPrice ? 'يوم' : raw.monthlyPrice ? 'شهر' : undefined)
      : undefined,
    currency: raw.currency,
    negotiable: raw.isPriceNegotiable,
    condition: raw.condition || '',
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    isPremium: (raw as any).isPremium ?? false,
    images,
    seller,
    location:
      raw.latitude !== undefined && raw.latitude !== null && raw.longitude !== undefined && raw.longitude !== null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: raw.listingType || 'SALE',
    carData,
  };
}

/** Transform bus listing API response to UnifiedListing */
function transformBus(raw: BusListingItem): UnifiedListing {
  const busData: BusSpecificData = {
    busType: raw.busType,
    capacity: raw.capacity,
    contractType: raw.contractType,
    contractClient: raw.contractClient ?? undefined,
    contractMonthly: raw.contractMonthly ?? undefined,
    contractDuration: raw.contractDuration ?? undefined,
    contractExpiry: raw.contractExpiry ?? undefined,
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
    price: parsePrice(raw.busListingType === 'BUS_RENT'
      ? (raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
      : raw.price),
    priceLabel: raw.busListingType === 'BUS_RENT'
      ? (raw.dailyPrice ? 'يوم' : raw.monthlyPrice ? 'شهر' : undefined)
      : undefined,
    currency: raw.currency,
    negotiable: raw.isPriceNegotiable,
    condition: raw.condition,
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude !== undefined && raw.latitude !== null && raw.longitude !== undefined && raw.longitude !== null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: raw.busListingType,
    busData,
  };
}

/** Transform equipment listing API response to UnifiedListing */
function transformEquipment(raw: EquipmentListingItem): UnifiedListing {
  const equipmentData: EquipmentSpecificData = {
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
    price: parsePrice(raw.listingType === 'EQUIPMENT_RENT'
      ? (raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
      : raw.listingType === 'EQUIPMENT_WANTED'
      ? (raw.budgetMin ?? raw.budgetMax ?? raw.price)
      : raw.price),
    priceLabel: raw.listingType === 'EQUIPMENT_RENT'
      ? (raw.dailyPrice ? 'يوم' : raw.monthlyPrice ? 'شهر' : undefined)
      : raw.listingType === 'EQUIPMENT_WANTED'
      ? ((raw.budgetMin || raw.budgetMax) ? 'ميزانية' : undefined)
      : undefined,
    currency: raw.currency,
    negotiable: raw.isPriceNegotiable,
    condition: raw.condition,
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude !== undefined && raw.latitude !== null && raw.longitude !== undefined && raw.longitude !== null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: raw.listingType,
    equipmentData,
  };
}

/** Transform spare part API response to UnifiedListing */
function transformPart(raw: SparePartItem): UnifiedListing {
  const partData: PartSpecificData = {
    partNumber: raw.partNumber,
    category: raw.partCategory,
    compatibility: raw.compatibleMakes.length > 0 ? raw.compatibleMakes : undefined,
    compatibleModels: raw.compatibleModels.length > 0 ? raw.compatibleModels : undefined,
    yearRange: raw.yearFrom && raw.yearTo ? `${raw.yearFrom} - ${raw.yearTo}` : raw.yearFrom ? `${raw.yearFrom}+` : undefined,
    isOriginal: raw.isOriginal,
    condition: raw.condition,
  };

  const seller = normalizeSeller(raw.seller, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp });
  const images = normalizeImages(raw.images);

  return {
    id: raw.id,
    type: 'part',
    title: raw.title,
    description: raw.description,
    price: parsePrice(raw.price),
    currency: raw.currency,
    negotiable: raw.isPriceNegotiable,
    condition: raw.condition,
    governorate: raw.governorate || '',
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude !== undefined && raw.latitude !== null && raw.longitude !== undefined && raw.longitude !== null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: 'PART', // Parts don't have a listingType enum
    partData,
  };
}

/** Transform car service API response to UnifiedListing */
function transformService(raw: CarServiceItem): UnifiedListing {
  const serviceData: ServiceSpecificData = {
    serviceType: raw.serviceType,
    providerType: raw.providerType,
    homeService: raw.isHomeService,
    workingHours: raw.workingHoursOpen && raw.workingHoursClose
      ? `${raw.workingHoursOpen} - ${raw.workingHoursClose}`
      : undefined,
    features: raw.specializations.length > 0 ? raw.specializations : undefined,
    priceTo: raw.priceTo ? parsePrice(raw.priceTo) : undefined,
    providerName: raw.providerName ?? undefined,
    workingDays: raw.workingDays?.length > 0 ? raw.workingDays : undefined,
    address: raw.address ?? undefined,
    website: raw.website ?? undefined,
  };

  const seller = normalizeSeller(raw.user, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp });
  const images = normalizeImages(raw.images);

  // For services, use priceFrom as the base price (or average of priceFrom and priceTo if both exist)
  let price = 0;
  if (isValidPrice(raw.priceFrom)) {
    price = parsePrice(raw.priceFrom);
  }

  return {
    id: raw.id,
    type: 'service',
    title: raw.title,
    description: raw.description,
    price,
    currency: raw.currency,
    negotiable: true, // Services are generally negotiable
    condition: raw.status === 'ACTIVE' ? 'AVAILABLE' : 'UNAVAILABLE',
    governorate: raw.governorate,
    city: raw.city ?? undefined,
    images,
    seller,
    location:
      raw.latitude !== undefined && raw.latitude !== null && raw.longitude !== undefined && raw.longitude !== null
        ? { lat: raw.latitude, lng: raw.longitude }
        : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    listingType: 'SERVICE', // Services don't have a listingType enum
    serviceData,
  };
}

/** Determine if a listing should redirect to a different page */
function getRedirectTarget(type: SaleEntityType, raw: unknown): string | null {
  if (type === 'car') {
    const item = raw as ListingItem;
    if (item.listingType === 'RENTAL') {
      return `/rental/car/${item.id}`;
    }
  }
  if (type === 'bus') {
    const item = raw as BusListingItem;
    if (item.busListingType === 'BUS_RENT') {
      return `/rental/bus/${item.id}`;
    }
  }
  if (type === 'equipment') {
    const item = raw as EquipmentListingItem;
    if (item.listingType === 'EQUIPMENT_RENT') {
      return `/rental/equipment/${item.id}`;
    }
  }
  return null;
}

/** Main dispatcher: transform raw API response to UnifiedListing */
function transformToUnified(
  type: SaleEntityType,
  raw: unknown,
): UnifiedListing | null {
  if (!raw) return null;

  try {
    switch (type) {
      case 'car':
        return transformCar(raw as ListingItem);
      case 'bus':
        return transformBus(raw as BusListingItem);
      case 'equipment':
        return transformEquipment(raw as EquipmentListingItem);
      case 'part':
        return transformPart(raw as SparePartItem);
      case 'service':
        return transformService(raw as CarServiceItem);
      default:
        return null;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to transform ${type} listing:`, error);
    return null;
  }
}

/**
 * Unified hook that aggregates 5 different listing APIs.
 * Uses empty-string pattern to conditionally enable only the relevant query.
 */
export function useUnifiedListing(
  type: SaleEntityType,
  id: string,
): UseUnifiedListingResult {
  // Call all hooks with empty-string pattern (enabled: !!id will disable them)
  const carQuery = useListing(type === 'car' ? id : '');
  const busQuery = useBusListing(type === 'bus' ? id : '');
  const equipmentQuery = useEquipmentListing(type === 'equipment' ? id : '');
  const partQuery = usePart(type === 'part' ? id : '');
  const serviceQuery = useCarService(type === 'service' ? id : '');

  // Get the raw data for the active type
  const rawData = useMemo<unknown>(() => {
    switch (type) {
      case 'car':
        return carQuery.data;
      case 'bus':
        return busQuery.data;
      case 'equipment':
        return equipmentQuery.data;
      case 'part':
        return partQuery.data;
      case 'service':
        return serviceQuery.data;
      default:
        return null;
    }
  }, [type, carQuery.data, busQuery.data, equipmentQuery.data, partQuery.data, serviceQuery.data]);

  // Determine loading state
  const isLoading = useMemo<boolean>(() => {
    switch (type) {
      case 'car':
        return carQuery.isLoading;
      case 'bus':
        return busQuery.isLoading;
      case 'equipment':
        return equipmentQuery.isLoading;
      case 'part':
        return partQuery.isLoading;
      case 'service':
        return serviceQuery.isLoading;
      default:
        return false;
    }
  }, [type, carQuery.isLoading, busQuery.isLoading, equipmentQuery.isLoading, partQuery.isLoading, serviceQuery.isLoading]);

  // Determine error state
  const error = useMemo<Error | null>(() => {
    const queryError =
      {
        car: carQuery.error,
        bus: busQuery.error,
        equipment: equipmentQuery.error,
        part: partQuery.error,
        service: serviceQuery.error,
      }[type] || null;

    return queryError instanceof Error ? queryError : null;
  }, [type, carQuery.error, busQuery.error, equipmentQuery.error, partQuery.error, serviceQuery.error]);

  const isError = error !== null;

  // Transform to unified format
  const listing = useMemo<UnifiedListing | null>(() => {
    if (!rawData) return null;
    return transformToUnified(type, rawData);
  }, [type, rawData]);

  // Check for redirect (rental listings)
  const redirectTo = useMemo<string | null>(() => {
    if (!rawData) return null;
    return getRedirectTarget(type, rawData);
  }, [type, rawData]);

  // Refetch function
  const refetch = useMemo<() => void>(() => {
    return () => {
      switch (type) {
        case 'car':
          void carQuery.refetch();
          break;
        case 'bus':
          void busQuery.refetch();
          break;
        case 'equipment':
          void equipmentQuery.refetch();
          break;
        case 'part':
          void partQuery.refetch();
          break;
        case 'service':
          void serviceQuery.refetch();
          break;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, carQuery.refetch, busQuery.refetch, equipmentQuery.refetch, partQuery.refetch, serviceQuery.refetch]);

  return {
    listing,
    isLoading,
    isError,
    error,
    refetch,
    redirectTo,
  };
}
