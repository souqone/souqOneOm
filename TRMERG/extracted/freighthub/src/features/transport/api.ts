// BACKEND INTEGRATION POINT: Replace mock implementations with real HTTP calls.
// All function signatures are stable — only the implementations change.
// Set NEXT_PUBLIC_API_URL in .env to point to your real backend.

import type {
  TransportRequest,
  TransportQuote,
  TransportBooking,
  CarrierProfile,
  PaginatedResponse,
  GetRequestsParams,
  GetCarriersParams,
  CreateRequestDto,
  CreateQuoteDto,
  CreateCarrierDto,
} from './types';

import {
  MOCK_TRANSPORT_REQUESTS,
  MOCK_QUOTES,
  MOCK_BOOKINGS,
  MOCK_CARRIER_PROFILES,
} from '@/lib/mock-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
void API_BASE; // Referenced when swapping to real backend

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const transportApi = {
  // ─── REQUESTS ───────────────────────────────────────────────────────────────

  getRequests: async (params: GetRequestsParams = {}): Promise<PaginatedResponse<TransportRequest>> => {
    // BACKEND: GET /api/v1/transport/requests?...params
    await delay(600);
    let items = [...MOCK_TRANSPORT_REQUESTS];

    if (params.serviceType) {
      items = items.filter((r) => r.serviceType === params.serviceType);
    }
    if (params.status) {
      items = items.filter((r) => r.status === params.status);
    }
    if (params.fromGovernorate) {
      items = items.filter((r) => r.fromGovernorate === params.fromGovernorate);
    }
    if (params.toGovernorate) {
      items = items.filter((r) => r.toGovernorate === params.toGovernorate);
    }

    if (params.sortBy === 'budgetMax') {
      items.sort((a, b) => {
        const aVal = a.budgetMax ?? 0;
        const bVal = b.budgetMax ?? 0;
        return params.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else {
      items.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return params.sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      });
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      items: paged,
      meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) },
    };
  },

  getRequest: async (id: string): Promise<TransportRequest> => {
    // BACKEND: GET /api/v1/transport/requests/:id
    await delay(400);
    const req = MOCK_TRANSPORT_REQUESTS.find((r) => r.id === id);
    if (!req) throw new Error(`Request ${id} not found`);
    return { ...req, quotes: MOCK_QUOTES.filter((q) => q.requestId === id) };
  },

  createRequest: async (dto: CreateRequestDto): Promise<TransportRequest> => {
    // BACKEND: POST /api/v1/transport/requests
    await delay(800);
    const now = new Date().toISOString();
    const newReq: TransportRequest = {
      id: `req-${Date.now()}`,
      userId: 'user-001',
      user: {
        id: 'user-001',
        username: 'ahmed_albalushi',
        displayName: 'أحمد البلوشي',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ahmed&backgroundColor=0B2447&textColor=ffffff',
      },
      ...dto,
      requiresHelper: dto.requiresHelper ?? false,
      isFlexible: dto.isFlexible ?? false,
      status: 'OPEN',
      currency: 'OMR',
      viewCount: 0,
      _count: { quotes: 0 },
      createdAt: now,
      updatedAt: now,
    };
    return newReq;
  },

  cancelRequest: async (id: string): Promise<void> => {
    // BACKEND: PATCH /api/v1/transport/requests/:id/cancel
    await delay(500);
    void id;
  },

  myRequests: async (page = 1): Promise<PaginatedResponse<TransportRequest>> => {
    // BACKEND: GET /api/v1/transport/requests/my?page=:page
    await delay(500);
    let items = MOCK_TRANSPORT_REQUESTS.filter((r) => r.userId === 'user-001');
    const limit = 10;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) },
    };
  },

  // ─── QUOTES ─────────────────────────────────────────────────────────────────

  submitQuote: async (requestId: string, dto: CreateQuoteDto): Promise<TransportQuote> => {
    // BACKEND: POST /api/v1/transport/requests/:requestId/quotes
    await delay(700);
    const now = new Date().toISOString();
    return {
      id: `quote-${Date.now()}`,
      requestId,
      carrierId: 'carrier-001',
      status: 'PENDING',
      currency: 'OMR',
      ...dto,
      createdAt: now,
    };
  },

  getQuotes: async (requestId: string): Promise<TransportQuote[]> => {
    // BACKEND: GET /api/v1/transport/requests/:requestId/quotes
    await delay(400);
    return MOCK_QUOTES.filter((q) => q.requestId === requestId);
  },

  acceptQuote: async (quoteId: string): Promise<TransportBooking> => {
    // BACKEND: PATCH /api/v1/transport/quotes/:quoteId/accept
    await delay(600);
    const now = new Date().toISOString();
    return {
      id: `booking-${Date.now()}`,
      requestId: 'req-001',
      quoteId,
      status: 'ACCEPTED',
      confirmedAt: now,
    };
  },

  withdrawQuote: async (quoteId: string): Promise<void> => {
    // BACKEND: PATCH /api/v1/transport/quotes/:quoteId/withdraw
    await delay(400);
    void quoteId;
  },

  myQuotes: async (page = 1): Promise<PaginatedResponse<TransportQuote>> => {
    // BACKEND: GET /api/v1/transport/quotes/my?page=:page
    await delay(500);
    const limit = 10;
    const start = (page - 1) * limit;
    return {
      items: MOCK_QUOTES.slice(start, start + limit),
      meta: { total: MOCK_QUOTES.length, page, limit, totalPages: Math.ceil(MOCK_QUOTES.length / limit) },
    };
  },

  // ─── BOOKINGS ────────────────────────────────────────────────────────────────

  markInProgress: async (bookingId: string): Promise<TransportBooking> => {
    // BACKEND: PATCH /api/v1/transport/bookings/:bookingId/start
    await delay(500);
    const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);
    return { ...booking, status: 'IN_PROGRESS' };
  },

  completeBooking: async (bookingId: string): Promise<TransportBooking> => {
    // BACKEND: PATCH /api/v1/transport/bookings/:bookingId/complete
    await delay(500);
    const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
    if (!booking) throw new Error(`Booking ${bookingId} not found`);
    return { ...booking, status: 'COMPLETED', completedAt: new Date().toISOString() };
  },

  cancelBooking: async (bookingId: string, reason?: string): Promise<void> => {
    // BACKEND: PATCH /api/v1/transport/bookings/:bookingId/cancel
    await delay(500);
    void bookingId;
    void reason;
  },

  myBookings: async (role: 'shipper' | 'carrier'): Promise<PaginatedResponse<TransportBooking>> => {
    // BACKEND: GET /api/v1/transport/bookings/my?role=:role
    await delay(500);
    void role;
    return {
      items: MOCK_BOOKINGS,
      meta: { total: MOCK_BOOKINGS.length, page: 1, limit: 10, totalPages: 1 },
    };
  },

  // ─── CARRIERS ────────────────────────────────────────────────────────────────

  createCarrierProfile: async (dto: CreateCarrierDto): Promise<CarrierProfile> => {
    // BACKEND: POST /api/v1/transport/carrier-profile
    await delay(800);
    const now = new Date().toISOString();
    return {
      id: `carrier-${Date.now()}`,
      userId: 'user-001',
      user: {
        id: 'user-001',
        username: 'ahmed_albalushi',
        displayName: 'أحمد البلوشي',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ahmed&backgroundColor=0B2447&textColor=ffffff',
      },
      ...dto,
      isAvailable: true,
      isVerified: false,
      completedTrips: 0,
      averageRating: 0,
      reviewCount: 0,
      createdAt: now,
    };
  },

  getMyCarrierProfile: async (): Promise<CarrierProfile> => {
    // BACKEND: GET /api/v1/transport/carrier-profile/me
    await delay(400);
    return MOCK_CARRIER_PROFILES[0];
  },

  setAvailability: async (isAvailable: boolean): Promise<CarrierProfile> => {
    // BACKEND: PATCH /api/v1/transport/carrier-profile/availability
    await delay(300);
    return { ...MOCK_CARRIER_PROFILES[0], isAvailable };
  },

  getCarriers: async (params: GetCarriersParams = {}): Promise<PaginatedResponse<CarrierProfile>> => {
    // BACKEND: GET /api/v1/transport/carriers?...params
    await delay(500);
    let items = [...MOCK_CARRIER_PROFILES];
    if (params.governorate) items = items.filter((c) => c.governorate === params.governorate);
    if (params.isAvailable !== undefined) items = items.filter((c) => c.isAvailable === params.isAvailable);
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      meta: { total: items.length, page, limit, totalPages: Math.ceil(items.length / limit) },
    };
  },

  getCarrier: async (id: string): Promise<CarrierProfile> => {
    // BACKEND: GET /api/v1/transport/carriers/:id
    await delay(400);
    const carrier = MOCK_CARRIER_PROFILES.find((c) => c.id === id);
    if (!carrier) throw new Error(`Carrier ${id} not found`);
    return carrier;
  },
};