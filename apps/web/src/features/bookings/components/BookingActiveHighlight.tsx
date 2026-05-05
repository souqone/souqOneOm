'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getBookingEntity } from '@/lib/api';
import type { BookingItem } from '@/lib/api';

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', {
    day: 'numeric', month: 'short',
  });
}

interface Props { booking: BookingItem }

export function BookingActiveHighlight({ booking }: Props) {
  const tb = useTranslations('bookings');
  const locale = useLocale();
  const entity = getBookingEntity(booking);

  return (
    <div className="relative bg-gradient-to-br from-primary to-[#0B2447] rounded-2xl p-4 text-on-primary overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0zm20 20h20v20H20z' fill='%23fff' fill-opacity='.4'/%3E%3C/svg%3E\")", backgroundSize: '40px 40px' }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-on-primary/70 text-[10px] font-bold uppercase tracking-wider">
            {tb('activeNow')}
          </span>
        </div>

        <p className="font-semibold text-on-primary text-[13px] mb-1 leading-tight">
          {entity.title}
        </p>

        <div className="flex items-center gap-1.5 text-on-primary/60 text-[10px] mb-3">
          <span className="material-symbols-outlined text-xs">calendar_month</span>
          {formatDate(booking.startDate, locale)}
          {' → '}
          {formatDate(booking.endDate, locale)}
        </div>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-black text-on-primary text-2xl">
            {Number(booking.totalPrice).toLocaleString('en-US')}
          </span>
          <span className="text-on-primary/50 text-[11px]">{tb('currencyOMR')}</span>
        </div>

        <Link href={`/bookings/${booking.id}`}
          className="flex items-center justify-center gap-1 w-full h-9 rounded-xl bg-on-primary/15 text-on-primary
                    text-[11px] font-semibold border border-on-primary/20 hover:bg-on-primary/20 transition-all">
          {tb('viewDetails')}
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </Link>
      </div>
    </div>
  );
}
