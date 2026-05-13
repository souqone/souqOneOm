'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreateJob, useUpdateJob, useJob } from '@/lib/api/jobs';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0JobType } from './Step0JobType';
import { Step1Details } from './Step1Details';
import { Step2Requirements } from './Step2Requirements';
import { Step3LocationContact } from './Step3LocationContact';
import { DEFAULT_JOB_FORM, type JobFormData } from './types';

export interface JobFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function JobFormShell({ mode, id }: JobFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const create = useCreateJob();
  const update = useUpdateJob();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<JobFormData>(DEFAULT_JOB_FORM);

  const { data: jobData, isLoading: isFetching, isError } = useJob(id ?? '');

  function onChange(updates: Partial<JobFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !jobData) return;
    setForm({
      ...DEFAULT_JOB_FORM,
      jobType:        (jobData.jobType as 'HIRING' | 'OFFERING') ?? 'HIRING',
      title:          jobData.title ?? '',
      description:    jobData.description ?? '',
      employmentType: jobData.employmentType ?? 'FULL_TIME',
      salary:         jobData.salary != null ? Number(jobData.salary) : '',
      salaryPeriod:   jobData.salaryPeriod ?? 'MONTHLY',
      licenseTypes:   jobData.licenseTypes ?? [],
      experienceYears: jobData.experienceYears != null ? Number(jobData.experienceYears) : '',
      minAge:         jobData.minAge != null ? Number(jobData.minAge) : '',
      maxAge:         jobData.maxAge != null ? Number(jobData.maxAge) : '',
      languages:      jobData.languages ?? [],
      nationality:    jobData.nationality ?? '',
      vehicleTypes:   jobData.vehicleTypes ?? [],
      hasOwnVehicle:  jobData.hasOwnVehicle ?? false,
      currency:       jobData.currency ?? 'OMR',
      governorate:    jobData.governorate ?? '',
      city:           jobData.city ?? '',
      contactPhone:   jobData.contactPhone ?? '',
      contactEmail:   jobData.contactEmail ?? '',
      whatsapp:       jobData.whatsapp ?? '',
    });
  }, [isEdit, jobData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', form.governorate, locale);

  const steps = [
    { label: 'نوع الإعلان' },
    { label: 'التفاصيل' },
    { label: 'المتطلبات' },
    { label: 'الموقع والتواصل' },
  ];
  const { step, next, back } = useFormSteps(steps.length);

  const canProceed =
    step === 0 ? !!form.jobType :
    step === 1 ? !!(form.title && form.title.length >= 3 && form.description && form.description.length >= 10) :
    step === 2 ? true :
    !!form.governorate;

  async function handleSubmit() {
    setErrors([]);
    if (!form.title || !form.description || !form.governorate) {
      addToast('error', tp('jnErrRequired'));
      return;
    }

    const payload: Record<string, unknown> = {
      title:          form.title,
      description:    form.description,
      jobType:        form.jobType,
      employmentType: form.employmentType,
      governorate:    form.governorate,
      currency:       form.currency,
      licenseTypes:   form.licenseTypes,
      languages:      form.languages,
      vehicleTypes:   form.vehicleTypes,
      hasOwnVehicle:  form.hasOwnVehicle,
    };

    if (form.salary !== '')          payload.salary = form.salary;
    if (form.salaryPeriod)           payload.salaryPeriod = form.salaryPeriod;
    if (form.experienceYears !== '') payload.experienceYears = form.experienceYears;
    if (form.minAge !== '')          payload.minAge = form.minAge;
    if (form.maxAge !== '')          payload.maxAge = form.maxAge;
    if (form.nationality)            payload.nationality = form.nationality;
    if (form.city)                   payload.city = form.city;
    if (form.contactPhone)           payload.contactPhone = form.contactPhone;
    if (form.contactEmail)           payload.contactEmail = form.contactEmail;
    if (form.whatsapp)               payload.whatsapp = form.whatsapp;

    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, ...payload });
        addToast('success', tp('editListingSaved'));
        router.push(`/jobs/${id}`);
      } else {
        const job = await create.mutateAsync(payload);
        addToast('success', tp('jnSuccess'));
        router.push(`/jobs/${job.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tp('jnError');
      setErrors(msg.split('\n').filter(Boolean));
    }
  }

  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-brand-navy)] text-4xl">progress_activity</span>
      </div>
    );
  }

  if (isEdit && (isError || !jobData)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const isLoading = isEdit ? update.isPending : create.isPending;

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={next}
      onBack={back}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isLoading={isLoading}
      submitLabel={isEdit ? tp('editListingSave') : tp('jnSubmit')}
      title={isEdit ? tp('jnEditTitle') : tp('jnTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {step === 0 && <Step0JobType form={form} onChange={onChange} />}
      {step === 1 && <Step1Details form={form} onChange={onChange} />}
      {step === 2 && <Step2Requirements form={form} onChange={onChange} />}
      {step === 3 && (
        <Step3LocationContact
          form={form}
          onChange={onChange}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
        />
      )}
    </BaseFormShell>
  );
}
