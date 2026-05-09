'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { UnifiedCard } from './UnifiedCard'
import { CardSkeleton } from '@/components/loading-skeleton'
import { ErrorState } from '@/components/error-state'
import type { UnifiedListingItem } from '../types/unified-item.types'

// ── Card width config ────────────────────────────────────────────────────────
// On mobile: ~80vw per card | sm: ~300px | md+: ~280px
const CARD_CLASS = 'w-[82vw] sm:w-[36vw] lg:w-[268px] xl:w-[341px] shrink-0'

// ── Props ────────────────────────────────────────────────────────────────────

interface CardSliderProps<T> {
  items: T[]
  mapItem: (item: T) => UnifiedListingItem
  isLoading?: boolean
  error?: { message?: string } | null
  onRetry?: () => void
  skeletonCount?: number
  emptyIcon?: string
  emptyMessage?: string
  className?: string
  hideContactButtons?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export function CardSlider<T extends { id: string }>({
  items,
  mapItem,
  isLoading = false,
  error = null,
  onRetry,
  skeletonCount = 4,
  emptyIcon = 'inventory_2',
  emptyMessage,
  className = '',
  hideContactButtons = false,
}: CardSliderProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(true)
  const dragRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = trackRef.current
    if (!el) return
    dragRef.current = { isDragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return
    const el = trackRef.current
    if (!el) return
    e.preventDefault()
    const x = e.pageX - el.offsetLeft
    const walk = (x - dragRef.current.startX) * 1.5
    el.scrollLeft = dragRef.current.scrollLeft - walk
  }, [])

  const onMouseUp = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    dragRef.current.isDragging = false
    el.style.cursor = 'grab'
    el.style.userSelect = ''
  }, [])

  const checkScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const isRtl = document.documentElement.dir === 'rtl'
    if (isRtl) {
      setCanScrollEnd(el.scrollLeft < -1)
      setCanScrollStart(el.scrollLeft > -(el.scrollWidth - el.clientWidth - 1))
    } else {
      setCanScrollStart(el.scrollLeft > 1)
      setCanScrollEnd(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
    }
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, items])

  function scroll(direction: 'start' | 'end') {
    const el = trackRef.current
    if (!el) return
    const isRtl = document.documentElement.dir === 'rtl'
    const sign = isRtl ? -1 : 1
    const amount = el.clientWidth * 0.75
    const delta = direction === 'end' ? amount * sign : -amount * sign
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={`flex gap-3 overflow-x-auto no-scrollbar pb-1 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className={CARD_CLASS}>
            <CardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  // ── Error ──
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />

  // ── Empty ──
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">
          {emptyIcon}
        </span>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Nav buttons — desktop only */}
      {canScrollStart && (
        <button
          onClick={() => scroll('start')}
          className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-background border border-outline-variant/30 shadow-md flex items-center justify-center hover:bg-surface-container-high transition-all hidden sm:flex"
          aria-label="السابق"
        >
          <ChevronRight size={18} className="text-on-surface" />
        </button>
      )}
      {canScrollEnd && (
        <button
          onClick={() => scroll('end')}
          className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full bg-background border border-outline-variant/30 shadow-md flex items-center justify-center hover:bg-surface-container-high transition-all hidden sm:flex"
          aria-label="التالي"
        >
          <ChevronLeft size={18} className="text-on-surface" />
        </button>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {items.map((item) => (
          <div key={item.id} className={CARD_CLASS}>
            <UnifiedCard item={mapItem(item)} className="h-full" hideContactButtons={hideContactButtons} />
          </div>
        ))}
      </div>
    </div>
  )
}
