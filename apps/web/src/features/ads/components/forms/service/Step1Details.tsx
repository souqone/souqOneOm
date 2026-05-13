'use client';

import { useState } from 'react';
import { FormSection, FormInput, FormTextarea, FormToggle, FormChipGroup, FormPriceInput } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { WEEKDAYS, HOURS, type ServiceFormData } from './types';

interface Step1Props {
  form: ServiceFormData;
  onChange: (updates: Partial<ServiceFormData>) => void;
}

export function Step1Details({ form, onChange }: Step1Props) {
  const [newSpec, setNewSpec] = useState('');

  function addSpecialization() {
    const trimmed = newSpec.trim();
    if (!trimmed || form.specializations.includes(trimmed)) return;
    onChange({ specializations: [...form.specializations, trimmed] });
    setNewSpec('');
  }

  function removeSpecialization(index: number) {
    onChange({ specializations: form.specializations.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-8">
      <FormSection icon="info" title="البيانات الأساسية">
        <div className="space-y-4">
          <FormInput
            label="اسم الخدمة"
            name="title"
            value={form.title}
            onChange={(v) => onChange({ title: v })}
            required
            placeholder="مثال: ورشة صيانة تويوتا — الخوض"
            hint="اجعل الاسم واضحاً ومميزاً"
          />
          <FormInput
            label="اسم المزوّد / الورشة"
            name="providerName"
            value={form.providerName}
            onChange={(v) => onChange({ providerName: v })}
            required
            placeholder="اسم الشركة أو الشخص"
          />
          <FormTextarea
            label="وصف الخدمة"
            name="description"
            value={form.description}
            onChange={(v) => onChange({ description: v })}
            required
            placeholder="اشرح خدماتك بالتفصيل — ماذا تقدم؟ ما هي مميزاتك؟"
            rows={4}
            maxLength={1000}
            showCount
          />
        </div>
      </FormSection>

      <FormSection icon="star" title="التخصصات">
        <p className="text-xs text-[var(--color-on-surface-variant)]/60 mb-3">
          أضف تخصصاتك لتظهر في نتائج البحث المناسبة
        </p>
        {form.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {form.specializations.map((s, i) => (
              <span key={i} className="flex items-center gap-1 bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] text-xs font-bold px-3 py-1.5 rounded-full">
                {s}
                <button type="button" onClick={() => removeSpecialization(i)} className="hover:opacity-70 transition-opacity">
                  <span className="material-symbols-outlined text-sm leading-none">close</span>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            value={newSpec}
            onChange={(e) => setNewSpec(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialization(); } }}
            placeholder="سيارات يابانية، ناقل حركة أوتوماتيك..."
          />
          <button
            type="button"
            onClick={addSpecialization}
            className="shrink-0 px-4 py-2 bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] font-bold rounded-xl text-sm hover:bg-[var(--color-brand-navy)]/20 transition-colors whitespace-nowrap"
          >
            + إضافة
          </button>
        </div>
      </FormSection>

      <FormSection icon="payments" title="التسعير">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormPriceInput label="السعر من" name="priceFrom" value={form.priceFrom} onChange={(v) => onChange({ priceFrom: v })} hint="أدنى سعر للخدمة" />
          <FormPriceInput label="السعر إلى" name="priceTo" value={form.priceTo} onChange={(v) => onChange({ priceTo: v })} hint="أعلى سعر للخدمة" />
        </div>
        <p className="text-xs text-[var(--color-on-surface-variant)]/50 mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">info</span>
          اتركهما فارغين إذا كان السعر يُحدد حسب الطلب
        </p>
        <div className="mt-3">
          <FormToggle
            name="isHomeService"
            label="خدمة منزلية متاحة"
            description="يمكنك التنقل إلى موقع العميل"
            checked={form.isHomeService}
            onChange={(v) => onChange({ isHomeService: v })}
          />
        </div>
      </FormSection>

      <FormSection icon="schedule" title="أوقات العمل">
        <div className="space-y-4">
          <FormChipGroup
            label="أيام الدوام"
            options={WEEKDAYS}
            value={form.workingDays}
            onChange={(v) => onChange({ workingDays: v as string[] })}
            multiSelect
            columns={4}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>يفتح الساعة</label>
              <select className={inputCls} value={form.workingHoursOpen} onChange={(e) => onChange({ workingHoursOpen: e.target.value })}>
                <option value="">-- اختر --</option>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>يغلق الساعة</label>
              <select className={inputCls} value={form.workingHoursClose} onChange={(e) => onChange({ workingHoursClose: e.target.value })}>
                <option value="">-- اختر --</option>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
