export type TransportServiceType =
  | 'GOODS' |'FURNITURE' |'CONSTRUCTION' |'HEAVY' |'BACKLOAD' |'EQUIPMENT';

export type RequestStatus =
  | 'OPEN' |'QUOTED' |'ACCEPTED' |'IN_PROGRESS' |'COMPLETED' |'CANCELLED' |'EXPIRED';

export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type BookingStatus = 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type VehicleType =
  | 'PICKUP' |'VAN' |'TRUCK_SMALL' |'TRUCK_LARGE' |'TRAILER' |'EXCAVATOR' |'TIPPER' |'CRANE' |'OTHER';

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface TransportRequest {
  id: string;
  userId: string;
  user: UserSummary;
  serviceType: TransportServiceType;
  status: RequestStatus;
  fromGovernorate: string;
  fromCity?: string;
  fromAddress: string;
  fromLat?: number;
  fromLng?: number;
  toGovernorate: string;
  toCity?: string;
  toAddress: string;
  toLat?: number;
  toLng?: number;
  cargoDescription: string;
  weightTons?: number;
  requiresHelper: boolean;
  notes?: string;
  scheduledAt?: string;
  isFlexible: boolean;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  viewCount: number;
  expiresAt?: string;
  _count: { quotes: number };
  quotes?: TransportQuote[];
  booking?: TransportBooking;
  createdAt: string;
  updatedAt: string;
}

export interface TransportQuote {
  id: string;
  requestId: string;
  request?: TransportRequest;
  carrierId: string;
  carrier?: CarrierProfile;
  status: QuoteStatus;
  price: number;
  currency: string;
  estimatedHours?: number;
  message?: string;
  createdAt: string;
}

export interface TransportBooking {
  id: string;
  requestId: string;
  request?: TransportRequest;
  quoteId: string;
  quote?: TransportQuote;
  status: BookingStatus;
  confirmedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface CarrierProfile {
  id: string;
  userId: string;
  user: UserSummary;
  companyName?: string;
  bio?: string;
  vehicleTypes: VehicleType[];
  serviceTypes: TransportServiceType[];
  governorate: string;
  city?: string;
  contactPhone?: string;
  whatsapp?: string;
  isAvailable: boolean;
  isVerified: boolean;
  completedTrips: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetRequestsParams {
  page?: number;
  limit?: number;
  serviceType?: TransportServiceType;
  status?: RequestStatus;
  fromGovernorate?: string;
  toGovernorate?: string;
  sortBy?: 'createdAt' | 'budgetMax' | 'scheduledAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetCarriersParams {
  page?: number;
  limit?: number;
  governorate?: string;
  vehicleType?: VehicleType;
  serviceType?: TransportServiceType;
  isAvailable?: boolean;
}

export interface CreateRequestDto {
  serviceType: TransportServiceType;
  fromGovernorate: string;
  fromCity?: string;
  fromAddress: string;
  fromLat?: number;
  fromLng?: number;
  toGovernorate: string;
  toCity?: string;
  toAddress: string;
  toLat?: number;
  toLng?: number;
  cargoDescription: string;
  weightTons?: number;
  requiresHelper?: boolean;
  notes?: string;
  scheduledAt?: string;
  isFlexible?: boolean;
  budgetMin?: number;
  budgetMax?: number;
}

export interface CreateQuoteDto {
  price: number;
  estimatedHours?: number;
  message?: string;
}

export interface CreateCarrierDto {
  companyName?: string;
  bio?: string;
  vehicleTypes: VehicleType[];
  serviceTypes: TransportServiceType[];
  governorate: string;
  city?: string;
  contactPhone?: string;
  whatsapp?: string;
}