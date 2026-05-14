'use client'

import { useQueries } from '@tanstack/react-query'
import { apiRequest } from '@/lib/auth'

interface ListingsCountResponse {
  meta: { total: number }
}

export function useBrandCounts(brands: string[]): Record<string, number> {
  const results = useQueries({
    queries: brands.map(brand => ({
      queryKey: ['brand-count', brand],
      queryFn: () =>
        apiRequest<ListingsCountResponse>(
          `/listings?make=${encodeURIComponent(brand)}&limit=1`,
        ),
      staleTime: 1000 * 60 * 10,
      gcTime:    1000 * 60 * 30,
    })),
  })

  const counts: Record<string, number> = {}
  results.forEach((result, i) => {
    if (result.data) counts[brands[i]] = result.data.meta.total
  })
  return counts
}
