'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea, FormToggle } from '@/features/ads/components/forms/shared';
import { chipCls } from '@/lib/constants/form-styles';
import { EQUIP_FEATURE_LABELS, type EquipmentFormData } from './types';

interface Step2Props {
  form: EquipmentFormData;
  onChange: (updates: Partial<EquipmentFormData>) => void;
  isRent: boolean;
}

export function Step2Pricing({ form, onChange, isRent }: Step2Props) {
  const tp = useTranslations('pages');

  function toggleFeature(label: string) {
    onChange({
      features: form.features.includes(label)
        ? form.features.filter((f) => f !== label)
        : [...form.features, label],
    });
  }

  return (
    <div className="space-y-6">
      <FormSection icon="payments" title={tp('eqLabelPrice')}>
        <div className="space-y-4">
          {!isRent ? (
            <FormInput label={tp('eqLabelSalePrice')} name="price" type="number" value={form.price} onChange={(v) => onChange({ price: v })} placeholder="0.000" />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <FormInput label={tp('eqLabelDaily')} name="dailyPrice" type="number" value={form.dailyPrice} onChange={(v) => onChange({ dailyPrice: v })} />
              <FormInput label={tp('eqLabelWeekly')} name="weeklyPrice" type="number" value={form.weeklyPrice} onChange={(v) => onChange({ weeklyPrice: v })} />
              <FormInput label={tp('eqLabelMonthly')} name="monthlyPrice" type="number" value={form.monthlyPrice} onChange={(v) => onChange({ monthlyPrice: v })} />
            </div>
          )}
          <div className="flex flex-wrap gap-5 mt-2">
            <FormToggle name="isPriceNegotiable" label={tp('eqLabelNegotiable')} checked={form.isPriceNegotiable} onChange={(v) => onChange({ isPriceNegotiable: v })} />
            <FormToggle name="withOperator" label={tp('eqLabelWithOperator')} checked={form.withOperator} onChange={(v) => onChange({ withOperator: v })} />
            <FormToggle name="deliveryAvailable" label={tp('eqLabelDelivery')} checked={form.deliveryAvailable} onChange={(v) => onChange({ deliveryAvailable: v })} />
          </div>
        </div>
      </FormSection>

      {isRent && (
        <FormSection icon="car_rental" title={tp('eqStepPrice')}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label={tp('eqLabelMinRental')} name="minRentalDays" type="number" value={form.minRentalDays} onChange={(v) => onChange({ minRentalDays: v })} />
              <FormInput label={tp('eqLabelDeposit')} name="depositAmount" type="number" value={form.depositAmount} onChange={(v) => onChange({ depositAmount: v })} placeholder={tp('eqPlaceholderOptional')} />
              <FormInput label={tp('eqLabelAvailableFrom')} name="availableFrom" type="date" value={form.availableFrom} onChange={(v) => onChange({ availableFrom: v })} />
              <FormInput label={tp('eqLabelAvailableTo')} name="availableTo" type="date" value={form.availableTo} onChange={(v) => onChange({ availableTo: v })} />
              <FormInput label={tp('eqLabelKmLimit')} name="kmLimitPerDay" type="number" value={form.kmLimitPerDay} onChange={(v) => onChange({ kmLimitPerDay: v })} placeholder={tp('eqPlaceholderOptional')} />
            </div>
            <FormToggle name="insuranceIncluded" label={tp('eqLabelInsurance')} checked={form.insuranceIncluded} onChange={(v) => onChange({ insuranceIncluded: v })} />
            <FormTextarea label={tp('eqLabelCancellation')} name="cancellationPolicy" value={form.cancellationPolicy} onChange={(v) => onChange({ cancellationPolicy: v })} placeholder={tp('eqPlaceholderCancellation')} rows={3} />
          </div>
        </FormSection>
      )}

      <FormSection icon="star" title={tp('eqLabelFeatures')}>
        <div className="flex flex-wrap gap-2">
          {EQUIP_FEATURE_LABELS.map((label) => (
            <button key={label} type="button" onClick={() => toggleFeature(label)} className={chipCls(form.features.includes(label))}>
              {label}
            </button>
          ))}
        </div>
      </FormSection>
    </div>
  );
}
