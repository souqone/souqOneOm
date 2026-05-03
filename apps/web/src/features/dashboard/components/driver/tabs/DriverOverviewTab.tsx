'use client';

import { useTranslations } from 'next-intl';
import { DriverStatsGrid } from '../DriverStatsGrid';
import { ApplicationCard } from '../cards/ApplicationCard';
import { RecommendationCard } from '../cards/RecommendationCard';
import { Button } from '@/components/ui/button';
import type { MyApplicationItem, JobItem } from '@/lib/api/jobs';
import type { DriverTab } from '../DriverNavTabs';

interface DriverOverviewTabProps {
  applications: MyApplicationItem[];
  recommendations: (JobItem & { matchScore?: number })[];
  pendingInvitesCount: number;
  onWithdraw: (id: string) => void;
  onChat: (userId: string) => void;
  onDispute: (escrowId: string) => void;
  setTab: (tab: DriverTab) => void;
}

export function DriverOverviewTab({
  applications,
  recommendations,
  pendingInvitesCount,
  onWithdraw,
  onChat,
  onDispute,
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
        pendingInvites={pendingInvitesCount}
      />

      {/* Pending invites alert */}
      {pendingInvitesCount > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-violet-600 text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mail
            </span>
            <div>
              <p className="font-semibold text-violet-900 text-[13px]">
                {tp('pendingInvitesTitle', { count: pendingInvitesCount })}
              </p>
              <p className="text-violet-600 text-[11px]">{tp('pendingInvitesDesc')}</p>
            </div>
          </div>
          <Button
            onClick={() => setTab('invites')}
            size="xs"
            className="flex-shrink-0 h-8 px-3 rounded-xl bg-violet-600 text-white text-[11px] font-bold"
          >
            {tp('review')}
          </Button>
        </div>
      )}

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
                onDispute={onDispute}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-on-surface text-[14px]">{tp('recommendedJobs')}</h3>
            {recommendations.length > 3 && (
              <button
                type="button"
                onClick={() => setTab('recs')}
                className="text-primary text-[12px] font-medium"
              >
                {tp('viewAll')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
