import { apiRequest } from '@/lib/auth'
import type { PaginatedResponse, TransportRequest, CarrierProfile } from './types'

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export const adminTransportApi = {
  getStats() {
    return apiRequest<any>('/admin/transport/stats')
  },

  getRequests(params: Record<string, any> = {}) {
    return apiRequest<PaginatedResponse<TransportRequest>>(`/admin/transport/requests${qs(params)}`)
  },

  updateRequestStatus(id: string, status: string) {
    return apiRequest<TransportRequest>(`/admin/transport/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  deleteRequest(id: string) {
    return apiRequest<{ message: string }>(`/admin/transport/requests/${id}`, {
      method: 'DELETE',
    })
  },

  getCarriers(params: Record<string, any> = {}) {
    return apiRequest<PaginatedResponse<CarrierProfile>>(`/admin/transport/carriers${qs(params)}`)
  },

  updateCarrier(id: string, data: { isVerified?: boolean; isAvailable?: boolean }) {
    return apiRequest<CarrierProfile>(`/admin/transport/carriers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteCarrier(id: string) {
    return apiRequest<{ message: string }>(`/admin/transport/carriers/${id}`, {
      method: 'DELETE',
    })
  },
}
