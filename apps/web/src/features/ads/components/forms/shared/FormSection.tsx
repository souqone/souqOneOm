'use client';

import { sectionCls, sectionTitleCls } from '@/lib/constants/form-styles';

interface FormSectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ icon, title, children, className }: FormSectionProps) {
  return (
    <section className={`${sectionCls}${className ? ` ${className}` : ''}`}>
      <h2 className={sectionTitleCls}>
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
