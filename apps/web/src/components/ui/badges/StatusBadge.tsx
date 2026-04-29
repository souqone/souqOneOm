// ── StatusBadge — Semantic status pills ──────────────────────────────────────
// Replaces all inline status pills in bookings, my-listings, etc.

import { memo } from 'react'
import { FILL_COLOR, type BadgeIntent, type BadgeSize } from './badge.config'

interface StatusBadgeProps {
  label: string
  intent?: BadgeIntent
  size?: BadgeSize
  icon?: string
  className?: string
}

const SIZE: Record<BadgeSize, string> = {
  xs: 'text-[8px] px-1.5 py-0.5',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[11px] px-2.5 py-1',
}

export const StatusBadge = memo(function StatusBadge({
  label,
  intent = 'neutral',
  size = 'sm',
  icon,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${SIZE[size]} ${FILL_COLOR[intent]} ${className}`}
    >
      {icon && (
        <span className="material-symbols-outlined text-[inherit]" style={{ fontSize: 'inherit' }}>
          {icon}
        </span>
      )}
      {label}
    </span>
  )
})
