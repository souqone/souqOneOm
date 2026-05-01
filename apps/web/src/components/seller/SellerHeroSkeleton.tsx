import { Skeleton } from './Skeleton'

export function SellerHeroSkeleton() {
  return (
    <div
      role="status"
      aria-label="جاري التحميل"
      className="flex flex-col items-center gap-3 px-4 pt-6 pb-5 bg-primary/5"
    >
      {/* Avatar */}
      <Skeleton className="w-20 h-20 rounded-2xl" />
      {/* Name */}
      <Skeleton className="h-5 w-36 rounded-full" />
      {/* Username */}
      <Skeleton className="h-4 w-24 rounded-full" />

      {/* Stats row */}
      <div className="flex gap-6 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-6 w-10 rounded" />
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* CTA buttons (mobile) */}
      <div className="flex gap-3 w-full mt-2">
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="flex-1 h-11 rounded-xl" />
        <Skeleton className="w-11 h-11 rounded-xl" />
      </div>
    </div>
  )
}
