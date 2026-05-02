'use client';

import { useTranslations } from 'next-intl';
import { BOOKING_TABS } from '@/lib/constants/bookings';
import type { BookingTabKey } from '@/lib/constants/bookings';
import type { BookingItem } from '@/lib/api';

interface Props {
  tab: BookingTabKey;
  onChange: (t: BookingTabKey) => void;
  bookings: BookingItem[];
  variant?: 'tabs' | 'pills';
}

export function BookingsFilterTabs({ tab, onChange, bookings, variant = 'tabs' }: Props) {
  const tb = useTranslations('bookings');

  function countForTab(statuses: readonly string[] | null) {
    if (!statuses) return bookings.length;
    return bookings.filter(b => statuses.includes(b.status)).length;
  }

  if (variant === 'pills') {
    return (
      <div className="flex flex-wrap gap-2">
        {BOOKING_TABS.map((t) => {
          const count = countForTab(t.statuses);
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => onChange(t.key)}
              className={`flex items-center gap-1.5 px-4 h-8 rounded-full text-[12px] font-semibold transition-all ${
                active
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}>
              {tb(t.labelKey)}
              {count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto scrollbar-none gap-1 px-3 py-2">
      {BOOKING_TABS.map((t) => {
        const count = countForTab(t.statuses);
        const active = tab === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-xl text-[12px] font-semibold transition-all ${
              active
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}>
            {tb(t.labelKey)}
            {count > 0 && (
              <span className={`text-[10px] font-black px-1.5 rounded-full ${
                active ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'
              }`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
