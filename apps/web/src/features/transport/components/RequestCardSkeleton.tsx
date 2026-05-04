export default function RequestCardSkeleton() {
  return (
    <div className="card-base p-4 flex flex-col gap-3 animate-pulse" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container-high)]" />
          <div>
            <div className="h-3 w-20 bg-[var(--color-surface-container-high)] rounded-full" />
            <div className="h-2 w-12 bg-[var(--color-surface-container)] rounded-full mt-1" />
          </div>
        </div>
        <div className="h-6 w-20 bg-[var(--color-surface-container-high)] rounded-full" />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-surface-container-high)]" />
          <div className="w-0.5 h-6 bg-[var(--color-surface-container-high)] my-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-surface-container-high)]" />
        </div>
        <div className="flex flex-col justify-between gap-2 flex-1">
          <div className="h-3.5 w-24 bg-[var(--color-surface-container-high)] rounded-full" />
          <div className="h-3.5 w-20 bg-[var(--color-surface-container-high)] rounded-full" />
        </div>
      </div>

      <div className="h-9 bg-[var(--color-surface-container)] rounded-xl" />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-[var(--color-surface-container-high)] rounded-full" />
          <div className="h-6 w-16 bg-[var(--color-surface-container-high)] rounded-full" />
        </div>
        <div className="h-5 w-28 bg-[var(--color-surface-container-high)] rounded-full" />
      </div>
    </div>
  );
}
