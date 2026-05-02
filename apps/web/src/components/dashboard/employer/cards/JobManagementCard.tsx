'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { JOB_STATUS_CONFIG, SALARY_PERIOD_CONFIG } from '@/lib/constants/jobs';
import { Button } from '@/components/ui/button';
import type { JobItem } from '@/lib/api/jobs';
import type { EmployerTab } from '../EmployerNavTabs';

function timeAgo(dateStr: string, tp: (key: string, values?: any) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return tp('notifTimeNow');
  if (mins < 60) return tp('notifTimeMinutes', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return tp('notifTimeHours', { count: hrs });
  return tp('notifTimeDays', { count: Math.floor(hrs / 24) });
}

interface JobManagementCardProps {
  job: JobItem;
  onClose: (jobId: string) => void;
  onViewApps: (jobId: string) => void;
  setTab: (tab: EmployerTab) => void;
}

export function JobManagementCard({ job, onClose, onViewApps, setTab }: JobManagementCardProps) {
  const tp = useTranslations('pages');
  const router = useRouter();
  const statusCfg = JOB_STATUS_CONFIG[job.status] ?? JOB_STATUS_CONFIG.ACTIVE;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 hover:border-outline-variant/30 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
          <p className="font-semibold text-on-surface text-[13px] leading-tight">{job.title}</p>
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{timeAgo(job.createdAt, tp)}</p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
          {tp(statusCfg.labelKey)}
        </span>
      </div>

      {/* Salary */}
      {job.salary && (
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-black text-primary text-base">{Number(job.salary).toLocaleString('ar-OM')}</span>
          <span className="text-[11px] text-primary/60">{tp('currencyOMR')}</span>
          {job.salaryPeriod && SALARY_PERIOD_CONFIG[job.salaryPeriod] && (
            <span className="text-[10px] text-on-surface-variant/50">{tp(SALARY_PERIOD_CONFIG[job.salaryPeriod].labelKey)}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: tp('jobApplicants'), value: job._count?.applications ?? 0, icon: 'group' },
          { label: tp('jobViews'),      value: job.viewCount,                 icon: 'visibility' },
          { label: tp('jobInvites'),    value: job.inviteCount ?? 0,          icon: 'mail' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-low rounded-xl p-2 text-center border border-outline-variant/[0.06]">
            <p className="font-black text-on-surface text-sm leading-none">{s.value.toLocaleString('ar-OM')}</p>
            <p className="text-[9px] text-on-surface-variant/50 mt-0.5 flex items-center justify-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">{s.icon}</span>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Actions — active only */}
      {job.status === 'ACTIVE' && (
        <div className="flex gap-2">
          <Button
            onClick={() => onViewApps(job.id)}
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl border-primary/20 text-primary text-[11px] font-semibold bg-primary/5 hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-base">people</span>
            {tp('viewApps')} ({job._count?.applications ?? 0})
          </Button>
          <Button
            onClick={() => setTab('invite')}
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            {tp('inviteDriver')}
          </Button>
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-base">more_vert</span>
            </Button>
            <div className="absolute end-0 top-10 z-20 hidden group-focus-within:flex flex-col bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
              <button
                onClick={() => router.push(`/edit-listing/job/${job.id}`)}
                className="px-4 py-2.5 text-[12px] text-on-surface hover:bg-surface-container-low text-right"
              >
                {tp('editJob')}
              </button>
              <button
                onClick={() => onClose(job.id)}
                className="px-4 py-2.5 text-[12px] text-error hover:bg-error/5 text-right"
              >
                {tp('closeJob')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
