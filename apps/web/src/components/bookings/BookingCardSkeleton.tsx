export function BookingCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm animate-pulse">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-surface-container-high flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-surface-container-high rounded w-3/4" />
            <div className="h-3 bg-surface-container rounded w-1/2" />
          </div>
        </div>
        <div className="h-10 bg-surface-container-low rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-container-high" />
          <div className="h-3 bg-surface-container-high rounded w-1/3" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-surface-container-high rounded-xl" />
          <div className="flex-1 h-9 bg-surface-container rounded-xl" />
        </div>
      </div>
    </div>
  );
}
