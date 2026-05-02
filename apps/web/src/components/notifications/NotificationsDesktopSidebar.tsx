'use client';

import { useTranslations } from 'next-intl';
import { renderNotifIcon, NOTIFICATION_TYPE_CONFIG, DEFAULT_NOTIF_CONFIG } from '@/lib/constants/notifications';

interface TypeBreakdown {
  type: string;
  count: number;
}

interface NotificationsDesktopSidebarProps {
  total: number;
  unread: number;
  filter: 'all' | 'unread';
  onFilterChange: (f: 'all' | 'unread') => void;
  onMarkAll: () => void;
  typeBreakdown: TypeBreakdown[];
  labels: {
    total: string;
    unread: string;
    all: string;
    unreadFilter: string;
    markAllRead: string;
  };
}

export function NotificationsDesktopSidebar({
  total,
  unread,
  filter,
  onFilterChange,
  onMarkAll,
  typeBreakdown,
  labels,
}: NotificationsDesktopSidebarProps) {
  const tp = useTranslations('pages');

  return (
    <aside className="w-64 flex-shrink-0 space-y-4 sticky top-20 self-start">
      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-on-surface">{labels.total}</span>
          <span className="text-[15px] font-black text-primary">{total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-on-surface">{labels.unread}</span>
          <span className="text-[15px] font-black text-error">{unread}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`w-full h-9 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {labels.all}
        </button>
        <button
          onClick={() => onFilterChange('unread')}
          className={`w-full h-9 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {labels.unreadFilter}
        </button>
        {unread > 0 && (
          <button
            onClick={onMarkAll}
            className="w-full h-9 rounded-xl text-xs font-bold bg-surface-container-low text-primary hover:bg-primary/10 transition-all"
          >
            {labels.markAllRead}
          </button>
        )}
      </div>

      {typeBreakdown.length > 0 && (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 space-y-2">
          {typeBreakdown.map(({ type, count }) => {
            const cfg = NOTIFICATION_TYPE_CONFIG[type] ?? DEFAULT_NOTIF_CONFIG;
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                  <span className={cfg.text}>{renderNotifIcon(cfg, 14)}</span>
                </div>
                <span className="text-[12px] text-on-surface-variant flex-1">{tp(cfg.labelKey)}</span>
                <span className="text-[12px] font-bold text-on-surface">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
