'use client';

import { FormSection, FormChipGroup } from '@/features/ads/components/forms/shared';
import { OPERATOR_TYPES, EQUIPMENT_TYPE_OPTIONS, type OperatorFormData } from './types';

interface Step0Props {
  form: OperatorFormData;
  onChange: (updates: Partial<OperatorFormData>) => void;
}

export function Step0OperatorType({ form, onChange }: Step0Props) {
  return (
    <div className="space-y-8">
      <FormSection icon="engineering" title="نوع المشغّل">
        <FormChipGroup
          options={OPERATOR_TYPES}
          value={form.operatorType}
          onChange={(v) => onChange({ operatorType: v as string })}
          variant="card"
          columns={2}
        />
      </FormSection>

      <FormSection icon="handyman" title="أنواع المعدات">
        <p className="text-xs text-[var(--color-on-surface-variant)]/60 mb-3">
          اختر كل أنواع المعدات التي تتقنها — يمكن اختيار أكثر من نوع
        </p>
        <FormChipGroup
          options={EQUIPMENT_TYPE_OPTIONS}
          value={form.equipmentTypes}
          onChange={(v) => onChange({ equipmentTypes: v as string[] })}
          multiSelect
          columns={3}
        />
      </FormSection>
    </div>
  );
}
