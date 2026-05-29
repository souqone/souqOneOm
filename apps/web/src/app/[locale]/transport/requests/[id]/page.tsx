'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ArrowRight,
  MapPin,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Star,
  Truck,
  MessageSquare,
  Banknote,
  Clock,
  Shield,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  XCircle,
  Edit2,
} from 'lucide-react';
import type {
  TransportRequest,
  TransportQuote,
  CreateQuoteDto,
} from '@/features/transport/types';
import { transportApi, useMyCarrierProfile } from '@/features/transport/api';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  REQUEST_STATUS_LABELS,
  CURRENCY_LABEL,
  QUOTE_STATUS_STYLES,
} from '@/features/transport/constants';

import {
  formatRelativeDate,
  formatBudgetRange,
  getRequestStatusBadgeClass,
} from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';

const RouteMapView = dynamic(
  () => import('@/features/transport/components/RouteMapView'),
  { ssr: false, loading: () => <div className="w-full rounded-xl bg-[var(--color-surface-container)] animate-pulse" style={{ height: 260 }} /> }
);

/* ─── Quote Card ──────────────────────────────────────────────── */

interface QuoteCardProps {
  quote: TransportQuote;
  isOwner: boolean;
  requestStatus: string;
  onAccept: (quoteId: string) => Promise<void>;
  accepting: string | null;
}

function QuoteCard({ quote, isOwner, requestStatus, onAccept, accepting }: QuoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAccepted = quote.status === 'ACCEPTED';
  const canAccept = isOwner && requestStatus === 'QUOTED' && quote.status === 'PENDING';

  const sc = QUOTE_STATUS_STYLES[quote.status] ?? QUOTE_STATUS_STYLES['PENDING'];

  return (
    <div
      className={`card-base p-4 flex flex-col gap-3 transition-all ${
        isAccepted ? 'ring-2 ring-[var(--color-success)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-[var(--color-brand-navy)]" />
          </div>
          <div>
            <Link
              href={`/transport/carriers/${quote.carrierId}`}
              className="text-sm font-bold text-[var(--color-on-surface)] hover:text-[var(--color-brand-navy)] transition-colors"
            >
              {quote.carrier?.companyName ?? quote.carrier?.user?.displayName ?? 'ناقل'}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5">
              {(quote.carrier?.averageRating ?? 0) > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-[var(--color-brand-amber)]">
                  <Star size={10} fill="currentColor" />
                  {quote.carrier?.averageRating?.toFixed(1)}
                </span>
              )}
              {quote.carrier?.isVerified && (
                <span className="flex items-center gap-0.5 text-xs text-[var(--color-info)] font-semibold">
                  <Shield size={10} />
                  موثّق
                </span>
              )}
              {quote.carrier?.completedTrips != null && (
                <span className="text-xs text-[var(--color-on-surface-muted)]">
                  {quote.carrier.completedTrips} رحلة
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: sc.bg, color: sc.text }}
        >
          {quote.status === 'PENDING' ? 'بانتظار الرد'
            : quote.status === 'ACCEPTED' ? 'مقبول'
            : quote.status === 'REJECTED' ? 'مرفوض'
            : 'مسحوب'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote size={18} className="text-[var(--color-brand-navy)]" />
          <span className="text-xl font-bold text-[var(--color-brand-navy)]">
            {quote.price} {CURRENCY_LABEL}
          </span>
          {quote.estimatedHours && (
            <span className="text-xs text-[var(--color-on-surface-muted)] flex items-center gap-1">
              <Clock size={11} />
              {quote.estimatedHours} ساعة
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--color-on-surface-muted)]">
          {formatRelativeDate(quote.createdAt)}
        </span>
      </div>

      {quote.message && (
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-[var(--color-brand-navy)] font-semibold"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'إخفاء الرسالة' : 'عرض رسالة الناقل'}
          </button>
          {expanded && (
            <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-xl px-3 py-2 mt-2">
              {quote.message}
            </p>
          )}
        </div>
      )}

      {canAccept && (
        <button
          onClick={() => onAccept(quote.id)}
          disabled={accepting === quote.id}
          className="btn-primary w-full justify-center text-sm disabled:opacity-60"
        >
          {accepting === quote.id ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <CheckCircle size={15} />
          )}
          قبول هذا العرض
        </button>
      )}
    </div>
  );
}

/* ─── Submit Quote Form ───────────────────────────────────────── */

interface SubmitQuoteFormProps {
  requestId: string;
  onSubmitted: (quote: TransportQuote) => void;
}

function SubmitQuoteForm({ requestId, onSubmitted }: SubmitQuoteFormProps) {
  const [price, setPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceError('');
    if (!price || Number(price) <= 0) {
      setPriceError('يرجى إدخال سعر صحيح');
      return;
    }
    const hours = estimatedHours ? Number(estimatedHours) : undefined;
    if (hours !== undefined && (isNaN(hours) || hours <= 0)) {
      setError('عدد الساعات يجب أن يكون رقماً موجباً');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dto: CreateQuoteDto = {
        price: Number(price),
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        message: message.trim() || undefined,
      };
      const quote = await transportApi.submitQuote(requestId, dto);
      onSubmitted(quote);
    } catch {
      setError('تعذّر إرسال العرض. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-base p-5 flex flex-col gap-4" dir="rtl">
      <h3 className="text-base font-bold text-[var(--color-on-surface)]">قدّم عرضك</h3>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-error)] bg-[var(--color-error-light)] rounded-xl px-3 py-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          السعر المقترح ({CURRENCY_LABEL}) *
        </label>
        <input
          type="number"
          min="1"
          step="0.1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 150"
          className={`w-full px-3 py-2.5 rounded-xl border bg-[var(--color-surface-container)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]/30 ${priceError ? 'border-[var(--color-error)]' : 'border-[var(--color-outline-variant)]'}`}
          required
        />
        {priceError && (
          <p className="text-xs text-[var(--color-error)] mt-1">{priceError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          الوقت المتوقع (ساعات)
        </label>
        <input
          type="number"
          min="1"
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
          placeholder="اختياري"
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          رسالة للعميل
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالة تعريفية أو تفاصيل إضافية..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)]/30 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary justify-center disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {submitting ? 'جارٍ الإرسال...' : 'إرسال العرض'}
      </button>
    </form>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { open: openAuth } = useAuthModal();
  const id = params?.id as string;

  const { data: carrierProfile, isLoading: checkingCarrier } = useMyCarrierProfile(
    isAuthenticated
  );

  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quotes, setQuotes] = useState<TransportQuote[]>([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const req = await transportApi.getRequest(id);
      setRequest(req);
    } catch {
      setError('تعذّر تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  // Fetch quotes for the request owner only (backend enforces this too)
  useEffect(() => {
    if (!request || !user || user.id !== request.userId) return;
    transportApi.getQuotes(id).then(setQuotes).catch(() => {});
  }, [request?.userId, user?.id, id]);

  const handleAcceptQuote = async (quoteId: string) => {
    setAccepting(quoteId);
    try {
      await transportApi.acceptQuote(quoteId);
      const bookings = await transportApi.myBookings('shipper', 1, 1);
      const booking = bookings.items?.[0];
      if (booking) {
        router.push(`/transport/bookings/${booking.id}`);
      } else {
        router.push('/transport/my-requests');
      }
    } catch {
      setError('تعذّر قبول العرض. حاول مرة أخرى.');
    } finally {
      setAccepting(null);
    }
  };

  const handleQuoteSubmitted = (quote: TransportQuote) => {
    setQuoteSent(true);
    setQuotes((prev) => [...prev, quote]);
    setRequest((prev) => {
      if (!prev) return prev;
      return { ...prev, status: 'QUOTED' };
    });
  };

  const [renewing, setRenewing] = useState(false);

  const handleRenewRequest = async () => {
    if (!request) return;
    setRenewing(true);
    try {
      const updated = await transportApi.renewRequest(request.id);
      setRequest(updated);
    } catch {
      setError('تعذّر تجديد الطلب. حاول مرة أخرى.');
    } finally {
      setRenewing(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancelRequest = async () => {
    if (!request) return;
    if (!confirm('هل تريد إلغاء هذا الطلب؟')) return;
    setCancelling(true);
    try {
      await transportApi.cancelRequest(request.id);
      setRequest((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
    } catch {
      // Error is handled inside apiRequest usually
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand-navy)]" />
          <p className="text-sm text-[var(--color-on-surface-muted)]">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={40} className="text-[var(--color-error)]" />
          <p className="text-base font-semibold">{error || 'الطلب غير موجود'}</p>
          <Link href="/transport/browse" className="btn-primary">
            <ArrowRight size={16} />
            العودة للتصفح
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === request.userId;
  // A user is considered a carrier if they have a loaded carrierProfile
  const isCarrier = !!carrierProfile;
  const acceptedQuote = quotes.find((q) => q.status === 'ACCEPTED');
  const hasAlreadyQuoted = carrierProfile?.id
    ? quotes.some((q) => q.carrierId === carrierProfile.id)
    : false;
  const canSubmitQuote =
    !isOwner &&
    isCarrier &&
    !!carrierProfile &&
    ['OPEN', 'QUOTED'].includes(request.status) &&
    !hasAlreadyQuoted &&
    !quoteSent;

  const serviceColor = SERVICE_TYPE_COLORS[request.serviceType] ?? '#0B2447';
  const serviceBg = SERVICE_TYPE_BG_COLORS[request.serviceType] ?? 'rgba(11,36,71,0.08)';

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">

        {/* Back */}
        <div className="mb-4">
          <Link
            href="/transport/browse"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-brand-navy)] font-semibold transition-colors"
          >
            <ArrowRight size={16} />
            العودة للتصفح
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Request Details */}
          <div className="flex flex-col gap-5">

            {/* Header Card */}
            <div className="card-base p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: serviceBg }}
                  >
                    <Package size={22} style={{ color: serviceColor }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[var(--color-on-surface)]">
                      {SERVICE_TYPE_LABELS[request.serviceType]}
                    </h1>
                    <p className="text-xs text-[var(--color-on-surface-muted)] font-mono mt-0.5">
                      #{request.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getRequestStatusBadgeClass(request.status)} text-xs font-bold px-3 py-1.5 rounded-full`}>
                  {REQUEST_STATUS_LABELS[request.status]}
                </span>
              </div>

              {/* Route */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                    <div className="w-0.5 h-8 bg-[var(--color-outline-variant)]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
                  </div>
                  <div className="flex flex-col gap-3 flex-1">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-on-surface-muted)] mb-0.5">نقطة الانطلاق</p>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        <MapPin size={13} className="inline me-1 text-[var(--color-success)]" />
                        {request.fromGovernorate}{request.fromCity ? ` — ${request.fromCity}` : ''}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{request.fromAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-on-surface-muted)] mb-0.5">الوجهة</p>
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        <MapPin size={13} className="inline me-1 text-[var(--color-error)]" />
                        {request.toGovernorate}{request.toCity ? ` — ${request.toCity}` : ''}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{request.toAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Map */}
            <div className="card-base p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">الخريطة</h2>
              <RouteMapView
                fromLat={request.fromLat}
                fromLng={request.fromLng}
                fromGovernorate={request.fromGovernorate}
                fromCity={request.fromCity}
                fromAddress={request.fromAddress}
                fromLabel={`${request.fromGovernorate}${request.fromCity ? ' — ' + request.fromCity : ''}`}
                toLat={request.toLat}
                toLng={request.toLng}
                toGovernorate={request.toGovernorate}
                toCity={request.toCity}
                toAddress={request.toAddress}
                toLabel={`${request.toGovernorate}${request.toCity ? ' — ' + request.toCity : ''}`}
              />
            </div>

            {/* Cargo Details */}
            <div className="card-base p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                تفاصيل البضاعة
              </h2>
              <p className="text-sm text-[var(--color-on-surface)]">{request.cargoDescription}</p>
              <div className="grid grid-cols-2 gap-3">
                {request.weightTons && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package size={14} className="text-[var(--color-brand-navy)]" />
                    <span className="text-[var(--color-on-surface-variant)]">
                      الوزن: <span className="font-semibold">{request.weightTons} طن</span>
                    </span>
                  </div>
                )}
                {request.requiresHelper && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle size={14} className="text-[var(--color-success)]" />
                    <span className="text-[var(--color-on-surface-variant)]">يتطلب مساعد</span>
                  </div>
                )}
              </div>
              {request.notes && (
                <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-xl px-3 py-2">
                  {request.notes}
                </p>
              )}
            </div>

            {/* Timing & Budget */}
            <div className="card-base p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                الموعد والميزانية
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[var(--color-brand-navy)]" />
                  <span className="text-[var(--color-on-surface-variant)]">
                    {request.scheduledAt
                      ? new Date(request.scheduledAt).toLocaleDateString('ar-OM-u-nu-latn', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })
                      : 'في أقرب وقت'}
                    {request.isFlexible && ' (مرن)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote size={14} className="text-[var(--color-brand-navy)]" />
                  <span className="text-[var(--color-on-surface-variant)] font-semibold">
                    {formatBudgetRange(request.budgetMin, request.budgetMax)}
                  </span>
                </div>
              </div>
            </div>

            {/* Accepted Quote / Booking */}
            {acceptedQuote && request.booking && (
              <div className="card-base p-5 flex flex-col gap-3 border-2 border-[var(--color-success)]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-[var(--color-success)]" />
                  <h2 className="text-base font-bold text-[var(--color-success)]">تم قبول العرض</h2>
                </div>
                <Link
                  href={`/transport/bookings/${request.booking.id}`}
                  className="btn-primary w-full justify-center"
                >
                  <ExternalLink size={15} />
                  عرض تفاصيل الحجز
                </Link>
              </div>
            )}

            {isOwner && ['OPEN', 'QUOTED'].includes(request.status) && (
              <div className="card-base p-4 flex flex-col gap-3">
                <Link
                  href={`/transport/requests/${request.id}/edit`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-brand-navy)] text-[var(--color-brand-navy)] text-sm font-semibold hover:bg-[var(--color-brand-navy)] hover:text-white transition-all"
                >
                  <Edit2 size={15} />
                  تعديل الطلب
                </Link>
                <button
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-error)] text-[var(--color-error)] text-sm font-semibold hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {cancelling
                    ? <Loader2 size={15} className="animate-spin" />
                    : <XCircle size={15} />
                  }
                  إلغاء الطلب
                </button>
              </div>
            )}

            {/* Quotes — only the owner can load and see submitted quotes */}
            {isOwner && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                    العروض المقدمة
                  </h2>
                  <span className="text-xs text-[var(--color-on-surface-muted)] font-semibold bg-[var(--color-surface-container)] px-2.5 py-1 rounded-full">
                    {quotes.length} عرض
                  </span>
                </div>
                {quotes.length === 0 ? (
                  <div className="card-base p-8 flex flex-col items-center gap-3 text-center">
                    <MessageSquare size={28} className="text-[var(--color-on-surface-muted)]" />
                    <p className="text-sm text-[var(--color-on-surface-muted)]">
                      لا توجد عروض بعد
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {quotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        isOwner={isOwner}
                        requestStatus={request.status}
                        onAccept={handleAcceptQuote}
                        accepting={accepting}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="flex flex-col gap-5">

            {/* Request Meta */}
            <div className="card-base p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                معلومات الطلب
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={13} className="text-[var(--color-brand-navy)]" />
                <span className="text-[var(--color-on-surface-variant)]">
                  نُشر {formatRelativeDate(request.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare size={13} className="text-[var(--color-brand-navy)]" />
                <span className="text-[var(--color-on-surface-variant)]">
                  {isOwner ? quotes.length : (request._count?.quotes ?? 0)} عرض مقدم
                </span>
              </div>
            </div>

            {/* Renew expired request */}
            {isOwner && request.status === 'EXPIRED' && (
              <div className="card-base p-5 flex flex-col gap-3 border-2 border-[var(--color-warning)]">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-[var(--color-warning)]" />
                  <h2 className="text-sm font-bold text-[var(--color-warning)]">انتهت صلاحية هذا الطلب</h2>
                </div>
                <p className="text-xs text-[var(--color-on-surface-muted)]">
                  يمكنك تجديد الطلب لإعادة نشره واستقبال عروض جديدة
                </p>
                <button
                  onClick={handleRenewRequest}
                  disabled={renewing}
                  className="btn-primary w-full justify-center"
                >
                  {renewing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  تجديد الطلب
                </button>
              </div>
            )}

            {/* CTA for authenticated non-carrier, non-owner users */}
            {isAuthenticated && !checkingCarrier && !isCarrier && !isOwner && request.status === 'OPEN' && (
              <div className="card-base p-4 text-center flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center mx-auto">
                  <Truck size={20} className="text-[var(--color-brand-navy)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">هل تريد تقديم عرض على هذا الطلب؟</p>
                  <p className="text-xs text-[var(--color-on-surface-muted)] mt-1">
                    سجّل كناقل مجاناً للتمكن من تقديم عروض الأسعار
                  </p>
                </div>
                <Link href="/transport/carriers/register" className="btn-primary w-full justify-center">
                  سجّل كناقل الآن
                </Link>
              </div>
            )}

            {/* Carrier CTA */}
            {!isOwner && request.status === 'OPEN' && (
              <div className="card-base p-5 flex flex-col gap-3">
                {quoteSent ? (
                  <div className="flex flex-col items-center gap-2 text-center py-2">
                    <CheckCircle size={28} className="text-[var(--color-success)]" />
                    <p className="text-sm font-bold text-[var(--color-success)]">
                      تم إرسال عرضك بنجاح!
                    </p>
                    <p className="text-xs text-[var(--color-on-surface-muted)]">
                      سيتم إشعارك عند قبول العرض
                    </p>
                  </div>
                ) : hasAlreadyQuoted ? (
                  <div className="flex flex-col items-center gap-2 text-center py-2">
                    <CheckCircle size={24} className="text-[var(--color-info)]" />
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                      لقد قدمت عرضاً مسبقاً
                    </p>
                  </div>
                ) : !user ? (
                  <div className="flex flex-col gap-3 text-center">
                    <p className="text-sm text-[var(--color-on-surface-muted)]">
                      سجّل دخولك لتقديم عرض سعر كناقل
                    </p>
                    <button
                      onClick={() => openAuth({ message: 'سجّل دخولك لتقديم عرض سعر كناقل' })}
                      className="btn-primary w-full justify-center"
                    >
                      <Truck size={15} />
                      تسجيل الدخول
                    </button>
                  </div>
                ) : canSubmitQuote ? (
                  <SubmitQuoteForm requestId={id} onSubmitted={handleQuoteSubmitted} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
