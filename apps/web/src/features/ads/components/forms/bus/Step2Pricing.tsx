'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormToggle } from '@/features/ads/components/forms/shared';
import { chipCls, labelCls } from '@/lib/constants/form-styles';
import { CONTRACT_TYPE_KEYS, type BusFormData } from './types';

interface Step2Props {
  form: BusFormData;
  onChange: (updates: Partial<BusFormData>) => void;
  isSale: boolean;
  isRent: boolean;
  hasContract: boolean;
}

export function Step2Pricing({ form, onChange, isSale, isRent, hasContract }: Step2Props) {
  const tp = useTranslations('pages');

  return (
    <div className="space-y-8">
      {isSale && (
        <FormSection icon="payments" title={tp('busLabelPrice')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label={tp('busLabelSalePrice')} name="price" type="number" value={form.price} onChange={(v) => onChange({ price: v })} placeholder="8000" />
            <div className="flex items-end pb-1">
              <FormToggle name="isPriceNegotiable" label={tp('busLabelNegotiable')} checked={form.isPriceNegotiable} onChange={(v) => onChange({ isPriceNegotiable: v })} />
            </div>
          </div>
        </FormSection>
      )}

      {hasContract && (
        <FormSection icon="assignment" title={tp('busLabelContractAttached')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>{tp('busLabelContractType')}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CONTRACT_TYPE_KEYS.map((c) => (
                  <button key={c.value} type="button" onClick={() => onChange({ contractType: c.value })} className={chipCls(form.contractType === c.value)}>
                    {tp(c.labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <FormInput label={tp('busLabelClientName')} name="contractClient" value={form.contractClient} onChange={(v) => onChange({ contractClient: v })} placeholder={tp('busPlaceholderClient')} />
            <FormInput label={tp('busLabelMonthlySalary')} name="contractMonthly" type="number" value={form.contractMonthly} onChange={(v) => onChange({ contractMonthly: v })} placeholder="400" />
            <FormInput label={tp('busLabelContractDuration')} name="contractDuration" type="number" value={form.contractDuration} onChange={(v) => onChange({ contractDuration: v })} placeholder="12" />
            <FormInput label={tp('busLabelContractExpiry')} name="contractExpiry" type="date" value={form.contractExpiry} onChange={(v) => onChange({ contractExpiry: v })} />
          </div>
        </FormSection>
      )}

      {isRent && (
        <FormSection icon="car_rental" title={tp('busLabelRentalPrices')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label={tp('busLabelDailyPrice')} name="dailyPrice" type="number" value={form.dailyPrice} onChange={(v) => onChange({ dailyPrice: v })} placeholder="70" />
            <FormInput label={tp('busLabelMonthlyPrice')} name="monthlyPrice" type="number" value={form.monthlyPrice} onChange={(v) => onChange({ monthlyPrice: v })} placeholder="1500" />
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <FormToggle name="withDriver" label={tp('busLabelWithDriver')} checked={form.withDriver} onChange={(v) => onChange({ withDriver: v })} />
          </div>
        </FormSection>
      )}
    </div>
  );
}
