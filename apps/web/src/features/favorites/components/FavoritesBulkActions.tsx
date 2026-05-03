interface FavoritesBulkActionsProps {
  selectedCount: number
  total: number
  onSelectAll: () => void
  onDelete: () => void
}

export function FavoritesBulkActions({
  selectedCount,
  total,
  onSelectAll,
  onDelete,
}: FavoritesBulkActionsProps) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-outline-variant/20 px-4 py-3 flex items-center justify-between gap-3 md:max-w-5xl md:mx-auto"
      aria-live="polite"
    >
      <span className="text-on-surface-variant text-sm">
        {selectedCount === 0
          ? 'اختر إعلانات'
          : `تم تحديد ${selectedCount}`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onSelectAll}
          className="px-4 py-2 rounded-full text-sm font-medium border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
        >
          {selectedCount === total ? 'إلغاء الكل' : 'تحديد الكل'}
        </button>
        <button
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="px-4 py-2 rounded-full text-sm font-medium bg-error/10 text-error border border-error/20 hover:bg-error hover:text-on-error transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          حذف ({selectedCount})
        </button>
      </div>
    </div>
  )
}
