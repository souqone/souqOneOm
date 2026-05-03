import { BellOff, CheckCheck } from 'lucide-react';

interface NotificationsEmptyStateProps {
  variant: 'empty' | 'all-read';
  labels: {
    emptyTitle: string;
    emptyDesc: string;
    noUnread: string;
    showAll: string;
  };
  onShowAll?: () => void;
}

export function NotificationsEmptyState({ variant, labels, onShowAll }: NotificationsEmptyStateProps) {
  if (variant === 'all-read') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6" role="status">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
          <CheckCheck size={24} className="text-green-600" />
        </div>
        <p className="text-on-surface font-bold">{labels.noUnread}</p>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="text-primary text-sm font-bold underline underline-offset-2"
          >
            {labels.showAll}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6"
      role="status"
    >
      <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center">
        <BellOff size={36} className="text-on-surface-variant/30" />
      </div>
      <p className="text-on-surface font-bold text-lg">{labels.emptyTitle}</p>
      <p className="text-on-surface-variant text-sm">{labels.emptyDesc}</p>
    </div>
  );
}
