import { Skeleton } from './Skeleton'

export function SellerReviewsTabSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="space-y-4">
      {/* Summary card skeleton */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <Skeleton className="h-10 w-14 rounded" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <div className="flex-1 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-2 w-full rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Review cards skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}
