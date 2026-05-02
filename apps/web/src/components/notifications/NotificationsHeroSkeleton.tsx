export function NotificationsHeroSkeleton() {
  return (
    <div className="bg-gradient-to-bl from-[#004ac6] via-[#1d4ed8] to-[#0B2447] px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-6 w-32 skeleton-pulse rounded-full opacity-30" />
        <div className="h-4 w-56 skeleton-pulse rounded-full opacity-20" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 w-16 skeleton-pulse rounded-full opacity-20" />
          <div className="h-8 w-24 skeleton-pulse rounded-full opacity-20" />
          <div className="h-8 w-32 skeleton-pulse rounded-full opacity-20 ml-auto" />
        </div>
      </div>
    </div>
  );
}
