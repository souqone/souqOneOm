// ── ListingTypeBadge — Colored text label for listing type ───────────────────
// Replaces ListingBadge, HomepageBadge, VehicleCard listingTypeLabel logic.

import { memo } from 'react'
import { TEXT_COLOR, LISTING_TYPE_INTENT, type BadgeIntent } from './badge.config'

interface ListingTypeBadgeProps {
  /** Raw listing type from API — e.g. 'SALE', 'RENTAL', 'WANTED', 'BUS_RENT', 'EQUIPMENT_SALE' */
  type: string
  /** Override the display label */
  label?: string
  /** Override the intent (otherwise inferred from type) */
  intent?: BadgeIntent
  className?: string
}

const TYPE_LABELS: Record<string, string> = {
  SALE:           'للبيع',
  RENTAL:         'إيجار',
  WANTED:         'مطلوب',
  BUS_SALE:       'للبيع',
  BUS_RENT:       'إيجار',
  EQUIPMENT_SALE: 'للبيع',
  EQUIPMENT_RENT: 'إيجار',
}

// For special categories that don't have a listingType but need a label
const CATEGORY_LABELS: Record<string, { label: string; intent: BadgeIntent }> = {
  jobs:     { label: 'وظيفة', intent: 'danger' },
  services: { label: 'خدمة',  intent: 'primary' },
  parts:    { label: 'قطعة',  intent: 'orange' },
}

export const ListingTypeBadge = memo(function ListingTypeBadge({
  type,
  label,
  intent,
  className = '',
}: ListingTypeBadgeProps) {
  // Check category labels first (jobs, services, parts)
  const catConfig = CATEGORY_LABELS[type]
  const resolvedIntent = intent ?? LISTING_TYPE_INTENT[type] ?? catConfig?.intent ?? 'primary'
  const resolvedLabel = label ?? TYPE_LABELS[type] ?? catConfig?.label ?? type

  return (
    <span className={`shrink-0 font-bold text-[10px] ${TEXT_COLOR[resolvedIntent]} ${className}`}>
      {resolvedLabel}
    </span>
  )
})
