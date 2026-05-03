'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useSearch, type SearchHit } from '@/lib/api/search'
import { resolveLocationLabel } from '@/lib/location-data'
import { getImageUrl } from '@/lib/image-utils'
import type { ActiveFilters } from '../types/filters.types'
import type { UnifiedListingItem } from '../types/unified-item.types'
import {
  CATEGORY_TO_ENTITY,
  ENTITY_TO_CATEGORY,
  FAVORITE_ENTITY_TYPE,
  buildDetailHref,
  type SearchCategory,
  type MeiliEntityType,
} from '../config/search-engine.config'

// ── Return type ──────────────────────────────────────────────────────────────

interface UseGlobalSearchReturn {
  items:      UnifiedListingItem[]
  total:      number
  totalPages: number
  isLoading:  boolean
  isFetching: boolean
  error:      Error | null
  page:       number
}

interface UseGlobalSearchOptions {
  /** Search query */
  q?: string
  /** UI category (cars, buses, jobs, ...) — mapped to entityType internally */
  category?: SearchCategory | ''
  /** Active filters from URL */
  filters?: ActiveFilters
  /** 1-based page */
  page?: number
}

import type { ListingCategory } from '../types/category.types'

// ── Hit → Unified mapper ────────────────────────────────────────────────────

function hitToUnified(hit: SearchHit, locale: string): UnifiedListingItem {
  const entityType = (hit._entityType ?? '').toLowerCase() as MeiliEntityType
  const rawCategory = ENTITY_TO_CATEGORY[entityType] ?? 'cars'
  const category = rawCategory as ListingCategory

  const price = (hit.price ?? hit.basePrice ?? hit.priceFrom ?? null) as number | null
  const image = hit.imageUrl ? getImageUrl(hit.imageUrl) ?? null : null

  return {
    id:                  hit.id,
    category,
    title:               hit.title,
    price:               price && Number(price) > 0 ? Number(price) : null,
    priceLabel:          null,
    currency:            hit.currency || 'OMR',
    images:              image ? [image] : [],
    governorate:         hit.governorate ?? null,
    createdAt:           typeof hit.createdAt === 'string' ? hit.createdAt : new Date(Number(hit.createdAt) || Date.now()).toISOString(),
    primaryBadge:        null,
    secondaryBadge:      null,
    details:             [],
    href:                buildDetailHref(rawCategory, hit.id, hit.slug),
    favoriteEntityType:  FAVORITE_ENTITY_TYPE[rawCategory] ?? 'LISTING',
    attributes: {
      slug:        hit.slug,
      make:        hit.make,
      model:       hit.model,
      year:        hit.year,
      condition:   hit.condition,
      city:        hit.city,
      _entityType: hit._entityType,
      _resolvedLocation: hit.governorate ? resolveLocationLabel(hit.governorate, locale) : undefined,
    },
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGlobalSearch({
  q,
  category,
  filters = {},
  page = 1,
}: UseGlobalSearchOptions): UseGlobalSearchReturn {
  const locale = useLocale()

  // Map UI category → Meilisearch entityType
  const entityType = category ? CATEGORY_TO_ENTITY[category] : undefined

  // Extract filters
  const governorate = (filters.governorate as string) || undefined
  const priceRange = filters['priceMin_priceMax'] as string | undefined
  const [pmin, pmax] = priceRange ? priceRange.split('|') : []

  const sort = (filters.sort as string) || ''
  const sortBy = sort === 'price:asc' ? 'price:asc'
    : sort === 'price:desc' ? 'price:desc'
    : sort === 'newest' ? 'newest'
    : undefined

  // Advanced filters (per-category)
  const make        = (filters.make as string) || undefined
  const model       = (filters.model as string) || undefined
  const condition   = (filters.condition as string) || undefined
  const listingType = (filters.listingType as string) || undefined

  const query = useSearch(
    {
      q:          q || undefined,
      entityType,
      governorate,
      minPrice:   pmin ? Number(pmin) : undefined,
      maxPrice:   pmax ? Number(pmax) : undefined,
      make,
      model,
      condition,
      listingType,
      sortBy,
      page,
      limit:      24,
    },
    Boolean(q || entityType || governorate),
  )

  const items = useMemo<UnifiedListingItem[]>(() => {
    const list = query.data?.items ?? []
    return list.map((hit) => hitToUnified(hit, locale))
  }, [query.data, locale])

  return {
    items,
    total:      query.data?.meta?.total      ?? 0,
    totalPages: query.data?.meta?.totalPages ?? 0,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    error:      query.error as Error | null,
    page,
  }
}
