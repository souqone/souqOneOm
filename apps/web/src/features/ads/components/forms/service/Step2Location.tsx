'use client';

import { LocationSection, FormSection, FormInput } from '@/features/ads/components/forms/shared';
import { ContactSection } from '@/features/ads/components/forms/shared/ContactSection';
import type { LocationOption } from '@/lib/location-data';
import type { ServiceFormData } from './types';

interface Step2Props {
  form: ServiceFormData;
  onChange: (updates: Partial<ServiceFormData>) => void;
  governorateOptions: LocationOption[];
  cityOptions: LocationOption[];
}

export function Step2Location({ form, onChange, governorateOptions, cityOptions }: Step2Props) {
  return (
    <div className="space-y-8">
      <LocationSection
        selectedGov={form.governorate}
        onGovChange={(gov) => onChange({ governorate: gov, city: '' })}
        city={form.city}
        onCityChange={(city) => onChange({ city })}
        latitude={form.latitude}
        longitude={form.longitude}
        onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        governorateOptions={governorateOptions}
        cityOptions={cityOptions}
        address={form.address}
        onAddressChange={(v) => onChange({ address: v })}
      />

      <FormSection icon="call" title="بيانات التواصل">
        <div className="space-y-4">
          <ContactSection
            phoneLabel="رقم الهاتف"
            whatsappLabel="واتساب"
            contactPhone={form.contactPhone}
            whatsapp={form.whatsapp}
            onPhoneChange={(v) => onChange({ contactPhone: v })}
            onWhatsappChange={(v) => onChange({ whatsapp: v })}
          />
          <FormInput
            label="الموقع الإلكتروني"
            name="website"
            type="url"
            value={form.website}
            onChange={(v) => onChange({ website: v })}
            placeholder="https://example.com"
            prefix={<span className="material-symbols-outlined text-base text-[var(--color-on-surface-variant)]/40">language</span>}
          />
        </div>
      </FormSection>
    </div>
  );
}
