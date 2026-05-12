'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea, FormToggle } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { CONTRACT_TYPE_KEYS, type BusFormData } from './types';

interface Step2Props {
  form: BusFormData;
  onChange: (updates: Partial<BusFormData>) => void;
  isSale: boolean;
  isRent: boolean;
  isContract: boolean;
  hasContract: boolean;
}

export function Step2Pricing({ form, onChange, isSale, isRent, isContract, hasContract }: Step2Props) {
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

      {isContract && (
        <FormSection icon="request_quote" title={tp('busLabelContractDetails')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label={tp('busLabelPassengers')} name="requestPassengers" type="number" value={form.requestPassengers} onChange={(v) => onChange({ requestPassengers: v })} placeholder="30" />
            <div>
              <label className={labelCls}>{tp('busLabelSchedule')}</label>
              <select className={inputCls} value={form.requestSchedule} onChange={(e) => onChange({ requestSchedule: e.target.value })}>
                <option value="">{tp('lfSelect')}</option>
                <option value="daily">{tp('busScheduleDaily')}</option>
                <option value="weekly">{tp('busScheduleWeekly')}</option>
                <option value="monthly">{tp('busScheduleMonthly')}</option>
                <option value="one_trip">{tp('busScheduleOneTrip')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <FormInput label={tp('busLabelRoute')} name="requestRoute" value={form.requestRoute} onChange={(v) => onChange({ requestRoute: v })} placeholder={tp('busPlaceholderRoute')} />
            </div>
            <FormInput label={tp('busLabelMonthlyBudget')} name="price" type="number" value={form.price} onChange={(v) => onChange({ price: v })} placeholder={tp('busPlaceholderOptional')} />
          </div>
        </FormSection>
      )}

      {isRent && (
        <FormSection icon="car_rental" title={tp('busLabelRentalPrices')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label={tp('busLabelDailyPrice')} name="dailyPrice" type="number" value={form.dailyPrice} onChange={(v) => onChange({ dailyPrice: v })} placeholder="70" />
            <FormInput label={tp('busLabelMonthlyPrice')} name="monthlyPrice" type="number" value={form.monthlyPrice} onChange={(v) => onChange({ monthlyPrice: v })} placeholder="1500" />
            <FormInput label={tp('busLabelMinRental')} name="minRentalDays" type="number" value={form.minRentalDays} onChange={(v) => onChange({ minRentalDays: v })} placeholder="1" />
            <FormInput label={tp('busLabelDeposit')} name="depositAmount" type="number" value={form.depositAmount} onChange={(v) => onChange({ depositAmount: v })} placeholder={tp('busPlaceholderOptional')} />
            <FormInput label={tp('busLabelAvailableFrom')} name="availableFrom" type="date" value={form.availableFrom} onChange={(v) => onChange({ availableFrom: v })} />
            <FormInput label={tp('busLabelAvailableTo')} name="availableTo" type="date" value={form.availableTo} onChange={(v) => onChange({ availableTo: v })} />
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <FormToggle name="withDriver" label={tp('busLabelWithDriver')} checked={form.withDriver} onChange={(v) => onChange({ withDriver: v })} />
            <FormToggle name="deliveryAvailable" label={tp('busLabelDelivery')} checked={form.deliveryAvailable} onChange={(v) => onChange({ deliveryAvailable: v })} />
            <FormToggle name="insuranceIncluded" label={tp('busLabelInsurance')} checked={form.insuranceIncluded} onChange={(v) => onChange({ insuranceIncluded: v })} />
          </div>
          <div className="mt-4">
            <FormTextarea label={tp('busLabelCancellation')} name="cancellationPolicy" value={form.cancellationPolicy} onChange={(v) => onChange({ cancellationPolicy: v })} placeholder={tp('busPlaceholderCancellation')} rows={3} />
          </div>
        </FormSection>
      )}
    </div>
  );
}
