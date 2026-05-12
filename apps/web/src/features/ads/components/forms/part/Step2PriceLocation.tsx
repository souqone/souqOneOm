'use client';

import { useTranslations } from 'next-intl';
import { LocationSection, FormSection, FormInput, FormToggle } from '@/features/ads/components/forms/shared';
import { ContactSection } from '@/features/ads/components/forms/shared/ContactSection';
import type { LocationOption } from '@/lib/location-data';
import type { PartFormData } from './types';

interface Step2Props {
  form: PartFormData;
  onChange: (updates: Partial<PartFormData>) => void;
  selectedGov: string;
  onGovChange: (v: string) => void;
  governorateOptions: LocationOption[];
  cityOptions: LocationOption[];
}

export function Step2PriceLocation({ form, onChange, selectedGov, onGovChange, governorateOptions, cityOptions }: Step2Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      <FormSection icon="sell" title={tp('partLabelPrice')}>
        <div className="space-y-4">
          <FormInput label={tp('partLabelPriceOMR')} name="price" type="number" value={form.price} onChange={(v) => onChange({ price: v })} placeholder="0.000" required />
          <FormToggle name="isPriceNegotiable" label={tp('partLabelNegotiable')} checked={form.isPriceNegotiable} onChange={(v) => onChange({ isPriceNegotiable: v })} />
        </div>
      </FormSection>

      <LocationSection
        selectedGov={selectedGov}
        onGovChange={(gov) => { onGovChange(gov); onChange({ governorate: gov, city: '' }); }}
        city={form.city}
        onCityChange={(city) => onChange({ city })}
        latitude={form.latitude}
        longitude={form.longitude}
        onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        governorateOptions={governorateOptions}
        cityOptions={cityOptions}
      />

      <FormSection icon="call" title={tp('partLabelLocationContact')}>
        <ContactSection
          phoneLabel={tp('partLabelPhone')}
          whatsappLabel={tp('partLabelWhatsapp')}
          contactPhone={form.contactPhone}
          whatsapp={form.whatsapp}
          onPhoneChange={(v) => onChange({ contactPhone: v })}
          onWhatsappChange={(v) => onChange({ whatsapp: v })}
        />
      </FormSection>
    </div>
  );
}
