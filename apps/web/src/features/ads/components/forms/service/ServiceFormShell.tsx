'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreateCarService, useUpdateCarService, useRemoveServiceImage, useCarService } from '@/lib/api/services';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { useDomainImages } from '@/features/ads/hooks/use-domain-images';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0ServiceType } from './Step0ServiceType';
import { Step1Details } from './Step1Details';
import { Step2Location } from './Step2Location';
import { DEFAULT_SERVICE_FORM, type ServiceFormData } from './types';

export interface ServiceFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function ServiceFormShell({ mode, id }: ServiceFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const create = useCreateCarService();
  const update = useUpdateCarService();
  const removeImage = useRemoveServiceImage();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<ServiceFormData>(DEFAULT_SERVICE_FORM);
  const hydratedRef = useRef(false);
  const { images, setImages, uploadImages, hydrateImages } = useDomainImages('services');

  const { data: svcData, isLoading: isFetching, isError } = useCarService(id ?? '');

  function onChange(updates: Partial<ServiceFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !svcData || hydratedRef.current) return;
    hydratedRef.current = true;
    setForm({
      ...DEFAULT_SERVICE_FORM,
      title:            svcData.title ?? '',
      description:      svcData.description ?? '',
      serviceType:      svcData.serviceType ?? '',
      providerType:     svcData.providerType ?? 'WORKSHOP',
      providerName:     svcData.providerName ?? '',
      specializations:  svcData.specializations ?? [],
      priceFrom:        svcData.priceFrom != null ? Number(svcData.priceFrom) : '',
      priceTo:          svcData.priceTo != null ? Number(svcData.priceTo) : '',
      isHomeService:    svcData.isHomeService ?? false,
      currency:         svcData.currency ?? 'OMR',
      workingHoursOpen: svcData.workingHoursOpen ?? '08:00',
      workingHoursClose: svcData.workingHoursClose ?? '20:00',
      workingDays:      svcData.workingDays ?? ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'],
      governorate:      svcData.governorate ?? '',
      city:             svcData.city ?? '',
      address:          svcData.address ?? '',
      latitude:         svcData.latitude ?? null,
      longitude:        svcData.longitude ?? null,
      contactPhone:     svcData.contactPhone ?? '',
      whatsapp:         svcData.whatsapp ?? '',
      website:          svcData.website ?? '',
    });
    if (svcData.images?.length) hydrateImages(svcData.images);
  }, [isEdit, svcData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', form.governorate, locale);

  const steps = [
    { label: tp('svcStepBasic') },
    { label: tp('svcStepDetails') },
    { label: tp('svcStepLocation') },
  ];
  const { step, next, back } = useFormSteps(steps.length);

  const canProceed =
    step === 0 ? !!(form.serviceType && form.providerType) :
    step === 1 ? !!(form.title && form.providerName && form.description) :
    !!form.governorate;

  async function handleRemoveExistingImage(imageId: string) {
    try {
      await removeImage.mutateAsync(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      addToast('error', 'فشل حذف الصورة');
    }
  }

  async function handleSubmit() {
    setErrors([]);
    const errs: string[] = [];
    if (!form.title || form.title.length < 3) errs.push('أدخل اسم الخدمة (3 أحرف على الأقل)');
    if (!form.providerName) errs.push('أدخل اسم المزوّد');
    if (!form.description || form.description.length < 10) errs.push('أدخل وصف الخدمة (10 أحرف على الأقل)');
    if (form.priceFrom !== '' && form.priceTo !== '' && Number(form.priceTo) < Number(form.priceFrom)) {
      errs.push('السعر الأقصى يجب أن يكون أكبر من الأدنى');
    }
    if (!form.governorate) errs.push('اختر المحافظة');
    if (errs.length) { setErrors(errs); return; }

    try {
      const payload: Record<string, unknown> = {
        title:        form.title,
        description:  form.description,
        serviceType:  form.serviceType,
        providerType: form.providerType,
        providerName: form.providerName,
        governorate:  form.governorate,
        isHomeService: form.isHomeService,
        currency:      form.currency,
        workingDays:  form.workingDays,
      };
      if (form.specializations.length)  payload.specializations = form.specializations;
      if (form.priceFrom !== '')         payload.priceFrom = form.priceFrom;
      if (form.priceTo !== '')           payload.priceTo = form.priceTo;
      if (form.workingHoursOpen)        payload.workingHoursOpen = form.workingHoursOpen;
      if (form.workingHoursClose)       payload.workingHoursClose = form.workingHoursClose;
      if (form.city)                    payload.city = form.city;
      if (form.address)                 payload.address = form.address;
      if (form.latitude)                payload.latitude = form.latitude;
      if (form.longitude)               payload.longitude = form.longitude;
      if (form.contactPhone)            payload.contactPhone = form.contactPhone;
      if (form.whatsapp)                payload.whatsapp = form.whatsapp;
      if (form.website)                 payload.website = form.website;

      if (isEdit && id) {
        await update.mutateAsync({ id, data: payload });
        await uploadImages(id, images);
        addToast('success', tp('svcSuccess'));
        router.push(`/sale/service/${id}`);
      } else {
        const svc = await create.mutateAsync(payload);
        await uploadImages(svc.id, images);
        addToast('success', tp('svcSuccess'));
        router.push(`/sale/service/${svc.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('svcError');
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

  if (isEdit && (isError || !svcData)) {
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
      submitLabel={isEdit ? tp('svcEditSubmit') : tp('svcSubmit')}
      title={isEdit ? tp('svcEditTitle') : tp('svcTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {step === 0 && (
        <Step0ServiceType
          form={form}
          onChange={onChange}
          images={images}
          onImagesChange={setImages}
          onRemoveExistingImage={handleRemoveExistingImage}
          isEdit={isEdit}
          isLoading={isLoading}
        />
      )}
      {step === 1 && <Step1Details form={form} onChange={onChange} />}
      {step === 2 && (
        <Step2Location
          form={form}
          onChange={onChange}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
        />
      )}
    </BaseFormShell>
  );
}
