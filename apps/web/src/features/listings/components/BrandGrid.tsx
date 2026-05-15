'use client'

import { clsx } from 'clsx'
import type { SliderItem } from '../data'

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_BLUE = '#0052CC'

// ── Sub-component ─────────────────────────────────────────────────────────────

function BrandCard({
  item,
  isActive,
  count,
  onClick,
}: {
  item: SliderItem
  isActive: boolean
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'group relative flex flex-col items-center justify-center gap-1 p-1',
        'w-full h-full rounded-xl border transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isActive
          ? 'bg-white shadow-md'
          : 'bg-white border-transparent shadow-sm hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={
        isActive
          ? { border: `1.5px solid ${BRAND_BLUE}30`, boxShadow: `0 4px 14px ${BRAND_BLUE}18` }
          : undefined
      }
    >
      {isActive && (
        <span
          className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full"
          style={{ background: BRAND_BLUE }}
        />
      )}

      {/* Logo */}
      <div className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
        {item.logo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.logo}
              alt={item.name}
              loading="lazy"
              className={clsx(
                'w-6 h-6 sm:w-9 sm:h-9 object-contain transition-all duration-200 group-hover:scale-110',
                isActive ? 'scale-105' : 'opacity-75 group-hover:opacity-100',
              )}
              onError={(e) => {
                const img = e.currentTarget
                img.style.display = 'none'
                const fallback = img.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <span
              style={{ display: 'none', color: BRAND_BLUE, background: `${BRAND_BLUE}12` }}
              className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg items-center justify-center font-bold text-xs sm:text-sm"
            >
              {item.name.charAt(0)}
            </span>
          </>
        ) : (
          <span
            style={{ color: BRAND_BLUE, background: `${BRAND_BLUE}12` }}
            className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm"
          >
            {item.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        className={clsx(
          'text-[8px] sm:text-[9px] font-semibold text-center leading-tight px-0.5 transition-colors duration-200',
          isActive ? 'font-bold' : 'text-on-surface-variant group-hover:text-on-surface',
        )}
        style={isActive ? { color: BRAND_BLUE } : undefined}
      >
        {item.name}
      </span>

      {/* Count */}
      {count !== undefined && count > 0 && (
        <span
          className="text-[7px] sm:text-[8px] font-medium tabular-nums leading-none"
          style={{ color: isActive ? BRAND_BLUE : '#94a3b8' }}
        >
          {count.toLocaleString('en-US')}
        </span>
      )}
    </button>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface BrandGridProps {
  items: SliderItem[]
  title?: string
  filterKey?: string
  filters: Record<string, unknown>
  onFilterChange: (key: string, value: string | boolean | null) => void
  counts?: Record<string, number>
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BrandGrid({
  items,
  title = 'تصفح حسب الماركة',
  filterKey = 'make',
  filters,
  onFilterChange,
  counts,
  className,
}: BrandGridProps) {
  const activeValue = filters[filterKey] as string | undefined

  function handleClick(value: string) {
    onFilterChange(filterKey, activeValue === value ? null : value)
  }

  return (
    <section
      dir="rtl"
      data-component="BrandGrid"
      className={clsx('border-b border-outline-variant/20 bg-[#f8faff]', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-4 sm:pt-4 sm:pb-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-1 h-5 rounded-full" style={{ background: BRAND_BLUE }} />
          <h2 className="text-sm font-bold text-on-surface tracking-wide">{title}</h2>
          <span className="text-xs text-on-surface-variant/60 font-medium">({items.length})</span>
        </div>

        {/* ── 2-row horizontal slide — all screen sizes ── */}
        <div className="rounded-2xl border border-outline bg-white/70" style={{ padding: '5px' }}>
          <div
            className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <div
              className={clsx(
                'grid grid-flow-col gap-2',
                '[grid-auto-columns:calc((100vw-84px)/5)]',
                'md:[grid-auto-columns:calc((100vw-116px)/7)]',
                'lg:[grid-auto-columns:calc((100vw-140px)/10)]',
              )}
              style={{ gridTemplateRows: 'repeat(2, 90px)' }}
            >
              {items.map(item => (
                <BrandCard
                  key={item.value}
                  item={item}
                  isActive={activeValue === item.value}
                  count={counts?.[item.value]}
                  onClick={() => handleClick(item.value)}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
