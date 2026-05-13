'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormToggle } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls, chipCls, sectionCls, sectionTitleCls } from '@/lib/constants/form-styles';
import { fuelOptions, transOptions, CAR_FEATURE_KEYS, type ListingFormData } from './types';
import { BODY_OPTIONS, DRIVE_OPTIONS, CANCEL_OPTIONS } from '@/lib/constants/mappings';

interface ColorOption { value: string; label: string; hex?: string }

interface Step2Props {
  form: ListingFormData;
  onChange: (updates: Partial<ListingFormData>) => void;
  fuelLabels: Record<string, string>;
  transLabels: Record<string, string>;
  cancelLabels: Record<string, string>;
  extColors: ColorOption[];
  intColors: ColorOption[];
}

export function Step2CarDetails({
  form,
  onChange,
  fuelLabels,
  transLabels,
  cancelLabels,
  extColors,
  intColors,
}: Step2Props) {
  const tp = useTranslations('pages');

  function toggleFeature(label: string) {
    const current = form.features;
    onChange({
      features: current.includes(label)
        ? current.filter((f) => f !== label)
        : [...current, label],
    });
  }

  return (
    <div className="space-y-8">
      {/* Car Specs */}
      <FormSection icon="tune" title={tp('lfCarDetailsTitle')}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('lfFuelType')}</label>
              <select value={form.fuelType} onChange={(e) => onChange({ fuelType: e.target.value })} className={inputCls}>
                <option value="">{tp('lfSelect')}</option>
                {fuelOptions.map((f) => <option key={f} value={f}>{fuelLabels[f]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('lfTransmission')}</label>
              <select value={form.transmission} onChange={(e) => onChange({ transmission: e.target.value })} className={inputCls}>
                <option value="">{tp('lfSelect')}</option>
                {transOptions.map((t) => <option key={t} value={t}>{transLabels[t]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>{tp('lfBodyType')}</label>
              <select value={form.bodyType} onChange={(e) => onChange({ bodyType: e.target.value })} className={inputCls}>
                <option value="">{tp('lfSelect')}</option>
                {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('lfDriveType')}</label>
              <select value={form.driveType} onChange={(e) => onChange({ driveType: e.target.value })} className={inputCls}>
                <option value="">{tp('lfSelect')}</option>
                {DRIVE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('lfExteriorColor')}</label>
              <div className="relative">
                <select value={form.exteriorColor} onChange={(e) => onChange({ exteriorColor: e.target.value })} className={inputCls} style={{ paddingInlineEnd: '2.5rem' }}>
                  <option value="">{tp('lfSelectColor')}</option>
                  {extColors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {form.exteriorColor && (
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-[var(--color-outline-variant)] shadow-sm"
                    style={{ backgroundColor: extColors.find((c) => c.value === form.exteriorColor)?.hex || '#ccc' }} />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>{tp('lfInteriorColor')}</label>
              <div className="relative">
                <select value={form.interiorColor} onChange={(e) => onChange({ interiorColor: e.target.value })} className={inputCls} style={{ paddingInlineEnd: '2.5rem' }}>
                  <option value="">{tp('lfSelectColor')}</option>
                  {intColors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {form.interiorColor && (
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-[var(--color-outline-variant)] shadow-sm"
                    style={{ backgroundColor: intColors.find((c) => c.value === form.interiorColor)?.hex || '#ccc' }} />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>{tp('lfEngineSize')}</label>
              <input type="text" value={form.engineSize} onChange={(e) => onChange({ engineSize: e.target.value })} placeholder="2.5L" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{tp('lfHorsepower')}</label>
              <input type="number" value={form.horsepower} onChange={(e) => onChange({ horsepower: e.target.value })} placeholder="200" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{tp('lfDoors')}</label>
              <input type="number" value={form.doors} onChange={(e) => onChange({ doors: e.target.value })} placeholder="4" className={inputCls} />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Features */}
      <section className={sectionCls}>
        <h2 className={sectionTitleCls}>
          <span className="material-symbols-outlined text-[var(--color-brand-amber)] text-[18px]">star</span>
          {tp('lfFeaturesTitle')}
          <span className="text-xs font-normal text-[var(--color-on-surface-variant)] ms-1">
            ({tp('lfFeaturesCount', { count: form.features.length })})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {CAR_FEATURE_KEYS.map((key) => {
            const label = tp(key);
            const selected = form.features.includes(label);
            return (
              <button key={key} type="button" onClick={() => toggleFeature(label)} className={chipCls(selected)}>
                {selected && <span className="ms-1">✓</span>} {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Rental-specific */}
      {form.listingType === 'RENTAL' && (
        <FormSection icon="car_rental" title={tp('lfRentalDetailsTitle')}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>{tp('lfMinRentalDays')}</label>
                <input type="number" min="1" value={form.minRentalDays} onChange={(e) => onChange({ minRentalDays: e.target.value })} placeholder="1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('lfKmLimitPerDay')}</label>
                <input type="number" value={form.kmLimitPerDay} onChange={(e) => onChange({ kmLimitPerDay: e.target.value })} placeholder="250" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('lfCancelPolicy')}</label>
                <select value={form.cancellationPolicy} onChange={(e) => onChange({ cancellationPolicy: e.target.value })} className={inputCls}>
                  <option value="">{tp('lfSelect')}</option>
                  {CANCEL_OPTIONS.map((c) => <option key={c} value={c}>{cancelLabels[c]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormToggle name="withDriver" label={tp('lfWithDriver')} checked={form.withDriver} onChange={(v) => onChange({ withDriver: v })} />
              <FormToggle name="deliveryAvailable" label={tp('lfDeliveryAvailable')} checked={form.deliveryAvailable} onChange={(v) => onChange({ deliveryAvailable: v })} />
              <FormToggle name="insuranceIncluded" label={tp('lfInsuranceIncluded')} checked={form.insuranceIncluded} onChange={(v) => onChange({ insuranceIncluded: v })} />
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
}
