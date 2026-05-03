interface NotificationsGroupHeaderProps {
  label: string;
  count: number;
}

export function NotificationsGroupHeader({ label, count }: NotificationsGroupHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-1 pt-4 pb-2 first:pt-0">
      <h3 className="text-[13px] font-bold text-on-surface">{label}</h3>
      <span className="text-[11px] text-on-surface-variant/60 font-medium">({count})</span>
      <div className="flex-1 h-px bg-outline-variant/10" />
    </div>
  );
}
