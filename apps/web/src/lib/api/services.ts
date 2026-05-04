import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyListings as useMyListingsHook } from '@/features/shared/hooks/useMyListings';
import { useDeleteListing as useDeleteListingHook } from '@/features/shared/hooks/useDeleteListing';
import { apiRequest } from '../auth';

export interface CarServiceItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  serviceType: string;
  providerType: string;
  providerName: string;
  specializations: string[];
  priceFrom?: string;
  priceTo?: string;
  currency: string;
  isHomeService: boolean;
  workingHoursOpen?: string;
  workingHoursClose?: string;
  workingDays: string[];
  governorate: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  whatsapp?: string;
  website?: string;
  status: string;
  viewCount: number;
  userId: string;
  user: { id: string; username: string; displayName?: string; avatarUrl?: string; phone?: string; governorate?: string; isVerified?: boolean; createdAt?: string };
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedServices {
  items: CarServiceItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useCarServices(params?: Record<string, string>, enabled = true) {
  const searchParams = new URLSearchParams(params);
  const qs = searchParams.toString();
  return useQuery<PaginatedServices>({
    queryKey: ['services', params],
    queryFn: () => apiRequest(`/services${qs ? `?${qs}` : ''}`),
    enabled,
  });
}

export function useCarService(id: string) {
  return useQuery<CarServiceItem>({
    queryKey: ['services', id],
    queryFn: () => apiRequest(`/services/${id}`),
    enabled: !!id,
  });
}

export function useMyCarServices() {
  return useMyListingsHook<CarServiceItem>('services', '/services/my');
}

export function useCarServiceBySlug(slug: string) {
  return useQuery<CarServiceItem>({
    queryKey: ['services', 'slug', slug],
    queryFn: () => apiRequest(`/services/slug/${slug}`),
    enabled: !!slug,
  });
}

export function useToggleCarServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<CarServiceItem>(`/services/${id}/status`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useCreateCarService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<CarServiceItem>('/services', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); },
  });
}

export function useUpdateCarService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<CarServiceItem>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); },
  });
}

export function useRemoveServiceImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) =>
      apiRequest(`/uploads/services/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); },
  });
}

export function useDeleteCarService() {
  return useDeleteListingHook('services', (id) => `/services/${id}`);
}
