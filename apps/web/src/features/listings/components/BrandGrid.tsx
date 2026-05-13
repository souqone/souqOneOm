'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { SliderItem } from '../data'

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_ROWS = 2
const COLS = 4
const INITIAL_VISIBLE = INITIAL_ROWS * COLS   // 8
const BRAND_BLUE = '#0052CC'

// ── Props ─────────────────────────────────────────────────────────────────────

interface BrandGridProps {
  items: SliderItem[]
  title?: string
  filterKey?: string
  filters: Record<string, unknown>
  onFilterChange: (key: string, value: string | boolean | null) => void
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BrandGrid({
  items,
  title = 'تصفح حسب الماركة',
  filterKey = 'make',
  filters,
  onFilterChange,
  className,
}: BrandGridProps) {
  const [expanded, setExpanded] = useState(false)

  const visibleItems = expanded ? items : items.slice(0, INITIAL_VISIBLE)
  const hasMore = items.length > INITIAL_VISIBLE
  const activeValue = filters[filterKey] as string | undefined

  function handleClick(value: string) {
    onFilterChange(filterKey, activeValue === value ? null : value)
  }

  return (
    <section
      dir="rtl"
      data-component="BrandGrid"
      className={clsx(
        'border-b border-outline-variant/20',
        'bg-[#f8faff]',
        className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: BRAND_BLUE }}
            />
            <h2 className="text-sm font-bold text-on-surface tracking-wide">
              {title}
            </h2>
            <span className="text-xs text-on-surface-variant/60 font-medium">
              ({items.length})
            </span>
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-bold transition-colors duration-200"
              style={{ color: BRAND_BLUE }}
            >
              {expanded ? (
                <>عرض أقل <ChevronUp size={14} /></>
              ) : (
                <>عرض الكل <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {visibleItems.map((item) => {
            const isActive = activeValue === item.value

            return (
              <button
                key={item.value}
                data-brand={item.value}
                onClick={() => handleClick(item.value)}
                className={clsx(
                  'group relative flex flex-col items-center justify-center gap-1.5 sm:gap-2',
                  'py-3 sm:py-4 px-2 rounded-2xl',
                  'border transition-all duration-300 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-white shadow-md -translate-y-0.5'
                    : 'bg-white border-transparent shadow-sm hover:-translate-y-1 hover:shadow-md',
                )}
                style={
                  isActive
                    ? { border: `1.5px solid ${BRAND_BLUE}20`, boxShadow: `0 4px 16px ${BRAND_BLUE}18` }
                    : undefined
                }
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span
                    className="absolute top-1.5 end-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: BRAND_BLUE }}
                  />
                )}

                {/* Logo */}
                <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0">
                  {item.logo ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.logo}
                        alt={item.name}
                        loading="lazy"
                        className={clsx(
                          'w-8 h-8 sm:w-10 sm:h-10 object-contain',
                          'transition-all duration-300 group-hover:scale-110',
                          isActive ? 'scale-105' : 'opacity-80 group-hover:opacity-100',
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
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl items-center justify-center font-bold text-sm sm:text-base"
                      >
                        {item.name.charAt(0)}
                      </span>
                    </>
                  ) : (
                    <span
                      style={{ color: BRAND_BLUE, background: `${BRAND_BLUE}12` }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base"
                    >
                      {item.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span
                  className={clsx(
                    'text-[10px] sm:text-[11px] font-semibold text-center leading-tight',
                    'transition-colors duration-200',
                    isActive ? 'font-bold' : 'text-on-surface-variant group-hover:text-on-surface',
                  )}
                  style={isActive ? { color: BRAND_BLUE } : undefined}
                >
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Expand toggle (bottom, mobile) ── */}
        {hasMore && (
          <div className="mt-3 flex justify-center sm:hidden">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-full border transition-colors duration-200"
              style={{ color: BRAND_BLUE, borderColor: `${BRAND_BLUE}30`, background: `${BRAND_BLUE}08` }}
            >
              {expanded ? (
                <>عرض أقل <ChevronUp size={13} /></>
              ) : (
                <>+ {items.length - INITIAL_VISIBLE} ماركة أخرى</>
              )}
            </button>
          </div>
        )}

      </div>
    </section>
  )
}
