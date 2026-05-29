'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCreateBusListing, useUpdateBusListing, useRemoveBusImage, useBusListing } from '@/lib/api/buses';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities } from '@/lib/location-data';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { useDomainImages } from '@/features/ads/hooks/use-domain-images';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { Step0AdType } from './Step0AdType';
import { Step1BusInfo } from './Step1BusInfo';
import { Step2Pricing } from './Step2Pricing';
import { Step3Location } from './Step3Location';
import { DEFAULT_BUS_FORM, type BusFormData } from './types';

export interface BusFormProps {
  mode: 'add' | 'edit';
  id?: string;
}

export function BusFormShell({ mode, id }: BusFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createBus = useCreateBusListing();
  const updateBus = useUpdateBusListing();
  const removeImage = useRemoveBusImage();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<BusFormData>(DEFAULT_BUS_FORM);
  const [selectedGov, setSelectedGov] = useState('');
  const hydratedRef = useRef(false);
  const { images, setImages, uploadImages, hydrateImages } = useDomainImages('buses');

  const { data: busData, isLoading: isFetching, isError } = useBusListing(id ?? '');

  function onChange(updates: Partial<BusFormData>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  useEffect(() => {
    if (!isEdit || !busData || hydratedRef.current) return;
    hydratedRef.current = true;
    setForm({
      ...DEFAULT_BUS_FORM,
      busListingType:    busData.busListingType ?? '',
      busType:           busData.busType ?? '',
      title:             busData.title ?? '',
      description:       busData.description ?? '',
      make:              busData.make ?? '',
      model:             busData.model ?? '',
      year:              String(busData.year ?? ''),
      capacity:          String(busData.capacity ?? ''),
      mileage:           String(busData.mileage ?? ''),
      fuelType:          busData.fuelType ?? '',
      transmission:      busData.transmission ?? '',
      condition:         busData.condition ?? 'USED',
      features:          busData.features ?? [],
      plateNumber:       busData.plateNumber ?? '',
      price:             String(busData.price ?? ''),
      isPriceNegotiable: busData.isPriceNegotiable ?? false,
      contractType:      busData.contractType ?? '',
      contractClient:    busData.contractClient ?? '',
      contractMonthly:   String(busData.contractMonthly ?? ''),
      contractDuration:  String(busData.contractDuration ?? ''),
      contractExpiry:    busData.contractExpiry?.slice(0, 10) ?? '',
      dailyPrice:        String(busData.dailyPrice ?? ''),
      monthlyPrice:      String(busData.monthlyPrice ?? ''),
      withDriver:        busData.withDriver ?? false,
      governorate:       busData.governorate ?? '',
      city:              busData.city ?? '',
      latitude:          busData.latitude ?? null,
      longitude:         busData.longitude ?? null,
      contactPhone:      busData.contactPhone ?? '',
      whatsapp:          busData.whatsapp ?? '',
    });
    setSelectedGov(busData.governorate ?? '');
    if (busData.images?.length) hydrateImages(busData.images);
  }, [isEdit, busData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const isSale     = form.busListingType === 'BUS_SALE' || form.busListingType === 'BUS_SALE_WITH_CONTRACT';
  const isRent     = form.busListingType === 'BUS_RENT';
  const hasContract = form.busListingType === 'BUS_SALE_WITH_CONTRACT';

  const allSteps = [
    { label: tp('busStepAdType') },
    { label: tp('busStepBusInfo') },
    { label: tp('busStepPriceDetails') },
    { label: tp('busStepLocationPhotos') },
  ];
  const steps = isEdit ? allSteps.slice(1) : allSteps;
  const maxStep = steps.length - 1;
  const { step, next, back } = useFormSteps(steps.length);
  const displayStep = isEdit ? step + 1 : step;

  const canProceed =
    displayStep === 0 ? !!form.busListingType && !!form.busType :
    displayStep === 1 ? !!form.title && !!form.make && !!form.year && !!form.capacity :
    displayStep === 2 ? (isSale ? !!form.price : isRent ? (!!form.dailyPrice || !!form.monthlyPrice) : true) :
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
        title:          form.title,
        description:    form.description || form.title,
        busListingType: form.busListingType,
        busType:        form.busType || 'MEDIUM_BUS',
        make:           form.make || tp('busUnspecified'),
        model:          form.model || tp('busUnspecified'),
        year:           parseInt(form.year) || new Date().getFullYear(),
        capacity:       parseInt(form.capacity) || 30,
      };

      if (form.mileage)           payload.mileage = parseInt(form.mileage);
      if (form.fuelType)          payload.fuelType = form.fuelType;
      if (form.transmission)      payload.transmission = form.transmission;
      if (form.condition)         payload.condition = form.condition;
      if (form.features.length)   payload.features = form.features;
      if (form.plateNumber)       payload.plateNumber = form.plateNumber;
      if (form.price)             payload.price = parseFloat(form.price);
      if (isSale)                 payload.isPriceNegotiable = form.isPriceNegotiable;
      if (form.contractType)      payload.contractType = form.contractType;
      if (form.contractClient)    payload.contractClient = form.contractClient;
      if (form.contractMonthly)   payload.contractMonthly = parseFloat(form.contractMonthly);
      if (form.contractDuration)  payload.contractDuration = parseInt(form.contractDuration);
      if (form.contractExpiry)    payload.contractExpiry = form.contractExpiry;
      if (form.dailyPrice)        payload.dailyPrice = parseFloat(form.dailyPrice);
      if (form.monthlyPrice)      payload.monthlyPrice = parseFloat(form.monthlyPrice);
      payload.withDriver         = form.withDriver;
      if (form.governorate)       payload.governorate = form.governorate;
      if (form.city)              payload.city = form.city;
      if (form.latitude)          payload.latitude = form.latitude;
      if (form.longitude)         payload.longitude = form.longitude;
      if (form.contactPhone)      payload.contactPhone = form.contactPhone;
      if (form.whatsapp)          payload.whatsapp = form.whatsapp;

      const redirectPath = `${form.busListingType === 'BUS_RENT' ? '/rental' : '/sale'}/bus/`;

      if (isEdit && id) {
        await updateBus.mutateAsync({ id, data: payload });
        await uploadImages(id, images);
        addToast('success', tp('busSuccess'));
        router.push(`${redirectPath}${id}`);
      } else {
        const bus = await createBus.mutateAsync(payload);
        await uploadImages(bus.id, images);
        addToast('success', tp('busSuccess'));
        router.push(`${redirectPath}${bus.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('busError');
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

  if (isEdit && (isError || !busData)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const isLoading = isEdit ? updateBus.isPending : createBus.isPending;

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={() => { if (step < maxStep) next(); }}
      onBack={back}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isLoading={isLoading}
      submitLabel={isEdit ? tp('busEditSubmit') : tp('busSubmit')}
      title={isEdit ? tp('busEditTitle') : tp('busTitle')}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {displayStep === 0 && <Step0AdType form={form} onChange={onChange} />}
      {displayStep === 1 && <Step1BusInfo form={form} onChange={onChange} />}
      {displayStep === 2 && (
        <Step2Pricing
          form={form}
          onChange={onChange}
          isSale={isSale}
          isRent={isRent}
          hasContract={hasContract}
        />
      )}
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
