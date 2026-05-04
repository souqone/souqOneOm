'use client';

import { useMemo } from 'react';
import { useListing } from '@/lib/api/listings';
import { useBusListing } from '@/lib/api/buses';
import { useEquipmentListing } from '@/lib/api/equipment';
import type { ListingItem } from '@/lib/api/listings';
import type { BusListingItem } from '@/lib/api/buses';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import {
  parsePrice,
  normalizeImages,
  normalizeSeller,
} from '@/features/shared/utils/listing-normalizers';
import type {
  RentalEntityType,
  UnifiedRentalListing,
  RentalCarData,
  RentalBusData,
  RentalEquipmentData,
} from '../types/unified-rental.types';

// ─── Rental type guards ──────────────────────────────────────────────────────

function isRentalListing(type: RentalEntityType, raw: unknown): boolean {
  if (!raw) return false;
  switch (type) {
    case 'car':
      return (raw as ListingItem).listingType === 'RENTAL';
    case 'bus':
      return (raw as BusListingItem).busListingType === 'BUS_RENT';
    case 'equipment':
      return (raw as EquipmentListingItem).listingType === 'EQUIPMENT_RENT';
    default:
      return false;
  }
}

function getSaleRedirect(type: RentalEntityType, id: string): string {
  return `/sale/${type}/${id}`;
}

// ─── Transform Functions ──────────────────────────────────────────────────────

function transformCarRental(raw: ListingItem): UnifiedRentalListing {
  const carData: RentalCarData = {
    brand: raw.make ?? undefined,
    model: raw.model ?? undefined,
    year: raw.year ?? undefined,
    mileage: raw.mileage ?? undefined,
    fuelType: raw.fuelType ?? undefined,
    transmission: raw.transmission ?? undefined,
    bodyType: raw.bodyType ?? undefined,
    exteriorColor: raw.exteriorColor ?? undefined,
    engineSize: raw.engineSize ?? undefined,
    horsepower: raw.horsepower ?? undefined,
    doors: raw.doors ?? undefined,
    seats: raw.seats ?? undefined,
    driveType: raw.driveType ?? undefined,
    features: raw.features?.length ? raw.features : undefined,
  };

  return {
    id: raw.id,
    type: 'car',
    title: raw.title,
    description: raw.description || undefined,
    images: normalizeImages(raw.images),
    seller: normalizeSeller(raw.seller, raw.governorate),
    location: raw.latitude && raw.longitude ? { lat: raw.latitude, lng: raw.longitude } : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    governorate: raw.governorate || '',
    currency: raw.currency,
    isPriceNegotiable: raw.isPriceNegotiable,
    condition: raw.condition || '',
    dailyPrice: parsePrice(raw.dailyPrice),
    weeklyPrice: parsePrice(raw.weeklyPrice),
    monthlyPrice: parsePrice(raw.monthlyPrice),
    minRentalDays: raw.minRentalDays ?? undefined,
    cancellationPolicy: raw.cancellationPolicy ?? undefined,
    depositAmount: parsePrice(raw.depositAmount),
    kmLimitPerDay: raw.kmLimitPerDay ?? undefined,
    withDriver: raw.withDriver ?? undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    carData,
  };
}

function transformBusRental(raw: BusListingItem): UnifiedRentalListing {
  const busData: RentalBusData = {
    busType: raw.busType ?? undefined,
    capacity: raw.capacity ?? undefined,
    brand: raw.make ?? undefined,
    model: raw.model ?? undefined,
    year: raw.year ?? undefined,
    mileage: raw.mileage ?? undefined,
    fuelType: raw.fuelType ?? undefined,
    transmission: raw.transmission ?? undefined,
    features: raw.features?.length ? raw.features : undefined,
  };

  return {
    id: raw.id,
    type: 'bus',
    title: raw.title,
    description: raw.description || undefined,
    images: normalizeImages(raw.images),
    seller: normalizeSeller(raw.user, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp }),
    location: raw.latitude && raw.longitude ? { lat: raw.latitude, lng: raw.longitude } : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    governorate: raw.governorate || '',
    currency: raw.currency,
    isPriceNegotiable: raw.isPriceNegotiable,
    condition: raw.condition,
    dailyPrice: parsePrice(raw.dailyPrice),
    weeklyPrice: undefined, // Bus API has no weeklyPrice
    monthlyPrice: parsePrice(raw.monthlyPrice),
    minRentalDays: raw.minRentalDays ?? undefined,
    depositAmount: parsePrice(raw.depositAmount),
    kmLimitPerDay: raw.kmLimitPerDay ?? undefined,
    withDriver: raw.withDriver ?? undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    cancellationPolicy: raw.cancellationPolicy ?? undefined,
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    busData,
  };
}

function transformEquipmentRental(raw: EquipmentListingItem): UnifiedRentalListing {
  const equipmentData: RentalEquipmentData = {
    category: raw.equipmentType ?? undefined,
    brand: raw.make ?? undefined,
    model: raw.model ?? undefined,
    features: raw.features?.length ? raw.features : undefined,
  };

  return {
    id: raw.id,
    type: 'equipment',
    title: raw.title,
    description: raw.description || undefined,
    images: normalizeImages(raw.images),
    seller: normalizeSeller(raw.user, raw.governorate, { phone: raw.contactPhone, whatsapp: raw.whatsapp }),
    location: raw.latitude && raw.longitude ? { lat: raw.latitude, lng: raw.longitude } : undefined,
    views: raw.viewCount,
    createdAt: raw.createdAt,
    status: raw.status,
    governorate: raw.governorate || '',
    currency: raw.currency,
    isPriceNegotiable: raw.isPriceNegotiable,
    condition: raw.condition,
    dailyPrice: parsePrice(raw.dailyPrice),
    weeklyPrice: parsePrice(raw.weeklyPrice),
    monthlyPrice: parsePrice(raw.monthlyPrice),
    minRentalDays: raw.minRentalDays ?? undefined,
    depositAmount: parsePrice(raw.depositAmount),
    kmLimitPerDay: raw.kmLimitPerDay ?? undefined,
    withDriver: raw.withOperator ?? undefined,
    deliveryAvailable: raw.deliveryAvailable ?? undefined,
    insuranceIncluded: raw.insuranceIncluded ?? undefined,
    cancellationPolicy: raw.cancellationPolicy ?? undefined,
    availableFrom: raw.availableFrom ?? undefined,
    availableTo: raw.availableTo ?? undefined,
    equipmentData,
  };
}

function transformToUnifiedRental(
  type: RentalEntityType,
  raw: unknown,
): UnifiedRentalListing | null {
  if (!raw) return null;
  try {
    switch (type) {
      case 'car': return transformCarRental(raw as ListingItem);
      case 'bus': return transformBusRental(raw as BusListingItem);
      case 'equipment': return transformEquipmentRental(raw as EquipmentListingItem);
      default: return null;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to transform ${type} rental listing:`, error);
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

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
    const queryError = { car: carQuery.error, bus: busQuery.error, equipment: equipmentQuery.error }[type] || null;
    return queryError instanceof Error ? queryError : null;
  }, [type, carQuery.error, busQuery.error, equipmentQuery.error]);

  const isError = error !== null;

  // If listing exists but is NOT a rental → redirect to sale page
  const redirectTo = useMemo<string | null>(() => {
    if (!rawData || isLoading) return null;
    if (!isRentalListing(type, rawData)) return getSaleRedirect(type, id);
    return null;
  }, [type, id, rawData, isLoading]);

  const listing = useMemo<UnifiedRentalListing | null>(() => {
    if (!rawData || redirectTo) return null;
    return transformToUnifiedRental(type, rawData);
  }, [type, rawData, redirectTo]);

  const refetch = useMemo<() => void>(() => {
    return () => {
      switch (type) {
        case 'car': void carQuery.refetch(); break;
        case 'bus': void busQuery.refetch(); break;
        case 'equipment': void equipmentQuery.refetch(); break;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, carQuery.refetch, busQuery.refetch, equipmentQuery.refetch]);

  return { listing, isLoading, isError, error, refetch, redirectTo };
}
