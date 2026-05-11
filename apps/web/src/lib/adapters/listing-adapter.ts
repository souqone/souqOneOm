import type { ListingFormData } from '@/features/ads/components/listing-form';

/**
 * Interface representing the database Listing entity.
 * This is a partial representation covering the fields used for mapping.
 */
export interface ListingEntity {
  id?: string;
  title?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  price?: number | null;
  currency?: string | null;
  mileage?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  condition?: string | null;
  bodyType?: string | null;
  exteriorColor?: string | null;
  interior?: string | null;
  engineSize?: string | null;
  horsepower?: number | null;
  doors?: number | null;
  seats?: number | null;
  driveType?: string | null;
  features?: string[] | null;
  description?: string | null;
  governorate?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPriceNegotiable?: boolean | null;
  listingType?: string | null;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
  minRentalDays?: number | null;
  depositAmount?: number | null;
  kmLimitPerDay?: number | null;
  withDriver?: boolean | null;
  deliveryAvailable?: boolean | null;
  insuranceIncluded?: boolean | null;
  cancellationPolicy?: string | null;
  images?: any[];
}

/**
 * Maps a database Listing entity to the format expected by ListingForm.
 * Safely handles null and undefined values.
 * 
 * @param car - The database listing object.
 * @returns Partial<ListingFormData> suitable for initializing the form.
 * 
 * @example
 * // TEST: Handles null gracefully
 * const form = mapCarListingToForm({ title: null, price: 1000 });
 * console.assert(form.title === '');
 * console.assert(form.price === '1000');
 */
export function mapCarListingToForm(car: ListingEntity): Partial<ListingFormData> {
  if (!car) return {};

  return {
    title: car.title || '',
    make: car.make || '',
    model: car.model || '',
    year: car.year ?? new Date().getFullYear(),
    price: car.price != null ? String(car.price) : '',
    currency: car.currency || 'OMR',
    mileage: car.mileage != null ? String(car.mileage) : '',
    fuelType: car.fuelType || '',
    transmission: car.transmission || '',
    condition: car.condition || '',
    bodyType: car.bodyType || '',
    exteriorColor: car.exteriorColor || '',
    interiorColor: car.interior || '',
    engineSize: car.engineSize || '',
    horsepower: car.horsepower != null ? String(car.horsepower) : '',
    doors: car.doors != null ? String(car.doors) : '',
    seats: car.seats != null ? String(car.seats) : '',
    driveType: car.driveType || '',
    features: car.features ?? [],
    description: car.description || '',
    governorate: car.governorate || '',
    city: car.city || '',
    latitude: car.latitude ?? null,
    longitude: car.longitude ?? null,
    isPriceNegotiable: car.isPriceNegotiable ?? false,
    listingType: (car.listingType as 'SALE' | 'RENTAL' | 'WANTED') ?? 'SALE',
    dailyPrice: car.dailyPrice != null ? String(car.dailyPrice) : '',
    weeklyPrice: car.weeklyPrice != null ? String(car.weeklyPrice) : '',
    monthlyPrice: car.monthlyPrice != null ? String(car.monthlyPrice) : '',
    minRentalDays: car.minRentalDays != null ? String(car.minRentalDays) : '1',
    depositAmount: car.depositAmount != null ? String(car.depositAmount) : '',
    kmLimitPerDay: car.kmLimitPerDay != null ? String(car.kmLimitPerDay) : '',
    withDriver: car.withDriver ?? false,
    deliveryAvailable: car.deliveryAvailable ?? false,
    insuranceIncluded: car.insuranceIncluded ?? false,
    cancellationPolicy: car.cancellationPolicy || '',
  };
}

/**
 * Maps the ListingFormData back into an API-ready payload.
 * Safely parses strings into numbers where necessary.
 * 
 * @param form - The validated ListingFormData.
 * @returns Record<string, unknown> API payload.
 * 
 * @example
 * // TEST: Parses numeric fields correctly
 * const apiData = mapFormToCarListing({ price: '1000.5', isPriceNegotiable: true, ... });
 * console.assert(apiData.price === 1000.5);
 */
export function mapFormToCarListing(form: ListingFormData): Record<string, unknown> {
  const isRental = form.listingType === 'RENTAL';
  const isWanted = form.listingType === 'WANTED';
  
  const payload: Record<string, unknown> = {
    title: form.title,
    make: form.make,
    model: form.model,
    year: form.year,
    price: isRental || isWanted ? (form.price ? parseFloat(form.price) : 0) : parseFloat(form.price),
    currency: form.currency,
    description: form.description,
    isPriceNegotiable: isRental ? false : form.isPriceNegotiable,
    listingType: form.listingType,
  };

  if (form.mileage) payload.mileage = parseInt(form.mileage);
  if (form.fuelType) payload.fuelType = form.fuelType;
  if (form.transmission) payload.transmission = form.transmission;
  if (form.condition) payload.condition = form.condition;
  if (form.bodyType) payload.bodyType = form.bodyType;
  if (form.exteriorColor) payload.exteriorColor = form.exteriorColor;
  if (form.interiorColor) payload.interior = form.interiorColor;
  if (form.features && form.features.length > 0) payload.features = form.features;
  if (form.engineSize) payload.engineSize = form.engineSize;
  if (form.horsepower) payload.horsepower = parseInt(form.horsepower);
  if (form.doors) payload.doors = parseInt(form.doors);
  if (form.seats) payload.seats = parseInt(form.seats);
  if (form.driveType) payload.driveType = form.driveType;
  if (form.governorate) payload.governorate = form.governorate;
  if (form.city) payload.city = form.city;
  if (form.latitude !== null) payload.latitude = form.latitude;
  if (form.longitude !== null) payload.longitude = form.longitude;

  if (isRental) {
    if (form.dailyPrice) payload.dailyPrice = parseFloat(form.dailyPrice);
    if (form.weeklyPrice) payload.weeklyPrice = parseFloat(form.weeklyPrice);
    if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
    if (form.minRentalDays) payload.minRentalDays = parseInt(form.minRentalDays);
    if (form.depositAmount) payload.depositAmount = parseFloat(form.depositAmount);
    if (form.kmLimitPerDay) payload.kmLimitPerDay = parseInt(form.kmLimitPerDay);
    
    payload.withDriver = form.withDriver;
    payload.deliveryAvailable = form.deliveryAvailable;
    payload.insuranceIncluded = form.insuranceIncluded;
    
    if (form.cancellationPolicy) payload.cancellationPolicy = form.cancellationPolicy;
  }

  return payload;
}
