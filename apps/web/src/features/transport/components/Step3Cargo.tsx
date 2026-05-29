'use client';

import { useFormContext } from 'react-hook-form';
import { Package, Weight, Users, FileText } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';

import { useTranslations } from 'next-intl';

export default function Step3Cargo() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CreateRequestFormData>();

  const requiresHelper = watch('requiresHelper');

  const t = useTranslations('transport.steps');
  const tCommon = useTranslations('transport');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          {t('cargo')}
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {t('cargoDesc')}
        </p>
      </div>

      <div className="space-y-5">
        {/* Cargo Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <Package size={15} className="text-[var(--color-brand-amber)]" />
            {tCommon('fields.cargo')} <span className="text-[var(--color-error)]">*</span>
          </label>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
            {t('cargoInputDesc')}
          </p>
          <textarea
            {...register('cargoDescription')}
            rows={3}
            placeholder={t('cargoExample')}
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
            {t('weightLabel')}
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">({tCommon('fields.optional')})</span>
          </label>
          <div className="relative">
            <input
              {...register('weightTons', {
                // S-4: guard against unrealistic weights
                validate: (v) => {
                  if (!v) return true;
                  const n = Number(v);
                  if (n > 9999) return t('weightTooHigh');
                  return true;
                },
              })}
              type="number"
              step="0.1"
              min="0.1"
              max="9999"
              placeholder={t('weightPlaceholder')}
              className={`input-base text-sm pe-16 ${errors.weightTons ? 'border-[var(--color-error)]' : ''}`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-on-surface-muted)]">
              {tCommon('fields.tons')}
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
            {t('helpersDesc')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, label: t('noHelpers') },
              { value: true, label: t('yesHelpers') },
            ].map(({ value, label }) => (
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
                  className={`text-sm font-bold mb-0.5 ${requiresHelper === value ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface)]'}`}
                  style={{ fontWeight: 700 }}
                >
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-1.5">
            <FileText size={15} className="text-[var(--color-brand-amber)]" />
            {tCommon('fields.notes')}
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">({tCommon('fields.optional')})</span>
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder={t('notesDesc')}
            className="input-base text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
