'use client';

import { ChevronLeft } from 'lucide-react';
import { getNotifConfig, renderNotifIcon } from '@/lib/constants/notifications';
import type { NotificationItem } from '@/lib/api/notifications';

interface NotificationCardProps {
  notification: NotificationItem;
  onClick: (n: NotificationItem) => void;
  isSelected?: boolean;
  labels: { viewDetails: string; typeBadge: string };
}

export function NotificationCard({ notification: n, onClick, isSelected, labels }: NotificationCardProps) {
  const cfg = getNotifConfig(n.type);

  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full relative flex items-start gap-3 p-3.5 text-start rounded-xl overflow-hidden border transition-all duration-200 group/item hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-primary/30' : ''}
        ${!n.isRead
          ? 'bg-surface-container-lowest border-outline-variant/20 shadow-sm'
          : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/25'
        }`}
    >
      {!n.isRead && (
        <div className={`absolute top-0 bottom-0 right-0 w-1 ${cfg.strip} rounded-l-sm`} />
      )}

      <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover/item:scale-110 ${cfg.bg}`}>
        <span className={cfg.text}>{renderNotifIcon(cfg)}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[13px] font-bold leading-tight ${!n.isRead ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {n.title}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {labels.typeBadge}
          </span>
          {!n.isRead && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
          )}
        </div>

        <p className={`text-xs mt-0.5 line-clamp-2 leading-relaxed ${!n.isRead ? 'text-on-surface-variant' : 'text-on-surface-variant/70'}`}>
          {n.body}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-on-surface-variant/50 font-medium">
            {labels.viewDetails}
          </span>
        </div>
      </div>

      <ChevronLeft
        size={16}
        className="flex-shrink-0 mt-3 text-on-surface-variant/20 group-hover/item:text-primary transition-all group-hover/item:rtl:-translate-x-1"
      />
    </button>
  );
}
