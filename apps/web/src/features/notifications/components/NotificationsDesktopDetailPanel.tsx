'use client';

import { Bell } from 'lucide-react';
import { getNotifConfig, renderNotifIcon } from '@/lib/constants/notifications';
import type { NotificationItem } from '@/lib/api/notifications';

interface NotificationsDesktopDetailPanelProps {
  notification: NotificationItem | null;
  labels: {
    selectPrompt: string;
    readStatus: string;
    unreadStatus: string;
  };
}

export function NotificationsDesktopDetailPanel({
  notification,
  labels,
}: NotificationsDesktopDetailPanelProps) {
  if (!notification) {
    return (
      <aside className="w-72 flex-shrink-0 sticky top-20 self-start">
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 flex flex-col items-center justify-center min-h-[200px] gap-3">
          <Bell size={28} className="text-on-surface-variant/30" />
          <p className="text-[13px] text-on-surface-variant text-center">{labels.selectPrompt}</p>
        </div>
      </aside>
    );
  }

  const cfg = getNotifConfig(notification.type);

  return (
    <aside className="w-72 flex-shrink-0 sticky top-20 self-start">
      <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 space-y-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          <span className={cfg.text}>{renderNotifIcon(cfg, 20)}</span>
        </div>
        <h3 className="text-[15px] font-bold text-on-surface">{notification.title}</h3>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">{notification.body}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${notification.isRead ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/10 text-primary'}`}>
            {notification.isRead ? labels.readStatus : labels.unreadStatus}
          </span>
          <span className="text-[11px] text-on-surface-variant/50">
            {new Date(notification.createdAt).toLocaleString('en-US')}
          </span>
        </div>
      </div>
    </aside>
  );
}
