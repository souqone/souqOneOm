// ── Badge System — Shared Configuration ─────────────────────────────────────
// Single source of truth for all badge colors, types, and mappings.
// 5 colors only: blue · green · red · orange · gray

// ── Semantic intent (5 only) ─────────────────────────────────────────────────

export type BadgeIntent =
  | 'primary'   // blue   — sale / default / verified / services
  | 'success'   // green  — new / confirmed / active / rental
  | 'danger'    // red    — cancelled / error / jobs
  | 'orange'    // orange — wanted / pending / negotiable / parts
  | 'neutral'   // gray   — used / expired / draft / unknown
  | 'gold'      // gold   — premium / featured

// ── Dot colors (for OverlayBadge on images) ─────────────────────────────────

export const DOT_COLOR: Record<BadgeIntent, string> = {
  primary: 'bg-blue-500',
  success: 'bg-emerald-500',
  danger:  'bg-red-500',
  orange:  'bg-orange-500',
  neutral: 'bg-gray-400',
  gold:    'bg-yellow-500',
}

// ── Fill colors (for StatusBadge — solid bg pills) ──────────────────────────

export const FILL_COLOR: Record<BadgeIntent, string> = {
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  danger:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  orange:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400',
  gold:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

// ── Soft bordered colors (for TrustBadge — light bg + border) ───────────────

export const SOFT_COLOR: Record<BadgeIntent, string> = {
  primary: 'bg-blue-50 border-blue-200/70 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-400',
  success: 'bg-emerald-50 border-emerald-200/70 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-400',
  danger:  'bg-red-50 border-red-200/70 text-red-700 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400',
  orange:  'bg-orange-50 border-orange-200/70 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-400',
  neutral: 'bg-gray-50 border-gray-200/70 text-gray-600 dark:bg-gray-900/30 dark:border-gray-700/50 dark:text-gray-400',
  gold:    'bg-yellow-50 border-yellow-300/70 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-700/50 dark:text-yellow-400',
}

// ── Text-only colors (for ListingTypeBadge) ─────────────────────────────────

export const TEXT_COLOR: Record<BadgeIntent, string> = {
  primary: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  danger:  'text-red-600 dark:text-red-400',
  orange:  'text-orange-600 dark:text-orange-400',
  neutral: 'text-gray-500 dark:text-gray-400',
  gold:    'text-yellow-600 dark:text-yellow-400',
}

// ── Condition → Intent mapping ──────────────────────────────────────────────

export const CONDITION_INTENT: Record<string, BadgeIntent> = {
  NEW:         'success',
  LIKE_NEW:    'success',
  USED:        'neutral',
  GOOD:        'primary',
  FAIR:        'orange',
  POOR:        'danger',
  REFURBISHED: 'orange',
}

// ── Listing type → Intent mapping ───────────────────────────────────────────

export const LISTING_TYPE_INTENT: Record<string, BadgeIntent> = {
  SALE:                   'primary',
  RENTAL:                 'success',
  WANTED:                 'orange',
  BUS_SALE:               'primary',
  BUS_RENT:               'success',
  BUS_SALE_WITH_CONTRACT: 'orange',
  EQUIPMENT_SALE:         'primary',
  EQUIPMENT_RENT:         'success',
  EQUIPMENT_WANTED:       'orange',
  PART:                   'neutral',
  SERVICE:                'success',
}

// ── Listing status → Intent mapping ─────────────────────────────────────────

export const LISTING_STATUS_INTENT: Record<string, BadgeIntent> = {
  ACTIVE:  'success',
  PENDING: 'orange',
  EXPIRED: 'neutral',
  DRAFT:   'neutral',
  SOLD:    'neutral',
}

// ── Badge sizes ─────────────────────────────────────────────────────────────

export type BadgeSize = 'xs' | 'sm' | 'md'

export const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: 'text-[7px] px-1 py-px gap-0.5',
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-[12px] px-2.5 py-1 gap-1.5',
}

export const RESPONSIVE_SIZE = 'text-[7px] sm:text-[10px] px-1 sm:px-2 py-px sm:py-0.5 gap-0.5 sm:gap-1'
