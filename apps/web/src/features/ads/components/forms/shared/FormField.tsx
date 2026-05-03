'use client';

import { labelCls } from '@/lib/constants/form-styles';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>
      {children}
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
