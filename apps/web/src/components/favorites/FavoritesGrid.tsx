import { UnifiedCard } from '@/features/listings/components/UnifiedCard'
import { ListingCard } from '@/features/listings/components/ListingCard'
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types'

interface FavoritesGridProps {
  items: UnifiedListingItem[]
  viewMode: 'grid' | 'list'
  isSelecting: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

export function FavoritesGrid({
  items,
  viewMode,
  isSelecting,
  selectedIds,
  onToggleSelect,
}: FavoritesGridProps) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
      {items.map(item => {
        const isSelected = selectedIds.has(item.id)
        return (
          <div key={item.id} className="relative">
            {viewMode === 'grid' ? (
              <UnifiedCard item={item} className="h-full" />
            ) : (
              <ListingCard item={item} />
            )}

            {/* Selection checkbox overlay (only in multi-select mode) */}
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
          </div>
        )
      })}
    </div>
  )
}
