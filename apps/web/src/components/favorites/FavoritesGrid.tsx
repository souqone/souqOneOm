import { UnifiedCard } from '@/features/listings/components/UnifiedCard'
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types'

interface FavoritesGridProps {
  items: UnifiedListingItem[]
  isSelecting: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onRemove: (id: string) => void
}

export function FavoritesGrid({
  items,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onRemove,
}: FavoritesGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 px-4">
      {items.map(item => {
        const isSelected = selectedIds.has(item.id)
        return (
          <div key={item.id} className="relative">
            <UnifiedCard item={item} className="h-full" />

            {/* Selection checkbox overlay */}
            {isSelecting && (
              <button
                onClick={() => onToggleSelect(item.id)}
                aria-pressed={isSelected}
                aria-label={isSelected ? 'إلغاء التحديد' : 'تحديد'}
                className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  isSelected
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-background/80 backdrop-blur-sm border-outline-variant/40'
                }`}
              >
                {isSelected && (
                  <span className="material-symbols-outlined text-sm">check</span>
                )}
              </button>
            )}

            {/* Remove button (non-selecting mode) */}
            {!isSelecting && (
              <button
                onClick={() => onRemove(item.id)}
                aria-label="إزالة من المفضلة"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-outline-variant/20 flex items-center justify-center text-error hover:bg-error/10 hover:border-error/20 transition-all z-10"
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
