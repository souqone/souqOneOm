export type RentalEntityType = 'car' | 'bus' | 'equipment';

export interface UnifiedRentalListing {
  id: string;
  type: RentalEntityType;
  title: string;
  description?: string;

  // Pricing (bus has no weeklyPrice → undefined)
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency: string;
  isPriceNegotiable: boolean;
  minRentalDays?: number;
  cancellationPolicy?: string;
  depositAmount?: number;
  kmLimitPerDay?: number;
  withDriver?: boolean;
  deliveryAvailable?: boolean;
  insuranceIncluded?: boolean;
  availableFrom?: string;
  availableTo?: string;

  // Common fields
  condition: string;
  governorate: string;
  images: string[];
  seller: UnifiedRentalSeller;
  location?: { lat: number; lng: number; radius?: number };
  views: number;
  createdAt: string;
  status: string;

  // Type-specific
  carData?: RentalCarData;
  busData?: RentalBusData;
  equipmentData?: RentalEquipmentData;
}

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
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  exteriorColor?: string;
  engineSize?: string;
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
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  features?: string[];
}

export interface RentalEquipmentData {
  category?: string;
  brand?: string;
  model?: string;
  features?: string[];
}

// Booking entity type map
export const BOOKING_ENTITY_TYPE: Record<RentalEntityType, string> = {
  car: 'CAR',
  bus: 'BUS',
  equipment: 'EQUIPMENT',
};
