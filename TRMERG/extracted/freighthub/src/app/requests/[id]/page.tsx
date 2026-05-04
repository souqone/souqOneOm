'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Package,
  Calendar,
  Weight,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  Circle,
  Loader2,
  AlertCircle,
  Send,
  Eye,
  Banknote,
  Star,
} from 'lucide-react';
import type { TransportRequest, TransportQuote, CreateQuoteDto } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { useAuth } from '@/lib/auth';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS, SERVICE_TYPE_BG_COLORS, REQUEST_STATUS_LABELS, CURRENCY_LABEL,  } from '@/features/transport/constants';
import {
  formatBudgetRange,
  formatRelativeDate,
  formatScheduledDate,
  getRequestStatusBadgeClass,
  getStatusDotColor,
} from '@/lib/utils';

const STATUS_STEPS = ['OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const;

const STATUS_STEP_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
};

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1" dir="rtl">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)]'
                    : 'bg-white border-[var(--color-outline)]'
                } ${isCurrent ? 'ring-2 ring-[var(--color-brand-amber)] ring-offset-2' : ''}`}
              >
                {isDone ? (
                  <CheckCircle size={16} className="text-white" />
                ) : (
                  <Circle size={16} className="text-[var(--color-on-surface-muted)]" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  isCurrent
                    ? 'text-[var(--color-brand-navy)]'
                    : isDone
                    ? 'text-[var(--color-on-surface-variant)]'
                    : 'text-[var(--color-on-surface-muted)]'
                }`}
              >
                {STATUS_STEP_LABELS[step]}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1 mb-5 flex-shrink-0 ${
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

function QuoteCard({
  quote,
  isOwner,
  onAccept,
  accepting,
}: {
  quote: TransportQuote;
  isOwner: boolean;
  onAccept: (quoteId: string) => void;
  accepting: string | null;
}) {
  return (
    <div className="card-base p-4 flex flex-col gap-3" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <img
            src={quote.carrier?.user?.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${quote.carrierId}`}
            alt={`صورة ${quote.carrier?.user?.displayName ?? 'الناقل'}`}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-sm font-bold text-[var(--color-on-surface)]">
              {quote.carrier?.companyName ?? quote.carrier?.user?.displayName ?? 'ناقل'}
            </p>
            {quote.carrier && (
              <div className="flex items-center gap-1">
                <Star size={11} className="text-[var(--color-brand-amber)] fill-[var(--color-brand-amber)]" />
                <span className="text-xs text-[var(--color-on-surface-variant)]">
                  {quote.carrier.averageRating.toFixed(1)} ({quote.carrier.reviewCount} تقييم)
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-[var(--color-brand-navy)]">
            {quote.price} {CURRENCY_LABEL}
          </p>
          {quote.estimatedHours && (
            <p className="text-xs text-[var(--color-on-surface-muted)] flex items-center gap-1 justify-end">
              <Clock size={11} />
              {quote.estimatedHours} ساعة
            </p>
          )}
        </div>
      </div>
      {quote.message && (
        <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-xl px-3 py-2">
          {quote.message}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--color-on-surface-muted)]">
          {formatRelativeDate(quote.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/carriers/${quote.carrierId}`}
            className="text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
          >
            عرض الملف
          </Link>
          {isOwner && quote.status === 'PENDING' && (
            <button
              onClick={() => onAccept(quote.id)}
              disabled={accepting === quote.id}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {accepting === quote.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle size={12} />
              )}
              قبول العرض
            </button>
          )}
          {quote.status === 'ACCEPTED' && (
            <span className="inline-flex items-center gap-1 bg-[var(--color-success-light)] text-[var(--color-success)] text-xs font-bold px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              مقبول
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function QuoteForm({
  requestId,
  onSubmitted,
}: {
  requestId: string;
  onSubmitted: () => void;
}) {
  const [price, setPrice] = useState('');
  const [hours, setHours] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('يرجى إدخال سعر صحيح');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dto: CreateQuoteDto = {
        price: Number(price),
        estimatedHours: hours ? Number(hours) : undefined,
        message: message || undefined,
      };
      await transportApi.submitQuote(requestId, dto);
      onSubmitted();
    } catch {
      setError('حدث خطأ أثناء إرسال العرض. حاول مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" dir="rtl">
      <h3 className="text-base font-bold text-[var(--color-on-surface)]">قدّم عرضك</h3>
      {error && (
        <div className="flex items-center gap-2 bg-[var(--color-error-light)] text-[var(--color-error)] text-sm px-3 py-2 rounded-xl">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          السعر (ر.ع.) *
        </label>
        <input
          type="number"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="مثال: 350"
          className="input-base"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          الوقت المتوقع (ساعات)
        </label>
        <input
          type="number"
          min="1"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="مثال: 8"
          className="input-base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
          رسالة للشاحن
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب تفاصيل عرضك هنا..."
          rows={3}
          className="input-base resize-none"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        إرسال العرض
      </button>
    </form>
  );
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);

  const fetchRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await transportApi.getRequest(id);
      setRequest(data);
    } catch {
      setError('تعذّر تحميل تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const handleAcceptQuote = async (quoteId: string) => {
    setAccepting(quoteId);
    try {
      const booking = await transportApi.acceptQuote(quoteId);
      router.push(`/bookings/${booking.id}`);
    } catch {
      setAccepting(null);
    }
  };

  const isOwner = request?.userId === user?.id;
  const isCarrier = user?.role === 'CARRIER';
  const acceptedQuote = request?.quotes?.find((q) => q.status === 'ACCEPTED');

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
          <p className="text-base font-semibold text-[var(--color-on-surface)]">
            {error || 'الطلب غير موجود'}
          </p>
          <Link href="/browse-transport-requests" className="btn-primary">
            <ArrowRight size={16} />
            العودة للتصفح
          </Link>
        </div>
      </div>
    );
  }

  const iconColor = SERVICE_TYPE_COLORS[request.serviceType];
  const iconBg = SERVICE_TYPE_BG_COLORS[request.serviceType];
  const statusBadgeClass = getRequestStatusBadgeClass(request.status);
  const statusDot = getStatusDotColor(request.status);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back */}
        <Link
          href="/browse-transport-requests"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-brand-navy)] font-semibold mb-6 transition-colors"
        >
          <ArrowRight size={16} />
          العودة للتصفح
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* ─── Main Column ─── */}
          <div className="flex flex-col gap-5">
            {/* Header Card */}
            <div className="card-base p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg }}
                  >
                    <Package size={22} style={{ color: iconColor }} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-[var(--color-on-surface)]">
                      {SERVICE_TYPE_LABELS[request.serviceType]}
                    </h1>
                    <span className="text-xs text-[var(--color-on-surface-muted)] font-mono">
                      #{request.id}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusBadgeClass}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusDot }}
                  />
                  {REQUEST_STATUS_LABELS[request.status]}
                </span>
              </div>

              {/* Status Timeline */}
              {request.status !== 'CANCELLED' && request.status !== 'EXPIRED' && (
                <div className="overflow-x-auto">
                  <StatusTimeline status={request.status} />
                </div>
              )}
            </div>

            {/* Route Card */}
            <div className="card-base p-5">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wide">
                المسار
              </h2>
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-0 pt-1 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2 border-[var(--color-brand-green)] bg-[#dcfce7]" />
                  <div className="w-0 flex-grow border-r-2 border-dashed border-[var(--color-brand-amber)] my-2" style={{ minHeight: '3rem' }} />
                  <div className="w-3 h-3 rounded-full border-2 border-[var(--color-brand-amber)] bg-[#fff7ed]" />
                </div>
                <div className="flex flex-col justify-between gap-4 flex-1">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={14} className="text-[var(--color-brand-green)]" />
                      <span className="text-base font-bold text-[var(--color-on-surface)]">
                        {request.fromGovernorate}
                        {request.fromCity && request.fromCity !== request.fromGovernorate && ` — ${request.fromCity}`}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mr-5">
                      {request.fromAddress}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin size={14} className="text-[var(--color-brand-amber)]" />
                      <span className="text-base font-bold text-[var(--color-on-surface)]">
                        {request.toGovernorate}
                        {request.toCity && request.toCity !== request.toGovernorate && ` — ${request.toCity}`}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-on-surface-variant)] mr-5">
                      {request.toAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="card-base p-5">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wide">
                تفاصيل البضاعة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                    <Package size={16} className="text-[var(--color-on-surface-variant)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">وصف البضاعة</p>
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">{request.cargoDescription}</p>
                  </div>
                </div>
                {request.weightTons && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                      <Weight size={16} className="text-[var(--color-on-surface-variant)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">الوزن</p>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">{request.weightTons} طن</p>
                    </div>
                  </div>
                )}
                {request.scheduledAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-[var(--color-on-surface-variant)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">الموعد المطلوب</p>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                        {formatScheduledDate(request.scheduledAt)}
                        {request.isFlexible && (
                          <span className="text-xs text-[var(--color-on-surface-muted)] mr-1">(مرن)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {request.requiresHelper && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-[var(--color-warning)]" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">مساعدة في التحميل</p>
                      <p className="text-sm font-semibold text-[var(--color-warning)]">مطلوب عمال تحميل</p>
                    </div>
                  </div>
                )}
              </div>
              {request.notes && (
                <div className="mt-4 bg-[var(--color-surface-container)] rounded-xl px-4 py-3">
                  <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold mb-1">ملاحظات إضافية</p>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">{request.notes}</p>
                </div>
              )}
            </div>

            {/* Budget Card */}
            <div className="card-base p-5">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wide">
                الميزانية
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
                  <Banknote size={22} className="text-[var(--color-brand-navy)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-brand-navy)]">
                    {formatBudgetRange(request.budgetMin, request.budgetMax)}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-muted)]">الميزانية المتوقعة</p>
                </div>
              </div>
            </div>

            {/* Requester Info */}
            <div className="card-base p-5">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-4 uppercase tracking-wide">
                معلومات الشاحن
              </h2>
              <div className="flex items-center gap-3">
                <img
                  src={request.user?.avatarUrl}
                  alt={`صورة ${request.user?.displayName}`}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-base font-bold text-[var(--color-on-surface)]">{request.user?.displayName}</p>
                  <p className="text-xs text-[var(--color-on-surface-muted)]">@{request.user?.username}</p>
                </div>
                <div className="mr-auto flex items-center gap-2 text-xs text-[var(--color-on-surface-muted)]">
                  <Eye size={13} />
                  {request.viewCount} مشاهدة
                </div>
              </div>
            </div>
          </div>

          {/* ─── Sidebar ─── */}
          <div className="flex flex-col gap-5">
            {/* Quotes / Quote Form */}
            <div className="card-base p-5 flex flex-col gap-4">
              {isOwner ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                      العروض المقدمة
                    </h2>
                    <span className="inline-flex items-center gap-1 bg-[var(--color-info-light)] text-[var(--color-info)] text-xs font-bold px-2.5 py-1 rounded-full">
                      <MessageSquare size={11} />
                      {request.quotes?.length ?? 0}
                    </span>
                  </div>
                  {acceptedQuote && (
                    <div className="bg-[var(--color-success-light)] border border-[var(--color-success)] rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-[var(--color-success)]" />
                        <span className="text-sm font-bold text-[var(--color-success)]">تم قبول عرض</span>
                      </div>
                      {request.booking && (
                        <Link
                          href={`/bookings/${request.booking.id}`}
                          className="text-xs font-bold text-[var(--color-brand-navy)] hover:underline"
                        >
                          عرض الحجز
                        </Link>
                      )}
                    </div>
                  )}
                  {request.quotes && request.quotes.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {request.quotes.map((q) => (
                        <QuoteCard
                          key={q.id}
                          quote={q}
                          isOwner={isOwner}
                          onAccept={handleAcceptQuote}
                          accepting={accepting}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <MessageSquare size={32} className="text-[var(--color-on-surface-muted)]" />
                      <p className="text-sm text-[var(--color-on-surface-muted)]">لا توجد عروض بعد</p>
                    </div>
                  )}
                </>
              ) : isCarrier ? (
                quoteSubmitted ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <CheckCircle size={36} className="text-[var(--color-success)]" />
                    <p className="text-base font-bold text-[var(--color-on-surface)]">تم إرسال عرضك بنجاح!</p>
                    <p className="text-sm text-[var(--color-on-surface-muted)]">سيتم إشعارك عند قبول العرض</p>
                  </div>
                ) : (
                  <QuoteForm requestId={id} onSubmitted={() => setQuoteSubmitted(true)} />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <User size={32} className="text-[var(--color-on-surface-muted)]" />
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                    سجّل دخولك كناقل لتقديم عرض
                  </p>
                  <Link href="/carriers/register" className="btn-primary text-sm">
                    التسجيل كناقل
                  </Link>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="card-base p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-on-surface-muted)]">تاريخ النشر</span>
                <span className="font-semibold text-[var(--color-on-surface-variant)]">
                  {formatRelativeDate(request.createdAt)}
                </span>
              </div>
              {request.expiresAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-on-surface-muted)]">ينتهي في</span>
                  <span className="font-semibold text-[var(--color-warning)]">
                    {formatScheduledDate(request.expiresAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
