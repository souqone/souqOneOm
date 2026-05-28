'use client';

import { X, SlidersHorizontal } from 'lucide-react';
import {
  OMAN_GOVERNORATES,
  OMAN_WILAYAT_BY_GOVERNORATE,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  REQUEST_STATUS_LABELS,
  BROWSE_SORT_OPTIONS,
} from '../constants';
import type { BrowseFilters } from './BrowseContent';

interface FilterSidebarProps {
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
}

export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const hasActiveFilters =
    !!filters.serviceType ||
    !!filters.status ||
    !!filters.fromGovernorate ||
    !!filters.toGovernorate ||
    !!filters.sortBy;

  function clearAll() {
    onChange({});
  }

  return (
    <aside className="w-64 flex-shrink-0" dir="rtl">
      <div className="card-base p-4 sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[var(--color-brand-navy)]" />
            <span className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
              التصفية
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-[var(--color-brand-amber)] font-bold hover:text-[var(--color-brand-amber-dark)] transition-colors flex items-center gap-1"
            >
              <X size={12} />
              مسح الكل
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Service Type */}
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2.5">
              نوع الخدمة
            </p>
            <div className="space-y-1.5">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => onChange({ ...filters, serviceType: filters.serviceType === type ? undefined : type })}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                    filters.serviceType === type
                      ? 'bg-[var(--color-brand-navy)] text-white font-bold'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                  }`}
                >
                  {SERVICE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2.5">
              الحالة
            </p>
            <div className="space-y-1.5">
              {(['OPEN', 'QUOTED', 'IN_PROGRESS'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => onChange({ ...filters, status: filters.status === status ? undefined : status })}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                    filters.status === status
                      ? 'bg-[var(--color-brand-navy)] text-white font-bold'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                  }`}
                >
                  {REQUEST_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* From Governorate + City */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">من محافظة</label>
                <select
                  className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                  value={filters.fromGovernorate ?? ''}
                  onChange={(e) => onChange({ ...filters, fromGovernorate: e.target.value || undefined, fromCity: undefined })}
                >
                  <option value="">الكل</option>
                  {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">المدينة</label>
                <select
                  className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                  value={filters.fromCity ?? ''}
                  onChange={(e) => onChange({ ...filters, fromCity: e.target.value || undefined })}
                  disabled={!filters.fromGovernorate}
                >
                  <option value="">الكل</option>
                  {(OMAN_WILAYAT_BY_GOVERNORATE[filters.fromGovernorate ?? ''] ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* To Governorate + City */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">إلى محافظة</label>
                <select
                  className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                  value={filters.toGovernorate ?? ''}
                  onChange={(e) => onChange({ ...filters, toGovernorate: e.target.value || undefined, toCity: undefined })}
                >
                  <option value="">الكل</option>
                  {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1">المدينة</label>
                <select
                  className="input-base text-sm py-2 px-3 bg-[var(--color-surface-container)] border-none"
                  value={filters.toCity ?? ''}
                  onChange={(e) => onChange({ ...filters, toCity: e.target.value || undefined })}
                  disabled={!filters.toGovernorate}
                >
                  <option value="">الكل</option>
                  {(OMAN_WILAYAT_BY_GOVERNORATE[filters.toGovernorate ?? ''] ?? []).map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2.5">
              الترتيب
            </p>
            <select
              value={filters.sortBy ?? ''}
              onChange={(e) => onChange({ ...filters, sortBy: e.target.value || undefined })}
              className="input-base text-sm"
            >
              <option value="">افتراضي</option>
              {BROWSE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
