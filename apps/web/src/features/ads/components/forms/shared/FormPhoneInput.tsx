'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';

interface FormPhoneInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormPhoneInput({
  label,
  name,
  value,
  onChange,
  required,
  error,
  className,
}: FormPhoneInputProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>

      <div className="flex items-center gap-0">
        <span className="shrink-0 flex items-center gap-1 px-3 h-[46px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">
          🇴🇲 +968
        </span>
        <input
          id={name}
          name={name}
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="9XXXXXXX"
          required={required}
          dir="ltr"
          className={`${inputCls} rounded-s-none`}
        />
      </div>

      {error && (
        <p className="text-error text-xs mt-1.5 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
