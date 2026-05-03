'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { FormToggle } from './FormToggle';

interface FormPriceInputProps {
  label: string;
  name: string;
  value: number | '';
  onChange: (value: number | '') => void;
  required?: boolean;
  error?: string;
  hint?: string;
  showNegotiable?: boolean;
  isNegotiable?: boolean;
  onNegotiableChange?: (v: boolean) => void;
  className?: string;
}

export function FormPriceInput({
  label,
  name,
  value,
  onChange,
  required,
  error,
  hint,
  showNegotiable = false,
  isNegotiable = false,
  onNegotiableChange,
  className,
}: FormPriceInputProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>

      <div className="flex items-center gap-0">
        <input
          id={name}
          name={name}
          type="number"
          min={0}
          step="0.001"
          value={value}
          onChange={(e) =>
            onChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          placeholder="0.000"
          required={required}
          dir="ltr"
          className={`${inputCls} [appearance:textfield] rounded-e-none`}
        />
        <span className="shrink-0 flex items-center h-[46px] px-3 rounded-e-xl border border-s-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">
          ر.ع
        </span>
      </div>

      {error && (
        <p className="text-error text-xs mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-on-surface-variant/60 text-xs mt-1">{hint}</p>
      )}

      {showNegotiable && onNegotiableChange && (
        <div className="mt-2">
          <FormToggle
            name={`${name}_negotiable`}
            label="السعر قابل للتفاوض"
            checked={isNegotiable}
            onChange={onNegotiableChange}
          />
        </div>
      )}
    </div>
  );
}
