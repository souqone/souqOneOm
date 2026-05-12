'use client';

import { useTranslations } from 'next-intl';
import { FormSection } from '../shared';
import type { JobFormData } from './types';

interface Props {
  form: JobFormData;
  onChange: (updates: Partial<JobFormData>) => void;
}

const JOB_TYPE_OPTIONS = [
  { value: 'HIRING' as const,   icon: 'person_add',    titleKey: 'jnTypeHiring',   descKey: 'jnTypeHiringDesc' },
  { value: 'OFFERING' as const, icon: 'person_search', titleKey: 'jnTypeOffering', descKey: 'jnTypeOfferingDesc' },
];

export function Step0JobType({ form, onChange }: Props) {
  const tp = useTranslations('pages');
  return (
    <FormSection title={tp('jnTypeLabel')} icon="work">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {JOB_TYPE_OPTIONS.map((opt) => {
          const selected = form.jobType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ jobType: opt.value })}
              className={`relative p-5 rounded-2xl border-2 text-start transition-all duration-200 ${
                selected
                  ? 'border-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/5'
                  : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] hover:border-[var(--color-brand-navy)]/40'
              }`}
            >
              {selected && (
                <span className="absolute top-3 end-3 material-symbols-outlined text-base text-[var(--color-brand-navy)]">
                  check_circle
                </span>
              )}
              <span className="material-symbols-outlined text-3xl text-[var(--color-brand-navy)] mb-3 block">
                {opt.icon}
              </span>
              <p className={`font-bold text-sm mb-0.5 ${selected ? 'text-[var(--color-brand-navy)]' : 'text-[var(--color-on-surface)]'}`}>
                {tp(opt.titleKey)}
              </p>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{tp(opt.descKey)}</p>
            </button>
          );
        })}
      </div>
    </FormSection>
  );
}
