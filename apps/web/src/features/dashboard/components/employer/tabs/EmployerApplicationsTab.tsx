'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApplicantCard } from '../cards/ApplicantCard';
import { ApplicantCardSkeleton } from '../cards/ApplicantCardSkeleton';
import { NoApplicationsState } from '../empty/NoApplicationsState';
import type { EmployerApplicationItem } from '@/lib/api/jobs';

type StatusFilter = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface EmployerApplicationsTabProps {
  applications: EmployerApplicationItem[];
  isLoading: boolean;
  jobFilter?: string;
  onUpdateStatus: (appId: string, status: 'ACCEPTED' | 'REJECTED') => void;
  onRelease: (escrowId: string) => void;
  onDispute: (escrowId: string) => void;
  onOpenPay: (app: EmployerApplicationItem) => void;
  isUpdating: boolean;
}

export function EmployerApplicationsTab({
  applications, isLoading, jobFilter,
  onUpdateStatus, onRelease, onDispute, onOpenPay, isUpdating,
}: EmployerApplicationsTabProps) {
  const tp = useTranslations('pages');
  const [filter, setFilter] = useState<StatusFilter>('all');

  let filtered = jobFilter ? applications.filter((a) => a.jobId === jobFilter) : applications;
  filtered = filter === 'all' ? filtered : filtered.filter((a) => a.status === filter);

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all',      label: tp('filterAll') },
    { key: 'PENDING',  label: tp('appStatusPending') },
    { key: 'ACCEPTED', label: tp('appStatusAccepted') },
    { key: 'REJECTED', label: tp('appStatusRejected') },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <ApplicantCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto scrollbar-none gap-2 pb-1">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${filter === f.key ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <NoApplicationsState />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicantCard key={app.id} app={app} onUpdateStatus={onUpdateStatus}
              onRelease={onRelease} onDispute={onDispute} onOpenPay={onOpenPay} isUpdating={isUpdating} />
          ))}
        </div>
      )}
    </div>
  );
}
