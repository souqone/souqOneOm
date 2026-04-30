'use client'

import { X } from 'lucide-react'
import { clsx } from 'clsx'
import type { ActiveFilters as ActiveFiltersType } from '../types/filters.types'
import type { ListingCategory } from '../types/category.types'
import { FILTERS_CONFIG } from '../config/filters.config'
import { GLOBAL_SHARED_FILTERS } from '../config/search-engine.config'
import { WILAYAT_BY_GOVERNORATE, GOVERNORATE_OPTIONS } from '../config/shared'
import { useBrands, useCarModels, CarBrand, CarModelItem } from '@/lib/api'

// ── Props ─────────────────────────────────────────────────────────────────────

interface ActiveFiltersProps {
  category: ListingCategory
  filters: ActiveFiltersType
  onRemove: (key: string) => void
  onClearAll: () => void
}

// ── Label Helper ──────────────────────────────────────────────────────────────

function buildLabel(
  key: string,
  value: string | string[],
  category: ListingCategory,
  brands: CarBrand[],
  models: CarModelItem[]
): string {
  // Special: city key
  if (key === 'city') {
    const str = Array.isArray(value) ? value[0] : value
    // Search all governorates' wilayats
    for (const wilayats of Object.values(WILAYAT_BY_GOVERNORATE)) {
      const found = wilayats.find(w => w.value === str)
      if (found) return found.labelAr
    }
    return str
  }

  // Special: model key
  if (key === 'model') {
    const str = Array.isArray(value) ? value[0] : value
    const found = models.find(m => m.name === str)
    return found ? (found.nameAr || found.name) : str
  }

  const config = category === '__global__' as any ? GLOBAL_SHARED_FILTERS : FILTERS_CONFIG[category]
  const field = config.find(f => f.key === key)
  if (!field) return Array.isArray(value) ? value.join('، ') : value

  // governorate_wilayat: show governorate label
  if (field.type === 'governorate_wilayat') {
    const str = Array.isArray(value) ? value[0] : value
    return GOVERNORATE_OPTIONS.find(g => g.value === str)?.labelAr ?? str
  }

  // make_model: show make label
  if (field.type === 'make_model') {
    const str = Array.isArray(value) ? value[0] : value
    const found = brands.find(b => b.name === str)
    return found ? (found.nameAr || found.name) : str
  }

  if (field.type === 'range') {
    const str = Array.isArray(value) ? value[0] : value
    const [mn, mx] = str.split('|')
    const fmt = (v: string) => v ? Number(v).toLocaleString('ar-EG') : ''
    const unit = field.unit ? ` ${field.unit}` : ''
    if (mn && mx) return `${fmt(mn)} — ${fmt(mx)}${unit}`
    if (mn) return `من ${fmt(mn)}${unit}`
    return `حتى ${fmt(mx ?? '')}${unit}`
  }

  if (field.type === 'toggle') return field.labelAr

  if (field.type === 'multiselect') {
    const vals = Array.isArray(value) ? value : value.split(',')
    return vals
      .map(v => field.options?.find(o => o.value === v)?.labelAr ?? v)
      .join('، ')
  }

  // select
  const str = Array.isArray(value) ? value[0] : value
  return field.options?.find(o => o.value === str)?.labelAr ?? str
}

function hasValue(value: string | string[] | undefined): boolean {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  return value !== '' && value !== '|'
}

// ── Tag Component ─────────────────────────────────────────────────────────────

function FilterTag({
  label,
  value,
  onRemove,
}: {
  label: string
  value: string
  onRemove: () => void
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full',
        'bg-gradient-to-l from-primary/8 to-primary/12',
        'border border-primary/20',
        'px-3 py-1.5',
        'animate-in fade-in slide-in-from-top-1 duration-200',
      )}
    >
      {/* Field name */}
      <span className="text-[11px] text-primary/60 font-medium">{label}:</span>
      {/* Value */}
      <span className="text-[11px] text-primary font-semibold">{value}</span>
      {/* Remove */}
      <button
        onClick={onRemove}
        className={clsx(
          'flex items-center justify-center w-4 h-4 rounded-full',
          'text-primary/50 hover:text-primary hover:bg-primary/15',
          'transition-all duration-150 cursor-pointer flex-shrink-0 mr-0.5',
        )}
        aria-label={`إزالة فلتر ${label}`}
      >
        <X size={9} />
      </button>
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ActiveFilters({
  category,
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const { data: brands = [] } = useBrands()
  const makeVal = Array.isArray(filters['make']) ? filters['make'][0] : filters['make']
  const selectedBrand = brands.find(b => b.name === makeVal)
  const { data: models = [] } = useCarModels(selectedBrand?.id ?? '')

  const config = category === '__global__' as any ? GLOBAL_SHARED_FILTERS : FILTERS_CONFIG[category]

  const activeEntries = config
    .filter(field => hasValue(filters[field.key] as string | string[] | undefined))
    .map(field => ({
      key: field.key,
      label: field.type === 'governorate_wilayat' ? 'المحافظة' : field.type === 'make_model' ? 'الماركة' : field.labelAr,
      value: buildLabel(field.key, filters[field.key] as string | string[], category, brands, models),
    }))

  // Add city as separate entry if set
  if (hasValue(filters['city'] as string | undefined)) {
    activeEntries.push({
      key: 'city',
      label: 'الولاية',
      value: buildLabel('city', filters['city'] as string, category, brands, models),
    })
  }

  // Add model as separate entry if set
  if (hasValue(filters['model'] as string | undefined)) {
    activeEntries.push({
      key: 'model',
      label: 'الموديل',
      value: buildLabel('model', filters['model'] as string, category, brands, models),
    })
  }

  if (activeEntries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeEntries.map(entry => (
        <FilterTag
          key={entry.key}
          label={entry.label}
          value={entry.value}
          onRemove={() => onRemove(entry.key)}
        />
      ))}

      {/* Clear all */}
      {activeEntries.length > 1 && (
        <button
          onClick={onClearAll}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'border border-outline-variant/40',
            'text-[11px] text-on-surface-variant',
            'hover:border-on-surface/30 hover:text-on-surface hover:bg-surface-container/50',
            'transition-all duration-150 cursor-pointer',
            'animate-in fade-in duration-200',
          )}
        >
          <X size={10} />
          مسح الكل
        </button>
      )}
    </div>
  )
}