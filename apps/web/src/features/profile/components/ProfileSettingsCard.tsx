import { Link } from '@/i18n/navigation';

interface ProfileSettingsCardProps {
  icon: string;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

export function ProfileSettingsCard({ icon, label, description, href, onClick }: ProfileSettingsCardProps) {
  const className = "flex w-full items-center gap-3 p-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest hover:border-outline-variant/30 hover:shadow-sm transition-all group text-right";
  const content = (
    <>
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-on-surface">{label}</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{description}</p>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant/40 text-base">chevron_left</span>
    </>
  );

  if (href) return <Link href={href} className={className}>{content}</Link>;

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
