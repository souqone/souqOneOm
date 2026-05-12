'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { FormSection } from './FormSection';
import { FormInput } from './FormInput';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

interface GovCityOption {
  value: string;
  label: string;
}

interface LocationSectionProps {
  selectedGov: string;
  onGovChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  governorateOptions: GovCityOption[];
  cityOptions: GovCityOption[];
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (lat: number | null, lng: number | null) => void;
  showMap?: boolean;
  address?: string;
  onAddressChange?: (v: string) => void;
}

export function LocationSection({
  selectedGov,
  onGovChange,
  city,
  onCityChange,
  governorateOptions,
  cityOptions,
  latitude,
  longitude,
  onLocationChange,
  showMap = true,
  address,
  onAddressChange,
}: LocationSectionProps) {
  const tp = useTranslations('pages');

  return (
    <FormSection icon="location_on" title={tp('lfLocationTitle')}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{tp('lfGovernorate')}</label>
            <select
              value={selectedGov}
              onChange={(e) => onGovChange(e.target.value)}
              className={inputCls}
            >
              <option value="">{tp('lfSelectGovernorate')}</option>
              {governorateOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{tp('lfCity')}</label>
            <select
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className={inputCls}
              disabled={!selectedGov}
            >
              <option value="">{selectedGov ? tp('lfSelectCity') : tp('lfSelectGovernorateFirst')}</option>
              {cityOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {address !== undefined && onAddressChange && (
          <FormInput
            label="العنوان التفصيلي"
            name="address"
            value={address}
            onChange={onAddressChange}
            placeholder="مثال: طريق الخوض، بجوار مسجد..."
            hint="يساعد العملاء على إيجادك بسهولة"
          />
        )}

        {showMap && onLocationChange && (
          <div>
            <label className={labelCls}>{tp('lfMapLabel')}</label>
            <div className="mt-1 rounded-xl overflow-hidden border border-[var(--color-outline-variant)]">
              <LocationPicker
                latitude={latitude ?? null}
                longitude={longitude ?? null}
                onChange={(lat, lng) => onLocationChange(lat, lng)}
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );
}
