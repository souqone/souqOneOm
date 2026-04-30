import { Skeleton } from './Skeleton'

export function SellerInfoTabSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl divide-y divide-outline-variant/10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-4">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
