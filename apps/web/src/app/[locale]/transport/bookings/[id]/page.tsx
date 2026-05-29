'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowRight,
  CheckCircle,
  Circle,
  MapPin,
  Package,
  Calendar,
  Star,
  Phone,
  MessageCircle,
  Truck,
  Clock,
  Banknote,
  XCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import type { TransportBooking, CarrierProfile, BookingStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { useAuth } from '@/providers/auth-provider';
import {
  BOOKING_STATUS_LABELS,
  CURRENCY_LABEL,
  SERVICE_TYPE_LABELS,
} from '@/features/transport/constants';
import { formatRelativeDate, formatScheduledDate } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';
import TransportReviewForm from '@/features/transport/components/TransportReviewForm';

const BOOKING_STEPS = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const;


function BookingTimeline({ status, cancelledAt }: { status: string; cancelledAt?: string }) {
  const locale = useLocale();
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-0" dir="rtl">
        {BOOKING_STEPS.map((step, idx) => (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-[var(--color-error)] border-[var(--color-error)]">
                <XCircle size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold whitespace-nowrap text-[var(--color-error)]">
                {BOOKING_STATUS_LABELS[step as BookingStatus] ?? step}
              </span>
            </div>
            {idx < BOOKING_STEPS.length - 1 && (
              <div className="h-0.5 w-16 sm:w-24 mx-2 mb-5 flex-shrink-0 bg-[var(--color-error)]" />
            )}
          </div>
        ))}
        {cancelledAt && (
          <p className="text-xs text-[var(--color-error)] mr-4 font-semibold">
            تم الإلغاء: {new Date(cancelledAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}
          </p>
        )}
      </div>
    );
  }

  const currentIdx = BOOKING_STEPS.indexOf(status as (typeof BOOKING_STEPS)[number]);
  return (
    <div className="flex items-center gap-0" dir="rtl">
      {BOOKING_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)]'
                    : 'bg-white border-[var(--color-outline)]'
                } ${isCurrent ? 'ring-2 ring-[var(--color-brand-amber)] ring-offset-2' : ''}`}
              >
                {isDone ? (
                  <CheckCircle size={18} className="text-white" />
                ) : (
                  <Circle size={18} className="text-[var(--color-on-surface-muted)]" />
                )}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  isCurrent
                    ? 'text-[var(--color-brand-navy)]'
                    : isDone
                    ? 'text-[var(--color-on-surface-variant)]'
                    : 'text-[var(--color-on-surface-muted)]'
                }`}
              >
                {BOOKING_STATUS_LABELS[step as BookingStatus] ?? step}
              </span>
            </div>
            {idx < BOOKING_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 sm:w-24 mx-2 mb-5 flex-shrink-0 ${
                  idx < currentIdx ? 'bg-[var(--color-brand-navy)]' : 'bg-[var(--color-outline)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;

  const [booking, setBooking] = useState<(TransportBooking & { carrier?: CarrierProfile }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await transportApi.getBooking(id);
        setBooking({ ...data, carrier: data.quote.carrier });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        setError(msg || 'تعذّر تحميل تفاصيل الحجز');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleMarkInProgress = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const updated = await transportApi.markInProgress(booking.id);
      setBooking((prev) => prev ? { ...prev, status: updated.status } : prev);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!booking) return;
    setActionLoading(true);
    try {
      const updated = await transportApi.completeBooking(booking.id, deliveryNote.trim() || undefined);
      setBooking((prev) => prev ? { ...prev, status: updated.status, completedAt: updated.completedAt, deliveryNote: updated.deliveryNote } : prev);
      setShowCompleteModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    if (!showCancelForm) {
      setShowCancelForm(true);
      return;
    }
    setActionLoading(true);
    try {
      await transportApi.cancelBooking(booking.id, cancelReason.trim() || undefined);
      setCancelled(true);
      setShowCancelForm(false);
      setBooking((prev) => prev ? { ...prev, status: 'CANCELLED', cancelledAt: new Date().toISOString(), cancellationReason: cancelReason.trim() || undefined } : prev);
    } finally {
      setActionLoading(false);
    }
  };

  const isCarrier = booking?.quote.carrier?.userId === user?.id;
  const isShipper = booking?.request.userId === user?.id;

  if (loading) return <TransportPageLoader />;

  if (error || !booking) return <TransportPageError message={error || 'الحجز غير موجود'} />;

  const statusColorMap: Record<string, string> = {
    ACCEPTED: 'var(--color-status-accepted)',
    IN_PROGRESS: 'var(--color-status-in-progress)',
    COMPLETED: 'var(--color-status-completed)',
    CANCELLED: 'var(--color-status-cancelled)',
  };

  const statusColor = statusColorMap[booking.status] ?? 'var(--color-on-surface-muted)';

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Back */}
        <Link
          href={isCarrier ? '/transport/my-quotes' : '/transport/my-bookings'}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-brand-navy)] font-semibold mb-6 transition-colors"
        >
          <ArrowRight size={16} />
          {isCarrier ? 'عروضي' : 'حجوزاتي'}
        </Link>

        {/* Status Header */}
        <div
          className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ backgroundColor: `${statusColor}15`, border: `1.5px solid ${statusColor}40` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <Truck size={26} style={{ color: statusColor }} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold mb-0.5">رقم الحجز</p>
              <h1 className="text-xl font-bold text-[var(--color-on-surface)]">#{booking.id}</h1>
              <span
                className="text-sm font-bold"
                style={{ color: statusColor }}
              >
                {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
              </span>
            </div>
          </div>
          <div className="text-sm text-[var(--color-on-surface-muted)]">
            <p>تأكيد: {formatRelativeDate(booking.confirmedAt)}</p>
            {booking.completedAt && (
              <p className="text-[var(--color-success)] font-semibold">
                اكتمل: {formatRelativeDate(booking.completedAt)}
              </p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card-base p-5 mb-6 overflow-x-auto">
          <BookingTimeline status={booking.status} cancelledAt={booking.cancelledAt} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main */}
          <div className="flex flex-col gap-5">
            {/* Trip Details */}
              <div className="card-base p-5">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wide">
                  تفاصيل الرحلة
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-[var(--color-on-surface-muted)]" />
                    <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                      {SERVICE_TYPE_LABELS[booking.request.serviceType]}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-0 pt-1 flex-shrink-0">
                      <div className="w-3 h-3 rounded-full border-2 border-[var(--color-brand-green)] bg-[#dcfce7]" />
                      <div className="w-0 flex-grow border-r-2 border-dashed border-[var(--color-brand-amber)] my-2" style={{ minHeight: '2.5rem' }} />
                      <div className="w-3 h-3 rounded-full border-2 border-[var(--color-brand-amber)] bg-[#fff7ed]" />
                    </div>
                    <div className="flex flex-col justify-between gap-3 flex-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[var(--color-brand-green)]" />
                          <span className="text-sm font-bold">{booking.request.fromGovernorate}</span>
                        </div>
                        <p className="text-xs text-[var(--color-on-surface-muted)] mr-5">{booking.request.fromAddress}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[var(--color-brand-amber)]" />
                          <span className="text-sm font-bold">{booking.request.toGovernorate}</span>
                        </div>
                        <p className="text-xs text-[var(--color-on-surface-muted)] mr-5">{booking.request.toAddress}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {booking.request.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)]">
                        <Calendar size={13} />
                        {formatScheduledDate(booking.request.scheduledAt)}
                      </div>
                    )}
                    {booking.quote.estimatedHours && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-variant)]">
                        <Clock size={13} />
                        {booking.quote.estimatedHours} ساعة متوقعة
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Price */}
              <div className="card-base p-5">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-3 uppercase tracking-wide">
                  السعر المتفق عليه
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
                    <Banknote size={22} className="text-[var(--color-brand-navy)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-brand-navy)]">
                    {booking.quote.price} {CURRENCY_LABEL}
                  </p>
                </div>
                {booking.quote.message && (
                  <p className="mt-3 text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-xl px-3 py-2">
                    {booking.quote.message}
                  </p>
                )}
              </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Carrier Card */}
            {booking.carrier && (
              <div className="card-base p-5 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  الناقل
                </h2>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      booking.carrier.user?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        booking.carrier.companyName ?? booking.carrier.user?.displayName ?? 'N'
                      )}&background=0B2447&color=fff&size=80`
                    }
                    alt={`صورة ${booking.carrier.user?.displayName ?? 'الناقل'}`}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=N&background=0B2447&color=fff&size=80`;
                    }}
                  />
                  <div>
                    <p className="text-base font-bold text-[var(--color-on-surface)] truncate">
                      {booking.carrier.companyName ?? booking.carrier.user?.displayName}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-[var(--color-brand-amber)] fill-[var(--color-brand-amber)]" />
                      <span className="text-xs text-[var(--color-on-surface-variant)]">
                        {booking.carrier.averageRating.toFixed(1)} ({booking.carrier.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {booking.carrier.whatsapp && (
                    <a
                      href={`https://wa.me/${booking.carrier.whatsapp.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full justify-center text-sm"
                    >
                      <MessageCircle size={15} />
                      واتساب
                    </a>
                  )}
                  {booking.carrier.contactPhone && (
                    <a
                      href={`tel:${booking.carrier.contactPhone}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] transition-all"
                    >
                      <Phone size={15} />
                      {booking.carrier.contactPhone}
                    </a>
                  )}
                  <Link
                    href={`/transport/carriers/${booking.carrier.id}`}
                    className="text-center text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
                  >
                    عرض الملف الكامل
                  </Link>
                </div>
              </div>
            )}

            {/* Chat Link */}
            {booking.conversationId && (
              <div className="card-base p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  تواصل
                </h2>
                <Link
                  href={`/messages/${booking.conversationId}`}
                  className="btn-outline w-full justify-center text-sm font-semibold flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  فتح المحادثة
                </Link>
              </div>
            )}

            {/* Action Buttons */}
            {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (isCarrier || isShipper) && (
              <div className="card-base p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  الإجراءات
                </h2>
                {isCarrier && booking.status === 'ACCEPTED' && (
                  <button
                    onClick={handleMarkInProgress}
                    disabled={actionLoading}
                    className="btn-primary w-full justify-center"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                    بدأت التحميل
                  </button>
                )}
                {isShipper && booking.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    disabled={actionLoading}
                    className="btn-primary w-full justify-center"
                  >
                    <CheckCircle size={16} />
                    استلمت — اكتمل
                  </button>
                )}
                {showCancelForm && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[var(--color-error)]">
                      سبب الإلغاء <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="اكتب سبب الإلغاء..."
                      rows={2}
                      className="w-full rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]"
                    />
                    {!cancelReason.trim() && (
                      <p className="text-[11px] text-[var(--color-error)] font-semibold">
                        سبب الإلغاء مطلوب
                      </p>
                    )}
                  </div>
                )}
                <button
                  onClick={handleCancel}
                  disabled={actionLoading || cancelled || (showCancelForm && !cancelReason.trim())}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-error)] text-[var(--color-error)] text-sm font-semibold hover:bg-[var(--color-error-light)] transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  {showCancelForm ? 'تأكيد الإلغاء' : 'إلغاء الحجز'}
                </button>
                {showCancelForm && (
                  <button
                    onClick={() => { setShowCancelForm(false); setCancelReason(''); }}
                    className="text-xs text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)] font-semibold"
                  >
                    تراجع
                  </button>
                )}
              </div>
            )}

            {/* Rating — after completion */}
            {booking.status === 'COMPLETED' && booking.carrier && (
              <div className="card-base p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  قيّم الناقل
                </h2>
                <TransportReviewForm bookingId={booking.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
            <h3 className="font-bold text-lg text-[var(--color-on-surface)]">تأكيد استلام البضاعة</h3>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              بعد التأكيد ستُوسَّم الرحلة كمكتملة ولا يمكن التراجع
            </p>
            <textarea
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="ملاحظات التسليم (اختياري)..."
              className="w-full px-3 py-2 rounded-xl border border-[var(--color-outline-variant)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]"
              rows={3}
            />
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn-ghost flex-1 justify-center"
                disabled={actionLoading}
              >
                إلغاء
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="btn-primary flex-1 justify-center"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'تأكيد الاستلام'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
