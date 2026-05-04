import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyListings as useMyListingsHook } from '@/features/shared/hooks/useMyListings';
import { useDeleteListing as useDeleteListingHook } from '@/features/shared/hooks/useDeleteListing';
import { apiRequest } from '../auth';

export interface SparePartItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  partCategory: string;
  condition: string;
  partNumber?: string;
  compatibleMakes: string[];
  compatibleModels: string[];
  yearFrom?: number;
  yearTo?: number;
  isOriginal: boolean;
  price: string;
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
  sellerId: string;
  seller: { id: string; username: string; displayName?: string; avatarUrl?: string; phone?: string; governorate?: string; isVerified?: boolean; createdAt?: string };
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedParts {
  items: SparePartItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useParts(params?: Record<string, string>, enabled = true) {
  const searchParams = new URLSearchParams(params);
  const qs = searchParams.toString();
  return useQuery<PaginatedParts>({
    queryKey: ['parts', params],
    queryFn: () => apiRequest(`/parts${qs ? `?${qs}` : ''}`),
    enabled,
  });
}

export function usePart(id: string) {
  return useQuery<SparePartItem>({
    queryKey: ['parts', id],
    queryFn: () => apiRequest(`/parts/${id}`),
    enabled: !!id,
  });
}

export function useMyParts() {
  return useMyListingsHook<SparePartItem>('parts', '/parts/my');
}

export function useCreatePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<SparePartItem>('/parts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); },
  });
}

export function useUpdatePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<SparePartItem>(`/parts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); },
  });
}

export function useRemovePartImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      apiRequest(`/uploads/parts/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parts'] }); },
  });
}

export function useDeletePart() {
  return useDeleteListingHook('parts', (id) => `/parts/${id}`);
}
