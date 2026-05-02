import type { ActiveFilters, FilterField } from '../types/filters.types'
import type { ListingCategory } from '../types/category.types'

export function parseRangeKey(key: string): [string, string] | null {
  if (!key.includes('_')) return null
  const parts = key.split('_')
  if (parts.length === 2) return [parts[0], parts[1]]
  const mid = Math.floor(parts.length / 2)
  return [parts.slice(0, mid).join(''), parts.slice(mid).join('')]
}

export function buildQueryParams(
  filters: ActiveFilters,
  config: FilterField[],
): Record<string, string> {
  const params: Record<string, string> = {}

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue

    // Pass-through secondary/child filter keys directly
    if (key === 'city' || key === 'model') {
      params[key] = value as string
      continue
    }

    // Pass-through system keys (map 'q' to 'search' for backend)
    if (key === 'q') {
      params['search'] = value as string
      continue
    }
    if (key === 'sort') {
      const val = value as string
      if (val.includes('_')) {
        const [sortBy, sortDir] = val.split('_')
        params['sortBy'] = sortBy
        params['sortOrder'] = sortDir
      } else {
        params['sortBy'] = val
      }
      continue
    }

    const field = config.find(f => f.key === key)
    if (!field) continue

    if (field.type === 'range') {
      const parsed = parseRangeKey(key)
      const [minKey, maxKey] = parsed ?? [key + 'Min', key + 'Max']
      const [min, max] = (value as string).split('|')
      if (min) params[minKey] = min
      if (max) params[maxKey] = max
    } else if (field.type === 'multiselect' && Array.isArray(value)) {
      params[key] = (value as string[]).join(',')
    } else if (field.type === 'toggle') {
      if (value === 'true') params[key] = 'true'
    } else {
      params[key] = value as string
    }
  }

  return params
}

export function parseUrlFilters(
  searchParams: URLSearchParams,
  config: FilterField[],
): ActiveFilters {
  const filters: ActiveFilters = {}

  for (const field of config) {
    if (field.type === 'range') {
      const parsed = parseRangeKey(field.key)
      const [minKey, maxKey] = parsed ?? [field.key + 'Min', field.key + 'Max']
      const min = searchParams.get(minKey)
      const max = searchParams.get(maxKey)
      if (min || max) {
        filters[field.key] = `${min ?? ''}|${max ?? ''}`
      }
    } else if (field.type === 'toggle') {
      if (searchParams.get(field.key) === 'true') {
        filters[field.key] = 'true'
      }
    } else if (field.type === 'multiselect') {
      const val = searchParams.get(field.key)
      if (val) filters[field.key] = val.split(',')
    } else if (field.type === 'governorate_wilayat') {
      const val = searchParams.get(field.key)
      if (val) filters[field.key] = val
    } else if (field.type === 'make_model') {
      const val = searchParams.get(field.key)
      if (val) filters[field.key] = val
    } else {
      const val = searchParams.get(field.key)
      if (val) filters[field.key] = val
    }
  }

  // Always read child and system keys directly from URL
  const city = searchParams.get('city')
  if (city) filters['city'] = city

  const model = searchParams.get('model')
  if (model) filters['model'] = model

  const q = searchParams.get('q')
  if (q) filters['q'] = q

  const sort = searchParams.get('sort')
  if (sort) filters['sort'] = sort

  return filters
}

export function countActiveFilters(filters: ActiveFilters): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'sort' || key === 'page') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') {
      if (value.includes('|')) return value !== '|'
      return value !== ''
    }
    return Boolean(value)
  }).length
}

export function removeFilter(filters: ActiveFilters, key: string): ActiveFilters {
  const next = { ...filters }
  delete next[key]
  return next
}

export function formatFilterLabel(
  _key: string,
  value: string | string[],
  _category: ListingCategory,
): string {
  if (Array.isArray(value)) return value.join('، ')
  if (typeof value === 'string' && value.includes('|')) {
    const [min, max] = value.split('|')
    if (min && max) return `${min}  ${max}`
    if (min) return `من ${min}`
    if (max) return `حتى ${max}`
  }
  if (value === 'true') return 'نعم'
  return value
}

export function getAddListingHref(category: ListingCategory): string {
  const map: Record<ListingCategory, string> = {
    cars:      '/add-listing/car',
    buses:     '/add-listing/bus',
    equipment: '/add-listing/equipment',
    'equipment-requests': '/equipment/requests/new',
    operators: '/add-listing/operator',
    parts:     '/add-listing/parts',
    services:  '/add-listing/service',
  }
  return map[category]
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `منذ ${mins} دقيقة`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `منذ ${hrs} ساعة`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `منذ ${days} يوم`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `منذ ${weeks} أسبوع`
  return `منذ ${Math.floor(days / 30)} شهر`
}