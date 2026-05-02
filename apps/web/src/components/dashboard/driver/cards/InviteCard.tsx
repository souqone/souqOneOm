'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import type { JobInviteItem } from '@/lib/api/jobs';

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

interface InviteCardProps {
  inv: JobInviteItem;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => void;
  isResponding: boolean;
}

export function InviteCard({ inv, onRespond, isResponding }: InviteCardProps) {
  const tp = useTranslations('pages');
  const router = useRouter();

  const statusColor =
    inv.status === 'ACCEPTED'
      ? 'bg-green-50 text-green-600 border-green-200'
      : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20';

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border shadow-sm p-4 relative overflow-hidden
        ${inv.status === 'PENDING' ? 'border-violet-200' : 'border-outline-variant/15'}`}
    >
      {inv.status === 'PENDING' && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-violet-400 to-primary rounded-t-2xl" />
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => inv.job && router.push(`/jobs/${inv.job.id}`)}
        >
          <p className="font-semibold text-on-surface text-[13px] leading-tight">{inv.job?.title}</p>
          <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
            {inv.job?.user?.displayName || inv.job?.user?.username} · {timeAgo(inv.createdAt, tp)}
          </p>
        </div>
        {inv.status !== 'PENDING' && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor}`}>
            {tp(`inviteStatus${inv.status}`)}
          </span>
        )}
      </div>

      {inv.message && (
        <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2 mb-3 leading-relaxed italic">
          &ldquo;{inv.message}&rdquo;
        </p>
      )}

      {inv.job?.salary && (
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-black text-primary text-lg">
            {Number(inv.job.salary).toLocaleString('ar-OM')}
          </span>
          <span className="text-sm text-primary/60">{tp('currencyOMR')}</span>
          <span className="text-[11px] text-on-surface-variant/50">/ {inv.job.governorate}</span>
        </div>
      )}

      {inv.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button
            onClick={() => onRespond(inv.id, 'ACCEPTED')}
            disabled={isResponding}
            size="sm"
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-[13px] shadow-sm shadow-primary/20 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-base">check</span>
            {tp('acceptInvite')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRespond(inv.id, 'DECLINED')}
            disabled={isResponding}
            className="flex-1 h-11 rounded-xl border-outline-variant/25 text-on-surface-variant text-[13px]"
          >
            {tp('declineInvite')}
          </Button>
        </div>
      )}
    </div>
  );
}
