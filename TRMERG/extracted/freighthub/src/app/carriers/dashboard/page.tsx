'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, ToggleLeft, ToggleRight, Star, CheckCircle, TrendingUp, MapPin, Loader2, AlertCircle, Package, MessageSquare,  } from 'lucide-react';
import type { CarrierProfile, TransportRequest, TransportQuote } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import {
  SERVICE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
  CURRENCY_LABEL,
  REQUEST_STATUS_LABELS,
} from '@/features/transport/constants';
import { formatRelativeDate, formatBudgetRange } from '@/lib/utils';
import { MOCK_TRANSPORT_REQUESTS, MOCK_QUOTES } from '@/lib/mock-data';
import Icon from '@/components/ui/AppIcon';


export default function CarrierDashboardPage() {
  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [nearbyRequests, setNearbyRequests] = useState<TransportRequest[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<TransportQuote[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const p = await transportApi.getMyCarrierProfile();
        setProfile(p);
        const nearby = MOCK_TRANSPORT_REQUESTS.filter(
          (r) => r.fromGovernorate === p.governorate || r.toGovernorate === p.governorate
        ).slice(0, 4);
        setNearbyRequests(nearby);
        const quotes = MOCK_QUOTES.filter((q) => q.carrierId === p.id).slice(0, 5);
        setRecentQuotes(quotes);
      } catch {
        setError('تعذّر تحميل لوحة التحكم');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const updated = await transportApi.setAvailability(!profile.isAvailable);
      setProfile(updated);
    } finally {
      setToggling(false);
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={40} className="text-[var(--color-error)]" />
          <p className="text-base font-semibold">{error || 'لا يوجد ملف ناقل'}</p>
          <Link href="/carriers/register" className="btn-primary">
            <Truck size={16} />
            سجّل كناقل
          </Link>
        </div>
      </div>
    );
  }

  const pendingQuotes = recentQuotes.filter((q) => q.status === 'PENDING').length;
  const acceptedQuotes = recentQuotes.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">لوحة الناقل</h1>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {profile.companyName ?? profile.user?.displayName}
            </p>
          </div>
          <Link
            href={`/carriers/${profile.id}`}
            className="text-sm text-[var(--color-brand-navy)] font-semibold hover:underline"
          >
            عرض ملفي الشخصي
          </Link>
        </div>

        {/* Availability Toggle */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
          style={{
            background: profile.isAvailable
              ? 'linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-navy-light))'
              : 'linear-gradient(135deg, #374151, #4b5563)',
          }}
        >
          <div>
            <p className="text-white/70 text-xs font-semibold mb-1">حالة التوفر</p>
            <p className="text-white text-xl font-bold">
              {profile.isAvailable ? 'متاح للعمل' : 'غير متاح حالياً'}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {profile.isAvailable
                ? 'يمكن للشاحنين رؤية ملفك وإرسال طلبات' :'ملفك مخفي عن الشاحنين'}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 size={18} className="animate-spin" />
            ) : profile.isAvailable ? (
              <ToggleRight size={22} />
            ) : (
              <ToggleLeft size={22} />
            )}
            {profile.isAvailable ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'عروض مقدمة',
              value: recentQuotes.length,
              icon: MessageSquare,
              color: 'var(--color-info)',
              bg: 'var(--color-info-light)',
            },
            {
              label: 'عروض مقبولة',
              value: acceptedQuotes,
              icon: CheckCircle,
              color: 'var(--color-success)',
              bg: 'var(--color-success-light)',
            },
            {
              label: 'رحلات مكتملة',
              value: profile.completedTrips,
              icon: TrendingUp,
              color: 'var(--color-brand-navy)',
              bg: 'rgba(11,36,71,0.1)',
            },
            {
              label: 'التقييم',
              value: profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—',
              icon: Star,
              color: 'var(--color-brand-amber)',
              bg: 'rgba(232,120,30,0.1)',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card-base p-4 flex flex-col gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{value}</p>
              <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Nearby Requests */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                طلبات قريبة منك
              </h2>
              <div className="flex items-center gap-1 text-xs text-[var(--color-on-surface-muted)]">
                <MapPin size={12} />
                {profile.governorate}
              </div>
            </div>
            {nearbyRequests.length === 0 ? (
              <div className="card-base p-8 flex flex-col items-center gap-3 text-center">
                <Package size={32} className="text-[var(--color-on-surface-muted)]" />
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  لا توجد طلبات قريبة حالياً
                </p>
                <Link href="/browse-transport-requests" className="btn-primary text-sm">
                  تصفح جميع الطلبات
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {nearbyRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="card-base card-hover p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                        {SERVICE_TYPE_LABELS[req.serviceType]}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-muted)] truncate">
                        {req.fromGovernorate} ← {req.toGovernorate}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] truncate">
                        {req.cargoDescription}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                        {formatBudgetRange(req.budgetMin, req.budgetMax)}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-muted)]">
                        {REQUEST_STATUS_LABELS[req.status]}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/browse-transport-requests"
                  className="text-center text-sm text-[var(--color-brand-navy)] font-semibold hover:underline py-2"
                >
                  عرض جميع الطلبات
                </Link>
              </div>
            )}
          </div>

          {/* Recent Quotes */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                عروضي الأخيرة
              </h2>
              <Link
                href="/my-quotes"
                className="text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            {recentQuotes.length === 0 ? (
              <div className="card-base p-8 flex flex-col items-center gap-3 text-center">
                <MessageSquare size={32} className="text-[var(--color-on-surface-muted)]" />
                <p className="text-sm text-[var(--color-on-surface-muted)]">لم تقدم أي عروض بعد</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentQuotes.map((q) => {
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    PENDING: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
                    ACCEPTED: { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
                    REJECTED: { bg: 'var(--color-error-light)', text: 'var(--color-error)' },
                    WITHDRAWN: { bg: 'var(--color-surface-container)', text: 'var(--color-on-surface-muted)' },
                  };
                  const sc = statusColors[q.status] ?? statusColors['PENDING'];
                  return (
                    <div key={q.id} className="card-base p-4 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-xs text-[var(--color-on-surface-muted)] font-mono">
                          #{q.requestId}
                        </p>
                        <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                          {q.price} {CURRENCY_LABEL}
                        </p>
                        <p className="text-xs text-[var(--color-on-surface-muted)]">
                          {formatRelativeDate(q.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                        {q.status === 'ACCEPTED' && (
                          <Link
                            href="/my-quotes"
                            className="text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
                          >
                            عرض الحجز
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Profile Summary */}
            <div className="card-base p-4 flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-bold text-[var(--color-on-surface-variant)]">ملخص الملف</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.vehicleTypes.map((v) => (
                  <span
                    key={v}
                    className="text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2.5 py-1 rounded-full font-semibold"
                  >
                    {VEHICLE_TYPE_LABELS[v]}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.serviceTypes.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] px-2.5 py-1 rounded-full font-semibold"
                  >
                    {SERVICE_TYPE_LABELS[s]}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-muted)]">
                <MapPin size={12} />
                {profile.governorate}
                {profile.city && ` — ${profile.city}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
