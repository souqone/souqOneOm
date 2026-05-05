'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { APP_STATUS_CONFIG, SALARY_PERIOD_CONFIG } from '@/lib/constants/jobs';
import type { MyApplicationItem } from '@/lib/api/jobs';
import { Button } from '@/components/ui/button';

function timeAgo(dateStr: string, tp: (key: string, values?: any) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return tp('notifTimeNow');
  if (mins < 60) return tp('notifTimeMinutes', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return tp('notifTimeHours', { count: hrs });
  const days = Math.floor(hrs / 24);
  return tp('notifTimeDays', { count: days });
}

interface ApplicationCardProps {
  app: MyApplicationItem;
  onWithdraw: (id: string) => void;
  onChat: (userId: string) => void;
}

export function ApplicationCard({ app, onWithdraw, onChat }: ApplicationCardProps) {
  const tp = useTranslations('pages');
  const router = useRouter();
  const statusCfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.PENDING;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => router.push(`/jobs/${app.jobId}`)}
        >
          <p className="font-semibold text-on-surface text-[13px] leading-tight">{app.job.title}</p>
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
            {app.job.user?.displayName || app.job.user?.username} · {timeAgo(app.createdAt, tp)}
          </p>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
          {tp(statusCfg.labelKey)}
        </span>
      </div>

      {/* Salary */}
      {app.job.salary && (
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-black text-primary text-lg">
            {Number(app.job.salary).toLocaleString('en-US')}
          </span>
          <span className="text-sm text-primary/60">{tp('currencyOMR')}</span>
          {app.job.salaryPeriod && SALARY_PERIOD_CONFIG[app.job.salaryPeriod] && (
            <span className="text-[11px] text-on-surface-variant/50">
              {tp(SALARY_PERIOD_CONFIG[app.job.salaryPeriod].labelKey)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {app.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWithdraw(app.id)}
            className="flex-1 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px] hover:text-error hover:border-error/20 hover:bg-error/5 transition-all"
          >
            {tp('withdrawApp')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChat(app.job.userId)}
            className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-base">chat</span>
          </Button>
        </div>
      )}
    </div>
  );
}
