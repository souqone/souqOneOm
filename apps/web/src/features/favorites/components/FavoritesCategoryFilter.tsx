import type { EntityType } from '@/lib/api/favorites'

const CATEGORIES: { value: EntityType | 'ALL'; label: string; icon: string }[] = [
  { value: 'ALL', label: 'الكل', icon: 'apps' },
  { value: 'LISTING', label: 'سيارات', icon: 'directions_car' },
  { value: 'BUS_LISTING', label: 'حافلات', icon: 'directions_bus' },
  { value: 'EQUIPMENT_LISTING', label: 'معدات', icon: 'construction' },
  { value: 'SPARE_PART', label: 'قطع غيار', icon: 'settings' },
  { value: 'CAR_SERVICE', label: 'خدمات', icon: 'build' },
  { value: 'JOB', label: 'وظائف', icon: 'work' },
  { value: 'OPERATOR_LISTING', label: 'مشغلين', icon: 'engineering' },
]

interface FavoritesCategoryFilterProps {
  active: EntityType | 'ALL'
  onChange: (category: EntityType | 'ALL') => void
  counts: Record<string, number>
}

export function FavoritesCategoryFilter({ active, onChange, counts }: FavoritesCategoryFilterProps) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  const visible = CATEGORIES.filter(
    c => c.value === 'ALL' || (counts[c.value] ?? 0) > 0
  )

  return (
    <div
      role="tablist"
      className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3"
    >
      {visible.map(c => {
        const isActive = active === c.value
        const count = c.value === 'ALL' ? total : (counts[c.value] ?? 0)
        return (
          <button
            key={c.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(c.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
            {c.label}
            {count > 0 && (
              <span className={`text-xs px-1.5 rounded-full min-w-4 text-center ${
                isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
