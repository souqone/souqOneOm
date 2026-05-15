'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormSection } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { condOptions, type ListingFormData } from './types';

interface Brand    { id: string; name: string; nameAr?: string | null }
interface CarModel { id: string; name: string; nameAr?: string | null }
interface CarTrim  {
  id: string; name: string; nameAr: string | null;
  yearFrom: number; yearTo: number;
  engineCapacity: string | null; cylinders: number | null;
  horsepower: number | null; torque: string | null;
  driveType: string | null; transmission: string | null;
  fuelType: string | null; seats: number | null;
  isFullOption: boolean;
}

interface Step1Props {
  form: ListingFormData;
  onChange: (updates: Partial<ListingFormData>) => void;
  images: UploadedImage[];
  onImagesChange: (imgs: UploadedImage[]) => void;
  brands: Brand[];
  models: CarModel[];
  trims: CarTrim[];
  selectedBrandId: string;
  onBrandChange: (id: string, name: string) => void;
  selectedModelId: string;
  onModelChange: (id: string, name: string) => void;
  selectedTrimId: string;
  onTrimChange: (id: string, trim: CarTrim) => void;
  isLoading: boolean;
  condLabels: Record<string, string>;
}

export function Step1BasicInfo({
  form,
  onChange,
  images,
  onImagesChange,
  brands,
  models,
  trims,
  selectedBrandId,
  onBrandChange,
  selectedModelId,
  onModelChange,
  selectedTrimId,
  onTrimChange,
  isLoading,
  condLabels,
}: Step1Props) {
  const tp = useTranslations('pages');

  // Build year options from selected trim's range, or from all trims for the model
  const yearOptions = useMemo(() => {
    if (trims.length === 0) return [];
    const selectedTrim = trims.find((t) => t.id === selectedTrimId);
    const from = selectedTrim
      ? selectedTrim.yearFrom
      : Math.min(...trims.map((t) => t.yearFrom));
    const to = selectedTrim
      ? selectedTrim.yearTo
      : Math.max(...trims.map((t) => t.yearTo));
    const years: number[] = [];
    for (let y = to; y >= from; y--) years.push(y);
    return years;
  }, [trims, selectedTrimId]);

  return (
    <div className="space-y-8">
      {/* Listing Type Toggle */}
      <FormSection icon="sell" title={tp('lfSectionLabel')}>
        <div className="flex items-center gap-3 bg-[var(--color-surface-container)] rounded-xl px-4 py-3">
          <span className="text-[var(--color-brand-navy)] text-lg">🚗</span>
          <span className="text-sm text-[var(--color-on-surface-variant)]">{tp('lfCategoryName')}</span>
          <span className="text-[var(--color-on-surface-variant)]/40 mx-1">›</span>
          <span className="text-sm font-bold text-[var(--color-on-surface)]">
            {form.listingType === 'RENTAL' ? tp('lfCatRental') : form.listingType === 'WANTED' ? tp('lfCatWanted') : tp('lfCatSale')}
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          {[
            { value: 'SALE'   as const, label: tp('lfTypeSale'),   icon: 'sell'       },
            { value: 'RENTAL' as const, label: tp('lfTypeRental'), icon: 'car_rental' },
            { value: 'WANTED' as const, label: tp('lfTypeWanted'), icon: 'search'     },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ listingType: opt.value })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                form.listingType === opt.value
                  ? opt.value === 'WANTED'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-[var(--color-brand-navy)] text-white shadow-lg'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </FormSection>

      {/* Images */}
      <FormSection icon="add_photo_alternate" title={tp('lfUploadTitle')}>
        <ImageUploader images={images} onChange={onImagesChange} disabled={isLoading} />
        <p className="text-xs text-[var(--color-on-surface-variant)] mt-3">{tp('lfUploadHint')}</p>
      </FormSection>

      {/* Basic Info — Brand → Model → Trim → Year */}
      <FormSection icon="directions_car" title={tp('lfBasicInfoTitle')}>
        <div className="space-y-5">

          {/* Row 1: Brand + Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('lfBrand')}</label>
              <select
                required
                value={selectedBrandId}
                onChange={(e) => {
                  const brand = brands.find((b) => b.id === e.target.value);
                  onBrandChange(e.target.value, brand?.name ?? '');
                }}
                className={inputCls}
              >
                <option value="">{tp('lfSelectBrand')}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('lfModel')}</label>
              <select
                required
                value={selectedModelId}
                onChange={(e) => {
                  const model = models.find((m) => m.id === e.target.value);
                  onModelChange(e.target.value, model?.name ?? '');
                }}
                className={inputCls}
                disabled={!selectedBrandId}
              >
                <option value="">{selectedBrandId ? tp('lfSelectModel') : tp('lfSelectBrandFirst')}</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.nameAr || m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Trim + Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>الفئة / Trim</label>
              <select
                value={selectedTrimId}
                onChange={(e) => {
                  const trim = trims.find((t) => t.id === e.target.value);
                  if (trim) onTrimChange(e.target.value, trim);
                  else onTrimChange('', { id: '', name: '', nameAr: null, yearFrom: 1990, yearTo: 2026, engineCapacity: null, cylinders: null, horsepower: null, torque: null, driveType: null, transmission: null, fuelType: null, seats: null, isFullOption: false });
                }}
                className={inputCls}
                disabled={!selectedModelId}
              >
                <option value="">{selectedModelId ? 'اختر الفئة' : 'اختر الموديل أولاً'}</option>
                {trims.map((t) => (
                  <option key={t.id} value={t.id}>{t.nameAr || t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('lfYear')}</label>
              <select
                required
                value={form.year || ''}
                onChange={(e) => onChange({ year: parseInt(e.target.value) })}
                className={inputCls}
                disabled={yearOptions.length === 0}
              >
                <option value="">{yearOptions.length > 0 ? tp('lfSelectYear') : 'اختر الموديل أولاً'}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Condition + Mileage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('lfCondition')}</label>
              <div className="flex gap-3">
                {condOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ condition: c })}
                    className={chipCls(form.condition === c) + ' flex-1'}
                  >
                    {condLabels[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>{tp('lfMileage')}</label>
              <input
                type="number"
                value={form.mileage}
                onChange={(e) => onChange({ mileage: e.target.value })}
                placeholder={tp('lfMileagePlaceholder')}
                className={inputCls}
              />
            </div>
          </div>

        </div>
      </FormSection>
    </div>
  );
}
