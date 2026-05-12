'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreatePart, useUpdatePart, useRemovePartImage, usePart } from '@/lib/api/parts';
import { useBrands } from '@/lib/api/cars';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { useDomainImages } from '@/features/ads/hooks/use-domain-images';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0Category } from './Step0Category';
import { Step1Details } from './Step1Details';
import { Step2PriceLocation } from './Step2PriceLocation';
import { DEFAULT_PART_FORM, type PartFormData } from './types';

export interface PartFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function PartFormShell({ mode, id }: PartFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const removeImage = useRemovePartImage();
  const { addToast } = useToast();
  const { data: brands = [] } = useBrands();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<PartFormData>(DEFAULT_PART_FORM);
  const [selectedGov, setSelectedGov] = useState('');
  const { images, setImages, uploadImages, hydrateImages } = useDomainImages('parts');

  const { data: partData, isLoading: isFetching, isError } = usePart(id ?? '');

  function onChange(updates: Partial<PartFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !partData) return;
    setForm({
      ...DEFAULT_PART_FORM,
      title:            partData.title ?? '',
      description:      partData.description ?? '',
      partCategory:     partData.partCategory ?? '',
      condition:        partData.condition ?? 'USED',
      partNumber:       partData.partNumber ?? '',
      compatibleMakes:  partData.compatibleMakes ?? [],
      compatibleModels: partData.compatibleModels ?? [],
      yearFrom:         String(partData.yearFrom ?? ''),
      yearTo:           String(partData.yearTo ?? ''),
      isOriginal:       partData.isOriginal ?? false,
      price:            String(partData.price ?? ''),
      isPriceNegotiable: partData.isPriceNegotiable ?? false,
      currency:          partData.currency ?? 'OMR',
      governorate:      partData.governorate ?? '',
      city:             partData.city ?? '',
      latitude:         partData.latitude ?? null,
      longitude:        partData.longitude ?? null,
      contactPhone:     partData.contactPhone ?? '',
      whatsapp:         partData.whatsapp ?? '',
    });
    setSelectedGov(partData.governorate ?? '');
    if (partData.images?.length) hydrateImages(partData.images);
  }, [isEdit, partData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const steps = [
    { label: tp('partStepBasic') },
    { label: tp('partStepDetails') },
    { label: tp('partStepPrice') },
  ];
  const { step, next, back } = useFormSteps(steps.length);

  const canProceed =
    step === 0 ? !!form.partCategory && !!form.title :
    step === 1 ? true :
    !!form.price;

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
    try {
      const payload: Record<string, unknown> = {
        title:             form.title,
        description:       form.description,
        partCategory:      form.partCategory,
        condition:         form.condition,
        price:             parseFloat(form.price),
        isPriceNegotiable: form.isPriceNegotiable,
        currency:          form.currency,
      };
      if (form.partNumber)              payload.partNumber = form.partNumber;
      if (form.compatibleMakes.length)  payload.compatibleMakes = form.compatibleMakes;
      if (form.compatibleModels.length) payload.compatibleModels = form.compatibleModels;
      if (form.yearFrom)                payload.yearFrom = parseInt(form.yearFrom);
      if (form.yearTo)                  payload.yearTo = parseInt(form.yearTo);
      if (form.isOriginal)              payload.isOriginal = true;
      if (form.governorate)             payload.governorate = form.governorate;
      if (form.city)                    payload.city = form.city;
      if (form.latitude)                payload.latitude = form.latitude;
      if (form.longitude)               payload.longitude = form.longitude;
      if (form.contactPhone)            payload.contactPhone = form.contactPhone;
      if (form.whatsapp)                payload.whatsapp = form.whatsapp;

      if (isEdit && id) {
        await updatePart.mutateAsync({ id, data: payload });
        await uploadImages(id, images);
        addToast('success', tp('partSuccess'));
        router.push(`/sale/part/${id}`);
      } else {
        const part = await createPart.mutateAsync(payload);
        await uploadImages(part.id, images);
        addToast('success', tp('partSuccess'));
        router.push(`/sale/part/${part.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('partError');
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

  if (isEdit && (isError || !partData)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const isLoading = isEdit ? updatePart.isPending : createPart.isPending;

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={next}
      onBack={back}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isLoading={isLoading}
      submitLabel={isEdit ? tp('partEditSubmit') : tp('partSubmit')}
      title={isEdit ? tp('partEditTitle') : tp('partTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {step === 0 && (
        <Step0Category
          form={form}
          onChange={onChange}
          images={images}
          onImagesChange={setImages}
          onRemoveExistingImage={handleRemoveExistingImage}
          isEdit={isEdit}
          isLoading={isLoading}
        />
      )}
      {step === 1 && <Step1Details form={form} onChange={onChange} brands={brands} />}
      {step === 2 && (
        <Step2PriceLocation
          form={form}
          onChange={onChange}
          selectedGov={selectedGov}
          onGovChange={setSelectedGov}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
        />
      )}
    </BaseFormShell>
  );
}
