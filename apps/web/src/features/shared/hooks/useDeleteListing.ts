import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/auth'

/**
 * Generic hook — deletes any listing by id.
 * Re-exported from each api/<entity>.ts as a typed wrapper to preserve
 * existing call-site names.
 */
export function useDeleteListing(
  entityType: string,
  endpointFn: (id: string) => string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiRequest(endpointFn(id), { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [entityType] }) },
  })
}
