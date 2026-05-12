'use client';

import { sectionTitleCls } from '@/lib/constants/form-styles';

interface FormSectionProps {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ icon, title, subtitle, children, className }: FormSectionProps) {
  return (
    <section className={className ?? ''}>
      <h2 className={sectionTitleCls}>
        <span className="material-symbols-outlined text-[var(--color-brand-amber)] text-[18px]">{icon}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-3 ms-7 -mt-1">{subtitle}</p>
      )}
      {children}
    </section>
  );
}
