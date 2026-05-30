'use client';

import { forwardRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import type { NotificationItem } from '@/lib/api';
import { getNotifConfig } from '@/lib/constants/notifications';

interface NotificationDropdownProps {
  open: boolean;
  toggle: () => void;
  close: () => void;
  unreadCount: number;
  items: NotificationItem[];
  onMarkRead: (id: string) => void;
}

export const NotificationDropdown = forwardRef<HTMLDivElement, NotificationDropdownProps>(
  ({ open, toggle, close, unreadCount, items, onMarkRead }, ref) => {
    const t = useTranslations('common');
    const router = useRouter();
    return (
      <div ref={ref} className="relative hidden lg:block">
        <button
          onClick={toggle}
          className="flex w-8 h-8 rounded-full items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all relative"
        >
          <span className="material-symbols-outlined text-base">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-80 bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
              <span className="font-bold text-sm text-on-surface">{t('notifications')}</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-900/20 text-red-400 px-2 py-0.5 rounded font-semibold">{t('newCount', { count: unreadCount })}</span>
              )}
            </div>
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">{t('noNotifications')}</div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/10">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) onMarkRead(n.id);
                      close();
                      const path = getNotifConfig(n.type).navigateTo(n.data) ?? '/notifications';
                      router.push(path);
                    }}
                    className={`w-full text-start px-4 py-3 flex items-start gap-2.5 hover:bg-surface-container transition-colors ${
                      !n.isRead ? 'bg-primary/[0.03]' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      !n.isRead ? 'bg-primary/10' : 'bg-surface-container'
                    }`}>
                      <span className={`material-symbols-outlined text-xs ${!n.isRead ? 'text-primary' : 'text-outline'}`}>notifications</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">{n.body}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
            )}
            <Link
              href="/notifications"
              onClick={close}
              className="block text-center py-2.5 text-xs font-semibold text-primary hover:bg-surface-container border-t border-outline-variant/20 transition-colors"
            >
              {t('viewAllNotifications')}
            </Link>
          </div>
        )}
      </div>
    );
  },
);

NotificationDropdown.displayName = 'NotificationDropdown';
