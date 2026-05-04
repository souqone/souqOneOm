'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Star,
  CheckCircle,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  Calendar,
  Loader2,
  AlertCircle,
  Shield,
  TrendingUp,
  Package,
} from 'lucide-react';
import type { CarrierProfile } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { SERVICE_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '@/features/transport/constants';

export default function PublicCarrierProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [carrier, setCarrier] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const found = await transportApi.getCarrier(id);
        setCarrier(found);
      } catch {
        setError('تعذّر تحميل الملف الشخصي');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

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

  if (error || !carrier) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={40} className="text-[var(--color-error)]" />
          <p className="text-base font-semibold">{error || 'الناقل غير موجود'}</p>
          <Link href="/transport/browse" className="btn-primary">
            <ArrowRight size={16} />
            تصفح الطلبات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      {/* Banner */}
      <div
        className="h-40 sm:h-52 w-full"
        style={{
          background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, var(--color-brand-navy-light) 60%, var(--color-brand-amber) 100%)',
        }}
      />

      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="pt-4 mb-2">
          <Link
            href="/transport/browse"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-brand-navy)] font-semibold transition-colors"
          >
            <ArrowRight size={16} />
            العودة
          </Link>
        </div>

        {/* Avatar + Name */}
        <div className="flex items-end gap-4 -mt-12 mb-6">
          <div className="relative flex-shrink-0">
            <img
              src={carrier.user?.avatarUrl}
              alt={`صورة ${carrier.user?.displayName}`}
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg"
            />
            {carrier.isVerified && (
              <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-[var(--color-info)] flex items-center justify-center border-2 border-white">
                <Shield size={13} className="text-white" />
              </div>
            )}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--color-on-surface)]">
                {carrier.companyName ?? carrier.user?.displayName}
              </h1>
              {carrier.isVerified && (
                <span className="inline-flex items-center gap-1 bg-[var(--color-info-light)] text-[var(--color-info)] text-xs font-bold px-2 py-0.5 rounded-full">
                  <Shield size={10} />
                  موثّق
                </span>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                carrier.isAvailable
                  ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-muted)]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  carrier.isAvailable ? 'bg-[var(--color-success)]' : 'bg-[var(--color-on-surface-muted)]'
                }`}
              />
              {carrier.isAvailable ? 'متاح' : 'غير متاح'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main */}
          <div className="flex flex-col gap-5">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'رحلات مكتملة',
                  value: carrier.completedTrips,
                  icon: TrendingUp,
                  color: 'var(--color-brand-navy)',
                },
                {
                  label: 'التقييم',
                  value: carrier.averageRating > 0 ? carrier.averageRating.toFixed(1) : '—',
                  icon: Star,
                  color: 'var(--color-brand-amber)',
                },
                {
                  label: 'التقييمات',
                  value: carrier.reviewCount,
                  icon: CheckCircle,
                  color: 'var(--color-success)',
                },
                {
                  label: 'عضو منذ',
                  value: new Date(carrier.createdAt).getFullYear().toString(),
                  icon: Calendar,
                  color: 'var(--color-on-surface-variant)',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card-base p-4 flex flex-col gap-1 items-center text-center">
                  <Icon size={18} style={{ color }} />
                  <p className="text-xl font-bold text-[var(--color-on-surface)]">{value}</p>
                  <p className="text-xs text-[var(--color-on-surface-muted)]">{label}</p>
                </div>
              ))}
            </div>

            {/* Vehicle Types */}
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-[var(--color-brand-navy)]" />
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  أنواع المركبات
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {carrier.vehicleTypes.map((v) => (
                  <span
                    key={v}
                    className="text-sm bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-3 py-1.5 rounded-full font-semibold"
                  >
                    {VEHICLE_TYPE_LABELS[v]}
                  </span>
                ))}
              </div>
            </div>

            {/* Service Types */}
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-[var(--color-brand-navy)]" />
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                  أنواع الخدمات
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {carrier.serviceTypes.map((s) => (
                  <span
                    key={s}
                    className="text-sm bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] px-3 py-1.5 rounded-full font-semibold"
                  >
                    {SERVICE_TYPE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            {carrier.bio && (
              <div className="card-base p-5">
                <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide mb-3">
                  نبذة تعريفية
                </h2>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                  {carrier.bio}
                </p>
              </div>
            )}
          </div>

          {/* Contact Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="card-base p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
                التواصل
              </h2>
              <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)]">
                <MapPin size={14} className="text-[var(--color-brand-navy)]" />
                {carrier.governorate}
                {carrier.city && ` — ${carrier.city}`}
              </div>
              {carrier.whatsapp && (
                <a
                  href={`https://wa.me/${carrier.whatsapp.replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center"
                >
                  <MessageCircle size={16} />
                  تواصل عبر واتساب
                </a>
              )}
              {carrier.contactPhone && (
                <a
                  href={`tel:${carrier.contactPhone}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] transition-all"
                >
                  <Phone size={15} />
                  {carrier.contactPhone}
                </a>
              )}
              <Link
                href="/transport/new"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--color-brand-amber)] text-white text-sm font-bold hover:bg-[var(--color-brand-amber-dark)] transition-all"
              >
                <Package size={15} />
                طلب عرض سعر
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
