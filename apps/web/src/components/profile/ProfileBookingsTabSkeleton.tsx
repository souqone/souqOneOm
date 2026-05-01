export function ProfileBookingsTabSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="space-y-3 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4" aria-hidden="true">
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded-full bg-surface-container-high animate-pulse" />
              <div className="h-3 w-1/2 rounded-full bg-surface-container-high animate-pulse" />
              <div className="h-3 w-1/3 rounded-full bg-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
