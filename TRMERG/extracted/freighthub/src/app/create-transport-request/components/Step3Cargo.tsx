'use client';

import { useFormContext } from 'react-hook-form';
import { Package, Weight, Users, FileText } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';

export default function Step3Cargo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const requiresHelper = watch('requiresHelper');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2
          className="text-xl text-[var(--color-on-surface)] mb-1"
          style={{ fontWeight: 700 }}
        >
          تفاصيل البضاعة
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          وصف دقيق للبضاعة يساعد المزودين على تقديم عروض مناسبة
        </p>
      </div>

      <div className="space-y-5">
        {/* Cargo Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <Package size={15} className="text-[var(--color-brand-amber)]" />
            وصف البضاعة <span className="text-[var(--color-error)]">*</span>
          </label>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
            اذكر نوع البضاعة وأي تفاصيل مهمة (هشاشة، احتياج تبريد، إلخ)
          </p>
          <textarea
            {...register('cargoDescription')}
            rows={3}
            placeholder="مثال: بضائع تجارية متنوعة — إلكترونيات ومعدات مكتبية. البضاعة غير قابلة للكسر ولا تحتاج تبريداً."
            className={`input-base text-sm resize-none ${errors.cargoDescription ? 'border-[var(--color-error)]' : ''}`}
          />
          {errors.cargoDescription && (
            <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
              {errors.cargoDescription.message}
            </p>
          )}
        </div>

        {/* Weight */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <Weight size={15} className="text-[var(--color-brand-amber)]" />
            الوزن التقريبي (بالطن)
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">(اختياري)</span>
          </label>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
            يساعد تحديد الوزن المزودين على اختيار المركبة المناسبة
          </p>
          <div className="relative">
            <input
              {...register('weightTons')}
              type="number"
              step="0.1"
              min="0.1"
              placeholder="مثال: 5.5"
              className={`input-base text-sm pe-16 ${errors.weightTons ? 'border-[var(--color-error)]' : ''}`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-on-surface-muted)]">
              طن
            </span>
          </div>
          {errors.weightTons && (
            <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
              {String(errors.weightTons.message)}
            </p>
          )}
        </div>

        {/* Requires Helper */}
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-3">
            <Users size={15} className="text-[var(--color-brand-amber)]" />
            هل تحتاج مساعدة في التحميل والتفريغ؟
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, label: 'لا، لدي عمال', sublabel: 'لديّ من يساعد في التحميل' },
              { value: true, label: 'نعم، أحتاج مساعدة', sublabel: 'يشمل السعر عمال التحميل' },
            ].map(({ value, label, sublabel }) => (
              <button
                key={`helper-${String(value)}`}
                type="button"
                onClick={() => setValue('requiresHelper', value, { shouldValidate: true })}
                className={`p-4 rounded-2xl border-2 text-start transition-all duration-150 ${
                  requiresHelper === value
                    ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                    : 'border-[var(--color-outline-variant)] hover:border-[var(--color-outline)] bg-white'
                }`}
              >
                <div
                  className={`text-sm font-bold mb-0.5 ${
                    requiresHelper === value
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
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <FileText size={15} className="text-[var(--color-brand-amber)]" />
            ملاحظات إضافية
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">(اختياري)</span>
          </label>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
            أي تعليمات خاصة للمزود (وقت التحميل، أدوات مطلوبة، إلخ)
          </p>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="مثال: يرجى الحضور قبل الساعة 7 صباحاً. يوجد رافعة في الموقع."
            className="input-base text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}