'use client';

import { useState } from 'react';
import { FormSection, FormInput, FormTextarea } from '@/features/ads/components/forms/shared';
import { inputCls } from '@/lib/constants/form-styles';
import type { OperatorFormData } from './types';

interface Step1Props {
  form: OperatorFormData;
  onChange: (updates: Partial<OperatorFormData>) => void;
}

export function Step1Experience({ form, onChange }: Step1Props) {
  const [newCert, setNewCert] = useState('');

  function addCertification() {
    const trimmed = newCert.trim();
    if (!trimmed || form.certifications.includes(trimmed)) return;
    onChange({ certifications: [...form.certifications, trimmed] });
    setNewCert('');
  }

  function removeCertification(index: number) {
    onChange({ certifications: form.certifications.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-8">
      <FormSection icon="person" title="البيانات الأساسية">
        <div className="space-y-4">
          <FormInput
            label="عنوان الإعلان"
            name="title"
            value={form.title}
            onChange={(v) => onChange({ title: v })}
            required
            placeholder="مثال: مشغّل رافعة — خبرة 10 سنوات — مسقط"
            hint="اجعل العنوان واضحاً ومميزاً"
          />
          <FormTextarea
            label="الوصف"
            name="description"
            value={form.description}
            onChange={(v) => onChange({ description: v })}
            required
            placeholder="اشرح خبرتك ومهاراتك بالتفصيل..."
            rows={4}
            maxLength={1000}
            showCount
          />
          <FormInput
            label="سنوات الخبرة"
            name="experienceYears"
            type="number"
            value={form.experienceYears}
            onChange={(v) => onChange({ experienceYears: v === '' ? '' : Number(v) })}
            min={0}
            max={50}
            placeholder="مثال: 10"
            hint="عدد سنوات الخبرة الكلية في تشغيل المعدات"
          />
        </div>
      </FormSection>

      <FormSection icon="verified" title="الشهادات والمؤهلات">
        <p className="text-xs text-[var(--color-on-surface-variant)]/60 mb-3">
          أضف رخصك وشهاداتك المهنية — تزيد من مصداقية إعلانك
        </p>
        {form.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {form.certifications.map((c, i) => (
              <span key={i} className="flex items-center gap-1 bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] text-xs font-bold px-3 py-1.5 rounded-full">
                {c}
                <button type="button" onClick={() => removeCertification(i)} className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            value={newCert}
            onChange={(e) => setNewCert(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
            placeholder="رخصة تشغيل درجة أولى، شهادة السلامة..."
          />
          <button
            type="button"
            onClick={addCertification}
            className="shrink-0 px-4 py-2 bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] font-bold rounded-xl text-sm hover:bg-[var(--color-brand-navy)]/20 transition-colors whitespace-nowrap"
          >
            + إضافة
          </button>
        </div>
      </FormSection>

    </div>
  );
}
