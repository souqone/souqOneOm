// ── DetailChip — Icon + text pill for quick-scan details ─────────────────────
// Replaces inline detail chips in ListingCard and UnifiedCard.

import { memo } from 'react'
import {
  Car, Bus, Wrench, Settings, Truck, Briefcase,
  Calendar, Gauge, Settings2, Users, Building2,
  CalendarDays, Route, Tag, Fuel, MapPin, Clock,
  Cog, HardHat, Palette,
} from 'lucide-react'

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>

const ICON_MAP: Record<string, LucideIcon> = {
  Car, Bus, Wrench, Settings, Truck, Briefcase,
  Calendar, Gauge, Settings2, Users, Building2,
  CalendarDays, Route, Tag, Fuel, MapPin, Clock,
  Cog, HardHat, Palette,
}

interface DetailChipProps {
  icon: string
  value: string
  className?: string
}

export const DetailChip = memo(function DetailChip({
  icon,
  value,
  className = '',
}: DetailChipProps) {
  const IconComp = ICON_MAP[icon]

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[11px] ${className}`}
    >
      {IconComp && (
        <span className="text-on-surface-variant/60">
          <IconComp size={10} />
        </span>
      )}
      <span className="truncate font-semibold text-on-surface">{value}</span>
    </span>
  )
})
