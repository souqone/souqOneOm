'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { NotificationCard } from './NotificationCard';
import { NotificationCardSkeleton } from './NotificationCardSkeleton';
import { NotificationsGroupHeader } from './NotificationsGroupHeader';
import { getNotifConfig } from '@/lib/constants/notifications';
import { timeAgo } from '@/lib/utils/group-by-date';
import type { NotificationGroup } from '@/lib/utils/group-by-date';
import type { NotificationItem } from '@/lib/api/notifications';

interface NotificationsListProps {
  groups: NotificationGroup[];
  onNotificationClick: (n: NotificationItem) => void;
  selectedId?: string;
  variant?: 'mobile' | 'desktop';
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function NotificationsList({
  groups,
  onNotificationClick,
  selectedId,
  variant = 'mobile',
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: NotificationsListProps) {
  const tp = useTranslations('pages');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== 'mobile' || !hasNextPage || !fetchNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [variant, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="space-y-1 px-4">
      {groups.map((group) => (
        <div key={group.label}>
          <NotificationsGroupHeader label={group.label} count={group.items.length} />
          <div className="space-y-2">
            {group.items.map((n) => {
              const cfg = getNotifConfig(n.type);
              return (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onClick={onNotificationClick}
                  isSelected={selectedId === n.id}
                  labels={{
                    viewDetails: timeAgo(n.createdAt, tp),
                    typeBadge: tp(cfg.labelKey),
                  }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {variant === 'mobile' && (
        <>
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="space-y-2 pb-4">
              <NotificationCardSkeleton />
              <NotificationCardSkeleton />
            </div>
          )}
          {!hasNextPage && totalItems > 0 && (
            <p className="text-center text-on-surface-variant/50 text-xs py-8 font-medium">
              — {tp('notifEndOfList')} —
            </p>
          )}
        </>
      )}
    </div>
  );
}
