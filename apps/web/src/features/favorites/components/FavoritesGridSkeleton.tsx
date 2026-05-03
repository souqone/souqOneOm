import { Skeleton } from '@/components/seller/Skeleton'

export function FavoritesGridSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-outline-variant/10 overflow-hidden bg-surface-container-lowest">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="p-2.5 sm:p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
