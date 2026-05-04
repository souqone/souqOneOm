'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
  hint,
  disabled,
  className,
}: FormSelectProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        dir="rtl"
        className={inputCls}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {!required && !placeholder && <option value="">---</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.icon ? `${opt.icon} ` : ''}
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-error text-xs mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-on-surface-variant/60 text-xs mt-1">{hint}</p>
      )}
    </div>
  );
}
