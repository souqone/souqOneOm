'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import {
  OMAN_GOVERNORATES,
  OMAN_WILAYAT_BY_GOVERNORATE,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  BROWSE_SORT_OPTIONS,
} from '../constants';
import type { BrowseFilters } from './BrowseContent';

interface MobileFilterSheetProps {
  filters: BrowseFilters;
  onApply: (filters: BrowseFilters) => void;
}

export default function MobileFilterSheet({ filters, onApply }: MobileFilterSheetProps) {
  const t = useTranslations('transport');
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<BrowseFilters>(filters);

  function handleApply() {
    onApply(local);
    setOpen(false);
  }

  function handleClear() {
    setLocal({});
    onApply({});
    setOpen(false);
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => { setLocal(filters); setOpen(true); }}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-outline-variant)] text-sm font-bold text-[var(--color-on-surface)] bg-white hover:bg-[var(--color-surface-container)] transition-colors relative"
      >
        <SlidersHorizontal size={16} className="text-[var(--color-brand-navy)]" />
        التصفية
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-brand-amber)] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 lg:hidden ${open ? 'translate-y-0' : 'translate-y-full'}`}
        dir="rtl"
        style={{
          bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(85vh - 58px - env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[var(--color-outline-variant)]" />
        </div>

        <div className="px-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-base font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              {t('filterResults')}
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={20} className="text-[var(--color-on-surface-muted)]" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Service Type */}
            <div>
              <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
                {t('serviceTypeLabel')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setLocal((p) => ({ ...p, serviceType: p.serviceType === type ? undefined : type }))}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border-2 transition-all ${
                      local.serviceType === type
                        ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5 text-[var(--color-brand-navy)] font-bold'
                        : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]'
                    }`}
                  >
                    <span>{SERVICE_TYPE_LABELS[type]}</span>
                    {local.serviceType === type && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
                {t('statusLabel')}
              </p>
              <div className="flex flex-wrap gap-2">
                {(['OPEN', 'QUOTED', 'IN_PROGRESS'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setLocal((p) => ({ ...p, status: p.status === status ? undefined : status }))}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      local.status === status
                        ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5 text-[var(--color-brand-navy)] font-bold'
                        : 'border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]'
                    }`}
                  >
                    {t(`status.${status}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Governorates + City */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">{t('fromGovernorate')}</label>
                  <select
                    className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                    value={local.fromGovernorate ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, fromGovernorate: e.target.value || undefined, fromCity: undefined }))}
                  >
                    <option value="">الكل</option>
                    {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">{t('cityLabel')}</label>
                  <select
                    className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                    value={local.fromCity ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, fromCity: e.target.value || undefined }))}
                    disabled={!local.fromGovernorate}
                  >
                    <option value="">الكل</option>
                    {(OMAN_WILAYAT_BY_GOVERNORATE[local.fromGovernorate ?? ''] ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">{t('toGovernorate')}</label>
                  <select
                    className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                    value={local.toGovernorate ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, toGovernorate: e.target.value || undefined, toCity: undefined }))}
                  >
                    <option value="">الكل</option>
                    {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">{t('cityLabel')}</label>
                  <select
                    className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                    value={local.toCity ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, toCity: e.target.value || undefined }))}
                    disabled={!local.toGovernorate}
                  >
                    <option value="">الكل</option>
                    {(OMAN_WILAYAT_BY_GOVERNORATE[local.toGovernorate ?? ''] ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2">
                {t('sortLabel')}
              </p>
              <select
                value={local.sortBy ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, sortBy: e.target.value || undefined }))}
                className="input-base text-sm"
              >
                <option value="">افتراضي</option>
                {BROWSE_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(`sortOptions.${opt.value}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClear}
              className="flex-1 py-3 rounded-2xl border-2 border-[var(--color-outline-variant)] text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors"
            >
              {t('clearAll')}
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 rounded-2xl btn-navy text-sm justify-center"
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
