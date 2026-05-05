'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { useBooking, useUpdateBookingStatus, getBookingEntity } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { SellerCard } from '@/components/seller-card';
import { getImageUrl } from '@/lib/image-utils';
import { bookingStatusLabels, cancelLabels as cancelLabelsT } from '@/lib/constants/mappings';
import { useTranslations, useLocale } from 'next-intl';
import { ReviewForm } from '@/components/reviews/review-form';
import { useState } from 'react';


export default function BookingDetailPage() {
  return (
    <AuthGuard>
      <BookingDetailContent />
    </AuthGuard>
  );
}

function BookingDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const locale = useLocale();
  const statusLabels = bookingStatusLabels(tm);
  const cancelLabels = cancelLabelsT(tm);
  const { data: booking, isLoading, isError } = useBooking(id);
  const updateStatus = useUpdateBookingStatus();

  const statusConfig: Record<string, { icon: string; bg: string; text: string; border: string; badge: string; desc: string }> = {
    PENDING:   { icon: 'hourglass_top', bg: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-700 dark:text-amber-400',  border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400', desc: tp('bookingDetailStatusPendingDesc') },
    CONFIRMED: { icon: 'check_circle',  bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400', desc: tp('bookingDetailStatusConfirmedDesc') },
    ACTIVE:    { icon: 'play_circle',   bg: 'bg-blue-50 dark:bg-blue-950/30',    text: 'text-blue-700 dark:text-blue-400',    border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400', desc: tp('bookingDetailStatusActiveDesc') },
    COMPLETED: { icon: 'task_alt',      bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400', desc: tp('bookingDetailStatusCompletedDesc') },
    CANCELLED: { icon: 'cancel',       bg: 'bg-red-50 dark:bg-red-950/30',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400', desc: tp('bookingDetailStatusCancelledDesc') },
    REJECTED:  { icon: 'block',        bg: 'bg-red-50 dark:bg-red-950/30',      text: 'text-red-700 dark:text-red-400',      border: 'border-red-200 dark:border-red-800', badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400', desc: tp('bookingDetailStatusRejectedDesc') },
  };

  const isOwner = user && booking?.ownerId === user.id;
  const isRenter = user && booking?.renterId === user.id;

  async function handleStatus(status: string) {
    try {
      await updateStatus.mutateAsync({ id, status });
      addToast('success', tp('bookingDetailStatusUpdated'));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : tp('bookingDetailError'));
    }
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="h-40 bg-gradient-to-bl from-[#004ac6] via-[#2563eb] to-[#0B2447]" />
          <main className="max-w-5xl mx-auto px-4 md:px-8 -mt-16">
            <div className="animate-pulse space-y-5">
              <div className="h-24 bg-surface-container-lowest dark:bg-surface-container" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <div className="h-48 bg-surface-container-lowest dark:bg-surface-container" />
                  <div className="h-40 bg-surface-container-lowest dark:bg-surface-container" />
                </div>
                <div className="h-64 bg-surface-container-lowest dark:bg-surface-container" />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  /* ── Error ── */
  if (isError || !booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-28">
          <main className="max-w-lg mx-auto px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
            </div>
            <h2 className="text-xl font-black text-on-surface mb-2">{tp('bookingDetailNotFound')}</h2>
            <p className="text-sm text-on-surface-variant mb-6">{tp('bookingDetailNotFoundDesc')}</p>
            <Link href="/bookings" className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 text-sm font-black hover:brightness-110 transition-all">
              <span className="material-symbols-outlined icon-flip text-lg">arrow_forward</span>
              {tp('bookingDetailBackToBookings')}
            </Link>
          </main>
        </div>
      </>
    );
  }

  const entity = getBookingEntity(booking);
  const entityImg = entity.images?.find((i: any) => i.isPrimary) ?? entity.images?.[0];
  const otherUser = isOwner ? booking.renter : booking.owner;
  const sc = statusConfig[booking.status] ?? statusConfig.PENDING;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Cover gradient */}
        <div className="h-40 md:h-48 bg-gradient-to-bl from-[#004ac6] via-[#2563eb] to-[#0B2447] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
        </div>

        <main className="max-w-5xl mx-auto px-4 md:px-8 -mt-20 md:-mt-24 relative z-10 pb-16">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/70 mb-5">
            <Link href="/bookings" className="hover:text-white transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">event</span>
              {tp('bookingDetailBreadcrumb')}
            </Link>
            <span className="material-symbols-outlined icon-flip text-xs">chevron_left</span>
            <span className="text-white font-bold">{tp('bookingDetailTitle')}</span>
          </nav>

          {/* Status Banner Card */}
          <div className={`${sc.bg} ${sc.border} border p-5 md:p-6 mb-6 shadow-sm`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${sc.badge} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-2xl ${sc.text}`}>{sc.icon}</span>
                </div>
                <div>
                  <p className={`font-black text-lg ${sc.text}`}>{statusLabels[booking.status]}</p>
                  <p className={`text-xs ${sc.text} opacity-80`}>{sc.desc}</p>
                </div>
              </div>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full ${sc.badge}`}>
                #{booking.id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Main Column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Car Info Card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="flex gap-0">
                  <div className="relative w-36 md:w-44 shrink-0 bg-surface-container-low dark:bg-surface-container-high aspect-[4/3]">
                    {getImageUrl(entityImg?.url) ? (
                      <Image src={getImageUrl(entityImg?.url)!} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full aspect-[4/3] flex items-center justify-center text-on-surface-variant/30">
                        <span className="material-symbols-outlined text-5xl">directions_car</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                    <Link href={entity.detailPath} className="font-black text-on-surface text-base md:text-lg hover:text-primary transition-colors line-clamp-2">
                      {entity.title || tp('bookingDetailCar')}
                    </Link>
                    {booking.listing && (
                      <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                        <span className="font-bold">{booking.listing.make} {booking.listing.model}</span>
                        <span className="w-1 h-1 rounded-full bg-outline/40" />
                        <span>{booking.listing.year}</span>
                      </p>
                    )}
                    <Link href={entity.detailPath} className="mt-3 inline-flex items-center gap-1 text-primary text-xs font-bold hover:underline">
                      {tp('bookingDetailViewCar')}
                      <span className="material-symbols-outlined icon-flip text-sm">arrow_back</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Booking Details Card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant/10 dark:border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">event_note</span>
                  <h2 className="font-black text-on-surface">{tp('bookingDetailDetails')}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    <DetailCell icon="event" label={tp('bookingDetailStartDate')} value={new Date(booking.startDate).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <DetailCell icon="event_upcoming" label={tp('bookingDetailEndDate')} value={new Date(booking.endDate).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <DetailCell icon="timelapse" label={tp('bookingDetailDuration')} value={tp('bookingDetailDays', { days: booking.totalDays })} />
                    <DetailCell icon="gavel" label={tp('bookingDetailCancelPolicy')} value={cancelLabels[booking.cancellationPolicy] ?? booking.cancellationPolicy} />
                    {booking.pickupLocation && <DetailCell icon="pin_drop" label={tp('bookingDetailPickup')} value={booking.pickupLocation} />}
                    {booking.dropoffLocation && <DetailCell icon="flag" label={tp('bookingDetailDropoff')} value={booking.dropoffLocation} />}
                  </div>

                  {/* Service badges */}
                  {(booking.driverRequested || booking.insuranceSelected) && (
                    <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-outline-variant/10 dark:border-outline-variant/20">
                      {booking.driverRequested && (
                        <span className="inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold px-3 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {tp('bookingDetailWithDriver')}
                        </span>
                      )}
                      {booking.insuranceSelected && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-sm">verified_user</span>
                          {tp('bookingDetailInsurance')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mt-5 pt-5 border-t border-outline-variant/10 dark:border-outline-variant/20">
                      <p className="text-xs font-bold text-on-surface-variant mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">sticky_note_2</span>
                        {tp('bookingDetailNotes')}
                      </p>
                      <p className="text-sm text-on-surface bg-surface-container-low dark:bg-surface-container-high p-4 rounded-lg leading-relaxed">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant/10 dark:border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">timeline</span>
                  <h2 className="font-black text-on-surface">{tp('bookingDetailTimeline')}</h2>
                </div>
                <div className="p-6">
                  <div className="relative pe-4">
                    {/* Timeline line */}
                    <div className="absolute end-[7px] top-2 bottom-2 w-0.5 bg-outline-variant/20 dark:bg-outline-variant/30" />
                    <div className="space-y-5">
                      <TimelineItem date={booking.createdAt} label={tp('bookingDetailCreated')} color="bg-primary" locale={locale} />
                      {booking.confirmedAt && <TimelineItem date={booking.confirmedAt} label={tp('bookingDetailConfirmed')} color="bg-emerald-500" locale={locale} />}
                      {booking.cancelledAt && <TimelineItem date={booking.cancelledAt} label={tp('bookingDetailCancelled')} color="bg-red-500" locale={locale} />}
                      {booking.completedAt && <TimelineItem date={booking.completedAt} label={tp('bookingDetailCompleted')} color="bg-emerald-500" locale={locale} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-6">

              {/* Price Summary Card */}
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant/10 dark:border-outline-variant/20 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">receipt_long</span>
                  <h3 className="font-black text-on-surface text-sm">{tp('bookingDetailPaymentSummary')}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-on-surface-variant">{tp('bookingDetailRentalDays', { days: booking.totalDays })}</span>
                      <span className="font-bold text-sm text-on-surface">{Number(booking.totalPrice).toLocaleString('en-US')} {tp('bookingDetailCurrencyOMR')}</span>
                    </div>
                    {booking.depositAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-on-surface-variant flex items-center gap-1">
                          {tp('bookingDetailDeposit')}
                          <span className="text-[10px] text-on-surface-variant/60">{tp('bookingDetailDepositRefundable')}</span>
                        </span>
                        <span className="font-bold text-sm text-on-surface">{Number(booking.depositAmount).toLocaleString('en-US')} {tp('bookingDetailCurrencyOMR')}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-outline-variant/10 dark:border-outline-variant/20 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-on-surface">{tp('bookingDetailTotal')}</span>
                      <div className="text-end">
                        <span className="text-2xl font-black text-primary">{Number(booking.totalPrice).toLocaleString('en-US')}</span>
                        <span className="text-xs text-on-surface-variant me-1">{tp('bookingDetailCurrencyOMR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other User Card */}
              {otherUser && (
                <SellerCard
                  title={isOwner ? tp('bookingDetailRenter') : tp('bookingDetailOwner')}
                  name={otherUser.displayName || otherUser.username}
                  username={otherUser.username}
                  avatarUrl={otherUser.avatarUrl}
                  phone={otherUser.phone}
                  onShare={() => {
                    const url = window.location.href;
                    if (navigator.share) navigator.share({ title: `#${booking.id}`, url });
                    else navigator.clipboard.writeText(url);
                  }}
                />
              )}

              {/* Actions Card */}
              <div className="space-y-3">
                {isOwner && booking.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleStatus('CONFIRMED')} disabled={updateStatus.isPending} className="w-full py-3.5 bg-primary text-on-primary font-black text-sm hover:brightness-110 transition-all shadow-ambient disabled:opacity-60 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      {tp('bookingDetailAccept')}
                    </button>
                    <button onClick={() => handleStatus('REJECTED')} disabled={updateStatus.isPending} className="w-full py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-black text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">block</span>
                      {tp('bookingDetailReject')}
                    </button>
                  </>
                )}
                {isOwner && booking.status === 'CONFIRMED' && (
                  <button onClick={() => handleStatus('ACTIVE')} disabled={updateStatus.isPending} className="w-full py-3.5 bg-primary text-on-primary font-black text-sm hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                    {tp('bookingDetailActivate')}
                  </button>
                )}
                {isOwner && booking.status === 'ACTIVE' && (
                  <button onClick={() => handleStatus('COMPLETED')} disabled={updateStatus.isPending} className="w-full py-3.5 bg-primary text-on-primary font-black text-sm hover:brightness-110 transition-all shadow-ambient disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">task_alt</span>
                    {tp('bookingDetailComplete')}
                  </button>
                )}
                {booking.status === 'COMPLETED' && isRenter && (
                  <ReviewSection bookingId={booking.id} ownerId={booking.ownerId} />
                )}
                {booking.status === 'COMPLETED' && isOwner && (
                  <ReviewSection bookingId={booking.id} ownerId={booking.renterId} />
                )}
                {isRenter && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                  <button onClick={() => handleStatus('CANCELLED')} disabled={updateStatus.isPending} className="w-full py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-black text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    {tp('bookingDetailCancel')}
                  </button>
                )}

                <Link href="/bookings" className="flex items-center justify-center gap-2 py-3 text-primary font-bold text-sm hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors">
                  <span className="material-symbols-outlined icon-flip text-lg">arrow_forward</span>
                  {tp('bookingDetailBackToBookings')}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

/* ── Sub-components ── */

function DetailCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-low/50 dark:bg-surface-container-high/30 p-4 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <p className="text-[11px] text-on-surface-variant font-bold">{label}</p>
      </div>
      <p className="font-black text-sm text-on-surface">{value}</p>
    </div>
  );
}

function ReviewSection({ bookingId, ownerId }: { bookingId: string; ownerId: string }) {
  const [done, setDone] = useState(false);
  const tr = useTranslations('reviews');

  if (done) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg text-center">
        <span className="material-symbols-outlined text-emerald-600 text-2xl mb-1 block">check_circle</span>
        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{tr('reviewSubmitted')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 p-4 rounded-lg">
      <p className="text-sm font-black text-on-surface mb-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-primary text-base">rate_review</span>
        {tr('rateTransaction')}
      </p>
      <ReviewForm entityType="BOOKING" entityId={bookingId} revieweeId={ownerId} onSuccess={() => setDone(true)} />
    </div>
  );
}

function TimelineItem({ date, label, color, locale }: { date: string; label: string; color: string; locale: string }) {
  return (
    <div className="flex items-start gap-4 relative">
      <div className={`w-3.5 h-3.5 rounded-full ${color} ring-4 ring-background shrink-0 mt-0.5 relative z-10`} />
      <div className="pb-1">
        <p className="text-sm font-black text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          {new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
