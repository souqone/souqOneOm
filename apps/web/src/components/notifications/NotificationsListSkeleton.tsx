import { NotificationCardSkeleton } from './NotificationCardSkeleton';

export function NotificationsListSkeleton() {
  return (
    <div className="space-y-2 p-4" role="status" aria-label="جاري التحميل">
      <div className="h-4 w-16 skeleton-pulse rounded-full mb-3" aria-hidden="true" />
      {[...Array(4)].map((_, i) => (
        <NotificationCardSkeleton key={i} />
      ))}
    </div>
  );
}
