// ── TrustBadge — Trust signal with two variants ─────────────────────────────
// variant="badge" → icon + text + bg (for body / detail pages)
// variant="icon"  → icon only (for card image overlays)
// Replaces VerifiedBadge, ListingCard trust capsules, VehicleCard verified icon.

import { memo } from 'react'
import { Tag, Shield, Award } from 'lucide-react'
import { SOFT_COLOR, type BadgeIntent } from './badge.config'

type TrustType = 'verified' | 'negotiable' | 'insured' | 'premium'

interface TrustBadgeProps {
  type: TrustType
  /** 'badge' = icon + text + bg (default), 'icon' = icon only (for card overlays) */
  variant?: 'badge' | 'icon'
  /** Override size for icon variant: sm=13px, md=16px, lg=20px */
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>

interface TrustConfig {
  /** null = use Material Symbol instead of Lucide */
  lucideIcon: LucideIcon | null
  /** Material Symbol name (used when lucideIcon is null) */
  materialIcon: string | null
  defaultLabel: string
  intent: BadgeIntent
  /** Icon color class for the icon-only variant */
  iconColor: string
}

const TRUST_CONFIG: Record<TrustType, TrustConfig> = {
  verified:   { lucideIcon: null,   materialIcon: 'verified', defaultLabel: 'موثق',         intent: 'primary', iconColor: 'text-blue-500' },
  negotiable: { lucideIcon: Tag,    materialIcon: null,       defaultLabel: 'قابل للتفاوض', intent: 'orange',  iconColor: 'text-orange-500' },
  insured:    { lucideIcon: Shield, materialIcon: null,       defaultLabel: 'مؤمّن',        intent: 'success', iconColor: 'text-emerald-500' },
  premium:    { lucideIcon: Award,  materialIcon: null,       defaultLabel: 'مميز',         intent: 'gold',    iconColor: 'text-yellow-500' },
}

const ICON_SIZE: Record<string, string> = {
  sm: 'text-[13px]',
  md: 'text-[16px]',
  lg: 'text-[20px]',
}

const LUCIDE_SIZE: Record<string, number> = { sm: 13, md: 16, lg: 20 }

export const TrustBadge = memo(function TrustBadge({
  type,
  variant = 'badge',
  size = 'sm',
  label,
  className = '',
}: TrustBadgeProps) {
  const config = TRUST_CONFIG[type]

  // ── Icon-only variant (for card overlays) ──
  if (variant === 'icon') {
    if (config.materialIcon) {
      return (
        <span
          className={`${config.iconColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${className}`}
        >
          <span
            className={`material-symbols-outlined ${ICON_SIZE[size]}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {config.materialIcon}
          </span>
        </span>
      )
    }
    const LIcon = config.lucideIcon!
    return (
      <span className={`${config.iconColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${className}`}>
        <LIcon size={LUCIDE_SIZE[size]} />
      </span>
    )
  }

  // ── Badge variant (icon + text + bg) ──
  const iconElement = config.materialIcon ? (
    <span
      className={`material-symbols-outlined text-[12px] ${config.iconColor}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      {config.materialIcon}
    </span>
  ) : (
    config.lucideIcon && <config.lucideIcon size={10} />
  )

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${SOFT_COLOR[config.intent]} ${className}`}
    >
      {iconElement}
      {label ?? config.defaultLabel}
    </span>
  )
})
