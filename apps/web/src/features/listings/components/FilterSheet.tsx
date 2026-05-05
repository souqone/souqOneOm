'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, SlidersHorizontal, ChevronDown, MapPin, Car } from 'lucide-react'
import * as RadixSlider from '@radix-ui/react-slider'
import { clsx } from 'clsx'
import type { ListingCategory } from '../types/category.types'
import { CATEGORY_META } from '../types/category.types'
import type { ActiveFilters, FilterField } from '../types/filters.types'
import { FILTERS_CONFIG } from '../config/filters.config'
import { GOVERNORATE_OPTIONS, WILAYAT_BY_GOVERNORATE } from '../config/shared'
import { useBrands, useCarModels } from '@/lib/api'

// ── Props ─────────────────────────────────────────────────────────────────────

interface FilterSheetProps {
  category: ListingCategory
  filters: ActiveFilters
  onFilterChange: (key: string, value: string | boolean | null) => void
  onFiltersChange?: (updates: Record<string, string | null>) => void
  onClearAll: () => void
  onClose: () => void
  total: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasValue(value: string | string[] | undefined): boolean {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  return value !== '' && value !== '|'
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
        'px-3.5 py-2 rounded-full text-[12px] font-medium border transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        active
          ? 'bg-primary text-on-primary border-primary shadow-sm shadow-primary/20'
          : 'bg-surface-container/60 text-on-surface-variant border-outline-variant/40 hover:border-primary/40 hover:text-on-surface',
      )}
    >
      {label}
    </button>
  )
}

// ── Governorate + Wilayat Cascaded ────────────────────────────────────────────

// ── Governorate + City Cascaded ────────────────────────────────────────────

function GovernorateCitySection({
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
    <div className="flex gap-3">
      {/* Governorate dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} className="text-primary" />
          <span className="text-[12px] font-semibold text-on-surface-variant">المحافظة</span>
        </div>
        <div className="relative">
          <select
            value={govValue}
            onChange={e => {
              const val = e.target.value || null
              onFiltersChange?.({ governorate: val, city: null })
            }}
            className={clsx(
              'auth-select !h-11 !pl-8 truncate',
              govValue ? 'font-medium text-on-surface bg-primary/5' : 'text-on-surface-variant'
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
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>

      {/* City dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={12} className={clsx("transition-colors", govValue ? "text-primary/70" : "text-outline-variant")} />
          <span className="text-[12px] font-semibold text-on-surface-variant">الولاية</span>
        </div>
        <div className="relative">
          <select
            name="city"
            value={cityValue}
            onChange={e => onFiltersChange?.({ governorate: govValue, city: e.target.value || null })}
            disabled={!govValue || wilayats.length === 0}
            className={clsx(
              'auth-select !h-11 !pl-8 truncate',
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
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
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
      ? `${n}`
      : n >= 1000
      ? `${(n / 1000).toLocaleString('en-US')}k`
      : String(n)

  function commit(vals: [number, number]) {
    if (vals[0] === min && vals[1] === max) {
      onChange(null)
    } else {
      onChange(`${vals[0]}|${vals[1]}`)
    }
  }

  return (
    <div className="px-1 pt-2 pb-1">
      {/* Value pills */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[10px] text-on-surface-variant">من</span>
          <span className="text-[13px] font-bold text-on-surface">
            {fmt(sliderVals[0])} <span className="text-[11px] font-normal text-on-surface-variant">{field.unit}</span>
          </span>
        </div>
        <div className="h-px flex-1 mx-4 bg-outline-variant/30" />
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] text-on-surface-variant">إلى</span>
          <span className="text-[13px] font-bold text-on-surface">
            {fmt(sliderVals[1])} <span className="text-[11px] font-normal text-on-surface-variant">{field.unit}</span>
          </span>
        </div>
      </div>

      {/* Slider */}
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
        <RadixSlider.Track className="bg-outline-variant/25 relative grow rounded-full h-2">
          <RadixSlider.Range className="absolute bg-gradient-to-l from-primary to-primary/70 rounded-full h-full" />
        </RadixSlider.Track>
        {[0, 1].map(i => (
          <RadixSlider.Thumb
            key={i}
            className={clsx(
              'block w-5 h-5 bg-white border-2 border-primary rounded-full',
              'shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30',
              'transition-transform duration-150 cursor-grab active:cursor-grabbing',
            )}
            aria-label={i === 0 ? 'الحد الأدنى' : 'الحد الأقصى'}
          />
        ))}
      </RadixSlider.Root>
    </div>
  )
}

// ── Range Select (Dropdowns) ──────────────────────────────────────────────────

function RangeSelect({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: string | undefined
  onChange: (v: string | null) => void
}) {
  const min = field.min ?? 1970
  const max = field.max ?? new Date().getFullYear()

  // Generate options descending (newest first)
  const options = []
  for (let y = max; y >= min; y--) {
    options.push(y)
  }

  const [from, to] = value && value.includes('|') ? value.split('|') : ['', '']

  function update(newFrom: string, newTo: string) {
    if (!newFrom && !newTo) {
      onChange(null)
    } else {
      onChange(`${newFrom || min}|${newTo || max}`)
    }
  }

  return (
    <div className="flex gap-3">
      {/* From Dropdown */}
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-on-surface-variant mb-2 block">من</span>
        <div className="relative">
          <select
            value={from}
            onChange={e => update(e.target.value, to)}
            className="auth-select !h-11 truncate !pr-4 !pl-8 text-center"
          >
            <option value="">أي</option>
            {options.map(y => (
              <option key={`from-${y}`} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        </div>
      </div>

      {/* To Dropdown */}
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-on-surface-variant mb-2 block">إلى</span>
        <div className="relative">
          <select
            value={to}
            onChange={e => update(from, e.target.value)}
            className="auth-select !h-11 truncate !pr-4 !pl-8 text-center"
          >
            <option value="">أي</option>
            {options.map(y => (
              <option key={`to-${y}`} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
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
    <div className="flex gap-3">
      {/* Make dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Car size={12} className="text-primary" />
          <span className="text-[12px] font-semibold text-on-surface-variant">الماركة</span>
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
              'auth-select !h-11 !pl-8 truncate',
              isBrandsLoading ? 'opacity-50 cursor-not-allowed text-on-surface-variant/50' :
              makeValue ? 'font-medium text-on-surface bg-primary/5' : 'text-on-surface-variant'
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
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>

      {/* Model dropdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Car size={12} className={clsx("transition-colors", makeValue ? "text-primary/70" : "text-outline-variant")} />
          <span className="text-[12px] font-semibold text-on-surface-variant">الموديل</span>
        </div>
        <div className="relative">
          <select
            value={modelValue}
            onChange={e => onFiltersChange?.({ model: e.target.value || null })}
            disabled={!makeValue || models.length === 0 || isModelsLoading}
            className={clsx(
              'auth-select !h-11 !pl-8 truncate',
              !makeValue || models.length === 0 || isModelsLoading
                ? 'opacity-50 cursor-not-allowed text-on-surface-variant/50'
                : modelValue
                ? 'font-medium text-on-surface bg-primary/5'
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
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  field,
  govValue,
  cityValue,
  makeValue,
  modelValue,
  onChange,
  onFiltersChange,
}: {
  field: FilterField
  govValue?: string
  cityValue?: string
  makeValue?: string
  modelValue?: string
  onChange: (v: string | boolean | null) => void
  onFiltersChange?: (updates: Record<string, string | null>) => void
}) {
  const [open, setOpen] = useState(true)
  const value = govValue || makeValue // This acts as the base filter value for legacy support
  const isActive =
    hasValue(value as string | string[] | undefined) ||
    (field.type === 'governorate_wilayat' && !!cityValue) ||
    (field.type === 'make_model' && !!modelValue)

  function renderContent() {
    if (field.type === 'select') {
      const opts = field.options ?? []
      const cur = (value as string) ?? ''
      return (
        <div className="flex flex-wrap justify-center gap-2">
          <ChipButton label="الكل" active={!cur} onClick={() => onChange(null)} />
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

    if (field.type === 'multiselect') {
      const opts = field.options ?? []
      const cur: string[] = typeof value === 'string'
        ? value.split(',').filter(Boolean)
        : (Array.isArray(value) ? value : [])
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {opts.map(opt => {
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
      )
    }

    if (field.type === 'range') {
      return (
        <RangeSlider
          field={field}
          value={value as string | undefined}
          onChange={onChange}
        />
      )
    }

    if (field.type === 'range_select') {
      return (
        <RangeSelect
          field={field}
          value={value as string | undefined}
          onChange={onChange}
        />
      )
    }

    if (field.type === 'toggle') {
      const on = value === 'true'
      return (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-on-surface-variant">{field.labelAr}</span>
          <button
            onClick={() => onChange(on ? null : 'true')}
            className={clsx(
              'relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              on ? 'bg-primary' : 'bg-outline-variant/50',
            )}
            role="switch"
            aria-checked={on}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200',
                on ? 'start-[calc(100%-22px)]' : 'start-0.5',
              )}
            />
          </button>
        </div>
      )
    }

    if (field.type === 'governorate_wilayat') {
      return (
        <GovernorateCitySection
          govValue={govValue ?? ''}
          cityValue={cityValue ?? ''}
          onFiltersChange={(updates) => onFiltersChange?.(updates as any)}
        />
      )
    }

    if (field.type === 'make_model') {
      return (
        <MakeModelSection
          makeValue={makeValue ?? ''}
          modelValue={modelValue ?? ''}
          onFiltersChange={onFiltersChange}
        />
      )
    }

    return null
  }

  return (
    <div className="border-b border-outline-variant/20 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full cursor-pointer py-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-on-surface">{field.labelAr}</span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <ChevronDown
          size={15}
          className={clsx(
            'text-on-surface-variant transition-transform duration-200 flex-shrink-0',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
      </button>

      {/* CSS Grid accordion */}
      <div
        className="grid transition-all duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pb-5">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FilterSheet({
  category,
  filters,
  onFilterChange,
  onFiltersChange,
  onClearAll,
  onClose,
  total,
}: FilterSheetProps) {
  const config = FILTERS_CONFIG[category] ?? []
  const meta = CATEGORY_META[category]
  const [mounted, setMounted] = useState(false)

  // Count active filters (excluding system keys)
  const SYSTEM_KEYS = ['sort', 'page', 'q']
  const activeCount = Object.keys(filters).filter(k => !SYSTEM_KEYS.includes(k)).length

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-[60] transition-all duration-300',
          mounted
            ? 'bg-black/50 backdrop-blur-sm opacity-100'
            : 'opacity-0',
        )}
      />

      {/* Sheet */}
      <div
        className={clsx(
          'fixed bottom-0 inset-x-0 z-[70] flex flex-col',
          'bg-background rounded-t-[24px]',
          'max-h-[92dvh]',
          'shadow-[0_-8px_40px_rgba(0,0,0,0.15)]',
          'transition-transform duration-300 ease-out',
          mounted ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-outline-variant/50" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20">
          {/* Clear all */}
          <button
            onClick={() => { onClearAll() }}
            className={clsx(
              'text-[13px] font-medium transition-colors',
              activeCount > 0
                ? 'text-primary hover:text-primary/70 cursor-pointer'
                : 'text-on-surface-variant/40 cursor-default',
            )}
            disabled={activeCount === 0}
          >
            مسح {activeCount > 0 ? `(${activeCount})` : ''}
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-primary" />
            <span className="text-[15px] font-bold text-on-surface">
              فلاتر {meta.labelAr}
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'bg-surface-container/80 hover:bg-surface-container',
              'text-on-surface-variant hover:text-on-surface',
              'transition-all duration-150 cursor-pointer',
            )}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-2">
          {config.map(field => (
            <Section
              key={field.key}
              field={field}
              govValue={(filters[field.key] as string) ?? ''}
              cityValue={
                field.type === 'governorate_wilayat'
                  ? (filters['city'] as string) ?? ''
                  : undefined
              }
              makeValue={(filters[field.key] as string) ?? ''}
              modelValue={
                field.type === 'make_model'
                  ? (filters['model'] as string) ?? ''
                  : undefined
              }
              onChange={v => onFilterChange(field.key, v)}
              onFiltersChange={onFiltersChange}
            />
          ))}
          {/* Bottom spacing */}
          <div className="h-4" />
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-outline-variant/15 bg-background/95 backdrop-blur-sm">
          <button
            onClick={onClose}
            className={clsx(
              'w-full h-12 rounded-2xl text-[14px] font-semibold',
              'transition-all duration-150 active:scale-[0.98] cursor-pointer',
              total > 0
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/25 hover:bg-primary/90'
                : 'bg-surface-container text-on-surface-variant cursor-default',
            )}
          >
            {total > 0
              ? `عرض ${total.toLocaleString('en-US')} إعلان`
              : 'لا توجد نتائج'}
          </button>
        </div>
      </div>
    </>
  )
}