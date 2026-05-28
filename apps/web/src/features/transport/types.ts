// ═══════════════════════════════════════
// Transport Marketplace — Types
// ═══════════════════════════════════════

export type TransportServiceType =
  | 'GOODS'
  | 'FURNITURE'
  | 'CONSTRUCTION'
  | 'HEAVY'
  | 'BACKLOAD'
  | 'EQUIPMENT'

export type TransportRequestStatus =
  | 'OPEN'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

/** Alias for freighthub compatibility */
export type RequestStatus = TransportRequestStatus

export type QuoteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'

export type BookingStatus = 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type VehicleType =
  | 'PICKUP'
  | 'VAN'
  | 'TRUCK_SMALL'
  | 'TRUCK_LARGE'
  | 'TRAILER'
  | 'EXCAVATOR'
  | 'TIPPER'
  | 'CRANE'
  | 'OTHER'

// ─── User Summary ─────────────────────────────────

export interface UserSummary {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
}

// ─── Carrier Profile ──────────────────────────────

export interface CarrierProfile {
  id: string
  userId: string
  user: UserSummary
  companyName?: string
  bio?: string
  vehicleTypes: VehicleType[]
  serviceTypes: TransportServiceType[]
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
  isAvailable: boolean
  isVerified: boolean
  completedTrips: number
  averageRating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

// ─── Transport Request ────────────────────────────

export interface TransportRequest {
  id: string
  userId: string
  user: UserSummary
  serviceType: TransportServiceType
  status: TransportRequestStatus
  fromGovernorate: string
  fromCity?: string
  fromAddress: string
  fromLat?: number
  fromLng?: number
  toGovernorate: string
  toCity?: string
  toAddress: string
  toLat?: number
  toLng?: number
  cargoDescription: string
  weightTons?: number
  requiresHelper: boolean
  notes?: string
  scheduledAt?: string
  isFlexible: boolean
  budgetMin?: number
  budgetMax?: number
  currency: string
  viewCount: number
  expiresAt?: string
  quotes?: TransportQuote[]
  quotesCount?: number
  _count?: { quotes: number }
  booking?: TransportBooking
  createdAt: string
  updatedAt: string
}

// ─── Transport Quote ──────────────────────────────

export interface TransportQuote {
  id: string
  requestId: string
  request?: TransportRequest
  carrierId: string
  carrier?: CarrierProfile
  booking?: { id: string }
  status: QuoteStatus
  price: number
  currency: string
  estimatedHours?: number
  message?: string
  createdAt: string
  updatedAt: string
}

// ─── Transport Booking ────────────────────────────

export interface TransportBooking {
  id: string
  requestId: string
  request?: TransportRequest
  quoteId: string
  quote?: TransportQuote
  status: BookingStatus
  confirmedAt: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

// ─── API Response ─────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─── Create DTOs ──────────────────────────────────

export interface CreateTransportRequestDto {
  serviceType: TransportServiceType
  fromGovernorate: string
  fromCity?: string
  fromAddress: string
  fromLat?: number
  fromLng?: number
  toGovernorate: string
  toCity?: string
  toAddress: string
  toLat?: number
  toLng?: number
  cargoDescription: string
  weightTons?: number
  requiresHelper?: boolean
  notes?: string
  scheduledAt?: string
  isFlexible?: boolean
  budgetMin?: number
  budgetMax?: number
}

export interface CreateQuoteDto {
  price: number
  estimatedHours?: number
  message?: string
}

export interface CreateCarrierProfileDto {
  companyName?: string
  bio?: string
  vehicleTypes: VehicleType[]
  serviceTypes: TransportServiceType[]
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
}

/** Alias for freighthub compatibility */
export type CreateRequestDto = CreateTransportRequestDto

export interface GetRequestsParams {
  page?: number
  limit?: number
  serviceType?: TransportServiceType
  status?: TransportRequestStatus
  fromGovernorate?: string
  fromCity?: string
  toGovernorate?: string
  toCity?: string
  sortBy?: 'createdAt' | 'budgetMax' | 'scheduledAt'
  sortOrder?: 'asc' | 'desc'
}
