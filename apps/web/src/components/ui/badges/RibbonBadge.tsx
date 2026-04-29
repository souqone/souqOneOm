// ── RibbonBadge — Corner ribbon flush with image edge ────────────────────────
// Replaces ListingCard's red ribbon primaryBadge (top-start, rounded-ee-xl).

import { memo } from 'react'
import { Star, Zap, Crown, Flame } from 'lucide-react'
import type { BadgeIntent } from './badge.config'

type RibbonIcon = 'star' | 'zap' | 'crown' | 'flame' | 'none'
type RibbonIntent = BadgeIntent | 'silver'
type RibbonSize = 'sm' | 'md' | 'lg'

interface RibbonBadgeProps {
  label: string
  intent?: RibbonIntent
  icon?: RibbonIcon
  size?: RibbonSize
  /** Corner placement */
  position?: 'top-start' | 'top-end'
  className?: string
}

const SIZE_CLASS: Record<RibbonSize, { container: string; icon: number }> = {
  sm: { container: 'gap-1 px-2 py-0.5 text-[10px]', icon: 9 },
  md: { container: 'gap-1 px-2.5 py-1 text-[11px]', icon: 10 },
  lg: { container: 'gap-1.5 px-3 py-1.5 text-[12px]', icon: 12 },
}

const ICON_MAP = {
  star:  Star,
  zap:   Zap,
  crown: Crown,
  flame: Flame,
}

const BG_COLOR: Record<RibbonIntent, string> = {
  primary: 'bg-blue-500 text-white',
  success: 'bg-emerald-500 text-white',
  danger:  'bg-red-500 text-white',
  orange:  'bg-orange-500 text-white',
  neutral: 'bg-gray-500 text-white',
  gold:    'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-white shadow-[0_2px_10px_rgba(245,158,11,0.35)]',
  silver:  'border border-white/70 bg-gradient-to-r from-slate-200 via-white to-slate-400 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_8px_rgba(148,163,184,0.35)]',
}

export const RibbonBadge = memo(function RibbonBadge({
  label,
  intent = 'danger',
  icon = 'star',
  size = 'md',
  position = 'top-start',
  className = '',
}: RibbonBadgeProps) {
  const IconComp = icon !== 'none' ? ICON_MAP[icon as keyof typeof ICON_MAP] : null
  const roundedClass = position === 'top-start' ? 'rounded-ee-xl' : 'rounded-es-xl'
  const s = SIZE_CLASS[size]

  return (
    <span
      className={`flex items-center ${s.container} font-bold ${BG_COLOR[intent]} ${roundedClass} ${className}`}
    >
      {IconComp && <IconComp size={s.icon} className={intent === 'silver' ? 'fill-slate-700 text-slate-700' : 'fill-white text-white'} />}
      {label}
    </span>
  )
})
