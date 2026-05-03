'use client';

import { useTranslations } from 'next-intl';
import type { BookingTabKey } from '@/lib/constants/bookings';

interface Props {
  count: number;
  onTabChange: (t: BookingTabKey) => void;
}

export function BookingPendingOwnerAlert({ count, onTabChange }: Props) {
  const tb = useTranslations('bookings');

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-yellow-100 dark:bg-yellow-800/30 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-yellow-600 text-base">schedule</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-yellow-800 dark:text-yellow-300">
            {tb('pendingAlert', { count })}
          </p>
          <p className="text-[11px] text-yellow-700/70 dark:text-yellow-400/70 mt-0.5">
            {tb('pendingAlertDesc')}
          </p>
        </div>
      </div>
      <button
        onClick={() => onTabChange('upcoming')}
        className="mt-3 w-full h-8 rounded-xl bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300
                  text-[11px] font-semibold hover:bg-yellow-200 transition-colors">
        {tb('reviewRequests')}
      </button>
    </div>
  );
}
