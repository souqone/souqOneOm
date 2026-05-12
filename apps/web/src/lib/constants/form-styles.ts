/** Shared class strings for form inputs and labels — unified with transport design system (CSS vars) */

export const inputCls =
  'input-base text-sm placeholder:text-[var(--color-on-surface-muted)]';

export const labelCls =
  'text-[13px] font-bold text-[var(--color-on-surface-variant)] block mb-2.5';

export const sectionCls = '';

export const sectionTitleCls =
  'text-base font-bold text-[var(--color-on-surface)] mb-3 pb-3 border-b border-[var(--color-outline-variant)] flex items-center gap-2';

export const chipCls = (active: boolean) =>
  `px-4 py-2 rounded-full text-[13px] font-semibold transition-all border cursor-pointer select-none ${
    active
      ? 'bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)] shadow-[0_2px_8px_rgba(11,36,71,0.25)]'
      : 'bg-[var(--color-surface-container)] border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-navy)]/40 hover:bg-[var(--color-brand-navy)]/5 hover:text-[var(--color-on-surface)]'
  }`;

export const checkboxLabelCls =
  'flex items-center gap-2.5 cursor-pointer select-none';

export const checkboxCls =
  'w-[18px] h-[18px] rounded accent-[var(--color-brand-navy)] cursor-pointer';

export const checkboxTextCls =
  'text-[13px] font-semibold text-[var(--color-on-surface)]';
