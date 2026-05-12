'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea, FormToggle } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls, checkboxCls } from '@/lib/constants/form-styles';
import { YEAR_OPTIONS, type PartFormData } from './types';

interface Brand { id: string; name: string; nameAr?: string | null }

interface Step1Props {
  form: PartFormData;
  onChange: (updates: Partial<PartFormData>) => void;
  brands: Brand[];
}

export function Step1Details({ form, onChange, brands }: Step1Props) {
  const tp = useTranslations('pages');
  const [brandsOpen, setBrandsOpen] = useState(false);
  const brandsRef = useRef<HTMLDivElement>(null);

  function handleClickOutside(e: MouseEvent) {
    if (brandsRef.current && !brandsRef.current.contains(e.target as Node)) setBrandsOpen(false);
  }

  function toggleBrand(name: string) {
    onChange({
      compatibleMakes: form.compatibleMakes.includes(name)
        ? form.compatibleMakes.filter((b) => b !== name)
        : [...form.compatibleMakes, name],
    });
  }

  return (
    <div className="space-y-8">
      <FormSection icon="info" title={tp('partLabelDetailsSection')}>
        <div className="space-y-4">
          <FormInput label={tp('partLabelOEM')} name="partNumber" value={form.partNumber} onChange={(v) => onChange({ partNumber: v })} placeholder={tp('partPlaceholderOptional')} />

          <div
            ref={brandsRef}
            className="relative"
            onMouseDown={() => document.addEventListener('mousedown', handleClickOutside, { once: true })}
          >
            <label className={labelCls}>{tp('partLabelBrands')}</label>
            <button
              type="button"
              onClick={() => setBrandsOpen(!brandsOpen)}
              className={inputCls + ' flex items-center justify-between text-start w-full mt-1.5'}
            >
              <span className={form.compatibleMakes.length ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]/50'}>
                {form.compatibleMakes.length
                  ? form.compatibleMakes.map((m) => {
                      const b = brands.find((br) => br.name === m);
                      return b?.nameAr || b?.name || m;
                    }).join(', ')
                  : tp('partSelect')}
              </span>
              <span className="material-symbols-outlined text-sm text-[var(--color-on-surface-variant)]">expand_more</span>
            </button>
            {brandsOpen && (
              <div className="absolute z-50 top-full mt-1 inset-x-0 max-h-52 overflow-y-auto rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] shadow-lg py-1">
                {brands.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface-container)] transition-colors cursor-pointer text-sm">
                    <input type="checkbox" checked={form.compatibleMakes.includes(b.name)} onChange={() => toggleBrand(b.name)} className={checkboxCls} />
                    <span className="text-[var(--color-on-surface)]">{b.nameAr || b.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('partLabelYearFrom')}</label>
              <select value={form.yearFrom} onChange={(e) => onChange({ yearFrom: e.target.value })} className={inputCls}>
                <option value="">{tp('partSelect')}</option>
                {YEAR_OPTIONS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('partLabelYearTo')}</label>
              <select value={form.yearTo} onChange={(e) => onChange({ yearTo: e.target.value })} className={inputCls}>
                <option value="">{tp('partSelect')}</option>
                {YEAR_OPTIONS.filter((y) => !form.yearFrom || y >= parseInt(form.yearFrom)).map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          <FormToggle name="isOriginal" label={tp('partLabelOriginal')} checked={form.isOriginal} onChange={(v) => onChange({ isOriginal: v })} />
          <FormTextarea label={tp('partLabelDesc')} name="description" value={form.description} onChange={(v) => onChange({ description: v })} placeholder={tp('partPlaceholderDesc')} rows={4} />
        </div>
      </FormSection>
    </div>
  );
}
