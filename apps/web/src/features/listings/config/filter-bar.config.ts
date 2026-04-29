/**
 * Filter Bar Config — Config-driven filter bar definitions
 * Maps to FilterBarFieldConfig for each category
 */

import { 
  Tag, 
  Banknote, 
  MapPin, 
  Wrench, 
  CheckCircle
} from 'lucide-react'
import type { FilterBarConfig } from '../types/filter-bar.types'
import type { ListingCategory } from '../types/category.types'
import { GOVERNORATE_OPTIONS } from './shared'

// ── Shared Field Definitions ────────────────────────────────────────────────

const GOVERNORATE_FIELD: FilterBarConfig[number] = {
  key: 'governorate',
  label: 'الموقع',
  icon: MapPin,
  type: 'select',
  placeholder: 'كل المناطق',
  options: GOVERNORATE_OPTIONS.map(g => ({ value: g.value, label: g.labelAr })),
  isPrimary: true,
  showInBar: true,
}

// ── Cars Configuration ──────────────────────────────────────────────────────

const CARS_CONFIG: FilterBarConfig = [
  {
    key: 'listingType',
    label: 'الفلترة',
    icon: Tag,
    type: 'select',
    placeholder: 'الكل',
    options: [
      { value: 'SALE', label: 'للبيع' },
      { value: 'RENTAL', label: 'للإيجار' },
      { value: 'WANTED', label: 'مطلوب' },
    ],
    showInBar: true,
  },
  {
    key: 'priceMin_priceMax',
    label: 'السعر',
    icon: Banknote,
    type: 'range',
    placeholder: 'أي سعر',
    min: 0,
    max: 100000,
    unit: 'ر.ع',
    showInBar: true,
  },
  GOVERNORATE_FIELD,
]

// ── Buses Configuration ───────────────────────────────────────────────────────

const BUSES_CONFIG: FilterBarConfig = [
  {
    key: 'busListingType',
    label: 'الفلترة',
    icon: Tag,
    type: 'select',
    placeholder: 'الكل',
    options: [
      { value: 'BUS_SALE', label: 'للبيع' },
      { value: 'BUS_SALE_WITH_CONTRACT', label: 'بيع مع عقد' },
      { value: 'BUS_RENT', label: 'للإيجار' },
      { value: 'BUS_CONTRACT', label: 'تعاقد' },
    ],
    showInBar: true,
  },
  {
    key: 'minPrice_maxPrice',
    label: 'السعر',
    icon: Banknote,
    type: 'range',
    placeholder: 'أي سعر',
    min: 0,
    max: 200000,
    unit: 'ر.ع',
    showInBar: true,
  },
  GOVERNORATE_FIELD,
]

// ── Equipment Configuration ───────────────────────────────────────────────────

const EQUIPMENT_CONFIG: FilterBarConfig = [
  {
    key: 'listingType',
    label: 'الفلترة',
    icon: Tag,
    type: 'select',
    placeholder: 'الكل',
    options: [
      { value: 'EQUIPMENT_SALE', label: 'للبيع' },
      { value: 'EQUIPMENT_RENT', label: 'للإيجار' },
    ],
    showInBar: true,
  },
  GOVERNORATE_FIELD,
]

// ── Parts Configuration ────────────────────────────────────────────────────────

const PARTS_CONFIG: FilterBarConfig = [
  {
    key: 'condition',
    label: 'الحالة',
    icon: CheckCircle,
    type: 'select',
    placeholder: 'الكل',
    options: [
      { value: 'NEW', label: 'جديد' },
      { value: 'USED', label: 'مستعمل' },
      { value: 'REFURBISHED', label: 'مجدد' },
    ],
    showInBar: true,
  },
  {
    key: 'minPrice_maxPrice',
    label: 'السعر',
    icon: Banknote,
    type: 'range',
    placeholder: 'أي سعر',
    min: 0,
    max: 5000,
    unit: 'ر.ع',
    showInBar: true,
  },
  GOVERNORATE_FIELD,
]

// ── Services Configuration ──────────────────────────────────────────────────────

const SERVICES_CONFIG: FilterBarConfig = [
  {
    key: 'serviceType',
    label: 'الخدمة',
    icon: Wrench,
    type: 'select',
    placeholder: 'الكل',
    options: [
      { value: 'MAINTENANCE', label: 'صيانة' },
      { value: 'CLEANING', label: 'تنظيف' },
      { value: 'INSPECTION', label: 'فحص' },
      { value: 'BODYWORK', label: 'هيكلة' },
    ],
    showInBar: true,
  },
  GOVERNORATE_FIELD,
]

// ── Main Export ───────────────────────────────────────────────────────────────

const JOBS_CONFIG: FilterBarConfig = [GOVERNORATE_FIELD]

export const FILTER_BAR_CONFIG: Record<ListingCategory, FilterBarConfig> = {
  cars: CARS_CONFIG,
  buses: BUSES_CONFIG,
  equipment: EQUIPMENT_CONFIG,
  'equipment-requests': EQUIPMENT_CONFIG,
  operators: JOBS_CONFIG,
  parts: PARTS_CONFIG,
  services: SERVICES_CONFIG,
  jobs: JOBS_CONFIG,
}

// ── Helper Functions ──────────────────────────────────────────────────────────

export function getFilterBarConfig(category: ListingCategory): FilterBarConfig {
  return FILTER_BAR_CONFIG[category] || []
}

export function getBarFields(config: FilterBarConfig): FilterBarConfig {
  return config.filter(f => f.showInBar !== false)
}

export function getSidebarFields(config: FilterBarConfig): FilterBarConfig {
  return config.filter(f => f.showInBar === false)
}
