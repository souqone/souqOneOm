export function ProfileHeroSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل">
      <div className="h-36 md:h-44 bg-surface-container-high animate-pulse" aria-hidden="true" />
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-10 pb-4" aria-hidden="true">
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-4 shadow-sm">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-background bg-surface-container-high animate-pulse" />
          <div className="h-5 w-44 rounded-full mt-4 bg-surface-container-high animate-pulse" />
          <div className="h-3 w-28 rounded-full mt-2 bg-surface-container-high animate-pulse" />
          <div className="h-3 w-36 rounded-full mt-2 bg-surface-container-high animate-pulse" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            {[60, 72, 56].map((w, i) => (
              <div key={i} className="h-6 rounded-full bg-surface-container-high animate-pulse" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
