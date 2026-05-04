import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyListings as useMyListingsHook } from '@/features/shared/hooks/useMyListings';
import { useDeleteListing as useDeleteListingHook } from '@/features/shared/hooks/useDeleteListing';
import { apiRequest } from '../auth';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface EquipmentListingItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  equipmentType: string;
  listingType: string;
  make?: string;
  model?: string;
  year?: number;
  condition: string;
  capacity?: string;
  power?: string;
  weight?: string;
  hoursUsed?: number;
  features: string[];
  price?: string;
  dailyPrice?: string;
  weeklyPrice?: string;
  monthlyPrice?: string;
  currency: string;
  isPriceNegotiable: boolean;
  withOperator: boolean;
  deliveryAvailable: boolean;
  minRentalDays?: number;
  depositAmount?: string;
  kmLimitPerDay?: number;
  insuranceIncluded: boolean;
  cancellationPolicy?: string;
  availableFrom?: string;
  availableTo?: string;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  whatsapp?: string;
  status: string;
  viewCount: number;
  userId: string;
  user: UserSummary;
  images: ImageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentRequestItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  equipmentType: string;
  quantity: number;
  budgetMin?: string;
  budgetMax?: string;
  currency: string;
  rentalDuration?: string;
  startDate?: string;
  endDate?: string;
  withOperator: boolean;
  governorate?: string;
  city?: string;
  siteDetails?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  whatsapp?: string;
  requestStatus: string;
  viewCount: number;
  userId: string;
  user: UserSummary;
  bids?: EquipmentBidItem[];
  _count?: { bids: number };
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentBidItem {
  id: string;
  price: string;
  currency: string;
  availability: string;
  notes?: string;
  withOperator: boolean;
  bidStatus: string;
  requestId: string;
  userId: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorListingItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  operatorType: string;
  specializations: string[];
  experienceYears?: number;
  equipmentTypes: string[];
  certifications: string[];
  dailyRate?: string;
  hourlyRate?: string;
  currency: string;
  isPriceNegotiable: boolean;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  whatsapp?: string;
  status: string;
  viewCount: number;
  userId: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
}

interface UserSummary {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  governorate?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface ImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ═══════════════════════════════════════
// Equipment Listings
// ═══════════════════════════════════════

export function useEquipmentListings(params?: Record<string, string>, enabled = true) {
  const qs = new URLSearchParams(params).toString();
  return useQuery<Paginated<EquipmentListingItem>>({
    queryKey: ['equipment', params],
    queryFn: () => apiRequest(`/equipment${qs ? `?${qs}` : ''}`),
    enabled,
  });
}

export function useEquipmentListing(id: string) {
  return useQuery<EquipmentListingItem>({
    queryKey: ['equipment', id],
    queryFn: () => apiRequest(`/equipment/${id}`),
    enabled: !!id,
  });
}

export function useMyEquipmentListings() {
  return useMyListingsHook<EquipmentListingItem>('equipment', '/equipment/my');
}

export function useEquipmentListingBySlug(slug: string) {
  return useQuery<EquipmentListingItem>({
    queryKey: ['equipment', 'slug', slug],
    queryFn: () => apiRequest(`/equipment/slug/${slug}`),
    enabled: !!slug,
  });
}

export function useAddEquipmentImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, urls }: { id: string; urls: string[] }) =>
      apiRequest(`/equipment/${id}/images`, { method: 'POST', body: JSON.stringify({ urls }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); },
  });
}

export function useRemoveEquipmentImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      apiRequest(`/equipment/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); },
  });
}

export function useCreateEquipmentListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<EquipmentListingItem>('/equipment', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); },
  });
}

export function useUpdateEquipmentListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<EquipmentListingItem>(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); },
  });
}

export function useDeleteEquipmentListing() {
  return useDeleteListingHook('equipment', (id) => `/equipment/${id}`);
}

// ═══════════════════════════════════════
// Equipment Requests
// ═══════════════════════════════════════

export function useEquipmentRequests(params?: Record<string, string>, enabled = true) {
  const qs = new URLSearchParams(params).toString();
  return useQuery<Paginated<EquipmentRequestItem>>({
    queryKey: ['equipment-requests', params],
    queryFn: () => apiRequest(`/equipment-requests${qs ? `?${qs}` : ''}`),
    enabled,
  });
}

export function useEquipmentRequest(id: string) {
  return useQuery<EquipmentRequestItem>({
    queryKey: ['equipment-requests', id],
    queryFn: () => apiRequest(`/equipment-requests/${id}`),
    enabled: !!id,
  });
}

export function useMyEquipmentRequests() {
  return useMyListingsHook<EquipmentRequestItem>('equipment-requests', '/equipment-requests/my');
}

export function useCreateEquipmentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<EquipmentRequestItem>('/equipment-requests', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

export function useUpdateEquipmentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<EquipmentRequestItem>(`/equipment-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

export function useChangeRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requestStatus }: { id: string; requestStatus: string }) =>
      apiRequest<EquipmentRequestItem>(`/equipment-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ requestStatus }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

export function useDeleteEquipmentRequest() {
  return useDeleteListingHook('equipment-requests', (id) => `/equipment-requests/${id}`);
}

// ═══════════════════════════════════════
// Bids
// ═══════════════════════════════════════

export function useCreateBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: Record<string, unknown> }) =>
      apiRequest<EquipmentBidItem>(`/equipment-requests/${requestId}/bids`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, bidId }: { requestId: string; bidId: string }) =>
      apiRequest<EquipmentBidItem>(`/equipment-requests/${requestId}/bids/${bidId}/accept`, { method: 'PATCH' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

export function useRejectBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, bidId }: { requestId: string; bidId: string }) =>
      apiRequest<EquipmentBidItem>(`/equipment-requests/${requestId}/bids/${bidId}/reject`, { method: 'PATCH' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment-requests'] }); },
  });
}

// ═══════════════════════════════════════
// Operators
// ═══════════════════════════════════════

export function useOperatorListings(params?: Record<string, string>, enabled = true) {
  const qs = new URLSearchParams(params).toString();
  return useQuery<Paginated<OperatorListingItem>>({
    queryKey: ['operators', params],
    queryFn: () => apiRequest(`/operators${qs ? `?${qs}` : ''}`),
    enabled,
  });
}

export function useOperatorListing(id: string) {
  return useQuery<OperatorListingItem>({
    queryKey: ['operators', id],
    queryFn: () => apiRequest(`/operators/${id}`),
    enabled: !!id,
  });
}

export function useMyOperatorListings() {
  return useMyListingsHook<OperatorListingItem>('operators', '/operators/my');
}

export function useCreateOperatorListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<OperatorListingItem>('/operators', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operators'] }); },
  });
}

export function useUpdateOperatorListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<OperatorListingItem>(`/operators/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operators'] }); },
  });
}

export function useDeleteOperatorListing() {
  return useDeleteListingHook('operators', (id) => `/operators/${id}`);
}
