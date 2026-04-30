/**
 * @deprecated — Replaced by FilterSidebar + BrowseGlobalShell unified search.
 * All filtering now uses URL params consumed by useGlobalSearch.
 * Scheduled for removal in a future sprint.
 */
'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Search, X, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import type { 
  FilterBarProps, 
  FilterBarFieldConfig,
  FilterBarOption 
} from '../types/filter-bar.types'

// ── Types ────────────────────────────────────────────────────────────────────

interface FilterContentProps {
  field: FilterBarFieldConfig
  value: string | null
  onSelect: (value: string | null) => void
}

interface FieldButtonProps {
  field: FilterBarFieldConfig
  value?: string
  isActive: boolean
  onClick: () => void
  onClear?: () => void
  ref?: React.Ref<HTMLButtonElement>
}

// ── Range Fields (extracted to comply with rules-of-hooks) ──────────────────

function RangeFields({
  field,
  value,
  onSelect,
}: {
  field: FilterBarFieldConfig
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
          <label className="block text-xs font-bold text-on-surface-variant mb-2">من</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder={field.min?.toString()}
            className={clsx(
              'w-full h-11 px-4 rounded-lg text-sm text-right',
              'bg-surface-container border border-outline-variant/20',
              'outline-none transition-all duration-200',
              'focus:border-primary focus:ring-1 focus:ring-primary/30',
              'hover:border-outline-variant/40'
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-on-surface-variant mb-2">إلى</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder={field.max?.toString()}
            className={clsx(
              'w-full h-11 px-4 rounded-lg text-sm text-right',
              'bg-surface-container border border-outline-variant/20',
              'outline-none transition-all duration-200',
              'focus:border-primary focus:ring-1 focus:ring-primary/30',
              'hover:border-outline-variant/40'
            )}
          />
        </div>
      </div>
      {field.unit && (
        <p className="text-xs text-on-surface-variant/70 text-center">{field.unit}</p>
      )}
      <Button
        onClick={() => {
          const val = localMin || localMax ? `${localMin}|${localMax}` : null
          onSelect(val)
        }}
        className="w-full h-11"
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
        <div className="max-h-60 overflow-y-auto no-scrollbar pb-1">
          {/* Clear option */}
          <button
            onClick={() => onSelect(null)}
            className={clsx(
              'w-full text-right px-4 py-3 text-sm transition-all duration-200',
              value === null
                ? 'bg-primary/15 text-primary font-bold'
                : 'text-on-surface font-medium hover:bg-surface-container hover:text-primary'
            )}
          >
            {field.placeholder || 'الكل'}
          </button>
          
          {field.options?.map((opt: FilterBarOption) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onSelect(isSelected ? null : opt.value)}
                className={clsx(
                  'w-full text-right px-4 py-3 text-sm transition-all duration-200',
                  'border-t border-outline-variant/10',
                  isSelected
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-on-surface font-medium hover:bg-surface-container hover:text-primary'
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  {opt.label}
                  {isSelected && <Check size={16} className="text-primary shrink-0" />}
                </span>
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
  field: FilterBarFieldConfig
  value?: string
  isActive: boolean
  onClick: () => void
  onClear?: () => void
}

const FieldButton = React.forwardRef<HTMLButtonElement, FieldButtonProps>(
  ({ field, value, isActive, onClick, onClear, ...props }, ref) => {
    const Icon = field.icon

    return (
      <button
        ref={ref}
        onClick={onClick}
        {...props}
      className={clsx(
        'group relative flex-1 min-w-0 h-full px-4 py-3 text-right',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-inset',
        'active:scale-[0.98]',
        field.isPrimary 
          ? 'bg-surface-container hover:bg-surface-container-high' 
          : 'hover:bg-surface-container/50'
      )}
    >
      <div className="flex items-start gap-2">
        <div className={clsx(
          'mt-0.5 transition-colors duration-150',
          isActive 
            ? 'text-primary' 
            : 'text-on-surface-variant/60 group-hover:text-on-surface-variant'
        )}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-on-surface/80 mb-0.5">
            {field.label}
          </div>
          <div className={clsx(
            'text-sm truncate font-medium transition-colors duration-150',
            isActive 
              ? 'text-on-surface' 
              : 'text-on-surface-variant/70 group-hover:text-on-surface/80'
          )}>
            {value || field.placeholder}
          </div>
        </div>
      </div>

      {isActive && (
        <div className="absolute top-2 left-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClear?.() }}
            className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center',
              'bg-surface-container-high hover:bg-surface-container-highest',
              'transition-all duration-150 ease-out',
              'active:scale-90 hover:shadow-sm'
            )}
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

// ── Helper: Format field value ────────────────────────────────────────────────

function formatFieldValue(
  field: FilterBarFieldConfig, 
  value: string | undefined
): string | undefined {
  if (!value) return undefined

  if (field.type === 'select') {
    const option = field.options?.find(o => o.value === value)
    return option?.label
  }

  if (field.type === 'range' && value.includes('|')) {
    const [mn, mx] = value.split('|')
    if (mn && mx) return `${Number(mn).toLocaleString()} - ${Number(mx).toLocaleString()}`
    if (mn) return `من ${Number(mn).toLocaleString()}`
    if (mx) return `حتى ${Number(mx).toLocaleString()}`
  }

  return value
}

// ── Main FilterBar Component ─────────────────────────────────────────────────

export function FilterBar({
  config,
  values,
  onChange,
  onSearch,
  searchPlaceholder = 'ابحث...',
  showActiveBadge = true,
}: FilterBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter to only show fields that should appear in the bar
  const barFields = config.filter(f => f.showInBar !== false)

  const handleFieldClick = useCallback((key: string) => {
    setActiveDropdown(activeDropdown === key ? null : key)
  }, [activeDropdown])

  const handleClear = useCallback((key: string) => {
    onChange(key, null)
  }, [onChange])

  const handleSearch = useCallback(() => {
    onSearch?.(searchQuery)
  }, [onSearch, searchQuery])

  const activeFieldsCount = barFields.filter(f => !!values[f.key]).length

  return (
    <div className="relative w-full">
      {/* Main Container */}
      <div className={clsx(
        'relative flex items-stretch',
        'bg-surface-container-low rounded-xl',
        'border border-outline-variant/30',
        'shadow-sm hover:shadow-ambient hover:border-outline-variant/50',
        'transition-all duration-200 ease-out',
        'overflow-hidden hover:scale-[1.005]'
      )}>

        {/* Config-Driven Fields */}
        {barFields.map((field, index) => {
          const value = formatFieldValue(field, values[field.key] as string | undefined)
          const isActive = !!value
          const isOpen = activeDropdown === field.key

          return (
            <div key={field.key} className="relative flex-1 min-w-0">
              {/* Divider */}
              {index > 0 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-outline-variant/30" />
              )}

              <Popover 
                open={isOpen} 
                onOpenChange={(open) => setActiveDropdown(open ? field.key : null)}
              >
                <PopoverTrigger asChild>
                  <FieldButton
                    field={field}
                    value={value}
                    isActive={isActive}
                    onClick={() => handleFieldClick(field.key)}
                    onClear={() => handleClear(field.key)}
                  />
                </PopoverTrigger>
                
                {(field.type === 'select' || field.type === 'range') && (
                  <PopoverContent 
                    align="end"
                    sideOffset={8}
                    className={clsx(
                      'w-[280px] p-0 bg-surface-container-lowest/95 backdrop-blur-2xl',
                      'rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
                      'border border-outline-variant/20',
                      'overflow-hidden flex flex-col',
                      'search-dropdown-enter'
                    )}
                  >
                    <FilterContent
                      field={field}
                      value={values[field.key] as string | null}
                      onSelect={(val) => {
                        onChange(field.key, val)
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
          'relative flex-[1.3] min-w-0',
          'bg-surface-container/50 hover:bg-surface-container',
          'transition-all duration-200 ease-out',
          barFields.length > 0 && 'border-r border-outline-variant/20',
          'focus-within:bg-surface-container-high',
          'focus-within:ring-1 focus-within:ring-primary/10'
        )}>
          <button
            className="w-full h-full px-4 py-3 text-right flex items-start gap-2 group"
            onClick={() => searchInputRef.current?.focus()}
          >
            <div className="mt-0.5 text-primary">
              <Search size={18} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-on-surface/80 mb-0.5">
                بحث
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchPlaceholder}
                className={clsx(
                  'w-full bg-transparent text-sm text-on-surface',
                  'placeholder:text-on-surface-variant/50',
                  'outline-none text-right',
                  'transition-all duration-150'
                )}
              />
            </div>
          </button>
        </div>

        {/* Search Button */}
        <div className="p-2 flex items-center">
          <Button 
            onClick={handleSearch} 
            className="h-10 px-6 rounded-xl active:scale-95 transition-transform duration-150"
          >
            <Search size={18} />
            <span className="hidden sm:inline">بحث</span>
          </Button>
        </div>
      </div>

      {/* Active Filters Badge */}
      {showActiveBadge && activeFieldsCount > 0 && (
        <div className="absolute -top-2 right-6 flex items-center gap-1.5">
          <span className={clsx(
            'px-2.5 py-0.5 rounded-full',
            'bg-primary text-on-primary',
            'text-xs font-bold shadow-sm'
          )}>
            {activeFieldsCount} فلتر
          </span>
        </div>
      )}
    </div>
  )
}
