/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Search Engine Configuration — Single Source of Truth
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * All search-related mappings live HERE. No scattered constants.
 *
 * UI uses `category` (cars, buses, jobs, ...)
 * API uses `entityType` (listings, buses, jobs, ...)
 */

import type { FilterField, SortOption } from '../types/filters.types'
import { GOVERNORATE_OPTIONS } from './shared'

// ── Category ↔ Entity Type Mapping ──────────────────────────────────────────
//
// IMPORTANT: This mapping is strictly 1:1.
// Each UI category maps to exactly one Meilisearch index (entity type).
// If a single entity (e.g. `listings`) ever needs to serve multiple
// categories (e.g. `cars` + `real-estate`), you must add a discriminator
// field (e.g. `listingCategory`) inside the index and filter on it.

export type SearchCategory = 'cars' | 'buses' | 'parts' | 'services' | 'jobs'
export type MeiliEntityType = 'listings' | 'buses' | 'parts' | 'services' | 'jobs'

export const CATEGORY_TO_ENTITY: Record<SearchCategory, MeiliEntityType> = {
  cars:      'listings',
  buses:     'buses',
  parts:     'parts',
  services:  'services',
  jobs:      'jobs',
}

export const ENTITY_TO_CATEGORY: Record<MeiliEntityType, SearchCategory> = {
  listings:  'cars',
  buses:     'buses',
  parts:     'parts',
  services:  'services',
  jobs:      'jobs',
}

export const ALL_SEARCH_CATEGORIES: SearchCategory[] = [
  'cars', 'buses', 'parts', 'services', 'jobs',
]

// ── Per-Category Filterable Fields (matches Meilisearch filterableAttributes) ─

export const CATEGORY_FILTERABLE_FIELDS: Record<SearchCategory, string[]> = {
  cars:      ['make', 'model', 'year', 'fuelType', 'transmission', 'condition', 'listingType'],
  buses:     ['make', 'busType', 'busListingType', 'capacity'],
  parts:     ['partCategory', 'condition', 'isOriginal'],
  services:  ['serviceType', 'providerType', 'isHomeService'],
  jobs:      ['jobType', 'employmentType'],
}

/** Filters available on ALL categories */
export const SHARED_FILTERABLE_FIELDS = ['governorate', 'city', 'minPrice', 'maxPrice'] as const

// ── Sort Options ────────────────────────────────────────────────────────────

export const SEARCH_SORT_OPTIONS: SortOption[] = [
  { value: '',           labelAr: 'الأكثر صلة' },
  { value: 'newest',     labelAr: 'الأحدث' },
  { value: 'price:asc',  labelAr: 'السعر: الأقل' },
  { value: 'price:desc', labelAr: 'السعر: الأعلى' },
]

// ── UI Metadata ─────────────────────────────────────────────────────────────

export interface SearchCategoryMeta {
  labelAr: string
  labelEn: string
  icon: string        // Material Symbols icon name
  color: string       // Tailwind gradient
}

export const CATEGORY_META: Record<SearchCategory, SearchCategoryMeta> = {
  cars:      { labelAr: 'سيارات',     labelEn: 'Cars',       icon: 'directions_car',   color: 'from-blue-500 to-blue-600' },
  buses:     { labelAr: 'حافلات',     labelEn: 'Buses',      icon: 'directions_bus',   color: 'from-emerald-500 to-emerald-600' },
  parts:     { labelAr: 'قطع غيار',   labelEn: 'Parts',      icon: 'settings',         color: 'from-amber-500 to-amber-600' },
  services:  { labelAr: 'خدمات',      labelEn: 'Services',   icon: 'build',            color: 'from-purple-500 to-purple-600' },
  jobs:      { labelAr: 'وظائف',      labelEn: 'Jobs',       icon: 'work',             color: 'from-rose-500 to-rose-600' },
}

// ── Shared Filter Fields for FilterSidebar ──────────────────────────────────

export const GLOBAL_SHARED_FILTERS: FilterField[] = [
  {
    key: 'governorate',
    labelAr: 'المحافظة',
    type: 'select',
    primary: true,
    options: GOVERNORATE_OPTIONS,
  },
  {
    key: 'priceMin_priceMax',
    labelAr: 'السعر',
    type: 'range',
    primary: true,
    min: 0,
    max: 100000,
    unit: 'ر.ع',
  },
]

// ── Favorite Entity Type Map ────────────────────────────────────────────────

export const FAVORITE_ENTITY_TYPE: Record<SearchCategory, string> = {
  cars:      'LISTING',
  buses:     'BUS_LISTING',
  parts:     'SPARE_PART',
  services:  'CAR_SERVICE',
  jobs:      'JOB',
}

// ── Detail Page Href Builder ────────────────────────────────────────────────

export function buildDetailHref(category: SearchCategory, id: string, slug?: string): string {
  switch (category) {
    case 'cars':      return `/sale/car/${id}`
    case 'buses':     return `/sale/bus/${id}`
    case 'parts':     return `/sale/part/${id}`
    case 'services':  return `/sale/service/${id}`
    case 'jobs':      return `/jobs/${slug || id}`
    default:          return `/sale/car/${id}`
  }
}

// ── Filter Cleanup Helper ───────────────────────────────────────────────────

/**
 * Returns the union of ALL category-specific filter keys.
 * Used to strip stale filters when switching categories
 * (e.g. clearing `make` when going from cars → jobs).
 */
export function getAllCategorySpecificKeys(): Set<string> {
  const keys = new Set<string>()
  for (const fields of Object.values(CATEGORY_FILTERABLE_FIELDS)) {
    for (const f of fields) keys.add(f)
  }
  return keys
}

