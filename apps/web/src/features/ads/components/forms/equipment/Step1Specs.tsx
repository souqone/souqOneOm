'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea } from '@/features/ads/components/forms/shared';
import { labelCls, chipCls } from '@/lib/constants/form-styles';
import { EQUIP_CONDITION_KEYS, type EquipmentFormData } from './types';

interface Step1Props {
  form: EquipmentFormData;
  onChange: (updates: Partial<EquipmentFormData>) => void;
}

export function Step1Specs({ form, onChange }: Step1Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-6">
      <FormSection icon="edit_note" title={tp('eqLabelBasicInfo')}>
        <div className="space-y-4">
          <FormInput label={tp('eqLabelTitle')} name="title" value={form.title} onChange={(v) => onChange({ title: v })} placeholder={tp('eqPlaceholderTitle')} required />
          <FormTextarea label={tp('eqLabelDesc')} name="description" value={form.description} onChange={(v) => onChange({ description: v })} placeholder={tp('eqPlaceholderDesc')} rows={4} />
        </div>
      </FormSection>

      <FormSection icon="settings" title={tp('eqLabelTechSpecs')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={tp('eqLabelBrand')} name="make" value={form.make} onChange={(v) => onChange({ make: v })} placeholder="Caterpillar" />
          <FormInput label={tp('eqLabelModel')} name="model" value={form.model} onChange={(v) => onChange({ model: v })} placeholder="320D" />
          <FormInput label={tp('eqLabelYear')} name="year" type="number" value={form.year} onChange={(v) => onChange({ year: v })} placeholder="2020" />
          <div>
            <label className={labelCls}>{tp('eqLabelCondition')}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EQUIP_CONDITION_KEYS.map((c) => (
                <button key={c.value} type="button" onClick={() => onChange({ condition: c.value })} className={chipCls(form.condition === c.value)}>
                  {tp(c.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <FormInput label={tp('eqLabelCapacity')} name="capacity" value={form.capacity} onChange={(v) => onChange({ capacity: v })} placeholder="20 ton" />
          <FormInput label={tp('eqLabelPower')} name="power" value={form.power} onChange={(v) => onChange({ power: v })} placeholder="150 HP" />
          <FormInput label={tp('eqLabelWeight')} name="weight" value={form.weight} onChange={(v) => onChange({ weight: v })} placeholder="22,000 kg" />
          <FormInput label={tp('eqLabelHours')} name="hoursUsed" type="number" value={form.hoursUsed} onChange={(v) => onChange({ hoursUsed: v })} placeholder="5000" />
        </div>
      </FormSection>
    </div>
  );
}
