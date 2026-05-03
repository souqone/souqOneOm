'use client';

import React, { useState, InputHTMLAttributes } from 'react';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  icon?: string;
  error?: string;
  /** Renders show/hide toggle when type="password" */
  isPassword?: boolean;
  hint?: string;
  iconClassName?:string;
  onHintClick?: () => void;
}

export function InputField({
  label,
  icon,
  error,
  isPassword,
  hint,
  onHintClick,
  iconClassName,
  ...rest
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : rest.type || 'text';

  const padEnd = icon ? 42 : 12;
  const padStart = isPassword ? 42 : 12;

  // Browsers force LTR on type=email/url/tel — override with dir="auto" so RTL placeholders render correctly

  return (
    <div className="flex flex-col gap-1">
      {(label || hint) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className="text-[11px] font-semibold text-on-surface-variant/80">
              {label}
            </label>
          )}
          {hint && (
            onHintClick ? (
              <button type="button" onClick={onHintClick} className="text-[10.5px] text-primary hover:text-primary/70 transition-colors font-medium">
                {hint}
              </button>
            ) : (
              <span className="text-[10px] text-on-surface-variant/50 font-medium">{hint}</span>
            )
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          {...rest}
          type={inputType}
          className="auth-input"
          style={{ paddingInlineEnd: padEnd, paddingInlineStart: padStart }}
        />

        {icon && (
          <span
            className={`material-symbols-outlined pointer-events-none text-on-surface-variant/40 ${iconClassName}`}
            style={{
              position: 'absolute',
              insetInlineEnd: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
            }}
          >
            {icon}
          </span>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="material-symbols-outlined text-on-surface-variant/50 hover:text-primary transition-colors cursor-pointer"
            style={{
              position: 'absolute',
              insetInlineStart: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            {showPassword ? 'visibility_off' : 'visibility'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
