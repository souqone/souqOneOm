'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea } from '@/features/ads/components/forms/shared';
import { labelCls, chipCls } from '@/lib/constants/form-styles';
import { FUEL_TYPE_KEYS, CONDITION_KEYS, BUS_FEATURE_KEYS, type BusFormData } from './types';

interface Step1Props {
  form: BusFormData;
  onChange: (updates: Partial<BusFormData>) => void;
}

export function Step1BusInfo({ form, onChange }: Step1Props) {
  const tp = useTranslations('pages');

  function toggleFeature(label: string) {
    onChange({
      features: form.features.includes(label)
        ? form.features.filter((f) => f !== label)
        : [...form.features, label],
    });
  }

  return (
    <div className="space-y-8">
      <FormSection icon="edit" title={tp('busLabelBasicInfo')}>
        <div className="space-y-4">
          <FormInput label={tp('busLabelAdTitle')} name="title" value={form.title} onChange={(v) => onChange({ title: v })} placeholder={tp('busPlaceholderBus')} required />
          <FormTextarea label={tp('busLabelDescription')} name="description" value={form.description} onChange={(v) => onChange({ description: v })} placeholder={tp('busPlaceholderDesc')} rows={4} />
        </div>
      </FormSection>

      <FormSection icon="directions_bus" title={tp('busLabelBusData')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label={tp('busLabelBrand')} name="make" value={form.make} onChange={(v) => onChange({ make: v })} placeholder={tp('busPlaceholderBrand')} />
          <FormInput label={tp('busLabelModel')} name="model" value={form.model} onChange={(v) => onChange({ model: v })} placeholder="Rosa, Coaster" />
          <FormInput label={tp('busLabelYear')} name="year" type="number" value={form.year} onChange={(v) => onChange({ year: v })} placeholder="2020" />
          <FormInput label={tp('busLabelCapacity')} name="capacity" type="number" value={form.capacity} onChange={(v) => onChange({ capacity: v })} placeholder="30" />
          <FormInput label={tp('busLabelMileage')} name="mileage" type="number" value={form.mileage} onChange={(v) => onChange({ mileage: v })} placeholder="100000" />
          <FormInput label={tp('busLabelPlate')} name="plateNumber" value={form.plateNumber} onChange={(v) => onChange({ plateNumber: v })} />
        </div>
      </FormSection>

      <FormSection icon="tune" title={tp('busLabelSpecs')}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>{tp('busLabelFuel')}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FUEL_TYPE_KEYS.map((f) => (
                  <button key={f.value} type="button" onClick={() => onChange({ fuelType: f.value })} className={chipCls(form.fuelType === f.value)}>
                    {tp(f.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>{tp('busLabelTransmission')}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: 'AUTOMATIC', labelKey: 'busTransAutomatic' as const },
                  { value: 'MANUAL',    labelKey: 'busTransManual' as const },
                ].map((t) => (
                  <button key={t.value} type="button" onClick={() => onChange({ transmission: t.value })} className={chipCls(form.transmission === t.value)}>
                    {tp(t.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>{tp('busLabelCondition')}</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CONDITION_KEYS.map((c) => (
                <button key={c.value} type="button" onClick={() => onChange({ condition: c.value })} className={chipCls(form.condition === c.value)}>
                  {tp(c.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection icon="star" title={tp('busLabelFeatures')}>
        <div className="flex flex-wrap gap-2.5">
          {BUS_FEATURE_KEYS.map((key) => {
            const label = tp(key);
            return (
              <button key={key} type="button" onClick={() => toggleFeature(label)} className={chipCls(form.features.includes(label))}>
                {label}
              </button>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
