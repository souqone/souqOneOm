'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { UnifiedRentalListing } from '../types/unified-rental.types';
import { RentalCalendar } from './RentalCalendar';
import { PricingTabs } from './PricingTabs';
import { PriceBreakdown } from './PriceBreakdown';
import { toYMD, diffDays, formatShort } from '../utils/date-helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

type PricingTab = 'daily' | 'weekly' | 'monthly';

export interface RentalBookingCardProps {
  listing: UnifiedRentalListing;
  isOwner: boolean;
  unavailableDates: string[];
  onBook: (startDate: string, endDate: string) => void;
  isBookingPending: boolean;
  onContactSeller?: () => void;
  isContactPending?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RentalBookingCard({
  listing, isOwner, unavailableDates, onBook,
  isBookingPending,
  onContactSeller,
  isContactPending,
}: RentalBookingCardProps) {
  const tr = useTranslations('rental');
  const locale = useLocale();
  const [pricingTab, setPricingTab]     = useState<PricingTab>('daily');
  const [checkIn, setCheckIn]           = useState<Date | null>(null);
  const [checkOut, setCheckOut]         = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [hoverDate, setHoverDate]       = useState<Date | null>(null);

  const nights   = checkIn && checkOut ? diffDays(checkIn, checkOut) : 0;
  const hasRange = checkIn !== null && checkOut !== null && nights > 0;

  const currency = listing.currency || 'ر.ع';

  function handleSelectIn(d: Date) {
    setCheckIn(d);
    setCheckOut(null);
    setCalendarOpen(true);
  }
  function handleSelectOut(d: Date) {
    setCheckOut(d);
    setCalendarOpen(false);
  }
  function handleClear() {
    setCheckIn(null);
    setCheckOut(null);
    setSelectingEnd(false);
    setHoverDate(null);
  }
  function handleBook() {
    if (!checkIn || !checkOut) return;
    onBook(toYMD(checkIn), toYMD(checkOut));
  }

  return (
    <div className="lg:sticky lg:top-5 rounded-2xl border border-outline-variant/30 bg-background overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      {/* Top accent */}
      <div className="h-[3px] w-full bg-primary" />

      <div className="p-5">

        {/* 1 — PRICING TABS */}
        <PricingTabs
          dailyPrice={listing.dailyPrice}
          weeklyPrice={listing.weeklyPrice}
          monthlyPrice={listing.monthlyPrice}
          activeTab={pricingTab}
          onTabChange={setPricingTab}
          currency={currency}
        />

        {/* 1b — AVAILABILITY PERIOD */}
        {(listing.availableFrom || listing.availableTo) && (
          <div className="flex items-center gap-2 mt-3 px-1 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[14px]">event_available</span>
            <span>
              {listing.availableFrom && listing.availableTo
                ? tr('availableRange', { from: new Date(listing.availableFrom).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' }), to: new Date(listing.availableTo).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' }) })
                : listing.availableFrom
                  ? tr('availableFrom', { from: new Date(listing.availableFrom).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' }) })
                  : tr('availableTo', { to: new Date(listing.availableTo!).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { day: 'numeric', month: 'short' }) })
              }
            </span>
          </div>
        )}

        {/* 2 — DATE INPUTS (Airbnb style) */}
        <div
          className="grid grid-cols-2 border border-outline-variant rounded-xl overflow-hidden mt-4 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setCalendarOpen(o => !o)}
        >
          <div className="p-3 hover:bg-surface-container/50 transition-colors border-l border-outline-variant">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface">{tr('checkIn')}</p>
            <p className={`text-[13px] text-on-surface mt-0.5 ${!checkIn ? 'text-on-surface-variant' : ''}`}>
              {checkIn ? formatShort(checkIn) : tr('addDate')}
            </p>
          </div>
          <div className="p-3 hover:bg-surface-container/50 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface">{tr('checkOut')}</p>
            <p className={`text-[13px] text-on-surface mt-0.5 ${!checkOut ? 'text-on-surface-variant' : ''}`}>
              {checkOut ? formatShort(checkOut) : tr('addDate')}
            </p>
          </div>
        </div>

        {/* 3 — CALENDAR (collapsible with animation) */}
        <div
          className={clsx(
            'overflow-hidden transition-all duration-300',
            calendarOpen ? 'max-h-[400px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          )}
        >
          <RentalCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            onSelectIn={handleSelectIn}
            onSelectOut={handleSelectOut}
            onClear={handleClear}
            selectingEnd={selectingEnd}
            setSelectingEnd={setSelectingEnd}
            unavailableDates={unavailableDates}
            minRentalDays={listing.minRentalDays}
            availableFrom={listing.availableFrom}
            availableTo={listing.availableTo}
            hoverDate={hoverDate}
            setHoverDate={setHoverDate}
          />
        </div>

        {/* 4 — PRICE BREAKDOWN */}
        {hasRange && checkIn && checkOut && (
          <PriceBreakdown
            checkIn={checkIn}
            checkOut={checkOut}
            dailyPrice={listing.dailyPrice}
            weeklyPrice={listing.weeklyPrice}
            monthlyPrice={listing.monthlyPrice}
            currency={currency}
            activeTab={pricingTab}
          />
        )}

        {/* 5 — CANCELLATION POLICY BADGE */}
        {listing.cancellationPolicy && (
          <div className="flex items-center gap-2 text-[12px] mt-3">
            <ShieldCheck size={15} className={listing.cancellationPolicy === 'FREE' ? 'text-green-600 flex-shrink-0' : 'text-on-surface-variant flex-shrink-0'} />
            <span className="font-medium">
              {listing.cancellationPolicy === 'FREE' ? tr('cancelFree') : listing.cancellationPolicy === 'FLEXIBLE' ? tr('cancelFlexible') : listing.cancellationPolicy === 'MODERATE' ? tr('cancelModerate') : listing.cancellationPolicy === 'STRICT' ? tr('cancelStrict') : listing.cancellationPolicy}
            </span>
          </div>
        )}

        {/* 6 — BOOK BUTTON */}
        <div className="mt-4">
          {isOwner ? (
            <a
              href={`/edit-listing/car/${listing.id}`}
              className="block w-full h-12 rounded-xl bg-primary text-on-primary text-[14px] font-medium text-center leading-[48px] hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
            >
              {tr('editListing')}
            </a>
          ) : !hasRange ? (
            <button
              disabled
              className="w-full h-12 rounded-xl bg-primary/40 text-white text-[15px] font-medium cursor-not-allowed"
            >
              {tr('selectDatesFirst')}
            </button>
          ) : isBookingPending ? (
            <button
              disabled
              className="w-full h-12 rounded-xl bg-primary/80 text-white text-[15px] font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 size={16} className="animate-spin" />
              {tr('booking')}
            </button>
          ) : (
            <button
              onClick={handleBook}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-on-primary text-[15px] font-medium transition-all duration-150 shadow-sm shadow-primary/30"
            >
              {tr('bookNow')}
            </button>
          )}

          {hasRange && !isOwner && (
            <p className="text-center text-[11px] text-on-surface-variant mt-2">
              {tr('noCharge')}
            </p>
          )}
        </div>

        {!isOwner && onContactSeller && (
          <button
            type="button"
            onClick={onContactSeller}
            disabled={isContactPending}
            className="w-full h-11 rounded-xl border border-outline-variant/25 text-[13px] font-medium text-on-surface
                       flex items-center justify-center gap-2 hover:bg-surface-container hover:border-outline-variant/40
                       transition-all disabled:opacity-50 mt-3"
          >
            {isContactPending
              ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-base">chat</span>}
            {tr('contactLandlord')}
          </button>
        )}

        {/* Report */}
        <div className="pt-4 border-t border-outline-variant/30 mt-4 text-center">
          <button className="text-[10px] text-on-surface-variant hover:text-error cursor-pointer underline underline-offset-2 transition-colors">
            {tr('reportListing')}
          </button>
        </div>

      </div>
    </div>
  );
}
