'use client';

interface FormToggleProps {
  label: string;
  description?: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function FormToggle({
  label,
  description,
  name,
  checked,
  onChange,
  disabled,
  className,
}: FormToggleProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-surface-container-low transition-colors select-none${disabled ? ' opacity-50 pointer-events-none' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-on-surface">{label}</p>
        {description && (
          <p className="text-xs text-on-surface-variant/60 mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={name}
        type="button"
        role="switch"
        aria-checked={checked}
        dir="ltr"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
          checked ? 'bg-primary' : 'bg-outline-variant/40 dark:bg-outline-variant/30'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
