'use client';

import { useTranslations } from 'next-intl';
import { FormSection } from '@/features/ads/components/forms/shared';
import { EQUIP_TYPE_KEYS, type EquipmentFormData } from './types';

interface Step0Props {
  form: EquipmentFormData;
  onChange: (updates: Partial<EquipmentFormData>) => void;
}

export function Step0AdType({ form, onChange }: Step0Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      <FormSection icon="category" title={tp('eqLabelAdType')}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'EQUIPMENT_SALE', lKey: 'eqTypeSale' as const,  i: 'sell',       dKey: 'eqTypeSaleDesc' as const },
            { v: 'EQUIPMENT_RENT', lKey: 'eqTypeRent' as const,  i: 'car_rental', dKey: 'eqTypeRentDesc' as const },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => onChange({ listingType: opt.v })}
              className={`p-4 rounded-2xl border-2 text-start transition-all ${
                form.listingType === opt.v
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-brand-navy)]/30'
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-[var(--color-brand-navy)] mb-2 block">{opt.i}</span>
              <p className="font-bold text-sm">{tp(opt.lKey)}</p>
              <p className="text-[11px] text-[var(--color-on-surface)] mt-0.5">{tp(opt.dKey)}</p>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection icon="construction" title={tp('eqLabelEquipType')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {EQUIP_TYPE_KEYS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ equipmentType: t.value })}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                form.equipmentType === t.value
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] hover:border-[var(--color-brand-navy)]/30'
              }`}
            >
              <span className="material-symbols-outlined text-xl text-[var(--color-brand-navy)]">{t.icon}</span>
              <span className="text-[10px] font-bold">{tp(t.labelKey)}</span>
            </button>
          ))}
        </div>
      </FormSection>
    </div>
  );
}
