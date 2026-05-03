export enum TransportServiceType {
  GOODS = 'GOODS',
  FURNITURE = 'FURNITURE',
  CONSTRUCTION = 'CONSTRUCTION',
  HEAVY = 'HEAVY',
  BACKLOAD = 'BACKLOAD',
  EQUIPMENT = 'EQUIPMENT',
}

export enum TransportRequestStatus {
  OPEN = 'OPEN',
  QUOTED = 'QUOTED',
  BOOKED = 'BOOKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TransportBookingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ICarrierProfile {
  id: string;
  userId: string;
  companyName?: string | null;
  vehicleTypes: string[];
  maxWeightTons?: number | null;
  serviceTypes: TransportServiceType[];
  governorates: string[];
  isAvailable: boolean;
  rating?: number | null;
  totalTrips: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransportRequest {
  id: string;
  slug: string;
  requesterId: string;
  serviceType: TransportServiceType;
  fromGovernorate: string;
  toGovernorate: string;
  description?: string | null;
  scheduledDate?: Date | null;
  weightTons?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  status: TransportRequestStatus;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransportQuote {
  id: string;
  requestId: string;
  carrierId: string;
  price: number;
  estimatedDays?: number | null;
  message?: string | null;
  status: QuoteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransportBooking {
  id: string;
  requestId: string;
  quoteId: string;
  carrierId: string;
  shipperId: string;
  totalPrice: number;
  status: TransportBookingStatus;
  createdAt: Date;
  updatedAt: Date;
}
