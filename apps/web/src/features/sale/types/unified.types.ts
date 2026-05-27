/**
 * Unified type system for the sale detail page.
 * Normalizes 5 different listing types (car, bus, equipment, part, service)
 * into a single interface with type-specific data extensions.
 */

/** The 5 supported sale listing types */
export type SaleEntityType = 'car' | 'bus' | 'equipment' | 'part' | 'service';

/** Normalized seller representation (unifies 'seller' and 'user' fields from different APIs) */
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

/** Geographic location with optional distance from user */
export interface UnifiedLocation {
  lat: number;
  lng: number;
  radius?: number;
  distance?: number; // distance in km from user's location
}

/** Car-specific data fields */
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

/** Bus-specific data fields */
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
}

/** Equipment-specific data fields */
export interface EquipmentSpecificData {
  category?: string;
  brand?: string;
  model?: string;
  year?: number;
  warranty?: string;
  hoursUsed?: number;
  features?: string[];
}

/** Spare part-specific data fields */
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

/** Service-specific data fields */
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

/**
 * The unified listing interface.
 * Contains shared fields present in ALL listing types,
 * plus optional type-specific data extensions.
 */
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
  /** Car-specific data (when type === 'car') */
  carData?: CarSpecificData;
  /** Bus-specific data (when type === 'bus') */
  busData?: BusSpecificData;
  /** Equipment-specific data (when type === 'equipment') */
  equipmentData?: EquipmentSpecificData;
  /** Part-specific data (when type === 'part') */
  partData?: PartSpecificData;
  /** Service-specific data (when type === 'service') */
  serviceData?: ServiceSpecificData;
}

/** Result from useUnifiedListing hook */
export interface UseUnifiedListingResult {
  listing: UnifiedListing | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  /** If set, the page should redirect to this URL (e.g., rental listings) */
  redirectTo: string | null;
}
