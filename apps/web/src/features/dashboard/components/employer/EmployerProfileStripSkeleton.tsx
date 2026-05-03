export function EmployerProfileStripSkeleton() {
  return (
    <div className="relative bg-gradient-to-bl from-primary via-[#1d4ed8] to-[#0B2447] overflow-hidden" aria-hidden>
      <div className="relative z-10 px-4 pt-5 pb-8 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded-full bg-white/10 animate-pulse" />
          <div className="h-3 w-24 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
