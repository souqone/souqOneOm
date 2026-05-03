export function ProfileNavTabsSkeleton() {
  return (
    <div role="status" aria-label="جاري التحميل" className="border-b border-outline-variant/20 bg-background">
      <div className="flex gap-2 overflow-hidden px-4" aria-hidden="true">
        {[88, 96, 84, 92, 76].map((w, i) => (
          <div key={i} className="h-11 flex-shrink-0 py-3">
            <div className="h-4 rounded-full bg-surface-container-high animate-pulse" style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );
}
