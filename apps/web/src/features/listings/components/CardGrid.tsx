'use client'

import { UnifiedCard } from './UnifiedCard'
import { CardSkeleton } from '@/components/loading-skeleton'
import { ErrorState } from '@/components/error-state'
import type { UnifiedListingItem } from '../types/unified-item.types'

// ── Grid column presets ──────────────────────────────────────────────────────

const COL_CLASS = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
} as const

type ColCount = keyof typeof COL_CLASS

// ── Props ────────────────────────────────────────────────────────────────────

interface CardGridProps<T> {
  items: T[]
  mapItem: (item: T) => UnifiedListingItem
  isLoading?: boolean
  error?: { message?: string } | null
  onRetry?: () => void
  cols?: ColCount
  skeletonCount?: number
  emptyIcon?: string
  emptyMessage?: string
  emptyAction?: { label: string; href: string }
  className?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export function CardGrid<T extends { id: string }>({
  items,
  mapItem,
  isLoading = false,
  error = null,
  onRetry,
  cols = 4,
  skeletonCount,
  emptyIcon = 'inventory_2',
  emptyMessage,
  emptyAction,
  className = '',
}: CardGridProps<T>) {
  const gridClass = `grid ${COL_CLASS[cols]} gap-2 sm:gap-4 ${className}`
  const count = skeletonCount ?? cols

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />
  }

  // ── Empty ──
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">
          {emptyIcon}
        </span>
        <p className="font-medium">{emptyMessage}</p>
        {emptyAction && (
          <a
            href={emptyAction.href}
            className="inline-block mt-4 px-6 py-2.5 text-sm font-black bg-primary text-on-primary rounded-lg hover:brightness-110 transition-colors"
          >
            {emptyAction.label}
          </a>
        )}
      </div>
    )
  }

  // ── Data ──
  return (
    <div className={gridClass}>
      {items.map((item) => (
        <UnifiedCard key={item.id} item={mapItem(item)} className="h-full" />
      ))}
    </div>
  )
}
