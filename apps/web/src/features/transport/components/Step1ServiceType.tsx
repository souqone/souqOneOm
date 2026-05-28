'use client';

import { useFormContext } from 'react-hook-form';
import { Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import type { TransportServiceType } from '../types';
import { useTranslations } from 'next-intl';

const SERVICE_OPTIONS: {
  type: TransportServiceType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { type: 'GOODS', label: 'بضائع عامة', sublabel: 'إلكترونيات، مواد غذائية', icon: Package, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { type: 'FURNITURE', label: 'أثاث ومنزليات', sublabel: 'نقل الأثاث بعناية', icon: Sofa, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { type: 'CONSTRUCTION', label: 'مواد البناء', sublabel: 'رمل، إسمنت، طوب', icon: HardHat, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  { type: 'HEAVY', label: 'شحن ثقيل', sublabel: 'حمولات ضخمة', icon: Container, color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  { type: 'BACKLOAD', label: 'عودة فارغة', sublabel: 'أسعار مخفضة', icon: ArrowLeftRight, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  { type: 'EQUIPMENT', label: 'معدات وآليات', sublabel: 'حفارات، رافعات', icon: Wrench, color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
];

export default function Step1ServiceType() {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const selected = watch('serviceType');
  const t = useTranslations('transport.steps');
  const tCommon = useTranslations('transport');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          {t('serviceType')}
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          اختر نوع البضاعة أو الخدمة التي تريد نقلها
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => setValue('serviceType', opt.type, { shouldValidate: true })}
              className={`p-4 rounded-2xl border-2 text-start transition-all duration-150 ${
                isSelected
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] bg-white'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: opt.bg }}
              >
                <Icon size={20} style={{ color: opt.color }} />
              </div>
              <p
                className={`text-sm font-bold mb-0.5 ${isSelected ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface)]'}`}
                style={{ fontWeight: 700 }}
              >
                {tCommon(`serviceTypes.${opt.type}`)}
              </p>
              <p className="text-[11px] text-[var(--color-on-surface-muted)]">{opt.sublabel}</p>
            </button>
          );
        })}
      </div>

      {errors.serviceType && (
        <p className="mt-3 text-xs text-[var(--color-error)] font-semibold">
          {errors.serviceType.message}
        </p>
      )}
    </div>
  );
}
