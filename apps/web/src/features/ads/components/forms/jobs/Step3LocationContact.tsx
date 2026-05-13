'use client';

import { useTranslations } from 'next-intl';
import { LocationSection, FormSection } from '../shared';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import type { LocationOption } from '@/lib/location-data';
import type { JobFormData } from './types';

interface Props {
  form: JobFormData;
  onChange: (updates: Partial<JobFormData>) => void;
  governorateOptions: LocationOption[];
  cityOptions: LocationOption[];
}

export function Step3LocationContact({ form, onChange, governorateOptions, cityOptions }: Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-6">
      <LocationSection
        selectedGov={form.governorate}
        onGovChange={(gov) => onChange({ governorate: gov, city: '' })}
        city={form.city}
        onCityChange={(city) => onChange({ city })}
        showMap={false}
        governorateOptions={governorateOptions}
        cityOptions={cityOptions}
      />

      <FormSection title={tp('jnContactTitle')} icon="contact_phone">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{tp('jnLabelPhone')}</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => onChange({ contactPhone: e.target.value })} className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className={labelCls}>{tp('jnLabelWhatsapp')}</label>
            <input type="tel" value={form.whatsapp} onChange={(e) => onChange({ whatsapp: e.target.value })} className={inputCls} dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{tp('jnLabelEmail')}</label>
            <input type="email" value={form.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} className={inputCls} dir="ltr" />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
