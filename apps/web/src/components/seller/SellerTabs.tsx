import { useState } from 'react'
import clsx from 'clsx'

type TabValue = 'listings' | 'reviews' | 'info'

interface Tab {
  value: TabValue
  label: string
  count?: number
}

interface SellerTabsProps {
  listingsCount: number
  reviewCount: number
  isLoading: boolean
  children: (activeTab: TabValue) => React.ReactNode
}

export function SellerTabs({ listingsCount, reviewCount, isLoading, children }: SellerTabsProps) {
  const [active, setActive] = useState<TabValue>('listings')

  const tabs: Tab[] = [
    { value: 'listings', label: 'إعلاناته', count: listingsCount },
    { value: 'reviews', label: 'التقييمات', count: reviewCount },
    { value: 'info', label: 'معلومات' },
  ]

  return (
    <div>
      {/* Sticky tab bar */}
      <div className="sticky top-14 z-10 bg-background border-b border-outline-variant/20 -mx-4 px-4">
        <div
          className={clsx(
            'grid grid-cols-3',
            isLoading && 'pointer-events-none opacity-50'
          )}
        >
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setActive(t.value)}
              className={clsx(
                'relative py-3 text-sm font-bold text-center transition-colors',
                active === t.value
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {t.label}
              {!isLoading && t.count != null && t.count > 0 && (
                <span className="text-xs opacity-70 mr-1">({t.count})</span>
              )}
              {active === t.value && (
                <span className="absolute bottom-0 inset-x-0 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="pt-5 px-4">
        {children(active)}
      </div>
    </div>
  )
}

export type { TabValue }
