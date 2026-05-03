'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  rows = 4,
  maxLength,
  showCount = false,
  disabled,
  className,
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`${inputCls} resize-none min-h-[${rows * 24 + 24}px]`}
      />

      <div className="flex items-start justify-between mt-1">
        {error ? (
          <p className="text-error text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">error</span>
            {error}
          </p>
        ) : hint ? (
          <p className="text-on-surface-variant/60 text-xs">{hint}</p>
        ) : (
          <span />
        )}
        {showCount && maxLength && (
          <p className="text-on-surface-variant/40 text-xs shrink-0 ms-2">
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
