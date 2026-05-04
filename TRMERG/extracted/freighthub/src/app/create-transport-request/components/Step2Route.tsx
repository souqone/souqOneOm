'use client';

import { useFormContext } from 'react-hook-form';
import { MapPin, ArrowDown } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';
import { OMAN_GOVERNORATES } from '@/features/transport/constants';

export default function Step2Route() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const fromGov = watch('fromGovernorate');
  const toGov = watch('toGovernorate');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2
          className="text-xl text-[var(--color-on-surface)] mb-1"
          style={{ fontWeight: 700 }}
        >
          مسار الرحلة
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          حدّد نقطة التحميل ونقطة التسليم
        </p>
      </div>

      {/* Route visual */}
      {(fromGov || toGov) && (
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="flex flex-col items-center gap-0">
            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-50" />
            <div className="w-0 border-r-2 border-dashed border-amber-400 h-8 my-1" />
            <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-50" />
          </div>
          <div className="flex flex-col justify-between gap-2 min-w-0 flex-1">
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {fromGov || '—'}
            </span>
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {toGov || '—'}
            </span>
          </div>
          {fromGov && toGov && (
            <span className="text-xs font-bold text-[var(--color-brand-amber)] bg-[var(--color-brand-amber)]/10 px-2.5 py-1 rounded-full">
              مسار محدد ✓
            </span>
          )}
        </div>
      )}

      <div className="space-y-5">
        {/* From Section */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center">
              <MapPin size={13} className="text-green-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">نقطة التحميل</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المحافظة <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('fromGovernorate')}
                className={`input-base text-sm ${errors.fromGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`from-gov-step2-${gov}`} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
              {errors.fromGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
                  {errors.fromGovernorate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المدينة / الحي
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">(اختياري)</span>
              </label>
              <input
                {...register('fromCity')}
                type="text"
                placeholder="مثال: السيب، الخوير"
                className="input-base text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              العنوان التفصيلي <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              أدخل العنوان الكامل لموقع التحميل لمساعدة المزودين في التخطيط
            </p>
            <textarea
              {...register('fromAddress')}
              rows={2}
              placeholder="مثال: المنطقة الصناعية، السيب، بالقرب من دوار الميناء"
              className={`input-base text-sm resize-none ${errors.fromAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.fromAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
                {errors.fromAddress.message}
              </p>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-amber)]/10 flex items-center justify-center">
            <ArrowDown size={18} className="text-[var(--color-brand-amber)]" />
          </div>
        </div>

        {/* To Section */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center">
              <MapPin size={13} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">نقطة التسليم</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المحافظة <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('toGovernorate')}
                className={`input-base text-sm ${errors.toGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`to-gov-step2-${gov}`} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
              {errors.toGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
                  {errors.toGovernorate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                المدينة / الحي
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">(اختياري)</span>
              </label>
              <input
                {...register('toCity')}
                type="text"
                placeholder="مثال: نزوى، صلالة"
                className="input-base text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              العنوان التفصيلي <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              أدخل العنوان الكامل لموقع التسليم
            </p>
            <textarea
              {...register('toAddress')}
              rows={2}
              placeholder="مثال: حي الحمراء، نزوى، بالقرب من مستشفى نزوى"
              className={`input-base text-sm resize-none ${errors.toAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.toAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">
                {errors.toAddress.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}