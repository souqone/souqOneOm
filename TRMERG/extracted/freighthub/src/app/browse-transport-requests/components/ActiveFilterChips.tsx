'use client';

import { X } from 'lucide-react';
import type { BrowseFilters } from './BrowseContent';
import {
  SERVICE_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  SORT_OPTIONS,
} from '@/features/transport/constants';

interface ActiveFilterChipsProps {
  filters: BrowseFilters;
  onClearFilter: (key: keyof BrowseFilters) => void;
  onClearAll: () => void;
}

export default function ActiveFilterChips({
  filters,
  onClearFilter,
  onClearAll,
}: ActiveFilterChipsProps) {
  const chips: { key: keyof BrowseFilters; label: string }[] = [];

  if (filters.serviceType) {
    chips.push({ key: 'serviceType', label: SERVICE_TYPE_LABELS[filters.serviceType] });
  }
  if (filters.status) {
    chips.push({ key: 'status', label: REQUEST_STATUS_LABELS[filters.status] });
  }
  if (filters.fromGovernorate) {
    chips.push({ key: 'fromGovernorate', label: `من: ${filters.fromGovernorate}` });
  }
  if (filters.toGovernorate) {
    chips.push({ key: 'toGovernorate', label: `إلى: ${filters.toGovernorate}` });
  }
  if (filters.sortBy && filters.sortOrder) {
    const sortVal = `${filters.sortBy}_${filters.sortOrder}`;
    const sortLabel = SORT_OPTIONS.find((o) => o.value === sortVal)?.label;
    if (sortLabel) {
      chips.push({ key: 'sortBy', label: `ترتيب: ${sortLabel}` });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" dir="rtl">
      <span className="text-xs font-semibold text-[var(--color-on-surface-muted)]">
        الفلاتر النشطة:
      </span>
      {chips.map(({ key, label }) => (
        <span
          key={`chip-${key}`}
          className="inline-flex items-center gap-1.5 bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] border border-[var(--color-brand-navy)]/20 rounded-full px-3 py-1 text-xs font-bold"
        >
          {label}
          <button
            onClick={() => onClearFilter(key)}
            className="hover:bg-[var(--color-brand-navy)]/20 rounded-full p-0.5 transition-colors"
            aria-label={`إزالة فلتر ${label}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-bold text-[var(--color-brand-amber)] hover:text-[var(--color-brand-amber-dark)] transition-colors"
        >
          مسح الكل
        </button>
      )}
    </div>
  );
}