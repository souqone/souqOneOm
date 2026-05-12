'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreateOperatorListing, useUpdateOperatorListing, useOperatorListing } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0OperatorType } from './Step0OperatorType';
import { Step1Experience } from './Step1Experience';
import { Step2PayLocation } from './Step2PayLocation';
import { DEFAULT_OPERATOR_FORM, type OperatorFormData } from './types';

export interface OperatorFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function OperatorFormShell({ mode, id }: OperatorFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createOp = useCreateOperatorListing();
  const updateOp = useUpdateOperatorListing();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<OperatorFormData>(DEFAULT_OPERATOR_FORM);

  const { data: opData, isLoading: isFetching, isError } = useOperatorListing(id ?? '');

  function onChange(updates: Partial<OperatorFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !opData) return;
    setForm({
      ...DEFAULT_OPERATOR_FORM,
      operatorType:    opData.operatorType ?? '',
      title:           opData.title ?? '',
      description:     opData.description ?? '',
      specializations: opData.specializations ?? [],
      experienceYears: opData.experienceYears != null ? Number(opData.experienceYears) : '',
      equipmentTypes:  opData.equipmentTypes ?? [],
      certifications:  opData.certifications ?? [],
      dailyRate:       opData.dailyRate != null ? Number(opData.dailyRate) : '',
      hourlyRate:      opData.hourlyRate != null ? Number(opData.hourlyRate) : '',
      isPriceNegotiable: opData.isPriceNegotiable ?? false,
      currency:        opData.currency ?? 'OMR',
      governorate:     opData.governorate ?? '',
      city:            opData.city ?? '',
      latitude:        opData.latitude ?? null,
      longitude:       opData.longitude ?? null,
      contactPhone:    opData.contactPhone ?? '',
      whatsapp:        opData.whatsapp ?? '',
    });
  }, [isEdit, opData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', form.governorate, locale);

  const steps = [
    { label: 'نوع المشغّل' },
    { label: 'الخبرة والمؤهلات' },
    { label: 'الأجر والموقع' },
  ];
  const { step, next, back } = useFormSteps(steps.length);

  const canProceed =
    step === 0 ? !!form.operatorType :
    step === 1 ? !!(form.title && form.description) :
    !!form.governorate;

  async function handleSubmit() {
    setErrors([]);
    const errs: string[] = [];
    if (!form.title || form.title.length < 3) errs.push('أدخل عنوان الإعلان (3 أحرف على الأقل)');
    if (!form.description || form.description.length < 10) errs.push('أدخل وصف الخبرة (10 أحرف على الأقل)');
    if (!form.governorate) errs.push('اختر المحافظة');
    if (errs.length) { setErrors(errs); return; }

    try {
      const payload: Record<string, unknown> = {
        title:           form.title,
        description:     form.description,
        operatorType:    form.operatorType,
        specializations: form.specializations,
        certifications:  form.certifications,
        equipmentTypes:  form.equipmentTypes.length ? form.equipmentTypes : undefined,
        isPriceNegotiable: form.isPriceNegotiable,
        currency:          form.currency,
      };
      if (form.experienceYears !== '') payload.experienceYears = form.experienceYears;
      if (form.dailyRate !== '')        payload.dailyRate = form.dailyRate;
      if (form.hourlyRate !== '')       payload.hourlyRate = form.hourlyRate;
      if (form.governorate)             payload.governorate = form.governorate;
      if (form.city)                    payload.city = form.city;
      if (form.latitude)                payload.latitude = form.latitude;
      if (form.longitude)               payload.longitude = form.longitude;
      if (form.contactPhone)            payload.contactPhone = form.contactPhone;
      if (form.whatsapp)                payload.whatsapp = form.whatsapp;

      if (isEdit && id) {
        await updateOp.mutateAsync({ id, data: payload });
        addToast('success', tp('opSuccess'));
        router.push(`/equipment/operators/${id}`);
      } else {
        const result = await createOp.mutateAsync(payload);
        addToast('success', tp('opSuccess'));
        router.push(`/equipment/operators/${result.id}`);
      }
    } catch (e: unknown) {
      setErrors([e instanceof Error ? e.message : tp('opError')]);
    }
  }

  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-brand-navy)] text-4xl">progress_activity</span>
      </div>
    );
  }

  if (isEdit && (isError || !opData)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const isLoading = isEdit ? updateOp.isPending : createOp.isPending;

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={next}
      onBack={back}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isLoading={isLoading}
      submitLabel={isEdit ? tp('opEditSubmit') : tp('opSubmit')}
      title={isEdit ? tp('opEditTitle') : tp('opTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {step === 0 && <Step0OperatorType form={form} onChange={onChange} />}
      {step === 1 && <Step1Experience form={form} onChange={onChange} />}
      {step === 2 && (
        <Step2PayLocation
          form={form}
          onChange={onChange}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
        />
      )}
    </BaseFormShell>
  );
}
