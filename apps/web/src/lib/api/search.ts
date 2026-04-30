import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../auth';

// ── Types ──

export interface SearchHit {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  price?: number;
  basePrice?: number;
  priceFrom?: number;
  currency?: string;
  governorate?: string;
  city?: string;
  make?: string;
  model?: string;
  year?: number;
  condition?: string;
  imageUrl?: string | null;
  status?: string;
  createdAt?: string | number;
  _entityType: string;
  _formatted?: Record<string, string>;
}

export interface SearchResponse {
  items: SearchHit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    processingTimeMs?: number;
  };
}

export interface AutocompleteSuggestion {
  id: string;
  title: string;
  highlighted: string;
  entityType: string;
}

// ── Search params ──

export interface SearchParams {
  q?: string;
  entityType?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  city?: string;
  governorate?: string;
  make?: string;
  model?: string;
  condition?: string;
  listingType?: string;
  sortBy?: 'price:asc' | 'price:desc' | 'newest';
  page?: number;
  limit?: number;
}

// ── Hooks ──

export function useSearch(params: SearchParams, enabled = true) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.set(key, String(value));
    }
  }

  return useQuery<SearchResponse>({
    queryKey: ['search', params],
    queryFn: () => apiRequest<SearchResponse>(`/search?${searchParams.toString()}`),
    enabled: enabled && !!(params.q || params.entityType || params.category || params.governorate),
  });
}

export function useAutocomplete(q: string, limit = 8) {
  return useQuery<AutocompleteSuggestion[]>({
    queryKey: ['autocomplete', q],
    queryFn: () => apiRequest<AutocompleteSuggestion[]>(`/search/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });
}
