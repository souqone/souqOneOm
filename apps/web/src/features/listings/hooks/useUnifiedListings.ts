'use client'

import { useMemo } from 'react'
import { useListings } from '@/lib/api/listings'
import { useBusListings } from '@/lib/api/buses'
import { useEquipmentListings, useOperatorListings } from '@/lib/api/equipment'
import { useParts } from '@/lib/api/parts'
import { useCarServices } from '@/lib/api/services'

import type { ListingCategory } from '../types/category.types'
import type { UnifiedListingItem } from '../types/unified-item.types'
import type { ActiveFilters } from '../types/filters.types'
import { FILTERS_CONFIG } from '../config/filters.config'
import { buildQueryParams } from '../utils/filter-helpers'
import { useItemTransformers } from './useItemTransformers'

// ─── Return type ─────────────────────────────────────────────────────────────

interface UseUnifiedListingsReturn {
  items: UnifiedListingItem[]
  total: number
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  page: number
  totalPages: number
}

// ─── Param builders ───────────────────────────────────────────────────────────

function toParams(filters: ActiveFilters, category: ListingCategory, page: number): Record<string, string> {
  return { ...buildQueryParams(filters, FILTERS_CONFIG[category] ?? []), page: String(page) }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUnifiedListings(
  category: ListingCategory,
  filters: ActiveFilters,
  page = 1,
): UseUnifiedListingsReturn {
  const { transformByCategory } = useItemTransformers()
  const p = toParams(filters, category, page)

  const carsQuery      = useListings(p,    category === 'cars')
  const busesQuery     = useBusListings(p, category === 'buses')
  const equipmentQuery = useEquipmentListings(p, category === 'equipment' || category === 'equipment-requests')
  const operatorsQuery = useOperatorListings(p, category === 'operators')
  const partsQuery     = useParts(p,       category === 'parts')
  const servicesQuery  = useCarServices(p, category === 'services')
  const raw = {
    cars:                 carsQuery.data,
    buses:                busesQuery.data,
    equipment:            equipmentQuery.data,
    'equipment-requests': equipmentQuery.data,
    operators:            operatorsQuery.data,
    parts:                partsQuery.data,
    services:             servicesQuery.data,
  }[category]

  const isLoading = {
    cars:                 carsQuery.isLoading,
    buses:                busesQuery.isLoading,
    equipment:            equipmentQuery.isLoading,
    'equipment-requests': equipmentQuery.isLoading,
    operators:            operatorsQuery.isLoading,
    parts:                partsQuery.isLoading,
    services:             servicesQuery.isLoading,
  }[category]

  const isFetching = {
    cars:                 carsQuery.isFetching,
    buses:                busesQuery.isFetching,
    equipment:            equipmentQuery.isFetching,
    'equipment-requests': equipmentQuery.isFetching,
    operators:            operatorsQuery.isFetching,
    parts:                partsQuery.isFetching,
    services:             servicesQuery.isFetching,
  }[category]

  const error = {
    cars:                 carsQuery.error,
    buses:                busesQuery.error,
    equipment:            equipmentQuery.error,
    'equipment-requests': equipmentQuery.error,
    operators:            operatorsQuery.error,
    parts:                partsQuery.error,
    services:             servicesQuery.error,
  }[category] as Error | null

  const items = useMemo<UnifiedListingItem[]>(() => {
    const list = (raw as any)?.items ?? []
    return list.map((item: unknown) => transformByCategory(category, item))
  }, [raw, category, transformByCategory])

  return {
    items,
    total:      (raw as any)?.meta?.total      ?? 0,
    totalPages: (raw as any)?.meta?.totalPages ?? 0,
    isLoading:  isLoading ?? false,
    isFetching: isFetching ?? false,
    error,
    page,
  }
}
