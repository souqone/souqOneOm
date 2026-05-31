'use client';

import { useTranslations } from 'next-intl';
import { FormSection, FormInput, FormTextarea } from '../shared';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { employmentOptionsT } from '@/lib/constants/jobs';
import { SALARY_PERIOD_OPTIONS, type JobFormData } from './types';

interface Props {
  form: JobFormData;
  onChange: (updates: Partial<JobFormData>) => void;
}

export function Step1Details({ form, onChange }: Props) {
  const tp = useTranslations('pages');
  const tj = useTranslations('jobs');
  const empOptions = employmentOptionsT(tj);

  return (
    <div className="space-y-6">
      <FormSection title={tp('jnBasicTitle')} icon="edit_note">
        <div className="space-y-4">
          <div>
            <FormInput
              name="title"
              label={`${tp('jnLabelTitle')} *`}
              value={form.title}
              onChange={(v) => onChange({ title: v })}
              placeholder={tp('jnLabelTitle')} // Fixed translation key from jnTitlePlaceholder
            />
            {form.title.length > 0 && form.title.length < 3 && (
              <p className="text-xs text-error mt-1">العنوان يجب أن يكون 3 أحرف على الأقل</p>
            )}
            {form.title.length === 0 && (
              <p className="text-xs text-error mt-1">مطلوب</p>
            )}
          </div>
          <div>
            <FormTextarea
              name="description"
              label={`${tp('jnLabelDesc')} *`}
              value={form.description}
              onChange={(v) => onChange({ description: v })}
              rows={4}
            />
            {form.description.length > 0 && form.description.length < 10 && (
              <p className="text-xs text-error mt-1">الوصف يجب أن يكون 10 أحرف على الأقل</p>
            )}
            {form.description.length === 0 && (
              <p className="text-xs text-error mt-1">مطلوب</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('jnLabelEmployment')}</label>
              <select value={form.employmentType} onChange={(e) => onChange({ employmentType: e.target.value })} className={inputCls}>
                {empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelNationality')}</label>
              <input type="text" value={form.nationality} onChange={(e) => onChange({ nationality: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title={tp('jnSalaryTitle')} icon="payments">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{tp('jnLabelSalary')}</label>
            <input
              type="number"
              value={form.salary}
              onChange={(e) => onChange({ salary: e.target.value === '' ? '' : Number(e.target.value) })}
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>{tp('jnLabelSalaryPeriod')}</label>
            <select value={form.salaryPeriod} onChange={(e) => onChange({ salaryPeriod: e.target.value })} className={inputCls}>
              {SALARY_PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{tp(o.key)}</option>)}
            </select>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
