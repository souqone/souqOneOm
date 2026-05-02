'use client';

import { useTranslations } from 'next-intl';
import { EmployerStatsGrid } from '../EmployerStatsGrid';
import { JobManagementCard } from '../cards/JobManagementCard';
import { ApplicantCard } from '../cards/ApplicantCard';
import { Button } from '@/components/ui/button';
import type { JobItem, EmployerApplicationItem } from '@/lib/api/jobs';
import type { EmployerTab } from '../EmployerNavTabs';

interface EmployerOverviewTabProps {
  jobs: JobItem[];
  applications: EmployerApplicationItem[];
  onTabChange: (tab: EmployerTab) => void;
  onCloseJob: (jobId: string) => void;
  onViewApps: (jobId: string) => void;
  onUpdateStatus: (appId: string, status: 'ACCEPTED' | 'REJECTED') => void;
  onRelease: (escrowId: string) => void;
  onDispute: (escrowId: string) => void;
  onOpenPay: (app: EmployerApplicationItem) => void;
  isUpdating: boolean;
}

export function EmployerOverviewTab({
  jobs, applications, onTabChange, onCloseJob, onViewApps,
  onUpdateStatus, onRelease, onDispute, onOpenPay, isUpdating,
}: EmployerOverviewTabProps) {
  const tp = useTranslations('pages');

  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE');
  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const recentApps = applications.slice(0, 3);

  return (
    <div className="space-y-5">
      <EmployerStatsGrid
        totalJobs={jobs.length}
        activeJobs={activeJobs.length}
        totalApps={applications.length}
        pendingApps={pendingApps.length}
      />

      {/* Pending alert */}
      {pendingApps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            <div>
              <p className="font-semibold text-yellow-900 text-[13px]">{tp('pendingAppsTitle', { count: pendingApps.length })}</p>
              <p className="text-yellow-700 text-[11px]">{tp('pendingAppsDesc')}</p>
            </div>
          </div>
          <Button onClick={() => onTabChange('apps')} size="xs"
            className="flex-shrink-0 h-8 px-3 rounded-xl bg-yellow-500 text-white text-[11px] font-bold shadow-sm shadow-yellow-200">
            {tp('review')}
          </Button>
        </div>
      )}

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-on-surface text-[14px]">{tp('activeJobs')}</h3>
            {jobs.length > 3 && (
              <button type="button" onClick={() => onTabChange('jobs')} className="text-primary text-[12px] font-medium">
                {tp('viewAll')}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {activeJobs.slice(0, 3).map((job) => (
              <JobManagementCard key={job.id} job={job} onClose={onCloseJob} onViewApps={onViewApps} setTab={onTabChange} />
            ))}
          </div>
        </div>
      )}

      {/* Recent applications */}
      {recentApps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-on-surface text-[14px]">{tp('recentApplicants')}</h3>
            {applications.length > 3 && (
              <button type="button" onClick={() => onTabChange('apps')} className="text-primary text-[12px] font-medium">
                {tp('viewAll')}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {recentApps.map((app) => (
              <ApplicantCard key={app.id} app={app} onUpdateStatus={onUpdateStatus} onRelease={onRelease}
                onDispute={onDispute} onOpenPay={onOpenPay} isUpdating={isUpdating} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
