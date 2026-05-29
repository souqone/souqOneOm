'use client';

import { useFormContext } from 'react-hook-form';
import { Clock, Calendar, DollarSign, Shuffle } from 'lucide-react';
import type { CreateRequestFormData } from './CreateRequestWizard';

import { useTranslations } from 'next-intl';

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

  const t = useTranslations('transport.steps');
  const tCommon = useTranslations('transport');

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          {t('timing')}
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {t('timingDesc')}
        </p>
      </div>

      <div className="space-y-6">
        {/* Timing Type */}
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-on-surface)] mb-3">
            <Clock size={15} className="text-[var(--color-brand-amber)]" />
            {t('timeLabel')}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { value: 'asap' as const, label: t('asapLabel'), sublabel: t('asapDesc'), Icon: Clock },
              { value: 'scheduled' as const, label: t('scheduledLabel'), sublabel: t('scheduledDesc'), Icon: Calendar },
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
                  className={`mb-2 ${timingType === value ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface-muted)]'}`}
                />
                <div
                  className={`text-sm font-bold mb-0.5 ${timingType === value ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface)]'}`}
                  style={{ fontWeight: 700 }}
                >
                  {label}
                </div>
                <div className="text-xs text-[var(--color-on-surface-muted)]">{sublabel}</div>
              </button>
            ))}
          </div>

          {timingType === 'scheduled' && (
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                {t('requiredDate')}
              </label>
              <input
                {...register('scheduledAt', {
                  validate: (v) => {
                    if (timingType !== 'scheduled') return true;
                    if (!v || v.length === 0) return t('pleaseSelectDate');
                    if (new Date(v) <= new Date()) return t('dateMustBeFuture');
                    return true;
                  },
                })}
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                type="datetime-local"
                className={`input-base text-sm ${
                  errors.scheduledAt ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]' : ''
                }`}
              />
              {errors.scheduledAt && (
                <p className="text-xs text-[var(--color-error)] mt-1">
                  {errors.scheduledAt.message as string}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between p-3 bg-[var(--color-surface-container)] rounded-xl">
                <div className="flex items-center gap-2">
                  <Shuffle size={15} className="text-[var(--color-on-surface-muted)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">{t('flexibleDate')}</p>
                    <p className="text-[11px] text-[var(--color-on-surface-muted)]">
                      {t('flexibleDateDesc')}
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
            {t('budgetLabel')}
            <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">({tCommon('fields.optional')})</span>
          </p>
          <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-3">
            {t('budgetDesc')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">{t('min')}</label>
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
                  {tCommon('currency')}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">{t('max')}</label>
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
                  {tCommon('currency')}
                </span>
              </div>
            </div>
          </div>

          {budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax) && (
            <p className="text-xs text-[var(--color-error)] mt-2 font-semibold">
              الحد الأدنى يجب أن يكون أقل من الحد الأعلى
            </p>
          )}

          {(budgetMin || budgetMax) && (
            <div className="mt-3 bg-[var(--color-brand-amber)]/8 border border-[var(--color-brand-amber)]/20 rounded-xl px-4 py-2.5">
              <p className="text-sm font-bold text-[var(--color-brand-amber)]">
                {t('budgetPrefix')}{' '}
                {budgetMin && budgetMax
                  ? `${budgetMin} – ${budgetMax} ${tCommon('currency')}`
                  : budgetMin
                  ? `${t('from')} ${budgetMin} ${tCommon('currency')}`
                  : `${t('to')} ${budgetMax} ${tCommon('currency')}`}
              </p>
            </div>
          )}

          {/* Common budget suggestions */}
          <div className="mt-3">
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">{t('commonRanges')}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: `50–150 ${tCommon('currency')}`, min: 50, max: 150 },
                { label: `150–350 ${tCommon('currency')}`, min: 150, max: 350 },
                { label: `350–700 ${tCommon('currency')}`, min: 350, max: 700 },
                { label: `700–1500 ${tCommon('currency')}`, min: 700, max: 1500 },
              ].map(({ label, min, max }) => (
                <button
                  key={`budget-${min}-${max}`}
                  type="button"
                  onClick={() => { setValue('budgetMin', min); setValue('budgetMax', max); }}
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
