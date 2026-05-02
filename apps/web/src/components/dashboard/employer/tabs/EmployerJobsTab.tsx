'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { JobManagementCard } from '../cards/JobManagementCard';
import { JobManagementCardSkeleton } from '../cards/JobManagementCardSkeleton';
import { NoJobsState } from '../empty/NoJobsState';
import type { JobItem } from '@/lib/api/jobs';
import type { EmployerTab } from '../EmployerNavTabs';

type StatusFilter = 'all' | 'ACTIVE' | 'CLOSED' | 'DRAFT' | 'EXPIRED';

interface EmployerJobsTabProps {
  jobs: JobItem[];
  isLoading: boolean;
  onClose: (jobId: string) => void;
  onViewApps: (jobId: string) => void;
  setTab: (tab: EmployerTab) => void;
}

export function EmployerJobsTab({ jobs, isLoading, onClose, onViewApps, setTab }: EmployerJobsTabProps) {
  const tp = useTranslations('pages');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all',     label: tp('filterAll') },
    { key: 'ACTIVE',  label: tp('jobStatusActive') },
    { key: 'CLOSED',  label: tp('jobStatusClosed') },
    { key: 'DRAFT',   label: tp('jobStatusDraft') },
    { key: 'EXPIRED', label: tp('jobStatusExpired') },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <JobManagementCardSkeleton key={i} />)}
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
        <NoJobsState />
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobManagementCard key={job.id} job={job} onClose={onClose} onViewApps={onViewApps} setTab={setTab} />
          ))}
        </div>
      )}
    </div>
  );
}
