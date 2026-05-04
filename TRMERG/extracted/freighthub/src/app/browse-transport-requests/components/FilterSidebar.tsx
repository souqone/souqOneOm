'use client';

import { RotateCcw } from 'lucide-react';
import type { BrowseFilters } from './BrowseContent';
import type { TransportServiceType, RequestStatus } from '@/features/transport/types';
import {
  OMAN_GOVERNORATES,
  SERVICE_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  SORT_OPTIONS,
} from '@/features/transport/constants';

interface FilterSidebarProps {
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
}

const SERVICE_TYPES: TransportServiceType[] = [
  'GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT',
];

const STATUS_FILTERS: RequestStatus[] = ['OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'];

export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const hasFilters = Object.keys(filters).some(
    (k) => filters[k as keyof BrowseFilters] !== undefined
  );

  function handleServiceType(type: TransportServiceType) {
    onChange({
      ...filters,
      serviceType: filters.serviceType === type ? undefined : type,
    });
  }

  function handleStatus(status: RequestStatus) {
    onChange({
      ...filters,
      status: filters.status === status ? undefined : status,
    });
  }

  function handleGovernorate(field: 'fromGovernorate' | 'toGovernorate', value: string) {
    onChange({ ...filters, [field]: value === '' ? undefined : value });
  }

  function handleSort(value: string) {
    if (value === '') {
      const { sortBy, sortOrder, ...rest } = filters;
      void sortBy;
      void sortOrder;
      onChange(rest);
      return;
    }
    const [sortBy, sortOrder] = value.split('_') as [
      'createdAt' | 'budgetMax' | 'scheduledAt',
      'asc' | 'desc'
    ];
    onChange({ ...filters, sortBy, sortOrder });
  }

  const currentSort =
    filters.sortBy && filters.sortOrder
      ? `${filters.sortBy}_${filters.sortOrder}`
      : '';

  return (
    <div className="card-base p-4 sticky top-20 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[var(--color-on-surface)]">تصفية النتائج</h3>
        {hasFilters && (
          <button
            onClick={() => onChange({})}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-amber)] hover:text-[var(--color-brand-amber-dark)] transition-colors"
          >
            <RotateCcw size={12} />
            مسح الكل
          </button>
        )}
      </div>

      {/* Service Type */}
      <div>
        <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
          نوع الخدمة
        </p>
        <div className="space-y-1.5">
          {SERVICE_TYPES.map((type) => {
            const isActive = filters.serviceType === type;
            return (
              <button
                key={`filter-service-${type}`}
                onClick={() => handleServiceType(type)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 text-start ${
                  isActive
                    ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)]'
                      : 'border-[var(--color-outline)]'
                  }`}
                >
                  {isActive && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {SERVICE_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-outline-variant)]" />

      {/* Status */}
      <div>
        <p className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-3">
          حالة الطلب
        </p>
        <div className="space-y-1.5">
          {STATUS_FILTERS.map((status) => {
            const isActive = filters.status === status;
            return (
              <button
                key={`filter-status-${status}`}
                onClick={() => handleStatus(status)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 text-start ${
                  isActive
                    ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)]'
                      : 'border-[var(--color-outline)]'
                  }`}
                >
                  {isActive && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {REQUEST_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--color-outline-variant)]" />

      {/* From Governorate */}
      <div>
        <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
          من محافظة
        </label>
        <select
          value={filters.fromGovernorate ?? ''}
          onChange={(e) => handleGovernorate('fromGovernorate', e.target.value)}
          className="input-base text-sm py-2.5"
        >
          <option value="">جميع المحافظات</option>
          {OMAN_GOVERNORATES.map((gov) => (
            <option key={`from-gov-${gov}`} value={gov}>
              {gov}
            </option>
          ))}
        </select>
      </div>

      {/* To Governorate */}
      <div>
        <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
          إلى محافظة
        </label>
        <select
          value={filters.toGovernorate ?? ''}
          onChange={(e) => handleGovernorate('toGovernorate', e.target.value)}
          className="input-base text-sm py-2.5"
        >
          <option value="">جميع المحافظات</option>
          {OMAN_GOVERNORATES.map((gov) => (
            <option key={`to-gov-${gov}`} value={gov}>
              {gov}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-[var(--color-outline-variant)]" />

      {/* Sort */}
      <div>
        <label className="text-xs font-bold text-[var(--color-on-surface-muted)] uppercase tracking-wider mb-2 block">
          ترتيب حسب
        </label>
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="input-base text-sm py-2.5"
        >
          <option value="">الافتراضي</option>
          {SORT_OPTIONS.map((opt) => (
            <option key={`sort-${opt.value}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}