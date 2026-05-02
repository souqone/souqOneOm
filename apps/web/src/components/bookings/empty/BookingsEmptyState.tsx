'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { BookingTabKey } from '@/lib/constants/bookings';

type BookingRole = 'renter' | 'owner';

const EMPTY_CONFIGS: Record<BookingRole, Record<BookingTabKey, { icon: string; titleKey: string; descKey: string; href: string | null }>> = {
  renter: {
    all:       { icon: 'calendar_month', titleKey: 'emptyAllRenter',       descKey: 'emptyAllRenterDesc',       href: '/' },
    upcoming:  { icon: 'event_upcoming', titleKey: 'emptyUpcomingRenter',  descKey: 'emptyUpcomingDesc',        href: '/' },
    active:    { icon: 'directions_car', titleKey: 'emptyActiveRenter',    descKey: 'emptyActiveDesc',          href: null },
    completed: { icon: 'task_alt',       titleKey: 'emptyCompletedRenter', descKey: 'emptyCompletedDesc',       href: null },
    cancelled: { icon: 'cancel',         titleKey: 'emptyCancelledRenter', descKey: 'emptyCancelledDesc',       href: '/' },
  },
  owner: {
    all:       { icon: 'calendar_month', titleKey: 'emptyAllOwner',        descKey: 'emptyAllOwnerDesc',        href: null },
    upcoming:  { icon: 'event_upcoming', titleKey: 'emptyUpcomingOwner',   descKey: 'emptyUpcomingOwnerDesc',   href: null },
    active:    { icon: 'directions_car', titleKey: 'emptyActiveOwner',     descKey: 'emptyActiveOwnerDesc',     href: null },
    completed: { icon: 'task_alt',       titleKey: 'emptyCompletedOwner',  descKey: 'emptyCompletedOwnerDesc',  href: null },
    cancelled: { icon: 'cancel',         titleKey: 'emptyCancelledOwner',  descKey: 'emptyCancelledOwnerDesc',  href: null },
  },
};

interface Props { tab: BookingTabKey; role: BookingRole }

export function BookingsEmptyState({ tab, role }: Props) {
  const tb = useTranslations('bookings');
  const config = EMPTY_CONFIGS[role][tab];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6" role="status">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">{config.icon}</span>
      </div>
      <div>
        <p className="text-on-surface font-semibold text-[14px]">{tb(config.titleKey)}</p>
        <p className="text-on-surface-variant text-[12px] mt-1">{tb(config.descKey)}</p>
      </div>
      {config.href && (
        <Link href={config.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-6 h-10 text-sm font-semibold">
          {tb('browseListings')}
        </Link>
      )}
    </div>
  );
}
