import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../auth';
import type { ListingItem } from './listings';
import type { BusListingItem } from './buses';
import type { EquipmentListingItem } from './equipment';

export type BookingEntityType = 'CAR' | 'BUS' | 'EQUIPMENT';

interface BookingUser { id: string; username: string; displayName: string | null; avatarUrl: string | null; phone: string | null }

export interface BookingItem {
  id: string;
  entityType: BookingEntityType;
  listingId: string | null;
  busListingId: string | null;
  equipmentListingId: string | null;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: string;
  depositAmount: string | null;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  cancellationPolicy: 'FREE' | 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  driverRequested: boolean;
  insuranceSelected: boolean;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  notes: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  listing?: ListingItem;
  busListing?: BusListingItem;
  equipmentListing?: EquipmentListingItem;
  renter?: BookingUser;
  owner?: BookingUser;
}

// Helper: get the entity title/images/id from a BookingItem regardless of type
// Bookings are always for rental listings → paths use /rental/[type]/[id]
export function getBookingEntity(b: BookingItem) {
  if (b.entityType === 'BUS' && b.busListing) return { title: b.busListing.title, images: b.busListing.images, entityId: b.busListingId!, detailPath: `/rental/bus/${b.busListingId}` };
  if (b.entityType === 'EQUIPMENT' && b.equipmentListing) return { title: b.equipmentListing.title, images: b.equipmentListing.images, entityId: b.equipmentListingId!, detailPath: `/rental/equipment/${b.equipmentListingId}` };
  // Default: CAR rental
  return { title: b.listing?.title ?? '', images: b.listing?.images ?? [], entityId: b.listingId ?? '', detailPath: `/rental/car/${b.listingId}` };
}

export interface BookingsResponse {
  items: BookingItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PriceCalculation {
  totalDays: number;
  totalPrice: number;
  breakdown: string;
  depositAmount: number | null;
  currency: string;
}

export interface BookingAvailability {
  startDate: string;
  endDate: string;
  status: string;
}

export interface CreateBookingPayload {
  entityType: BookingEntityType;
  entityId: string;
  startDate: string;
  endDate: string;
  driverRequested?: boolean;
  insuranceSelected?: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
  quantity?: number;
}

function validateBookingPayload(data: CreateBookingPayload): void {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error('تواريخ غير صالحة');
  if (start < today) throw new Error('تاريخ البداية يجب أن يكون في المستقبل');
  if (end <= start) throw new Error('تاريخ النهاية يجب أن يكون بعد البداية');
  if (data.quantity !== undefined && (!Number.isInteger(data.quantity) || data.quantity < 1)) {
    throw new Error('الكمية يجب أن تكون رقم صحيح 1 أو أكثر');
  }
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => {
      validateBookingPayload(data);
      return apiRequest<BookingItem>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useMyBookings(params?: { status?: string; page?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', params.page);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return useQuery<BookingsResponse>({
    queryKey: ['my-bookings', params],
    queryFn: () => apiRequest<BookingsResponse>(`/bookings/my${query}`),
  });
}

export function useReceivedBookings(params?: { status?: string; page?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', params.page);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return useQuery<BookingsResponse>({
    queryKey: ['received-bookings', params],
    queryFn: () => apiRequest<BookingsResponse>(`/bookings/received${query}`),
  });
}

export function useBooking(id: string) {
  return useQuery<BookingItem>({
    queryKey: ['booking', id],
    queryFn: () => apiRequest<BookingItem>(`/bookings/${id}`),
    enabled: !!id,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest<BookingItem>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['received-bookings'] });
    },
  });
}

export function useBookingAvailability(entityType: BookingEntityType, entityId: string) {
  return useQuery<BookingAvailability[]>({
    queryKey: ['booking-availability', entityType, entityId],
    queryFn: () => apiRequest<BookingAvailability[]>(`/bookings/availability/${entityType}/${entityId}`),
    enabled: !!entityId,
  });
}

export function useCalculatePrice(entityType: BookingEntityType, entityId: string, startDate: string, endDate: string) {
  const enabled = !!entityId && !!startDate && !!endDate;
  return useQuery<PriceCalculation>({
    queryKey: ['calculate-price', entityType, entityId, startDate, endDate],
    queryFn: () =>
      apiRequest<PriceCalculation>(
        `/bookings/calculate-price?entityType=${entityType}&entityId=${entityId}&startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled,
  });
}
