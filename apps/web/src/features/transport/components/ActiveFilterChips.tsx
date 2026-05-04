'use client';

import { X } from 'lucide-react';
import { SERVICE_TYPE_LABELS, REQUEST_STATUS_LABELS, BROWSE_SORT_OPTIONS } from '../constants';
import type { TransportServiceType, TransportRequestStatus } from '../types';
import type { BrowseFilters } from './BrowseContent';

interface ActiveFilterChipsProps {
  filters: BrowseFilters;
  onChange: (filters: BrowseFilters) => void;
}

export default function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const chips: { label: string; key: keyof BrowseFilters }[] = [];

  if (filters.serviceType) {
    chips.push({
      label: SERVICE_TYPE_LABELS[filters.serviceType as TransportServiceType] ?? filters.serviceType,
      key: 'serviceType',
    });
  }
  if (filters.status) {
    chips.push({
      label: REQUEST_STATUS_LABELS[filters.status as TransportRequestStatus] ?? filters.status,
      key: 'status',
    });
  }
  if (filters.fromGovernorate) {
    chips.push({ label: `من: ${filters.fromGovernorate}`, key: 'fromGovernorate' });
  }
  if (filters.toGovernorate) {
    chips.push({ label: `إلى: ${filters.toGovernorate}`, key: 'toGovernorate' });
  }
  if (filters.sortBy) {
    const sortLabel = BROWSE_SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label;
    if (sortLabel) chips.push({ label: sortLabel, key: 'sortBy' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" dir="rtl">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--color-brand-navy)]/8 text-[var(--color-brand-navy)] border border-[var(--color-brand-navy)]/15"
        >
          {chip.label}
          <button
            onClick={() => onChange({ ...filters, [chip.key]: undefined })}
            className="hover:text-[var(--color-error)] transition-colors"
            aria-label="إزالة الفلتر"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange({})}
        className="text-xs text-[var(--color-on-surface-muted)] hover:text-[var(--color-error)] transition-colors font-semibold"
      >
        مسح الكل
      </button>
    </div>
  );
}
