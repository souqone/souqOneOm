'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApplicationCard } from '../cards/ApplicationCard';
import { ApplicationCardSkeleton } from '../cards/ApplicationCardSkeleton';
import { DriverEmptyState } from '../empty/DriverEmptyState';
import type { MyApplicationItem } from '@/lib/api/jobs';

type StatusFilter = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

interface DriverApplicationsTabProps {
  applications: MyApplicationItem[];
  isLoading: boolean;
  onWithdraw: (id: string) => void;
  onChat: (userId: string) => void;
  onDispute: (escrowId: string) => void;
}

export function DriverApplicationsTab({ applications, isLoading, onWithdraw, onChat, onDispute }: DriverApplicationsTabProps) {
  const tp = useTranslations('pages');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: tp('filterAll') },
    { key: 'PENDING', label: tp('appStatusPending') },
    { key: 'ACCEPTED', label: tp('appStatusAccepted') },
    { key: 'REJECTED', label: tp('appStatusRejected') },
    { key: 'WITHDRAWN', label: tp('appStatusWithdrawn') },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ApplicationCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto scrollbar-none gap-2 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${filter === f.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <DriverEmptyState
          icon="list_alt"
          title={tp('noAppsTitle')}
          desc={tp('noAppsDesc')}
          actionLabel={tp('browseJobs')}
          actionHref="/jobs"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onWithdraw={onWithdraw}
              onChat={onChat}
              onDispute={onDispute}
            />
          ))}
        </div>
      )}
    </div>
  );
}
