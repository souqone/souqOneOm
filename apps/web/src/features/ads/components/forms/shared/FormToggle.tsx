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
    <label
      htmlFor={name}
      className={`flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2.5 hover:bg-surface-container-low transition-colors${disabled ? ' opacity-50 pointer-events-none' : ''}${className ? ` ${className}` : ''}`}
    >
      <input
        id={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-[18px] h-[18px] rounded accent-primary cursor-pointer shrink-0"
      />
      <div>
        <span className="text-[13px] font-semibold text-on-surface">{label}</span>
        {description && (
          <p className="text-xs text-on-surface-variant/60 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
