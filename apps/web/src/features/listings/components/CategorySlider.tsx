'use client'

import { clsx } from 'clsx'
import type { SliderItem } from '../data'

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategorySliderProps {
  items: SliderItem[]
  title: string
  defaultFilterKey: string
  filters: Record<string, unknown>
  onFilterChange: (key: string, value: string | boolean | null) => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategorySlider({
  items, title, defaultFilterKey, filters, onFilterChange, page, setPage,
}: CategorySliderProps) {
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)

  return (
    <div className="bg-surface-container-lowest border-b border-outline-variant/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative group">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-sm font-bold text-on-surface tracking-wide">{title}</h2>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-on-surface-variant font-medium">
              {page + 1} / {totalPages}
            </span>
          )}
        </div>

        {/* Navigation Arrow — Left (Next in RTL) */}
        {totalPages > 1 && (
          <div className="absolute inset-y-0 -left-1 hidden sm:flex items-center z-20">
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-surface-container-high border border-outline-variant/30 shadow-md text-on-surface-variant",
                page >= totalPages - 1
                  ? "opacity-0 scale-90 pointer-events-none"
                  : "hover:bg-primary hover:text-on-primary hover:border-primary hover:shadow-lg opacity-0 group-hover:opacity-100"
              )}
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
          </div>
        )}

        {/* Navigation Arrow — Right (Prev in RTL) */}
        {totalPages > 1 && (
          <div className="absolute inset-y-0 -right-1 hidden sm:flex items-center z-20">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-surface-container-high border border-outline-variant/30 shadow-md text-on-surface-variant",
                page === 0
                  ? "opacity-0 scale-90 pointer-events-none"
                  : "hover:bg-primary hover:text-on-primary hover:border-primary hover:shadow-lg opacity-0 group-hover:opacity-100"
              )}
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
        )}

        {/* Slider Content — touch swipeable */}
        <div
          className="overflow-hidden rounded-2xl touch-pan-y"
          onTouchStart={(e) => {
            const touch = e.touches[0]
            ;(e.currentTarget as any)._touchStartX = touch.clientX
            ;(e.currentTarget as any)._touchStartY = touch.clientY
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._touchStartX
            const startY = (e.currentTarget as any)._touchStartY
            if (startX == null) return
            const endX = e.changedTouches[0].clientX
            const endY = e.changedTouches[0].clientY
            const diffX = startX - endX
            const diffY = Math.abs(startY - endY)
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
              if (diffX > 0) setPage(p => Math.min(totalPages - 1, p + 1))
              else setPage(p => Math.max(0, p - 1))
            }
          }}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(${page * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIdx) => (
              <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 grid-rows-2 gap-2 sm:gap-4 px-1 sm:px-6">
                {items.slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE).map((item, idx) => {
                  const fKey = item.filterKey || defaultFilterKey
                  const isActive = item.isBoolean
                    ? filters[fKey] === true || filters[fKey] === 'true'
                    : filters[fKey] === item.value

                  return (
                    <button
                      key={item.value + fKey}
                      onClick={() => {
                        if (item.isBoolean) onFilterChange(fKey, isActive ? null : true)
                        else onFilterChange(fKey, isActive ? null : item.value)
                      }}
                      className={clsx(
                        "flex flex-col items-center gap-2 sm:gap-2.5 py-3 sm:py-4 px-1 sm:px-2 rounded-xl transition-all duration-300",
                        idx >= 6 && "hidden sm:flex",
                        idx >= 8 && "sm:hidden lg:flex",
                        isActive
                          ? "bg-primary-fixed/60 ring-1 ring-primary/30 shadow-sm"
                          : "hover:bg-surface-container hover:shadow-sm"
                      )}
                    >
                      {/* Visual — logo / img / icon */}
                      {item.logo ? (
                        <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.logo}
                            alt={item.name}
                            className={clsx(
                              "w-9 h-9 sm:w-12 sm:h-12 object-contain transition-all duration-300",
                              isActive ? "scale-110" : "opacity-75"
                            )}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <span
                            style={{ display: 'none' }}
                            className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-primary-fixed items-center justify-center text-primary font-bold text-base sm:text-lg"
                          >
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      ) : (
                        <div className={clsx(
                          "w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden",
                          item.img
                            ? "bg-surface-container"
                            : isActive
                              ? `bg-gradient-to-br ${item.gradient} scale-110 shadow-md`
                              : `bg-gradient-to-br ${item.gradient} opacity-75`,
                          isActive && item.img && "ring-2 ring-primary/30 shadow-md scale-105"
                        )}>
                          {item.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.img} alt={item.name} className={clsx(
                              "w-full h-full object-cover transition-all duration-300",
                              isActive ? "scale-110" : "opacity-90"
                            )} />
                          ) : (
                            <span className="material-symbols-outlined text-white text-xl sm:text-2xl">{item.icon}</span>
                          )}
                        </div>
                      )}

                      {/* Label */}
                      <span className={clsx(
                        "text-[10px] sm:text-[11px] text-center font-bold tracking-tight truncate w-full leading-tight",
                        isActive ? "text-primary" : "text-on-surface-variant"
                      )}>
                        {item.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 sm:mt-5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  page === i
                    ? "w-8 bg-primary"
                    : "w-2 bg-outline-variant/40 hover:bg-outline-variant"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
