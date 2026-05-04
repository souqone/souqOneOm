'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';

interface FormInputProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string | number;
  className?: string;
}

export function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
  hint,
  suffix,
  prefix,
  disabled,
  min,
  max,
  step,
  className,
}: FormInputProps) {
  const hasPrefix = !!prefix;
  const hasSuffix = !!suffix;

  const sharedBoxCls =
    'shrink-0 flex items-center h-[46px] px-3 border border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none';

  const inputExtraCls = [
    type === 'number' ? '[appearance:textfield]' : '',
    hasPrefix ? 'rounded-s-none' : '',
    hasSuffix ? 'rounded-e-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>

      <div className="flex items-center">
        {hasPrefix && (
          <div className={`${sharedBoxCls} rounded-s-xl border-e-0`}>{prefix}</div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          dir={type === 'tel' || type === 'number' ? 'ltr' : undefined}
          className={`${inputCls}${inputExtraCls ? ` ${inputExtraCls}` : ''}`}
        />
        {hasSuffix && (
          <div className={`${sharedBoxCls} rounded-e-xl border-s-0`}>{suffix}</div>
        )}
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
    </div>
  );
}
