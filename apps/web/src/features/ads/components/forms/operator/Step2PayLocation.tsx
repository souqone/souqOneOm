'use client';

import { LocationSection, FormSection, FormToggle, FormPriceInput } from '@/features/ads/components/forms/shared';
import { ContactSection } from '@/features/ads/components/forms/shared/ContactSection';
import type { LocationOption } from '@/lib/location-data';
import type { OperatorFormData } from './types';

interface Step2Props {
  form: OperatorFormData;
  onChange: (updates: Partial<OperatorFormData>) => void;
  governorateOptions: LocationOption[];
  cityOptions: LocationOption[];
}

export function Step2PayLocation({ form, onChange, governorateOptions, cityOptions }: Step2Props) {
  return (
    <div className="space-y-8">
      <FormSection icon="payments" title="الأجر">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormPriceInput
            label="الأجر اليومي"
            name="dailyRate"
            value={form.dailyRate}
            onChange={(v) => onChange({ dailyRate: v })}
            hint="السعر باليوم بالريال العماني"
          />
          <FormPriceInput
            label="الأجر بالساعة"
            name="hourlyRate"
            value={form.hourlyRate}
            onChange={(v) => onChange({ hourlyRate: v })}
            hint="السعر بالساعة بالريال العماني"
          />
        </div>
        <p className="text-xs text-[var(--color-on-surface-variant)]/50 mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          اتركهما فارغين إذا كان الأجر يُحدد حسب الاتفاق
        </p>
        <div className="mt-3">
          <FormToggle
            name="isPriceNegotiable"
            label="الأجر قابل للتفاوض"
            description="سيظهر وسم 'قابل للتفاوض' على إعلانك"
            checked={form.isPriceNegotiable}
            onChange={(v) => onChange({ isPriceNegotiable: v })}
          />
        </div>
      </FormSection>

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
      />

      <FormSection icon="call" title="بيانات التواصل">
        <ContactSection
          phoneLabel="رقم الهاتف"
          whatsappLabel="واتساب"
          contactPhone={form.contactPhone}
          whatsapp={form.whatsapp}
          onPhoneChange={(v) => onChange({ contactPhone: v })}
          onWhatsappChange={(v) => onChange({ whatsapp: v })}
        />
      </FormSection>
    </div>
  );
}
