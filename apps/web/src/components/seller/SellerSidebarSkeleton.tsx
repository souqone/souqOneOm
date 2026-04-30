import { Skeleton } from './Skeleton'

export function SellerSidebarSkeleton() {
  return (
    <aside className="hidden md:block w-72 flex-shrink-0" role="status" aria-label="جاري التحميل">
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5 space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-3 w-40 rounded-full mx-auto" />
      </div>
    </aside>
  )
}
