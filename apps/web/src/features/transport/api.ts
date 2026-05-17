import { apiRequest, apiFetch } from '@/lib/auth'
import type {
  TransportRequest,
  TransportQuote,
  TransportBooking,
  CarrierProfile,
  PaginatedResponse,
  CreateTransportRequestDto,
  CreateQuoteDto,
  CreateCarrierProfileDto,
} from './types'

// ─── Helper ───────────────────────────────────────

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

// ─── Transport API ────────────────────────────────

export const transportApi = {
  // ── Requests ─────────────────────────────────────

  getRequests(params: Record<string, string | number | boolean | undefined> = {}) {
    return apiRequest<PaginatedResponse<TransportRequest>>(`/transport/requests${qs(params)}`)
  },

  getRequest(id: string) {
    return apiRequest<TransportRequest>(`/transport/requests/${id}`)
  },

  createRequest(dto: CreateTransportRequestDto) {
    return apiRequest<TransportRequest>('/transport/requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  },

  myRequests(page = 1, limit = 12, status?: string) {
    const q = qs({ page, limit, ...(status ? { status } : {}) })
    return apiRequest<PaginatedResponse<TransportRequest>>(`/transport/requests/my${q}`)
  },

  cancelRequest(id: string) {
    return apiRequest<TransportRequest>(`/transport/requests/${id}/cancel`, { method: 'PATCH' })
  },

  // ── Quotes ───────────────────────────────────────

  submitQuote(requestId: string, dto: CreateQuoteDto) {
    return apiRequest<TransportQuote>(`/transport/requests/${requestId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  },

  getQuotes(requestId: string) {
    return apiRequest<TransportQuote[]>(`/transport/requests/${requestId}/quotes`)
  },

  acceptQuote(quoteId: string) {
    return apiRequest<TransportQuote>(`/transport/quotes/${quoteId}/accept`, { method: 'PATCH' })
  },

  withdrawQuote(quoteId: string) {
    return apiRequest<TransportQuote>(`/transport/quotes/${quoteId}/withdraw`, { method: 'PATCH' })
  },

  myQuotes(page = 1, limit = 12, status?: string) {
    const q = qs({ page, limit, ...(status ? { status } : {}) })
    return apiRequest<PaginatedResponse<TransportQuote>>(`/transport/quotes/my${q}`)
  },

  // ── Bookings ─────────────────────────────────────

  getBooking(id: string) {
    return apiRequest<TransportBooking>(`/transport/bookings/${id}`)
  },

  myBookings(role: 'shipper' | 'carrier' = 'shipper', page = 1, limit = 12) {
    return apiRequest<PaginatedResponse<TransportBooking>>(
      `/transport/bookings/my?role=${role}&page=${page}&limit=${limit}`,
    )
  },

  markInProgress(bookingId: string) {
    return apiRequest<TransportBooking>(`/transport/bookings/${bookingId}/start`, {
      method: 'PATCH',
    })
  },

  completeBooking(bookingId: string) {
    return apiRequest<TransportBooking>(`/transport/bookings/${bookingId}/complete`, {
      method: 'PATCH',
    })
  },

  cancelBooking(bookingId: string, reason?: string) {
    return apiRequest<TransportBooking>(`/transport/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: reason ? JSON.stringify({ reason }) : undefined,
    })
  },

  // ── Carrier Profile ──────────────────────────────

  async createCarrierProfile(dto: CreateCarrierProfileDto) {
    const res = await apiFetch('/transport/carrier-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const err = Object.assign(
        new Error(data?.message || data?.error || 'SERVER_ERROR'),
        { status: res.status },
      )
      throw err
    }
    return data as CarrierProfile
  },

  getMyCarrierProfile() {
    return apiRequest<CarrierProfile>('/transport/carrier-profile/me')
  },

  updateCarrierProfile(dto: Partial<CreateCarrierProfileDto>) {
    return apiRequest<CarrierProfile>('/transport/carrier-profile', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    })
  },

  setAvailability(isAvailable: boolean) {
    return apiRequest<CarrierProfile>('/transport/carrier-profile/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    })
  },

  getCarriers(params: Record<string, string | number | boolean | undefined> = {}) {
    return apiRequest<PaginatedResponse<CarrierProfile>>(`/transport/carriers${qs(params)}`)
  },

  getCarrier(id: string) {
    return apiRequest<CarrierProfile>(`/transport/carriers/${id}`)
  },

  getStats() {
    return apiRequest<{ activeRequests: number; verifiedCarriers: number; completedTrips: number }>(
      '/transport/stats',
    )
  },
}
