'use client';

import { Button } from '@/components/ui/button';

interface DriverEmptyStateProps {
  icon: string;
  title: string;
  desc: string;
  actionLabel?: string;
  actionHref?: string;
}

export function DriverEmptyState({ icon, title, desc, actionLabel, actionHref }: DriverEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center" role="status">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">{icon}</span>
      </div>
      <p className="text-on-surface font-semibold text-[14px]">{title}</p>
      <p className="text-on-surface-variant text-[12px] max-w-xs">{desc}</p>
      {actionLabel && actionHref && (
        <Button
          href={actionHref}
          size="sm"
          className="h-9 px-5 rounded-xl bg-primary text-on-primary text-[12px] font-semibold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
