'use client';
import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import {
  OMAN_GOVERNORATES,
  OMAN_WILAYAT_BY_GOVERNORATE,
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SORT_OPTIONS,
  STRINGS,
} from '../constants';
import { cn } from '@/lib/utils';

export interface JobFilters {
  jobType: string
  employmentType: string
  governorate: string
  wilayat: string
  licenseType: string
  sortBy: string
  minSalary: string
  maxSalary: string
}

interface JobFilterSidebarProps {
  filters: JobFilters
  onChange: (key: keyof JobFilters, value: string) => void
  onClear: () => void
  totalCount: number
}

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'HIRING', label: 'طلب سائق' },
  { value: 'OFFERING', label: 'عرض خدمة' },
]

const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const LICENSE_OPTIONS = Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }))

export default function JobFilterSidebar({ filters, onChange, onClear, totalCount }: JobFilterSidebarProps) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'createdAt_desc')

  return (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <h2 className="font-bold text-sm text-on-surface">{STRINGS.FILTER_TITLE}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-bold text-error hover:text-red-700 transition-colors"
          >
            <X size={12} />
            {STRINGS.CLEAR_FILTERS}
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Job Type */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">نوع الإعلان</p>
          <div className="space-y-1">
            {JOB_TYPE_OPTIONS.map(opt => (
              <label
                key={`filter-jobtype-${opt.value || 'all'}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm font-bold',
                  filters.jobType === opt.value
                    ? 'bg-surface-container-low text-primary' :'hover:bg-surface text-on-surface-variant'
                )}
              >
                <input
                  type="radio"
                  name="jobType"
                  value={opt.value}
                  checked={filters.jobType === opt.value}
                  onChange={() => onChange('jobType', opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Employment Type — H-1: radio for single-select semantics */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">نوع التوظيف</p>
          <div className="space-y-1">
            <label
              key="filter-emp-all"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm font-bold',
                filters.employmentType === ''
                  ? 'bg-surface-container-low text-primary' : 'hover:bg-surface text-on-surface-variant'
              )}
            >
              <input
                type="radio"
                name="employmentType"
                value=""
                checked={filters.employmentType === ''}
                onChange={() => onChange('employmentType', '')}
                className="accent-primary"
              />
              الكل
            </label>
            {EMPLOYMENT_OPTIONS.map(opt => (
              <label
                key={`filter-emp-${opt.value}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm',
                  filters.employmentType === opt.value
                    ? 'bg-surface-container-low text-primary font-bold' : 'hover:bg-surface text-on-surface-variant'
                )}
              >
                <input
                  type="radio"
                  name="employmentType"
                  value={opt.value}
                  checked={filters.employmentType === opt.value}
                  onChange={() => onChange('employmentType', opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Governorate + Wilayat */}
        <div className="space-y-2">
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">المحافظة</p>
            <select
              value={filters.governorate}
              onChange={e => { onChange('governorate', e.target.value); onChange('wilayat', ''); }}
              className="input-base text-sm"
            >
              <option value="">كل المحافظات</option>
              {OMAN_GOVERNORATES.map(gov => (
                <option key={`filter-gov-${gov}`} value={gov}>{gov}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">الولاية</p>
            <select
              value={filters.wilayat}
              onChange={e => onChange('wilayat', e.target.value)}
              className="input-base text-sm"
              disabled={!filters.governorate}
            >
              <option value="">كل الولايات</option>
              {(OMAN_WILAYAT_BY_GOVERNORATE[filters.governorate] ?? []).map(w => (
                <option key={`filter-wil-${w}`} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* License Type — radio for single-select */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">نوع الرخصة</p>
          <div className="space-y-1">
            <label
              key="filter-lic-all"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm font-bold',
                filters.licenseType === ''
                  ? 'bg-surface-container-low text-primary' : 'hover:bg-surface text-on-surface-variant'
              )}
            >
              <input
                type="radio"
                name="licenseType"
                value=""
                checked={filters.licenseType === ''}
                onChange={() => onChange('licenseType', '')}
                className="accent-primary"
              />
              الكل
            </label>
            {LICENSE_OPTIONS.map(opt => (
              <label
                key={`filter-lic-${opt.value}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors text-sm',
                  filters.licenseType === opt.value
                    ? 'bg-surface-container-low text-primary font-bold' : 'hover:bg-surface text-on-surface-variant'
                )}
              >
                <input
                  type="radio"
                  name="licenseType"
                  value={opt.value}
                  checked={filters.licenseType === opt.value}
                  onChange={() => onChange('licenseType', opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Salary Range Sliders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{STRINGS.SALARY_RANGE_LABEL}</p>
            {(filters.minSalary || filters.maxSalary) && (
              <span className="text-xs font-bold text-brand-amber">
                {filters.minSalary || '0'} – {filters.maxSalary || '2000+'} ر.ع
              </span>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{STRINGS.SALARY_MIN_LABEL}</span>
                <span className="font-bold text-on-surface">
                  {filters.minSalary ? `${filters.minSalary} ر.ع` : STRINGS.SALARY_ANY}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={Number(filters.minSalary) || 0}
                onChange={e => {
                  const val = Number(e.target.value)
                  const maxVal = Number(filters.maxSalary) || 2000
                  if (val <= maxVal - 50 || !filters.maxSalary)
                    onChange('minSalary', val === 0 ? '' : String(val))
                }}
                className="w-full h-1.5 accent-brand-amber cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{STRINGS.SALARY_MAX_LABEL}</span>
                <span className="font-bold text-on-surface">
                  {filters.maxSalary ? `${filters.maxSalary} ر.ع` : STRINGS.SALARY_UNSET}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={Number(filters.maxSalary) || 2000}
                onChange={e => {
                  const val = Number(e.target.value)
                  const minVal = Number(filters.minSalary) || 0
                  if (val >= minVal + 50 || !filters.minSalary)
                    onChange('maxSalary', val === 2000 ? '' : String(val))
                }}
                className="w-full h-1.5 accent-brand-amber cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sort */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">{STRINGS.SORT_BY_LABEL}</p>
          <select
            value={filters.sortBy}
            onChange={e => onChange('sortBy', e.target.value)}
            className="input-base text-sm"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={`filter-sort-${opt.value}`} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="pt-2 border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant text-center">
            {STRINGS.RESULTS_COUNT(totalCount)}
          </p>
        </div>
      </div>
    </aside>
  )
}
