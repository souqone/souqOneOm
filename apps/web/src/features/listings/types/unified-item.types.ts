import type { ListingCategory } from './category.types'

/**
 * Normalized shape for any listing item across all 6 categories.
 * Raw API responses are transformed into this via normalizer functions
 * defined in features/listings/config/categories.config.ts
 */
export interface UnifiedListingItem {
  id: string
  category: ListingCategory

  // ── Core display fields (present in every category) ──────────────────
  title: string

  /**
   * Resolved price as a number. null = no price available (e.g. "اتصل لمعرفة السعر")
   * For RENTAL listings → this is the primary recurring price (daily or monthly).
   */
  price: number | null

  /**
   * Suffix label shown next to price.
   * Examples: "/ يوم" | "/ شهر" | "/ رحلة" | null (for lump-sum sale price)
   */
  priceLabel: string | null
  priceText?: string | null

  currency: string

  /** First image URL, already resolved (absolute or CDN path). Empty array if none. */
  images: string[]

  governorate: string | null
  createdAt: string
  viewCount?: number

  // ── Badges (max 2, to keep card uncluttered) ─────────────────────────
  /**
   * Primary badge — usually the listing type or service type.
   * Examples: "للبيع" | "للإيجار" | "مطلوب" | "صيانة" | "نقل عام"
   */
  primaryBadge: Badge | null

  /**
   * Secondary badge — a notable attribute.
   * Examples: "جديد" | "أصلي" | "خدمة منزلية" | "موثق"
   */
  secondaryBadge: Badge | null

  // ── Detail chips (max 3, shown as icon+text row below title) ─────────
  /**
   * Up to 3 quick-scan details specific to the category.
   * Cars: year, mileage, transmission
   * Buses: capacity, busType, make
   * Equipment: equipmentType, condition, hoursUsed
   * Parts: partCategory, condition, compatibleMakes[0]
   * Services: serviceType, providerType, workingDays count
   * Jobs: jobType, employmentType, experienceYears
   */
  details: DetailItem[]

  // ── Navigation ───────────────────────────────────────────────────────
  /** Full href for <Link> — e.g. "/sale/car/abc123" */
  href: string

  // ── Contact ──────────────────────────────────────────────────────────
  phoneNumber?: string | null
  whatsappNumber?: string | null

  // ── Trust & Pricing signals ──────────────────────────────────────────
  isPriceNegotiable?: boolean
  sellerVerified?: boolean

  // ── Favorites ────────────────────────────────────────────────────────
  /** Entity type string used by the favorites API — e.g. "LISTING" | "BUS_LISTING" */
  favoriteEntityType: string

  // ── Category-specific raw data ───────────────────────────────────────
  /** Raw category-specific data for advanced use cases. Preserves all API fields. */
  attributes?: Record<string, any>
}

export interface Badge {
  label: string
  color: BadgeColor
}

export type BadgeColor = 'blue' | 'green' | 'orange' | 'purple' | 'gray' | 'red'

export interface DetailItem {
  /** Lucide icon component name */
  icon: string
  value: string
}

/** Badge color → Tailwind classes (light bg + text, with dark mode) */
export const BADGE_COLOR_CLASSES: Record<BadgeColor, string> = {
  blue:   'bg-blue-50   text-blue-600   dark:bg-blue-900/20   dark:text-blue-400',
  green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  gray:   'bg-secondary text-muted-foreground',
  red:    'bg-red-50    text-red-600    dark:bg-red-900/20    dark:text-red-400',
}

/** Type badge text-only color (for overlay badges on images) */
export const TYPE_BADGE_TEXT: Record<BadgeColor, string> = {
  blue:   'text-blue-600',
  green:  'text-emerald-600',
  orange: 'text-orange-500',
  purple: 'text-purple-600',
  gray:   'text-foreground/70',
  red:    'text-red-600',
}
