'use client';

import { useTranslations } from 'next-intl';
import { FormSection } from '../shared';
import { inputCls, labelCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { LICENSE_OPTIONS, VEHICLE_TYPE_OPTIONS, LANGUAGE_OPTIONS, type JobFormData } from './types';

interface Props {
  form: JobFormData;
  onChange: (updates: Partial<JobFormData>) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function Step2Requirements({ form, onChange }: Props) {
  const tp = useTranslations('pages');

  return (
    <FormSection title={tp('jnRequirementsTitle')} icon="checklist">
      <div className="space-y-5">
        <div>
          <label className={labelCls}>{tp('jnLabelLicense')}</label>
          <div className="flex flex-wrap gap-2">
            {LICENSE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => onChange({ licenseTypes: toggle(form.licenseTypes, o.value) })}
                className={chipCls(form.licenseTypes.includes(o.value))}>
                {tp(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>{tp('jnLabelExperience')}</label>
            <input type="number" value={form.experienceYears}
              onChange={(e) => onChange({ experienceYears: e.target.value === '' ? '' : Number(e.target.value) })}
              className={inputCls} min={0} max={50} />
          </div>
          <div>
            <label className={labelCls}>{tp('jnLabelMinAge')}</label>
            <input type="number" value={form.minAge}
              onChange={(e) => onChange({ minAge: e.target.value === '' ? '' : Number(e.target.value) })}
              className={inputCls} min={18} />
          </div>
          <div>
            <label className={labelCls}>{tp('jnLabelMaxAge')}</label>
            <input type="number" value={form.maxAge}
              onChange={(e) => onChange({ maxAge: e.target.value === '' ? '' : Number(e.target.value) })}
              className={inputCls} max={70} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{tp('jnLabelLanguages')}</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => onChange({ languages: toggle(form.languages, o.value) })}
                className={chipCls(form.languages.includes(o.value))}>
                {tp(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>{tp('jnLabelVehicleTypes')}</label>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPE_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => onChange({ vehicleTypes: toggle(form.vehicleTypes, o.value) })}
                className={chipCls(form.vehicleTypes.includes(o.value))}>
                {tp(o.key)}
              </button>
            ))}
          </div>
        </div>

        <label className={checkboxLabelCls}>
          <input type="checkbox" checked={form.hasOwnVehicle} onChange={(e) => onChange({ hasOwnVehicle: e.target.checked })} className={checkboxCls} />
          <span className={checkboxTextCls}>{tp('jnHasOwnVehicle')}</span>
        </label>
      </div>
    </FormSection>
  );
}
