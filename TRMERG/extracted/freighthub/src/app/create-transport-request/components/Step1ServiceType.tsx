'use client';

import { useFormContext } from 'react-hook-form';
import { Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench, CheckCircle } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import type { TransportServiceType } from '@/features/transport/types';
import Icon from '@/components/ui/AppIcon';


const SERVICE_OPTIONS: {
  type: TransportServiceType;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    type: 'GOODS',
    label: 'بضائع عامة',
    sublabel: 'سلع تجارية، مواد غذائية، منتجات مستهلكة',
    Icon: Package,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
  },
  {
    type: 'FURNITURE',
    label: 'أثاث ومنزليات',
    sublabel: 'نقل الأثاث والأجهزة المنزلية',
    Icon: Sofa,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
  {
    type: 'CONSTRUCTION',
    label: 'مواد البناء',
    sublabel: 'إسمنت، حديد، رمل، طوب، بلاط',
    Icon: HardHat,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
  },
  {
    type: 'HEAVY',
    label: 'شحن ثقيل',
    sublabel: 'معدات صناعية وخزانات ومعدات بترولية',
    Icon: Container,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.08)',
  },
  {
    type: 'BACKLOAD',
    label: 'عودة فارغة',
    sublabel: 'شحن بأسعار مخفّضة مع رحلات العودة',
    Icon: ArrowLeftRight,
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
  },
  {
    type: 'EQUIPMENT',
    label: 'معدات وآليات',
    sublabel: 'حفارات، رافعات، قلابات، جرارات',
    Icon: Wrench,
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.08)',
  },
];

export default function Step1ServiceType() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const selected = watch('serviceType');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2
          className="text-xl text-[var(--color-on-surface)] mb-1"
          style={{ fontWeight: 700 }}
        >
          ما الذي تريد نقله؟
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          اختر نوع الخدمة الذي يصف بضاعتك بشكل أفضل
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICE_OPTIONS.map(({ type, label, sublabel, Icon, color, bg }) => {
          const isSelected = selected === type;
          return (
            <button
              key={`step1-service-${type}`}
              type="button"
              onClick={() => setValue('serviceType', type, { shouldValidate: true })}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-start transition-all duration-200 ${
                isSelected
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5 shadow-md'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] hover:shadow-sm bg-white'
              }`}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: isSelected ? `${color}20` : bg,
                }}
              >
                <Icon size={22} style={{ color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-bold mb-0.5 ${
                    isSelected ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface)]'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {label}
                </div>
                <div className="text-xs text-[var(--color-on-surface-muted)] leading-relaxed">
                  {sublabel}
                </div>
              </div>

              {/* Check */}
              {isSelected && (
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle size={20} className="text-[var(--color-brand-navy)]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {errors.serviceType && (
        <p className="mt-3 text-sm font-semibold text-[var(--color-error)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
          {errors.serviceType.message}
        </p>
      )}
    </div>
  );
}