/**
 * @deprecated — This component is replaced by the unified search in BrowseGlobalShell.
 * All search now goes through /browse with Meilisearch. Do not use for new features.
 * Scheduled for removal in a future sprint.
 */
'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Search, MapPin, Tag, Banknote, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover'
import clsx from 'clsx'
import type { ListingCategory } from '../types/category.types'
import type { ActiveFilters, FilterField, FilterOption } from '../types/filters.types'
import { FILTERS_CONFIG } from '../config/filters.config'
import { Button } from '@/components/ui/button'

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  category: ListingCategory
  filters: ActiveFilters
  onFilterChange: (key: string, value: string | boolean | null) => void
  onSearch?: (query: string) => void
}

interface FieldConfig {
  key: string
  icon: React.ReactNode
  label: string
  placeholder: string
  isPrimary?: boolean
}

interface FilterContentProps {
  field: FilterField
  value: string | null
  onSelect: (value: string | null) => void
}

// ── Range Fields (extracted to comply with rules-of-hooks) ──────────────

function RangeFields({
  field,
  value,
  onSelect,
}: {
  field: FilterField
  value: string | null
  onSelect: (value: string | null) => void
}) {
  const [min, max] = value?.split('|') || ['', '']
  const [localMin, setLocalMin] = useState(min)
  const [localMax, setLocalMax] = useState(max)

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1.5">من</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder={field.min?.toString()}
            className="w-full h-10 px-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm text-right outline-none transition-all duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-outline-variant/50"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-1.5">إلى</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder={field.max?.toString()}
            className="w-full h-10 px-3 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm text-right outline-none transition-all duration-200 ease-out focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-outline-variant/50"
          />
        </div>
      </div>
      {field.unit && <p className="text-xs text-on-surface-variant">{field.unit}</p>}
      <Button
        onClick={() => {
          const val = localMin || localMax ? `${localMin}|${localMax}` : null
          onSelect(val)
        }}
        className="w-full"
      >
        تطبيق
      </Button>
    </div>
  )
}

// ── Filter Content Component ──────────────────────────────────────────────────────────────────

function FilterContent({ field, value, onSelect }: FilterContentProps) {
  switch (field.type) {
    case 'select':
      return (
        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
          {field.options?.map((opt: FilterOption) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onSelect(isSelected ? null : opt.value)}
                className={clsx(
                  'w-full px-4 py-2.5 text-right text-sm flex items-center justify-between gap-3 transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-on-surface hover:bg-surface-container'
                )}
              >
                <span>{opt.labelAr}</span>
                {isSelected && <Check size={16} className="text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      )

    case 'range':
      return <RangeFields field={field} value={value} onSelect={onSelect} />

    default:
      return null
  }
}

// ── Field Button Component ─────────────────────────────────────────────────

interface FieldButtonProps {
  config: FieldConfig
  value?: string
  isActive: boolean
  onClick: () => void
  onClear?: () => void
}

const FieldButton = React.forwardRef<HTMLButtonElement, FieldButtonProps>(
  ({ config, value, isActive, onClick, onClear, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        {...props}
      className={clsx(
        'group relative flex-1 min-w-0 h-full px-4 py-3 text-right transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset',
        config.isPrimary ? 'bg-surface-container hover:bg-surface-container-high' : 'hover:bg-surface-container/50',
        'active:scale-[0.98]'
      )}
    >
      <div className="flex items-start gap-2">
        <div className={clsx(
          'mt-0.5 transition-colors',
          isActive ? 'text-primary' : 'text-on-surface-variant/60 group-hover:text-on-surface-variant'
        )}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-on-surface/80 mb-0.5">{config.label}</div>
          <div className={clsx(
            'text-sm truncate font-medium transition-colors',
            isActive ? 'text-on-surface' : 'text-on-surface-variant/70 group-hover:text-on-surface/80'
          )}>
            {value || config.placeholder}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 left-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClear?.() }}
            className="w-5 h-5 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center transition-all duration-150 ease-out active:scale-90 hover:shadow-sm"
          >
            <X size={12} className="text-on-surface-variant" />
          </button>
        </div>
      )}
    </button>
  )
  }
)
FieldButton.displayName = 'FieldButton'

// ── Main SearchBar Component ───────────────────────────────────────────────

export function SearchBar({ category, filters, onFilterChange, onSearch }: SearchBarProps) {
  const t = useTranslations('listings')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  const config = FILTERS_CONFIG[category]

  const fields: FieldConfig[] = [
    {
      key: config.find(f => f.key === 'listingType' || f.key === 'busListingType')?.key || 'listingType',
      icon: <Tag size={18} />,
      label: 'الفلترة',
      placeholder: 'الكل'
    },
    {
      key: config.find(f => f.key === 'priceMin_priceMax' || f.key === 'minPrice_maxPrice')?.key || 'price',
      icon: <Banknote size={18} />,
      label: 'السعر',
      placeholder: 'أي سعر'
    },
    {
      key: 'governorate',
      icon: <MapPin size={18} />,
      label: 'الموقع',
      placeholder: 'كل المناطق',
      isPrimary: true
    }
  ].filter(f => config.some(cfg => cfg.key === f.key) || f.key === 'governorate')

  const handleFieldClick = useCallback((key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key)
  }, [activeDropdown])

  const handleSelect = useCallback((key: string, value: string | null) => {
    onFilterChange(key, value)
    setActiveDropdown(null)
  }, [onFilterChange])

  const handleClear = useCallback((key: string) => {
    onFilterChange(key, null)
  }, [onFilterChange])

  const handleSearch = useCallback(() => {
    onSearch?.(searchQuery)
  }, [onSearch, searchQuery])

  const getFieldValue = (key: string): string | undefined => {
    const value = filters[key] as string | undefined
    if (!value) return undefined

    const field = config.find(f => f.key === key)
    if (field?.type === 'select') {
      const option = field.options?.find(o => o.value === value)
      return option?.labelAr
    }
    if (field?.type === 'range' && value.includes('|')) {
      const [mn, mx] = value.split('|')
      if (mn && mx) return `${Number(mn).toLocaleString()} - ${Number(mx).toLocaleString()}`
      if (mn) return `من ${Number(mn).toLocaleString()}`
      if (mx) return `حتى ${Number(mx).toLocaleString()}`
    }
    return value
  }

  const activeFieldsCount = fields.filter(f => !!filters[f.key]).length

  return (
    <div className="relative w-full">
      {/* Search Container */}
      <div className="relative flex items-stretch bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-ambient hover:border-outline-variant/50 transition-all duration-200 ease-out overflow-hidden hover:scale-[1.005]">

        {/* Filter Fields */}
        {fields.map((field, index) => {
          const fieldConfig = config.find(f => f.key === field.key)
          const value = getFieldValue(field.key)
          const isActive = !!value
          const isOpen = activeDropdown === field.key

          return (
            <div key={field.key} className="relative flex-1 min-w-0">
              {index > 0 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-outline-variant/30" />}

              <Popover 
                open={isOpen} 
                onOpenChange={(open) => setActiveDropdown(open ? field.key : null)}
              >
                <PopoverTrigger asChild>
                  <FieldButton
                    config={field}
                    value={value}
                    isActive={isActive}
                    onClick={() => handleFieldClick(field.key)}
                    onClear={() => handleClear(field.key)}
                  />
                </PopoverTrigger>
                {fieldConfig && (
                  <PopoverContent 
                    align="end"
                    sideOffset={8}
                    className="w-[280px] p-0 bg-surface-container-low border border-outline-variant/30 rounded-xl shadow-ambient overflow-hidden"
                  >
                    <FilterContent
                      field={fieldConfig}
                      value={filters[field.key] as string | null}
                      onSelect={(val) => {
                        handleSelect(field.key, val)
                        setActiveDropdown(null)
                      }}
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>
          )
        })}

        {/* Search Input Field */}
        <div className={clsx(
          'relative flex-[1.3] min-w-0 bg-surface-container/50 hover:bg-surface-container transition-all duration-200 ease-out',
          fields.length > 0 && 'border-r border-outline-variant/20',
          'focus-within:bg-surface-container-high focus-within:ring-1 focus-within:ring-primary/10'
        )}>
          <button
            className="w-full h-full px-4 py-3 text-right flex items-start gap-2 group"
            onClick={() => searchInputRef.current?.focus()}
          >
            <div className="mt-0.5 text-primary"><Search size={18} /></div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-on-surface/80 mb-0.5">بحث</div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('sfSearchPlaceholder')}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none text-right transition-all duration-150"
              />
            </div>
          </button>
        </div>

        {/* Search Button */}
        <div className="p-2 flex items-center">
          <Button onClick={handleSearch} className="h-10 px-6 rounded-xl active:scale-95 transition-transform duration-150">
            <Search size={18} />
            <span className="hidden sm:inline">بحث</span>
          </Button>
        </div>
      </div>

      {/* Active Filters Badge */}
      {activeFieldsCount > 0 && (
        <div className="absolute -top-2 right-6 flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm">
            {activeFieldsCount} فلتر
          </span>
        </div>
      )}
    </div>
  )
}
