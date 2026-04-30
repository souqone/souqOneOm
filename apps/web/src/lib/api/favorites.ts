import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getAuthToken } from '../auth';
import type { ListingItem } from './listings';

export type EntityType =
  | 'LISTING'
  | 'JOB'
  | 'SPARE_PART'
  | 'CAR_SERVICE'
  | 'BUS_LISTING'
  | 'EQUIPMENT_LISTING'
  | 'OPERATOR_LISTING'
;

export interface FavoriteEntity {
  id: string;
  title: string;
  image: string | null;
}

export interface FavoriteItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  createdAt: string;
  listing?: ListingItem | null;
  entity?: FavoriteEntity | null;
}

export interface FavoritesResponse {
  items: FavoriteItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useFavorites(entityType?: EntityType) {
  const params = new URLSearchParams();
  if (entityType) params.set('type', entityType);
  const qs = params.toString();
  return useQuery<FavoritesResponse>({
    queryKey: ['favorites', entityType || 'all'],
    queryFn: () => apiRequest<FavoritesResponse>(`/favorites${qs ? `?${qs}` : ''}`),
    enabled: !!getAuthToken(),
  });
}

export function useFavoriteIds() {
  return useQuery<string[]>({
    queryKey: ['favorite-ids'],
    queryFn: () => apiRequest<string[]>('/favorites/ids'),
    staleTime: 30_000,
    enabled: !!getAuthToken(),
  });
}

export function useCheckFavorite(listingId: string) {
  return useQuery<{ favorited: boolean }>({
    queryKey: ['favorite-check', 'LISTING', listingId],
    queryFn: () => apiRequest<{ favorited: boolean }>(`/favorites/check/${listingId}`),
    enabled: !!listingId && !!getAuthToken(),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: EntityType; entityId: string }) =>
      apiRequest(`/favorites/${entityType}/${entityId}`, { method: 'POST' }),
    onSuccess: (_data, { entityType, entityId }) => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['favorite-ids'] });
      qc.invalidateQueries({ queryKey: ['favorite-check', entityType, entityId] });
    },
  });
}
