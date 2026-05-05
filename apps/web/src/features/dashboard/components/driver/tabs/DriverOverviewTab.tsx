'use client';

import { useTranslations } from 'next-intl';
import { DriverStatsGrid } from '../DriverStatsGrid';
import { ApplicationCard } from '../cards/ApplicationCard';
import type { MyApplicationItem } from '@/lib/api/jobs';
import type { DriverTab } from '../DriverNavTabs';

interface DriverOverviewTabProps {
  applications: MyApplicationItem[];
  onWithdraw: (id: string) => void;
  onChat: (userId: string) => void;
  setTab: (tab: DriverTab) => void;
}

export function DriverOverviewTab({
  applications,
  onWithdraw,
  onChat,
  setTab,
}: DriverOverviewTabProps) {
  const tp = useTranslations('pages');

  const pendingApps = applications.filter((a) => a.status === 'PENDING').length;
  const acceptedApps = applications.filter((a) => a.status === 'ACCEPTED').length;
  const recentApps = applications.slice(0, 3);

  return (
    <div className="space-y-5">
      <DriverStatsGrid
        totalApps={applications.length}
        pendingApps={pendingApps}
        acceptedApps={acceptedApps}
      />

      {/* Recent applications */}
      {recentApps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-on-surface text-[14px]">{tp('recentApps')}</h3>
            {applications.length > 3 && (
              <button
                type="button"
                onClick={() => setTab('apps')}
                className="text-primary text-[12px] font-medium"
              >
                {tp('viewAll')}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {recentApps.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onWithdraw={onWithdraw}
                onChat={onChat}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
