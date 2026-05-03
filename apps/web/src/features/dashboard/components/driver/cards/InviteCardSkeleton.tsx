export function InviteCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 space-y-3" aria-hidden>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-36 rounded-full bg-surface-container-high animate-pulse" />
          <div className="h-2.5 w-24 rounded-full bg-surface-container-high animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-full rounded-xl bg-surface-container-high animate-pulse" />
      <div className="h-6 w-32 rounded-full bg-surface-container-high animate-pulse" />
      <div className="flex gap-2">
        <div className="flex-1 h-11 rounded-xl bg-surface-container-high animate-pulse" />
        <div className="flex-1 h-11 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
    </div>
  );
}
