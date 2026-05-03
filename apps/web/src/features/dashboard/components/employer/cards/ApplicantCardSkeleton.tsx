export function ApplicantCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 space-y-3" aria-hidden>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-surface-container-high animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-32 rounded-full bg-surface-container-high animate-pulse" />
          <div className="flex gap-1.5">
            <div className="h-4 w-14 rounded-full bg-surface-container-high animate-pulse" />
            <div className="h-4 w-14 rounded-full bg-surface-container-high animate-pulse" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-surface-container-high animate-pulse flex-shrink-0" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-11 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="flex-1 h-11 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="w-11 h-11 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
    </div>
  );
}
