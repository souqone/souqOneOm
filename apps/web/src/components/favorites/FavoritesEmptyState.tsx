import { Button } from '@/components/ui/button'

interface FavoritesEmptyStateProps {
  variant: 'empty' | 'no-results'
  onClear?: () => void
}

export function FavoritesEmptyState({ variant, onClear }: FavoritesEmptyStateProps) {
  if (variant === 'no-results') {
    return (
      <div
        role="status"
        aria-label="لا توجد نتائج"
        className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-3xl">
          🔍
        </div>
        <p className="text-on-surface font-bold">لا توجد مفضلة في هذا القسم</p>
        {onClear && (
          <button
            onClick={onClear}
            className="text-primary text-sm underline underline-offset-2"
          >
            عرض الكل
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="لا توجد مفضلة"
      className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center">
        <span
          className="material-symbols-outlined text-4xl text-on-surface-variant"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          favorite
        </span>
      </div>
      <h2 className="text-on-surface font-bold text-lg">لا توجد مفضلة بعد</h2>
      <p className="text-on-surface-variant text-sm max-w-xs">
        اضغط على أيقونة القلب في أي إعلان لحفظه هنا
      </p>
      <Button variant="primary" href="/" className="rounded-full px-6 mt-2">
        تصفح الإعلانات
      </Button>
    </div>
  )
}
