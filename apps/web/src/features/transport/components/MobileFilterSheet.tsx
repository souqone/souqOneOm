'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import {
  OMAN_GOVERNORATES,
  OMAN_WILAYAT_BY_GOVERNORATE,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  REQUEST_STATUS_LABELS,
  BROWSE_SORT_OPTIONS,
} from '../constants';
import type { BrowseFilters } from './BrowseContent';

interface MobileFilterSheetProps {
  filters: BrowseFilters;
  onApply: (filters: BrowseFilters) => void;
}

export default function MobileFilterSheet({ filters, onApply }: MobileFilterSheetProps) {
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
              تصفية النتائج
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={20} className="text-[var(--color-on-surface-muted)]" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Service Type */}
            <div>
              <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
                نوع الخدمة
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
                الحالة
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
                    {REQUEST_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Governorates + Wilayat */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2">من محافظة</p>
                  <select
                    value={local.fromGovernorate ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, fromGovernorate: e.target.value || undefined, fromWilayat: undefined }))}
                    className="input-base text-sm"
                  >
                    <option value="">الكل</option>
                    {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2">من ولاية</p>
                  <select
                    value={local.fromWilayat ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, fromWilayat: e.target.value || undefined }))}
                    className="input-base text-sm"
                    disabled={!local.fromGovernorate}
                  >
                    <option value="">الكل</option>
                    {(OMAN_WILAYAT_BY_GOVERNORATE[local.fromGovernorate ?? ''] ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2">إلى محافظة</p>
                  <select
                    value={local.toGovernorate ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, toGovernorate: e.target.value || undefined, toWilayat: undefined }))}
                    className="input-base text-sm"
                  >
                    <option value="">الكل</option>
                    {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2">إلى ولاية</p>
                  <select
                    value={local.toWilayat ?? ''}
                    onChange={(e) => setLocal((p) => ({ ...p, toWilayat: e.target.value || undefined }))}
                    className="input-base text-sm"
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
                الترتيب
              </p>
              <select
                value={local.sortBy ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, sortBy: e.target.value || undefined }))}
                className="input-base text-sm"
              >
                <option value="">افتراضي</option>
                {BROWSE_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              مسح الكل
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-3 rounded-2xl btn-navy text-sm justify-center"
            >
              تطبيق الفلاتر
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
