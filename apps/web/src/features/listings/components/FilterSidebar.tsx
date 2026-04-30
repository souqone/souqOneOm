'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal, ChevronDown, X, MapPin, Car } from 'lucide-react'
import * as RadixSlider from '@radix-ui/react-slider'
import { clsx } from 'clsx'
import type { ListingCategory } from '../types/category.types'
import type { ActiveFilters, FilterField } from '../types/filters.types'
import { FILTERS_CONFIG } from '../config/filters.config'
import { GLOBAL_SHARED_FILTERS } from '../config/search-engine.config'
import { GOVERNORATE_OPTIONS, WILAYAT_BY_GOVERNORATE } from '../config/shared'
import { useBrands, useCarModels } from '@/lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasValue(value: string | string[] | undefined): boolean {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value !== '' && value !== '|'
  return false
}

function countActive(config: FilterField[], filters: ActiveFilters): number {
  return config.filter(f => hasValue(filters[f.key] as string | string[] | undefined)).length
}

// ── Range Slider ──────────────────────────────────────────────────────────────

function RangeSlider({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: string | undefined
  onChange: (v: string | null) => void
}) {
  const min = field.min ?? 0
  const max = field.max ?? 100000

  const parseValues = useCallback((): [number, number] => {
    if (value && value.includes('|')) {
      const [a, b] = value.split('|')
      return [
        a ? Math.max(min, Math.min(Number(a), max)) : min,
        b ? Math.max(min, Math.min(Number(b), max)) : max,
      ]
    }
    return [min, max]
  }, [value, min, max])

  const [sliderVals, setSliderVals] = useState<[number, number]>(parseValues)

  useEffect(() => {
    setSliderVals(parseValues())
  }, [parseValues])

  const fmt = (n: number) =>
    field.unit === 'راكب'
      ? `${n} راكب`
      : n >= 1000
      ? `${(n / 1000).toLocaleString('ar-EG')}k`
      : String(n)

  const isDefault = sliderVals[0] === min && sliderVals[1] === max

  function commit(vals: [number, number]) {
    if (vals[0] === min && vals[1] === max) {
      onChange(null)
    } else {
      onChange(`${vals[0]}|${vals[1]}`)
    }
  }

  return (
    <div className="px-1 pt-1 pb-2">
      {/* Live value display */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {fmt(sliderVals[0])} {field.unit && field.unit !== 'راكب' ? field.unit : ''}
        </span>
        <span className="text-[10px] text-on-surface-variant/50 mx-1">—</span>
        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {fmt(sliderVals[1])} {field.unit && field.unit !== 'راكب' ? field.unit : ''}
        </span>
      </div>

      {/* Radix Slider */}
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={min}
        max={max}
        step={field.unit === 'راكب' ? 1 : max > 10000 ? 500 : 1}
        value={sliderVals}
        onValueChange={vals => setSliderVals(vals as [number, number])}
        onValueCommit={vals => commit(vals as [number, number])}
        dir="rtl"
      >
        <RadixSlider.Track className="bg-outline-variant/30 relative grow rounded-full h-1.5">
          <RadixSlider.Range className="absolute bg-primary rounded-full h-full" />
        </RadixSlider.Track>
        {[0, 1].map(i => (
          <RadixSlider.Thumb
            key={i}
            className={clsx(
              'block w-4 h-4 bg-white border-2 border-primary rounded-full',
              'shadow-[0_1px_6px_rgba(0,0,0,0.15)]',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30',
              'transition-transform duration-150 cursor-grab active:cursor-grabbing',
            )}
            aria-label={i === 0 ? 'الحد الأدنى' : 'الحد الأقصى'}
          />
        ))}
      </RadixSlider.Root>

      {/* Reset button */}
      {!isDefault && (
        <button
          onClick={() => { setSliderVals([min, max]); onChange(null) }}
          className="mt-3 text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
        >
          <X size={10} />
          إعادة تعيين
        </button>
      )}
    </div>
  )
}

// ── Chip Button ───────────────────────────────────────────────────────────────

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        active
          ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/20 scale-[0.98]'
          : 'bg-background text-on-surface-variant border-outline-variant/50 hover:border-primary/40 hover:text-on-surface hover:bg-surface-container/50',
      )}
    >
      {label}
    </button>
  )
}

// ── Governorate + Wilayat Cascaded Component ────────────────────────────────

function GovernorateWilayatSection({
  govValue,
  cityValue,
  onFiltersChange,
}: {
  govValue: string
  cityValue: string
  onFiltersChange?: (updates: { governorate: string | null; city: string | null }) => void
}) {
  const wilayats = govValue ? (WILAYAT_BY_GOVERNORATE[govValue] ?? []) : []

  return (
    <div className="flex gap-2">
      {/* Governorate dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin size={11} className="text-primary" />
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
            المحافظة
          </span>
        </div>
        <div className="relative">
          <select
            value={govValue}
            onChange={e => {
              const val = e.target.value || null
              onFiltersChange?.({ governorate: val, city: null })
            }}
            className={clsx(
              'auth-select !pl-8 truncate',
              govValue ? 'font-medium text-on-surface' : 'text-on-surface-variant'
            )}
          >
            <option value="">كل المحافظات</option>
            {GOVERNORATE_OPTIONS.map(gov => (
              <option key={gov.value} value={gov.value}>
                {gov.labelAr}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>

      {/* Wilayat dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin size={11} className={clsx("transition-colors", govValue ? "text-primary/70" : "text-outline-variant")} />
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
            الولاية
          </span>
        </div>
        <div className="relative">
          <select
            name="city"
            value={cityValue}
            onChange={e => onFiltersChange?.({ governorate: govValue, city: e.target.value || null })}
            disabled={!govValue || wilayats.length === 0}
            className={clsx(
              'auth-select !pl-8 truncate',
              !govValue || wilayats.length === 0
                ? 'opacity-50 bg-surface-container-high/50 cursor-not-allowed'
                : cityValue
                  ? 'bg-surface-container-low border-primary/30 text-on-surface'
                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-outline-variant/60',
            )}
          >
            <option value="">كل الولايات</option>
            {wilayats.map(w => (
              <option key={w.value} value={w.value}>
                {w.labelAr}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}

// ── Make + Model Cascaded Component ──────────────────────────────────────────

function MakeModelSection({
  makeValue,
  modelValue,
  onFiltersChange,
}: {
  makeValue: string
  modelValue: string
  onFiltersChange?: (updates: Record<string, string | null>) => void
}) {
  const { data: brands = [], isLoading: isBrandsLoading } = useBrands()
  const selectedBrand = brands.find(b => b.name === makeValue)
  const { data: models = [], isLoading: isModelsLoading } = useCarModels(selectedBrand?.id ?? '')

  return (
    <div className="flex gap-2">
      {/* Make dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Car size={11} className="text-primary" />
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
            الماركة
          </span>
        </div>
        <div className="relative">
          <select
            value={makeValue}
            onChange={e => {
              const val = e.target.value || null
              onFiltersChange?.({ make: val, model: null })
            }}
            disabled={isBrandsLoading}
            className={clsx(
              'auth-select !pl-8 truncate',
              isBrandsLoading ? 'opacity-50 cursor-not-allowed text-on-surface-variant/50' :
              makeValue ? 'font-medium text-on-surface' : 'text-on-surface-variant'
            )}
          >
            <option value="">{isBrandsLoading ? 'جاري التحميل...' : 'كل الماركات'}</option>
            {brands.map(b => (
              <option key={b.id} value={b.name}>
                {b.nameAr || b.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>

      {/* Model dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Car size={11} className={clsx("transition-colors", makeValue ? "text-primary/70" : "text-outline-variant")} />
          <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide">
            الموديل
          </span>
        </div>
        <div className="relative">
          <select
            value={modelValue}
            onChange={e => onFiltersChange?.({ model: e.target.value || null })}
            disabled={!makeValue || models.length === 0 || isModelsLoading}
            className={clsx(
              'auth-select !pl-8 truncate',
              !makeValue || models.length === 0 || isModelsLoading
                ? 'opacity-50 cursor-not-allowed text-on-surface-variant/50'
                : modelValue
                ? 'font-medium text-on-surface'
                : 'text-on-surface-variant',
            )}
          >
            <option value="">{isModelsLoading ? 'جاري التحميل...' : 'كل الموديلات'}</option>
            {models.map(m => (
              <option key={m.id} value={m.name}>
                {m.nameAr || m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function SidebarSection({
  field,
  value,
  govValue,
  cityValue,
  modelValue,
  onChange,
  onFiltersChange,
  defaultOpen = false,
  t,
}: {
  field: FilterField
  value: string | string[] | undefined
  govValue?: string
  cityValue?: string
  modelValue?: string
  onChange: (v: string | boolean | null) => void
  onFiltersChange?: (updates: Record<string, string | null>) => void
  defaultOpen?: boolean
  t: (key: string) => string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [optionSearch, setOptionSearch] = useState('')

  const isActive =
    hasValue(value as string | string[] | undefined) ||
    (field.type === 'governorate_wilayat' && !!cityValue) ||
    (field.type === 'make_model' && !!modelValue)

  function renderContent() {
    // ── Select → Chip Grid ──
    if (field.type === 'select') {
      const opts = field.options ?? []
      const cur = (value as string) ?? ''
      return (
        <div className="flex flex-wrap gap-1.5">
          <ChipButton
            label={t('all')}
            active={!cur}
            onClick={() => onChange(null)}
          />
          {opts.map(opt => (
            <ChipButton
              key={opt.value}
              label={opt.labelAr}
              active={cur === opt.value}
              onClick={() => onChange(cur === opt.value ? null : opt.value)}
            />
          ))}
        </div>
      )
    }

    // ── Multiselect → Chip Grid ──
    if (field.type === 'multiselect') {
      const opts = field.options ?? []
      const cur: string[] = typeof value === 'string'
        ? value.split(',').filter(Boolean)
        : (Array.isArray(value) ? value : [])
      const filtered = opts.filter(o =>
        o.labelAr.toLowerCase().includes(optionSearch.toLowerCase()),
      )
      return (
        <div>
          {opts.length > 6 && (
            <input
              placeholder={t('search')}
              value={optionSearch}
              onChange={e => setOptionSearch(e.target.value)}
              className="w-full h-7 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 text-[11px] focus:outline-none focus:border-primary/40 transition-all mb-2"
            />
          )}
          <div className="flex flex-wrap gap-1.5">
            {filtered.map(opt => {
              const checked = cur.includes(opt.value)
              return (
                <ChipButton
                  key={opt.value}
                  label={opt.labelAr}
                  active={checked}
                  onClick={() => {
                    const next = checked
                      ? cur.filter(v => v !== opt.value)
                      : [...cur, opt.value]
                    onChange(next.length ? next.join(',') : null)
                  }}
                />
              )
            })}
          </div>
        </div>
      )
    }

    // ── Range → Dual Slider ──
    if (field.type === 'range') {
      return (
        <RangeSlider
          field={field}
          value={value as string | undefined}
          onChange={onChange}
        />
      )
    }

    // ── Toggle ──
    if (field.type === 'toggle') {
      const on = value === 'true'
      return (
        <div className="flex items-center justify-between py-0.5">
          <span className="text-[12px] text-on-surface-variant">{field.labelAr}</span>
          <button
            onClick={() => onChange(on ? null : 'true')}
            className={clsx(
              'relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20',
              on ? 'bg-primary' : 'bg-outline-variant/60',
            )}
            role="switch"
            aria-checked={on}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200',
                on ? 'start-[calc(100%-18px)]' : 'start-0.5',
              )}
            />
          </button>
        </div>
      )
    }

    // ── Governorate + Wilayat (Cascaded) ──
    if (field.type === 'governorate_wilayat') {
      return (
        <GovernorateWilayatSection
          govValue={govValue ?? ''}
          cityValue={cityValue ?? ''}
          onFiltersChange={(updates) => onFiltersChange?.(updates as any)}
        />
      )
    }

    // ── Make + Model (Cascaded) ──
    if (field.type === 'make_model') {
      return (
        <MakeModelSection
          makeValue={(value as string) ?? ''}
          modelValue={modelValue ?? ''}
          onFiltersChange={onFiltersChange}
        />
      )
    }

    return null
  }

  return (
    <div className="border-b border-outline-variant/20 last:border-0">
      {/* Header */}
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between w-full py-3 group cursor-pointer"
      >
        <span className="text-[12px] font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
          {field.labelAr}
          {/* Active badge */}
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-in fade-in duration-150" />
          )}
        </span>
        <ChevronDown
          size={13}
          className={clsx(
            'text-on-surface-variant transition-transform duration-200 flex-shrink-0',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      {/* CSS Grid accordion — no max-h hack */}
      <div
        className="grid transition-all duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pb-4 pt-0.5">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  category: ListingCategory
  filters: ActiveFilters
  onFilterChange: (key: string, value: string | boolean | null) => void
  onFiltersChange?: (updates: Record<string, string | null>) => void
  onClearAll: () => void
}

export function FilterSidebar({
  category,
  filters,
  onFilterChange,
  onFiltersChange,
  onClearAll,
}: FilterSidebarProps) {
  const config = category === '__global__' as any ? GLOBAL_SHARED_FILTERS : FILTERS_CONFIG[category]
  const activeCount = countActive(config, filters)
  const t = useTranslations('listings')

  return (
    <aside className="hidden lg:block w-[288px] flex-shrink-0 self-start sticky top-[100px] space-y-3">



      {/* ── Filters Card ── */}
      <div className="bg-background border border-outline-variant/40 rounded-xl p-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-on-surface flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-primary" />
            {t('filters')}
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </span>
          {activeCount > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
            >
              <X size={11} />
              {t('clearAll')}
            </button>
          )}
        </div>

        {/* Sections */}
        <div>
          {config.map((field, i) => (
            <SidebarSection
              key={field.key}
              field={field}
              value={filters[field.key] as string | string[] | undefined}
              govValue={(filters[field.key] as string) ?? ''}
              cityValue={(filters['city'] as string) ?? ''}
              modelValue={(filters['model'] as string) ?? ''}
              onChange={v => onFilterChange(field.key, v)}
              onFiltersChange={onFiltersChange}
              defaultOpen={
                i < 3 ||
                !!filters[field.key] ||
                (field.type === 'governorate_wilayat' && !!filters['city']) ||
                (field.type === 'make_model' && !!filters['model'])
              }
              t={t}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
