'use client';

import { labelCls } from '@/lib/constants/form-styles';

export interface ChipOption {
  value: string;
  label: string;
  icon?: string;
  desc?: string;
}

interface FormChipGroupProps {
  label?: string;
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  required?: boolean;
  error?: string;
  columns?: 2 | 3 | 4 | 'auto';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'chip' | 'card';
  className?: string;
}

const gridColsCls: Record<string | number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  auto: 'flex flex-wrap',
};

export function FormChipGroup({
  label,
  options,
  value,
  onChange,
  multiSelect = false,
  required,
  error,
  columns = 'auto',
  size = 'md',
  variant = 'chip',
  className,
}: FormChipGroupProps) {
  const isActive = (v: string) =>
    Array.isArray(value) ? value.includes(v) : value === v;

  function handleClick(v: string) {
    if (multiSelect) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(isActive(v) ? '' : v);
    }
  }

  const sizeCls = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-5 py-2.5 text-sm',
  }[size];

  const chipBaseCls = `rounded-full font-semibold transition-all border cursor-pointer select-none ${sizeCls}`;
  const chipActiveCls =
    'bg-primary text-on-primary border-primary shadow-[0_2px_8px_rgba(0,74,198,0.25)]';
  const chipInactiveCls =
    'bg-surface-container-low dark:bg-surface-container-high/50 border-outline-variant/15 dark:border-outline-variant/25 text-on-surface-variant hover:border-primary/40 hover:bg-primary/5 hover:text-on-surface';

  const cardBaseCls =
    'flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all text-start cursor-pointer select-none';
  const cardActiveCls = 'border-primary bg-primary/5 dark:bg-primary/10';
  const cardInactiveCls =
    'border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container';

  const gridLayout = columns === 'auto' ? 'flex flex-wrap gap-2' : `grid gap-2 ${gridColsCls[columns]}`;

  return (
    <div className={className}>
      {label && (
        <label className={labelCls}>
          {label}
          {required && <span className="text-error me-1">*</span>}
        </label>
      )}

      <div className={variant === 'chip' ? gridLayout : `grid gap-3 ${gridColsCls[columns]}`}>
        {options.map((opt) => {
          const active = isActive(opt.value);
          if (variant === 'card') {
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleClick(opt.value)}
                className={`${cardBaseCls} ${active ? cardActiveCls : cardInactiveCls}`}
              >
                {opt.icon && (
                  <span
                    className={`material-symbols-outlined text-2xl mt-0.5 ${
                      active ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {opt.icon}
                  </span>
                )}
                <p className="font-black text-on-surface text-sm">{opt.label}</p>
                {opt.desc && (
                  <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                )}
              </button>
            );
          }
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              className={`${chipBaseCls} ${active ? chipActiveCls : chipInactiveCls}`}
            >
              {opt.icon && (
                <span className="material-symbols-outlined text-sm me-1 align-middle">
                  {opt.icon}
                </span>
              )}
              {opt.label}
            </button>
          );
        })}
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
