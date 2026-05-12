'use client';

import { useTranslations } from 'next-intl';
import { FormSection } from '@/features/ads/components/forms/shared';
import { chipCls } from '@/lib/constants/form-styles';
import { BUS_LISTING_TYPE_KEYS, BUS_TYPE_KEYS, type BusFormData } from './types';

interface Step0Props {
  form: BusFormData;
  onChange: (updates: Partial<BusFormData>) => void;
}

export function Step0AdType({ form, onChange }: Step0Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      <FormSection icon="category" title={tp('busLabelAdType')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUS_LISTING_TYPE_KEYS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ busListingType: t.value })}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-start ${
                form.busListingType === t.value
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-outline-variant)]/60'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl mt-0.5 ${form.busListingType === t.value ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                {t.icon}
              </span>
              <div>
                <p className="font-black text-[var(--color-on-surface)] text-sm">{tp(t.labelKey)}</p>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{tp(t.descKey)}</p>
              </div>
            </button>
          ))}
        </div>
      </FormSection>

      {form.busListingType && (
        <FormSection icon="directions_bus" title={tp('busLabelBusType')}>
          <div className="flex flex-wrap gap-2">
            {BUS_TYPE_KEYS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => onChange({ busType: b.value })}
                className={chipCls(form.busType === b.value)}
              >
                {tp(b.labelKey)} <span className="text-[10px] opacity-60">({tp(b.descKey)})</span>
              </button>
            ))}
          </div>
        </FormSection>
      )}
    </div>
  );
}
