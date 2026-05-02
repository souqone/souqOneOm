'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { BOOKING_STATUS_CONFIG, LISTING_TYPE_CONFIG } from '@/lib/constants/bookings';
import { getBookingEntity } from '@/lib/api';
import { getImageUrl } from '@/lib/image-utils';
import type { BookingItem } from '@/lib/api';

type BookingRole = 'renter' | 'owner';

interface Props {
  booking: BookingItem;
  role: BookingRole;
  onRate: (b: BookingItem) => void;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onChat: (userId: string) => void;
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US', {
    day: 'numeric', month: 'short',
  });
}

export function BookingCard({ booking, role, onRate, onConfirm, onReject, onCancel, onChat }: Props) {
  const tb = useTranslations('bookings');
  const locale = useLocale();

  const st = BOOKING_STATUS_CONFIG[booking.status as keyof typeof BOOKING_STATUS_CONFIG]
    ?? BOOKING_STATUS_CONFIG.CANCELLED;
  const entityTypeKey = booking.entityType === 'CAR' ? 'CAR'
    : booking.entityType === 'BUS' ? 'BUS'
    : booking.entityType === 'EQUIPMENT' ? 'EQUIPMENT' : 'CAR';
  const lt = LISTING_TYPE_CONFIG[entityTypeKey];
  const entity = getBookingEntity(booking);
  const coverImg = entity.images?.find((i: any) => i.isPrimary) ?? entity.images?.[0];
  const isOwner = role === 'owner';
  const other = isOwner ? booking.renter : booking.owner;

  return (
    <div className={`bg-surface-container-lowest rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg hover:shadow-black/5 ${
      booking.status === 'ACTIVE' ? 'border-primary/20' : 'border-outline-variant/15'
    }`}>

      {booking.status === 'ACTIVE' && (
        <div className="h-0.5 bg-gradient-to-l from-primary/60 to-primary" />
      )}

      <div className="p-4">

        {/* Section 1: Listing info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl bg-surface-container-low border border-outline-variant/10
                         flex items-center justify-center flex-shrink-0 overflow-hidden">
            {getImageUrl(coverImg?.url)
              ? <Image src={getImageUrl(coverImg?.url)!} alt={entity.title} width={56} height={56}
                  className="object-cover w-full h-full" />
              : <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">{lt.icon}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-on-surface text-[13px] leading-tight truncate">
                  {entity.title || tb('unknownListing')}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${lt.badgeColor}`}>
                    <span className="material-symbols-outlined text-[10px]">{lt.icon}</span>
                    {tb(lt.labelKey)}
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${st.badgeColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor} flex-shrink-0`} />
                {tb(st.labelKey)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Dates + Price */}
        <div className="flex items-center justify-between bg-surface-container-low
                       rounded-xl px-3 py-2 mb-3 border border-outline-variant/[0.06]">
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-on-surface-variant/40">calendar_month</span>
            <span className="font-medium">{formatDate(booking.startDate, locale)}</span>
            <span className="text-on-surface-variant/30">←</span>
            <span className="font-medium">{formatDate(booking.endDate, locale)}</span>
            <span className="text-on-surface-variant/40">
              ({booking.totalDays} {tb('days')})
            </span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-black text-primary text-[13px]">
              {Number(booking.totalPrice).toLocaleString('ar-OM')}
            </span>
            <span className="text-[10px] text-primary/60">{tb('currencyOMR')}</span>
          </div>
        </div>

        {/* Section 3: Other party */}
        {other && (
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-[#0B2447]
                             flex items-center justify-center text-on-primary font-semibold text-xs overflow-hidden">
                {getImageUrl(other.avatarUrl)
                  ? <Image src={getImageUrl(other.avatarUrl)!} alt={other.displayName ?? other.username}
                      width={28} height={28} className="object-cover w-full h-full" />
                  : (other.displayName || other.username || '?')[0]?.toUpperCase()
                }
              </div>
              {other.isVerified && (
                <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-primary rounded-full
                               border border-background flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[6px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-on-surface">
                {other.displayName || other.username}
              </span>
              <span className="text-[10px] text-on-surface-variant/50 mr-1.5">
                · {isOwner ? tb('renter') : tb('owner')}
              </span>
            </div>
            <button onClick={() => onChat(other.id)}
              aria-label={tb('chat')}
              className="min-w-[28px] min-h-[28px] w-7 h-7 rounded-lg bg-surface-container-low border border-outline-variant/15
                        flex items-center justify-center text-on-surface-variant/40
                        hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-base">chat</span>
            </button>
          </div>
        )}

        {/* Section 4: Context messages */}
        {isOwner && booking.status === 'PENDING' && (booking.renterNote || booking.notes) && (
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl px-3 py-2 mb-3">
            <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
              &ldquo;{booking.renterNote || booking.notes}&rdquo;
            </p>
          </div>
        )}

        {booking.status === 'CANCELLED' && booking.cancellationReason && (
          <div className="bg-error/5 border border-error/15 rounded-xl px-3 py-2 mb-3">
            <p className="text-[10px] text-error/70 flex items-start gap-1">
              <span className="material-symbols-outlined text-[12px] mt-0.5">info</span>
              {tb('cancelReason')}: {booking.cancellationReason}
            </p>
          </div>
        )}

        {/* Section 5: Actions */}
        <BookingCardActions
          booking={booking}
          isOwner={isOwner}
          onRate={onRate}
          onConfirm={onConfirm}
          onReject={onReject}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function BookingCardActions({ booking, isOwner, onRate, onConfirm, onReject, onCancel }: {
  booking: BookingItem;
  isOwner: boolean;
  onRate: (b: BookingItem) => void;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const tb = useTranslations('bookings');
  const base = 'flex-1 min-h-[36px] h-9 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]';

  if (!isOwner) {
    if (booking.status === 'PENDING') return (
      <div className="flex gap-2">
        <button onClick={() => onCancel?.(booking.id)}
          className={`${base} border border-outline-variant/20 text-on-surface-variant
                     hover:text-error hover:border-error/20 hover:bg-error/5`}>
          {tb('cancelBooking')}
        </button>
      </div>
    );

    if (booking.status === 'CONFIRMED') return (
      <div className="flex gap-2">
        <Link href={`/bookings/${booking.id}`}
          className={`${base} border border-primary/20 text-primary bg-primary/5 hover:bg-primary/8`}>
          <span className="material-symbols-outlined text-base">receipt_long</span>
          {tb('viewDetails')}
        </Link>
        <button onClick={() => onCancel?.(booking.id)}
          className={`${base} border border-outline-variant/20 text-on-surface-variant
                     hover:text-error hover:border-error/20 hover:bg-error/5`}>
          {tb('cancel')}
        </button>
      </div>
    );

    if (booking.status === 'ACTIVE') return (
      <div className="flex gap-2">
        <button className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20 hover:brightness-105`}>
          <span className="material-symbols-outlined text-base">chat</span>
          {tb('contactOwner')}
        </button>
        <Link href={`/bookings/${booking.id}`}
          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl border border-outline-variant/20 text-on-surface-variant
                    flex items-center justify-center hover:border-primary/20 hover:text-primary transition-all">
          <span className="material-symbols-outlined text-base">receipt_long</span>
        </Link>
      </div>
    );

    if (booking.status === 'COMPLETED' && !booking.renterRating) return (
      <button onClick={() => onRate(booking)}
        className={`${base} w-full bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100`}>
        <span className="material-symbols-outlined text-base text-yellow-500">star</span>
        {tb('rateExperience')}
      </button>
    );

    if (booking.status === 'COMPLETED' && booking.renterRating) return (
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant/50">
        <span className="material-symbols-outlined text-base text-yellow-400"
          style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        {tb('rated')} — {booking.renterRating}/5
      </div>
    );

    return null;
  }

  if (booking.status === 'PENDING') return (
    <div className="flex gap-2">
      <button onClick={() => onConfirm?.(booking.id)}
        className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20 hover:brightness-105`}>
        <span className="material-symbols-outlined text-base">check</span>
        {tb('confirmBooking')}
      </button>
      <button onClick={() => onReject?.(booking.id)}
        className={`${base} border border-outline-variant/20 text-on-surface-variant
                   hover:text-error hover:border-error/20 hover:bg-error/5`}>
        {tb('reject')}
      </button>
    </div>
  );

  if (booking.status === 'ACTIVE') return (
    <div className="flex gap-2">
      <button className={`${base} bg-primary text-on-primary shadow-sm shadow-primary/20`}>
        <span className="material-symbols-outlined text-base">chat</span>
        {tb('contactRenter')}
      </button>
      <Link href={`/bookings/${booking.id}`}
        className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-xl border border-outline-variant/20
                  flex items-center justify-center hover:border-primary/20 transition-all">
        <span className="material-symbols-outlined text-base text-on-surface-variant">receipt_long</span>
      </Link>
    </div>
  );

  if (booking.status === 'COMPLETED' && !booking.ownerRating) return (
    <button onClick={() => onRate(booking)}
      className={`${base} w-full bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100`}>
      <span className="material-symbols-outlined text-base text-yellow-500">star</span>
      {tb('rateRenter')}
    </button>
  );

  return null;
}
