// ── OverlayBadge — For use ON images (blur background) ──────────────────────
// Replaces all inline bg-black/55 backdrop-blur badges across cards & showcases.

import { memo } from 'react'
import { DOT_COLOR, RESPONSIVE_SIZE, SIZE_CLASSES, type BadgeIntent, type BadgeSize } from './badge.config'

interface OverlayBadgeProps {
  label: string
  intent?: BadgeIntent
  /** Show colored dot before label */
  dot?: boolean
  /** Fixed size or responsive (xs on mobile → sm on desktop) */
  size?: BadgeSize | 'responsive'
  className?: string
}

export const OverlayBadge = memo(function OverlayBadge({
  label,
  intent = 'primary',
  dot = true,
  size = 'responsive',
  className = '',
}: OverlayBadgeProps) {
  const sizeClass = size === 'responsive' ? RESPONSIVE_SIZE : SIZE_CLASSES[size]

  return (
    <span
      className={`inline-flex items-center rounded font-bold bg-black/55 backdrop-blur-sm text-white select-none ${sizeClass} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLOR[intent]}`} />
      )}
      {label}
    </span>
  )
})
