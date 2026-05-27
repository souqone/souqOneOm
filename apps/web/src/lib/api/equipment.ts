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
  monthlyPrice?: string;
  currency: string;
  isPriceNegotiable: boolean;
  withOperator: boolean;
  budgetMin?: string;
  budgetMax?: string;
  rentalDuration?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  siteDetails?: string;
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
