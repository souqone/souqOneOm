'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { JobItem } from '@/lib/api/jobs';

interface RecommendationCardProps {
  rec: JobItem & { matchScore?: number };
}

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const tp = useTranslations('pages');
  const router = useRouter();
  const score = rec.matchScore ?? 0;

  return (
    <div
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-3
                 flex items-center gap-3 hover:border-outline-variant/30 hover:shadow-md
                 transition-all cursor-pointer group"
      onClick={() => router.push(`/jobs/${rec.id}`)}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/12 transition-colors">
        <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface text-[13px] truncate">{rec.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {rec.salary && (
            <span className="font-black text-primary text-[12px]">
              {Number(rec.salary).toLocaleString('ar-OM')} {tp('currencyOMR')}
            </span>
          )}
          <span className="text-on-surface-variant/30 text-[10px]">·</span>
          <span className="text-on-surface-variant/50 text-[10px]">{rec.governorate}</span>
        </div>
      </div>

      {score > 0 && (
        <div className="flex-shrink-0 text-center">
          <div
            className={`font-black text-[13px] ${
              score >= 90 ? 'text-green-600' : score >= 75 ? 'text-yellow-600' : 'text-on-surface-variant'
            }`}
          >
            {score}%
          </div>
          <div className="text-[9px] text-on-surface-variant/50">{tp('match')}</div>
        </div>
      )}
    </div>
  );
}
