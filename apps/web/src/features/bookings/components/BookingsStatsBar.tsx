'use client';

import { useTranslations } from 'next-intl';
import type { BookingItem } from '@/lib/api';

interface Props {
  bookings: BookingItem[];
  variant?: 'horizontal' | 'vertical';
}

export function BookingsStatsBar({ bookings, variant = 'horizontal' }: Props) {
  const tb = useTranslations('bookings');

  const upcoming  = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length;
  const active    = bookings.filter(b => b.status === 'ACTIVE').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;

  const stats = [
    { label: tb('statUpcoming'),  value: upcoming,  icon: 'event_upcoming',      color: 'text-yellow-600' },
    { label: tb('statActive'),    value: active,    icon: 'radio_button_checked', color: 'text-primary' },
    { label: tb('statCompleted'), value: completed, icon: 'task_alt',             color: 'text-green-600' },
  ];

  if (variant === 'vertical') {
    return (
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 divide-y divide-outline-variant/10">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-base ${s.color}`}>{s.icon}</span>
              <span className="text-[12px] text-on-surface-variant">{s.label}</span>
            </div>
            <span className="font-black text-on-surface text-[15px]">{s.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-3 py-3">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-3 text-center">
          <span className={`material-symbols-outlined text-xl ${s.color}`}>{s.icon}</span>
          <p className="font-black text-on-surface text-lg leading-none mt-1">{s.value}</p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
