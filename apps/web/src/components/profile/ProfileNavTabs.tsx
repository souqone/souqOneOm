export type ProfileTab = 'overview' | 'listings' | 'bookings' | 'settings' | 'security';

interface ProfileNavTabsProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  counts: { listings: number; bookings: number };
  variant?: 'tabs' | 'sidebar';
  onLogout?: () => void;
  labels: {
    overview: string;
    listings: string;
    bookings: string;
    settings: string;
    security: string;
    logout: string;
  };
  className?: string;
}

const TAB_META: Array<{ key: ProfileTab; icon: string; countKey?: 'listings' | 'bookings' }> = [
  { key: 'overview', icon: 'grid_view' },
  { key: 'listings', icon: 'list_alt', countKey: 'listings' },
  { key: 'bookings', icon: 'calendar_month', countKey: 'bookings' },
  { key: 'settings', icon: 'manage_accounts' },
  { key: 'security', icon: 'lock' },
];

export function ProfileNavTabs({ active, onChange, counts, variant = 'tabs', onLogout, labels, className = '' }: ProfileNavTabsProps) {
  if (variant === 'sidebar') {
    return (
      <aside className={`w-64 flex-shrink-0 ${className}`}>
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden sticky top-20">
          {TAB_META.map((tab) => {
            const count = tab.countKey ? counts[tab.countKey] : null;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChange(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-outline-variant/10 last:border-0 transition-all ${
                  active === tab.key ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span className="flex-1 text-right font-medium">{labels[tab.key]}</span>
                {count != null && count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {count}
                  </span>
                )}
                <span className="material-symbols-outlined text-sm text-on-surface-variant/40">chevron_left</span>
              </button>
            );
          })}
          {onLogout && (
            <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface-variant hover:text-error hover:bg-error/5 transition-all border-t border-outline-variant/10">
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="flex-1 text-right">{labels.logout}</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <div className={`sticky top-14 z-10 bg-background border-b border-outline-variant/20 ${className}`}>
      <div className="flex overflow-x-auto no-scrollbar">
        {TAB_META.map((tab) => {
          const count = tab.countKey ? counts[tab.countKey] : null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 flex-shrink-0 transition-all -mb-px ${
                active === tab.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {labels[tab.key]}
              {count != null && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
