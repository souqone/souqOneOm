import { Skeleton } from '@/components/seller/Skeleton'

export function FavoritesCategoryFilterSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="flex gap-2 px-4 py-3 overflow-hidden">
      {['w-20', 'w-16', 'w-[72px]', 'w-16', 'w-20'].map((w, i) => (
        <Skeleton key={i} className={`h-9 rounded-full flex-shrink-0 ${w}`} />
      ))}
    </div>
  )
}
