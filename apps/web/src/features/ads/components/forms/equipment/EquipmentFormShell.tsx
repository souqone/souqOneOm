'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreateEquipmentListing, useUpdateEquipmentListing, useRemoveEquipmentImage, useEquipmentListing } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { useDomainImages } from '@/features/ads/hooks/use-domain-images';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0AdType } from './Step0AdType';
import { Step1Specs } from './Step1Specs';
import { Step2Pricing } from './Step2Pricing';
import { Step3Location } from './Step3Location';
import { DEFAULT_EQUIPMENT_FORM, type EquipmentFormData } from './types';

export interface EquipmentFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function EquipmentFormShell({ mode, id }: EquipmentFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createEquip = useCreateEquipmentListing();
  const updateEquip = useUpdateEquipmentListing();
  const removeImage = useRemoveEquipmentImage();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<EquipmentFormData>(DEFAULT_EQUIPMENT_FORM);
  const [selectedGov, setSelectedGov] = useState('');
  const { images, setImages, uploadImages, hydrateImages } = useDomainImages('equipment');

  const { data: equip, isLoading: isFetching, isError } = useEquipmentListing(id ?? '');

  function onChange(updates: Partial<EquipmentFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !equip) return;
    setForm({
      ...DEFAULT_EQUIPMENT_FORM,
      listingType:       equip.listingType ?? '',
      equipmentType:     equip.equipmentType ?? '',
      title:             equip.title ?? '',
      description:       equip.description ?? '',
      make:              equip.make ?? '',
      model:             equip.model ?? '',
      year:              String(equip.year ?? ''),
      condition:         equip.condition ?? 'USED',
      capacity:          equip.capacity ?? '',
      power:             equip.power ?? '',
      weight:            equip.weight ?? '',
      hoursUsed:         String(equip.hoursUsed ?? ''),
      features:          equip.features ?? [],
      price:             String(equip.price ?? ''),
      dailyPrice:        String(equip.dailyPrice ?? ''),
      weeklyPrice:       String(equip.weeklyPrice ?? ''),
      monthlyPrice:      String(equip.monthlyPrice ?? ''),
      isPriceNegotiable: equip.isPriceNegotiable ?? false,
      withOperator:      equip.withOperator ?? false,
      deliveryAvailable: equip.deliveryAvailable ?? false,
      minRentalDays:     String(equip.minRentalDays ?? ''),
      depositAmount:     String(equip.depositAmount ?? ''),
      insuranceIncluded: equip.insuranceIncluded ?? false,
      availableFrom:     equip.availableFrom?.slice(0, 10) ?? '',
      availableTo:       equip.availableTo?.slice(0, 10) ?? '',
      cancellationPolicy: equip.cancellationPolicy ?? '',
      kmLimitPerDay:     String(equip.kmLimitPerDay ?? ''),
      currency:          equip.currency ?? 'OMR',
      governorate:       equip.governorate ?? '',
      city:              equip.city ?? '',
      latitude:          equip.latitude ?? null,
      longitude:         equip.longitude ?? null,
      contactPhone:      equip.contactPhone ?? '',
      whatsapp:          equip.whatsapp ?? '',
    });
    setSelectedGov(equip.governorate ?? '');
    if (equip.images?.length) hydrateImages(equip.images);
  }, [isEdit, equip]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const isRent = form.listingType === 'EQUIPMENT_RENT';

  const allSteps = [
    { label: tp('eqStepType') },
    { label: tp('eqStepSpecs') },
    { label: tp('eqStepPrice') },
    { label: tp('eqStepPhotos') },
  ];
  const steps = isEdit ? allSteps.slice(1) : allSteps;
  const maxStep = steps.length - 1;
  const { step, next, back } = useFormSteps(steps.length);
  const displayStep = isEdit ? step + 1 : step;

  const canProceed =
    displayStep === 0 ? !!(form.listingType && form.equipmentType) :
    displayStep === 1 ? !!(form.title && form.description) :
    displayStep === 2 ? (isRent ? !!(form.dailyPrice || form.monthlyPrice) : !!form.price) :
    true;

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
        title:         form.title,
        description:   form.description,
        equipmentType: form.equipmentType,
        listingType:   form.listingType,
        condition:     form.condition,
      };

      if (form.make)            payload.make = form.make;
      if (form.model)           payload.model = form.model;
      if (form.year)            payload.year = Number(form.year);
      if (form.capacity)        payload.capacity = form.capacity;
      if (form.power)           payload.power = form.power;
      if (form.weight)          payload.weight = form.weight;
      if (form.hoursUsed)       payload.hoursUsed = Number(form.hoursUsed);
      if (form.features.length) payload.features = form.features;
      if (form.price)           payload.price = Number(form.price);
      if (form.dailyPrice)      payload.dailyPrice = Number(form.dailyPrice);
      if (form.weeklyPrice)     payload.weeklyPrice = Number(form.weeklyPrice);
      if (form.monthlyPrice)    payload.monthlyPrice = Number(form.monthlyPrice);
      payload.isPriceNegotiable = form.isPriceNegotiable;
      payload.withOperator      = form.withOperator;
      payload.deliveryAvailable = form.deliveryAvailable;
      if (form.minRentalDays)    payload.minRentalDays = Number(form.minRentalDays);
      if (form.depositAmount)    payload.depositAmount = Number(form.depositAmount);
      if (isRent)                payload.insuranceIncluded = form.insuranceIncluded;
      if (form.availableFrom)    payload.availableFrom = form.availableFrom;
      if (form.availableTo)      payload.availableTo = form.availableTo;
      if (form.cancellationPolicy) payload.cancellationPolicy = form.cancellationPolicy;
      if (form.governorate)      payload.governorate = form.governorate;
      if (form.city)             payload.city = form.city;
      if (form.latitude)         payload.latitude = form.latitude;
      if (form.longitude)        payload.longitude = form.longitude;
      if (form.kmLimitPerDay)    payload.kmLimitPerDay = Number(form.kmLimitPerDay);
      payload.currency           = form.currency;
      if (form.contactPhone)     payload.contactPhone = form.contactPhone;
      if (form.whatsapp)         payload.whatsapp = form.whatsapp;

      const redirectBase = `${isRent ? '/rental' : '/sale'}/equipment/`;

      if (isEdit && id) {
        await updateEquip.mutateAsync({ id, data: payload });
        await uploadImages(id, images);
        addToast('success', tp('eqSuccess'));
        router.push(`${redirectBase}${id}`);
      } else {
        const result = await createEquip.mutateAsync(payload);
        await uploadImages(result.id, images);
        addToast('success', tp('eqSuccess'));
        router.push(`${redirectBase}${result.id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tp('eqError');
      setErrors([msg]);
    }
  }

  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-brand-navy)] text-4xl">progress_activity</span>
      </div>
    );
  }

  if (isEdit && (isError || !equip)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const isLoading = isEdit ? updateEquip.isPending : createEquip.isPending;

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={() => { if (step < maxStep) next(); }}
      onBack={back}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isLoading={isLoading}
      submitLabel={isEdit ? tp('eqEditSubmit') : tp('eqSubmit')}
      title={isEdit ? tp('eqEditTitle') : tp('eqTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {displayStep === 0 && <Step0AdType form={form} onChange={onChange} />}
      {displayStep === 1 && <Step1Specs form={form} onChange={onChange} />}
      {displayStep === 2 && <Step2Pricing form={form} onChange={onChange} isRent={isRent} />}
      {displayStep === 3 && (
        <Step3Location
          form={form}
          onChange={onChange}
          selectedGov={selectedGov}
          onGovChange={setSelectedGov}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
          images={images}
          onImagesChange={setImages}
          onRemoveExistingImage={handleRemoveExistingImage}
          isEdit={isEdit}
        />
      )}
    </BaseFormShell>
  );
}
