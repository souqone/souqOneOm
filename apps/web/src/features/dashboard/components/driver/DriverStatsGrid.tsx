'use client';

import { useTranslations } from 'next-intl';

interface DriverStatsGridProps {
  totalApps: number;
  pendingApps: number;
  acceptedApps: number;
}

export function DriverStatsGrid({ totalApps, pendingApps, acceptedApps }: DriverStatsGridProps) {
  const tp = useTranslations('pages');

  const stats = [
    { label: tp('statTotalApps'), value: totalApps, icon: 'list_alt', color: 'text-primary' },
    { label: tp('statPendingApps'), value: pendingApps, icon: 'hourglass_empty', color: 'text-yellow-600' },
    { label: tp('statAcceptedApps'), value: acceptedApps, icon: 'check_circle', color: 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-3.5 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
            <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
          </div>
          <div>
            <p className="font-black text-on-surface text-lg leading-none">{s.value}</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
