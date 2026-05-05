import type { NotificationItem } from '@/lib/api/notifications';

export interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

export function groupNotificationsByDate(
  notifications: NotificationItem[],
  locale: string,
  labels: { today: string; yesterday: string },
): NotificationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;

  const map = new Map<string, NotificationItem[]>();
  const order: string[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt).getTime();
    let key: string;

    if (d >= today) key = labels.today;
    else if (d >= yesterday) key = labels.yesterday;
    else
      key = new Date(n.createdAt).toLocaleDateString(
        locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US',
        { day: 'numeric', month: 'long' },
      );

    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(n);
  }

  return order.map((label) => ({ label, items: map.get(label)! }));
}

export function timeAgo(
  dateStr: string,
  tp: (key: string, values?: any) => string,
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return tp('notifTimeNow');
  if (mins < 60) return tp('notifTimeMinutes', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return tp('notifTimeHours', { count: hrs });
  const days = Math.floor(hrs / 24);
  return tp('notifTimeDays', { count: days });
}
