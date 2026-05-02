export function NotificationCardSkeleton() {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl border border-outline-variant/10 bg-surface-container-lowest"
      role="status"
      aria-hidden="true"
    >
      <div className="w-10 h-10 rounded-xl skeleton-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 w-2/3 skeleton-pulse rounded-full" />
          <div className="h-3.5 w-12 skeleton-pulse rounded-full" />
        </div>
        <div className="h-3 w-full skeleton-pulse rounded-full" />
        <div className="h-3 w-4/5 skeleton-pulse rounded-full" />
        <div className="h-2.5 w-16 skeleton-pulse rounded-full" />
      </div>
    </div>
  );
}
