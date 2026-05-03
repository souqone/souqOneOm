export function ProfileListingsTabSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-outline-variant/15 bg-surface-container-lowest" aria-hidden="true">
          <div className="aspect-[16/10] bg-surface-container-high animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 rounded-full bg-surface-container-high animate-pulse" />
            <div className="h-3 w-1/2 rounded-full bg-surface-container-high animate-pulse" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-16 rounded-full bg-surface-container-high animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
