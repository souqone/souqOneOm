'use client';

import { X, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BrowseFilters } from './BrowseContent';
import type { TransportServiceType, RequestStatus } from '@/features/transport/types';
import {
  OMAN_GOVERNORATES,
  SERVICE_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  SORT_OPTIONS,
} from '@/features/transport/constants';

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
}

const SERVICE_TYPES: TransportServiceType[] = [
  'GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT',
];
const STATUS_FILTERS: RequestStatus[] = ['OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'];

export default function MobileFilterSheet({
  open,
  onClose,
  filters,
  onChange,
}: MobileFilterSheetProps) {
  const [local, setLocal] = useState<BrowseFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  function handleApply() {
    onChange(local);
  }

  const currentSort =
    local.sortBy && local.sortOrder ? `${local.sortBy}_${local.sortOrder}` : '';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-outline)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-outline-variant)]">
          <h3 className="font-bold text-base text-[var(--color-on-surface)]">تصفية النتائج</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--color-surface-container)] transition-colors"
          >
            <X size={20} className="text-[var(--color-on-surface-variant)]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Service Type */}
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
              نوع الخدمة
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((type) => {
                const isActive = local.serviceType === type;
                return (
                  <button
                    key={`mobile-filter-service-${type}`}
                    onClick={() =>
                      setLocal((p) => ({
                        ...p,
                        serviceType: p.serviceType === type ? undefined : type,
                      }))
                    }
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]'
                        : 'border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-navy)]/40'
                    }`}
                  >
                    {SERVICE_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
              حالة الطلب
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_FILTERS.map((status) => {
                const isActive = local.status === status;
                return (
                  <button
                    key={`mobile-filter-status-${status}`}
                    onClick={() =>
                      setLocal((p) => ({
                        ...p,
                        status: p.status === status ? undefined : status,
                      }))
                    }
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]'
                        : 'border-[var(--color-outline)] text-[var(--color-on-surface-variant)]'
                    }`}
                  >
                    {REQUEST_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* From/To */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
                من محافظة
              </label>
              <select
                value={local.fromGovernorate ?? ''}
                onChange={(e) =>
                  setLocal((p) => ({
                    ...p,
                    fromGovernorate: e.target.value === '' ? undefined : e.target.value,
                  }))
                }
                className="input-base text-sm py-2.5"
              >
                <option value="">الكل</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`mobile-from-${gov}`} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
                إلى محافظة
              </label>
              <select
                value={local.toGovernorate ?? ''}
                onChange={(e) =>
                  setLocal((p) => ({
                    ...p,
                    toGovernorate: e.target.value === '' ? undefined : e.target.value,
                  }))
                }
                className="input-base text-sm py-2.5"
              >
                <option value="">الكل</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`mobile-to-${gov}`} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
              ترتيب حسب
            </label>
            <select
              value={currentSort}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setLocal((p) => {
                    const { sortBy, sortOrder, ...rest } = p;
                    void sortBy;
                    void sortOrder;
                    return rest;
                  });
                } else {
                  const [sb, so] = val.split('_') as [
                    'createdAt' | 'budgetMax' | 'scheduledAt',
                    'asc' | 'desc'
                  ];
                  setLocal((p) => ({ ...p, sortBy: sb, sortOrder: so }));
                }
              }}
              className="input-base text-sm py-2.5"
            >
              <option value="">الافتراضي</option>
              {SORT_OPTIONS.map((opt) => (
                <option key={`mobile-sort-${opt.value}`} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-[var(--color-outline-variant)] flex gap-3">
          <button
            onClick={() => setLocal({})}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-outline)] text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-all duration-150"
          >
            <RotateCcw size={14} />
            مسح الكل
          </button>
          <button
            onClick={handleApply}
            className="flex-2 btn-navy flex-1 justify-center text-sm py-3"
          >
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    </div>
  );
}