'use client';

import { useFormContext } from 'react-hook-form';
import {
  Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench,
  MapPin, Weight, Users, Calendar, DollarSign, FileText, CheckCircle,
} from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
} from '@/features/transport/constants';
import type { TransportServiceType } from '@/features/transport/types';

const SERVICE_ICONS: Record<TransportServiceType, React.ElementType> = {
  GOODS: Package,
  FURNITURE: Sofa,
  CONSTRUCTION: HardHat,
  HEAVY: Container,
  BACKLOAD: ArrowLeftRight,
  EQUIPMENT: Wrench,
};

export default function Step5Review() {
  const { watch } = useFormContext<CreateRequestFormData>();
  const data = watch();

  const serviceType = data.serviceType as TransportServiceType | undefined;
  const ServiceIcon = serviceType ? SERVICE_ICONS[serviceType] : Package;
  const iconColor = serviceType ? SERVICE_TYPE_COLORS[serviceType] : '#9ca3af';
  const iconBg = serviceType ? SERVICE_TYPE_BG_COLORS[serviceType] : '#f3f4f6';

  function formatBudgetPreview(): string {
    const { budgetMin, budgetMax } = data;
    if (!budgetMin && !budgetMax) return 'السعر قابل للتفاوض';
    if (budgetMin && budgetMax) return `${budgetMin} – ${budgetMax} ر.ع.`;
    if (budgetMin) return `من ${budgetMin} ر.ع.`;
    return `حتى ${budgetMax} ر.ع.`;
  }

  const reviewSections = [
    {
      key: 'service',
      title: 'نوع الخدمة',
      icon: ServiceIcon,
      iconColor,
      iconBg,
      content: serviceType ? SERVICE_TYPE_LABELS[serviceType] : '—',
    },
  ];

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2
          className="text-xl text-[var(--color-on-surface)] mb-1"
          style={{ fontWeight: 700 }}
        >
          مراجعة الطلب
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          راجع تفاصيل طلبك قبل الإرسال. يمكنك العودة لتعديل أي خطوة.
        </p>
      </div>

      {/* Summary Card */}
      <div className="space-y-4">
        {/* Service Type */}
        <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-container)] rounded-2xl">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <ServiceIcon size={22} style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-0.5">
              نوع الخدمة
            </p>
            <p className="text-base font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              {serviceType ? SERVICE_TYPE_LABELS[serviceType] : '—'}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="p-4 border border-[var(--color-outline-variant)] rounded-2xl">
          <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
            مسار الرحلة
          </p>
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-50" />
              <div className="w-0 border-r-2 border-dashed border-amber-400 h-8 my-1" />
              <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-50" />
            </div>
            <div className="flex flex-col justify-between gap-2 min-w-0 flex-1">
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin size={12} className="text-green-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    {data.fromGovernorate || '—'}
                    {data.fromCity ? ` — ${data.fromCity}` : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-on-surface-muted)] ps-4">
                  {data.fromAddress || '—'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin size={12} className="text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-[var(--color-on-surface)]">
                    {data.toGovernorate || '—'}
                    {data.toCity ? ` — ${data.toCity}` : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-on-surface-muted)] ps-4">
                  {data.toAddress || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="p-4 border border-[var(--color-outline-variant)] rounded-2xl space-y-3">
          <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider">
            تفاصيل البضاعة
          </p>

          <div className="flex items-start gap-2">
            <Package size={14} className="text-[var(--color-brand-amber)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[var(--color-on-surface-muted)] mb-0.5">وصف البضاعة</p>
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                {data.cargoDescription || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.weightTons && (
              <div className="flex items-center gap-2">
                <Weight size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-[var(--color-on-surface-muted)]">الوزن</p>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">
                    {data.weightTons} طن
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--color-on-surface-muted)]">عمال التحميل</p>
                <p className="text-sm font-bold text-[var(--color-on-surface)]">
                  {data.requiresHelper ? 'مطلوب' : 'غير مطلوب'}
                </p>
              </div>
            </div>
          </div>

          {data.notes && (
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-[var(--color-brand-amber)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-on-surface-muted)] mb-0.5">ملاحظات</p>
                <p className="text-sm text-[var(--color-on-surface-variant)]">{data.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Timing & Budget */}
        <div className="p-4 border border-[var(--color-outline-variant)] rounded-2xl space-y-3">
          <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider">
            الموعد والميزانية
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--color-on-surface-muted)]">الموعد</p>
                <p className="text-sm font-bold text-[var(--color-on-surface)]">
                  {data.timingType === 'asap' ?'في أقرب وقت'
                    : data.scheduledAt
                    ? new Date(data.scheduledAt).toLocaleDateString('ar-OM', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'موعد محدد'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--color-on-surface-muted)]">الميزانية</p>
                <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                  {formatBudgetPreview()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Notice */}
        <div className="flex items-start gap-3 p-4 bg-[var(--color-success-light)] border border-[var(--color-success)]/20 rounded-2xl">
          <CheckCircle size={18} className="text-[var(--color-success)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[var(--color-success)] mb-0.5">
              جاهز للإرسال
            </p>
            <p className="text-xs text-[var(--color-success)]/80 leading-relaxed">
              بعد الإرسال سيُنشر طلبك وتبدأ في استقبال عروض الأسعار من المزودين المتاحين في منطقتك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}