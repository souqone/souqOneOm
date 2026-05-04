'use client';

import { useFormContext } from 'react-hook-form';
import { Clock, Calendar, DollarSign, Shuffle } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import Icon from '@/components/ui/AppIcon';


export default function Step4Timing() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const timingType = watch('timingType');
  const isFlexible = watch('isFlexible');
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2
          className="text-xl text-[var(--color-on-surface)] mb-1"
          style={{ fontWeight: 700 }}
        >
          الموعد والميزانية
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          حدّد متى تريد النقل وما هو نطاق ميزانيتك
        </p>
      </div>

      <div className="space-y-6">
        {/* Timing Type */}
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-3">
            <Clock size={15} className="text-[var(--color-brand-amber)]" />
            موعد النقل
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              {
                value: 'asap' as const,
                label: 'في أقرب وقت',
                sublabel: 'أريد النقل في أسرع وقت ممكن',
                Icon: Clock,
              },
              {
                value: 'scheduled' as const,
                label: 'موعد محدد',
                sublabel: 'لديّ تاريخ ووقت محدد',
                Icon: Calendar,
              },
            ].map(({ value, label, sublabel, Icon }) => (
              <button
                key={`timing-${value}`}
                type="button"
                onClick={() => setValue('timingType', value)}
                className={`p-4 rounded-2xl border-2 text-start transition-all duration-150 ${
                  timingType === value
                    ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                    : 'border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] bg-white'
                }`}
              >
                <Icon
                  size={18}
                  className={`mb-2 ${
                    timingType === value
                      ? 'text-[var(--color-brand-navy)]'
                      : 'text-[var(--color-on-surface-muted)]'
                  }`}
                />
                <div
                  className={`text-sm font-bold mb-0.5 ${
                    timingType === value
                      ? 'text-[var(--color-brand-navy)]'
                      : 'text-[var(--color-on-surface)]'
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {label}
                </div>
                <div className="text-xs text-[var(--color-on-surface-muted)]">{sublabel}</div>
              </button>
            ))}
          </div>

          {/* Date picker */}
          {timingType === 'scheduled' && (
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                التاريخ والوقت المطلوب
              </label>
              <input
                {...register('scheduledAt')}
                type="datetime-local"
                className="input-base text-sm"
              />

              {/* Flexible toggle */}
              <div className="mt-3 flex items-center justify-between p-3 bg-[var(--color-surface-container)] rounded-xl">
                <div className="flex items-center gap-2">
                  <Shuffle size={15} className="text-[var(--color-on-surface-muted)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">
                      الموعد مرن
                    </p>
                    <p className="text-[11px] text-[var(--color-on-surface-muted)]">
                      يمكن التعديل بالاتفاق مع المزود
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('isFlexible', !isFlexible)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
                    isFlexible ? 'bg-[var(--color-brand-amber)]' : 'bg-[var(--color-outline)]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                      isFlexible ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Budget */}
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <DollarSign size={15} className="text-[var(--color-brand-amber)]" />
            الميزانية المتوقعة (ر.ع.)
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">(اختياري)</span>
          </p>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-3">
            تحديد نطاق الميزانية يساعد على جذب عروض مناسبة. يمكنك تركها فارغة لاستقبال جميع العروض.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                الحد الأدنى
              </label>
              <div className="relative">
                <input
                  {...register('budgetMin')}
                  type="number"
                  min="0"
                  step="5"
                  placeholder="50"
                  className="input-base text-sm pe-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-on-surface-muted)]">
                  ر.ع.
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                الحد الأقصى
              </label>
              <div className="relative">
                <input
                  {...register('budgetMax')}
                  type="number"
                  min="0"
                  step="5"
                  placeholder="500"
                  className="input-base text-sm pe-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-on-surface-muted)]">
                  ر.ع.
                </span>
              </div>
            </div>
          </div>

          {/* Budget preview */}
          {(budgetMin || budgetMax) && (
            <div className="mt-3 bg-[var(--color-brand-amber)]/8 border border-[var(--color-brand-amber)]/20 rounded-xl px-4 py-2.5">
              <p className="text-sm font-bold text-[var(--color-brand-amber)]">
                الميزانية المحددة:{' '}
                {budgetMin && budgetMax
                  ? `${budgetMin} – ${budgetMax} ر.ع.`
                  : budgetMin
                  ? `من ${budgetMin} ر.ع.`
                  : `حتى ${budgetMax} ر.ع.`}
              </p>
            </div>
          )}

          {/* Common budget suggestions */}
          <div className="mt-3">
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              نطاقات شائعة:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '50–150 ر.ع.', min: 50, max: 150 },
                { label: '150–350 ر.ع.', min: 150, max: 350 },
                { label: '350–700 ر.ع.', min: 350, max: 700 },
                { label: '700–1500 ر.ع.', min: 700, max: 1500 },
              ].map(({ label, min, max }) => (
                <button
                  key={`budget-suggestion-${min}-${max}`}
                  type="button"
                  onClick={() => {
                    setValue('budgetMin', min);
                    setValue('budgetMax', max);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-amber)] hover:text-[var(--color-brand-amber)] transition-all duration-150"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}