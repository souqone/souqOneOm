import { UnifiedCard } from '@/features/listings/components/UnifiedCard'
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers'
import type { ListingCategory } from '@/features/listings/types/category.types'

const TABS_CONFIG = [
  { key: 'cars' as const, labelKey: 'سيارات', entityType: 'LISTING' },
  { key: 'buses' as const, labelKey: 'حافلات', entityType: 'BUS_LISTING' },
  { key: 'equipment' as const, labelKey: 'معدات', entityType: 'EQUIPMENT_LISTING' },
  { key: 'operators' as const, labelKey: 'مشغلين', entityType: 'OPERATOR_LISTING' },
  { key: 'parts' as const, labelKey: 'قطع غيار', entityType: 'SPARE_PART' },
  { key: 'services' as const, labelKey: 'خدمات', entityType: 'CAR_SERVICE' },
  { key: 'jobs' as const, labelKey: 'وظائف', entityType: 'JOB' },
] as const

export type ListingTabKey = typeof TABS_CONFIG[number]['key']

interface DataMap {
  cars: { data?: { items: any[] }; isLoading?: boolean }
  buses: { data?: { items: any[] }; isLoading?: boolean }
  equipment: { data?: { items: any[] }; isLoading?: boolean }
  operators: { data?: { items: any[] }; isLoading?: boolean }
  parts: { data?: { items: any[] }; isLoading?: boolean }
  services: { data?: { items: any[] }; isLoading?: boolean }
  jobs: { data?: { items: any[] }; isLoading?: boolean }
}

interface SellerListingsTabProps {
  activeTab: ListingTabKey
  onTabChange: (tab: ListingTabKey) => void
  dataMap: DataMap
}

export { TABS_CONFIG }

export function SellerListingsTab({ activeTab, onTabChange, dataMap }: SellerListingsTabProps) {
  const { transformByCategory } = useItemTransformers()

  const tabsWithCounts = TABS_CONFIG.map(t => ({
    ...t,
    count: dataMap[t.key]?.data?.items?.length ?? 0,
    loading: dataMap[t.key]?.isLoading ?? false,
  }))

  const visibleTabs = tabsWithCounts.filter(t => t.count > 0 || t.key === 'cars')
  const activeData = dataMap[activeTab]
  const items = activeData?.data?.items ?? []
  const isLoading = activeData?.isLoading ?? false

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              activeTab === t.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant'
            }`}
          >
            {t.labelKey}
            {t.count > 0 && ` (${t.count})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => {
            const category = activeTab as ListingCategory
            return (
              <UnifiedCard
                key={item.id}
                item={transformByCategory(category, item)}
                className="h-full"
              />
            )
          })}
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-2xl">
            📭
          </div>
          <p className="text-on-surface font-bold">لا توجد إعلانات</p>
          <p className="text-on-surface-variant text-sm">لم يقم هذا البائع بنشر أي إعلانات بعد</p>
        </div>
      )}
    </div>
  )
}
