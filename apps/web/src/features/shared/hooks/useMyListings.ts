import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/auth'

/**
 * Generic hook — fetches the current user's listings for any entity type.
 * Re-exported from each api/<entity>.ts as a typed wrapper to preserve
 * existing call-site names.
 */
export function useMyListings<T>(entityType: string, endpoint: string) {
  return useQuery<T[]>({
    queryKey: [entityType, 'my'],
    queryFn: () => apiRequest<T[]>(endpoint),
  })
}
