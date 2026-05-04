'use client';

import { useFormContext } from 'react-hook-form';
import { Truck, MapPin, Package, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS, SERVICE_TYPE_BG_COLORS } from '../constants';
import type { TransportServiceType } from '../types';

export default function Step5Review() {
  const { watch } = useFormContext<CreateRequestFormData>();
  const data = watch();

  const serviceColor = SERVICE_TYPE_COLORS[data.serviceType as TransportServiceType] ?? '#9ca3af';
  const serviceBg = SERVICE_TYPE_BG_COLORS[data.serviceType as TransportServiceType] ?? '#f3f4f6';
  const serviceLabel = data.serviceType
    ? SERVICE_TYPE_LABELS[data.serviceType as TransportServiceType]
    : '—';

  const budgetText =
    data.budgetMin && data.budgetMax
      ? `${data.budgetMin} – ${data.budgetMax} ر.ع.`
      : data.budgetMin
      ? `من ${data.budgetMin} ر.ع.`
      : data.budgetMax
      ? `حتى ${data.budgetMax} ر.ع.`
      : 'قابل للتفاوض';

  const timingText =
    data.timingType === 'scheduled' && data.scheduledAt
      ? new Date(data.scheduledAt).toLocaleString('ar-OM', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }) + (data.isFlexible ? ' (مرن)' : '')
      : 'في أقرب وقت ممكن';

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          مراجعة الطلب
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          تأكد من صحة جميع البيانات قبل الإرسال
        </p>
      </div>

      <div className="space-y-4">
        {/* Service */}
        <div className="p-4 bg-[var(--color-surface-container)] rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: serviceBg }}
            >
              <Truck size={18} style={{ color: serviceColor }} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider">
                نوع الخدمة
              </p>
              <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                {serviceLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="p-4 bg-[var(--color-surface-container)] rounded-2xl">
          <p className="text-[11px] font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin size={12} />
            المسار
          </p>
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-green-50" />
              <div className="w-0 border-r-2 border-dashed border-amber-400 h-8 my-0.5" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-50" />
            </div>
            <div className="flex flex-col justify-between gap-2 flex-1 min-w-0">
              <div>
                <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                  {data.fromGovernorate || '—'}
                  {data.fromCity ? ` — ${data.fromCity}` : ''}
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)] truncate mt-0.5">
                  {data.fromAddress || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                  {data.toGovernorate || '—'}
                  {data.toCity ? ` — ${data.toCity}` : ''}
                </p>
                <p className="text-xs text-[var(--color-on-surface-variant)] truncate mt-0.5">
                  {data.toAddress || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div className="p-4 bg-[var(--color-surface-container)] rounded-2xl">
          <p className="text-[11px] font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package size={12} />
            البضاعة
          </p>
          <p className="text-sm text-[var(--color-on-surface)] leading-relaxed">
            {data.cargoDescription || '—'}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {data.weightTons && (
              <span className="text-xs font-bold text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/8 px-2.5 py-1 rounded-full">
                {data.weightTons} طن
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-bold text-[var(--color-on-surface-variant)] bg-white border border-[var(--color-outline-variant)] px-2.5 py-1 rounded-full">
              <Users size={11} />
              {data.requiresHelper ? 'يحتاج مساعدة في التحميل' : 'لديه عمال'}
            </span>
          </div>
        </div>

        {/* Timing & Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-[var(--color-surface-container)] rounded-2xl">
            <p className="text-[11px] font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={12} />
              الموعد
            </p>
            <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              {timingText}
            </p>
          </div>
          <div className="p-4 bg-[var(--color-surface-container)] rounded-2xl">
            <p className="text-[11px] font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign size={12} />
              الميزانية
            </p>
            <p className="text-sm font-bold text-[var(--color-brand-amber)]" style={{ fontWeight: 700 }}>
              {budgetText}
            </p>
          </div>
        </div>

        {/* Confirmation notice */}
        <div className="flex items-start gap-3 p-3 bg-[var(--color-success-light)] border border-green-200 rounded-2xl">
          <CheckCircle size={16} className="text-[var(--color-brand-green)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--color-brand-green)] leading-relaxed">
            بالضغط على &quot;إرسال الطلب&quot; ستبدأ في استقبال عروض المزودين. يمكنك مراجعة العروض والاختيار لاحقاً.
          </p>
        </div>
      </div>
    </div>
  );
}
