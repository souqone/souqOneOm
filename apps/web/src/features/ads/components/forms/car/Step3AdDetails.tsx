'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea, FormToggle, ContactSection } from '@/features/ads/components/forms/shared';
import { LocationSection } from '@/features/ads/components/forms/shared/LocationSection';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import type { ListingFormData } from './types';

interface GovCityOption { value: string; label: string }

interface Step3Props {
  form: ListingFormData;
  onChange: (updates: Partial<ListingFormData>) => void;
  selectedGov: string;
  onGovChange: (value: string) => void;
  governorateOptions: GovCityOption[];
  cityOptions: GovCityOption[];
}

export function Step3AdDetails({
  form,
  onChange,
  selectedGov,
  onGovChange,
  governorateOptions,
  cityOptions,
}: Step3Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      {/* Title + Description */}
      <FormSection icon="edit_note" title={tp('lfAdDetailsTitle')}>
        <div className="space-y-5">
          <FormInput
            label={tp('lfAdTitle')}
            name="title"
            value={form.title}
            onChange={(v) => onChange({ title: v })}
            type="text"
            required
            placeholder={tp('lfAdTitlePlaceholder')}
          />
          <FormTextarea
            label={tp('lfDescription')}
            name="description"
            value={form.description}
            onChange={(v) => onChange({ description: v })}
            placeholder={tp('lfDescriptionPlaceholder')}
            rows={4}
          />
        </div>
      </FormSection>

      {/* Pricing */}
      <FormSection
        icon="payments"
        title={
          form.listingType === 'RENTAL'
            ? tp('lfPricingRental')
            : form.listingType === 'WANTED'
            ? tp('lfPricingWanted')
            : tp('lfPricingSale')
        }
      >
        {form.listingType === 'WANTED' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{tp('lfBudgetLabel')}</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => onChange({ price: e.target.value })} placeholder={tp('lfBudgetPlaceholder')} className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{tp('lfBudgetHint')}</p>
          </div>
        ) : form.listingType === 'SALE' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{tp('lfSalePrice')}</label>
                <input type="number" required step="0.01" value={form.price} onChange={(e) => onChange({ price: e.target.value })} placeholder="0.000" className={inputCls} />
              </div>
            </div>
            <FormToggle name="isPriceNegotiable" label={tp('lfNegotiable')} checked={form.isPriceNegotiable} onChange={(v) => onChange({ isPriceNegotiable: v })} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>{tp('lfDailyPrice')}</label>
                <input type="number" required step="0.001" value={form.dailyPrice} onChange={(e) => onChange({ dailyPrice: e.target.value })} placeholder="15.000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('lfWeeklyPrice')}</label>
                <input type="number" step="0.001" value={form.weeklyPrice} onChange={(e) => onChange({ weeklyPrice: e.target.value })} placeholder="90.000" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('lfMonthlyPrice')}</label>
                <input type="number" step="0.001" value={form.monthlyPrice} onChange={(e) => onChange({ monthlyPrice: e.target.value })} placeholder="300.000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>{tp('lfDepositAmount')}</label>
              <input type="number" step="0.001" value={form.depositAmount} onChange={(e) => onChange({ depositAmount: e.target.value })} placeholder="50.000" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{tp('lfAvailableFrom')}</label>
                <input type="date" value={form.availableFrom} onChange={(e) => onChange({ availableFrom: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('lfAvailableTo')}</label>
                <input type="date" value={form.availableTo} onChange={(e) => onChange({ availableTo: e.target.value })} className={inputCls} />
              </div>
            </div>
          </div>
        )}
      </FormSection>

      {/* Location */}
      <LocationSection
        selectedGov={selectedGov}
        onGovChange={(gov) => {
          onGovChange(gov);
          onChange({ governorate: gov, city: '' });
        }}
        city={form.city}
        onCityChange={(city) => onChange({ city })}
        latitude={form.latitude}
        longitude={form.longitude}
        onLocationChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        governorateOptions={governorateOptions}
        cityOptions={cityOptions}
      />

      {/* Contact */}
      <ContactSection
        phoneLabel={tp('lfContactPhone')}
        whatsappLabel={tp('lfWhatsapp')}
        contactPhone={form.contactPhone}
        whatsapp={form.whatsapp}
        onPhoneChange={(v) => onChange({ contactPhone: v })}
        onWhatsappChange={(v) => onChange({ whatsapp: v })}
      />

    </div>
  );
}
