'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useBrands, useCarModels, useCarTrims, useCarListing, useCreateCarListing, useUpdateCarListing } from '@/lib/api/cars';
import { BaseFormShell } from '@/features/ads/components/base/BaseFormShell';
import { useFormSteps } from '@/features/ads/hooks/use-form-steps';
import { useDomainImages } from '@/features/ads/hooks/use-domain-images';
import { useRemoveListingImage } from '@/lib/api/uploads';
import { getGovernorates, getCities } from '@/lib/location-data';
import { getImageUrl } from '@/lib/image-utils';
import { useToast } from '@/components/toast';
import {
  fuelLabels as fuelLabelsT,
  transmissionLabels as transLabelsT,
  conditionLabels as condLabelsT,
  exteriorColors as exteriorColorsT,
  interiorColors as interiorColorsT,
} from '@/lib/constants/mappings';
import { carListingSchema } from '@/features/ads/validations/car.schema';
import type { UploadedImage } from '@/features/ads/components/image-uploader';
import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2CarDetails } from './Step2CarDetails';
import { Step3AdDetails } from './Step3AdDetails';
import { defaultListingData, type ListingFormData } from './types';

export type { ListingFormData };

interface CarFormShellProps {
  mode: 'add' | 'edit';
  id?: string;
  initialData?: Partial<ListingFormData>;
  initialImages?: UploadedImage[];
}

function mapCarToForm(car: Record<string, any>): Partial<ListingFormData> {
  return {
    title:              car.title || '',
    make:               car.make || '',
    model:              car.model || '',
    trim:               car.trim || '',
    year:               car.year ?? new Date().getFullYear(),
    price:              car.price != null ? String(car.price) : '',
    currency:           car.currency || 'OMR',
    mileage:            car.mileage != null ? String(car.mileage) : '',
    fuelType:           car.fuelType || '',
    transmission:       car.transmission || '',
    condition:          car.condition || '',
    bodyType:           car.bodyType || '',
    exteriorColor:      car.exteriorColor || '',
    interiorColor:      car.interior || '',
    engineSize:         car.engineSize || '',
    horsepower:         car.horsepower != null ? String(car.horsepower) : '',
    doors:              car.doors != null ? String(car.doors) : '',
    seats:              car.seats != null ? String(car.seats) : '',
    driveType:          car.driveType || '',
    features:           car.features ?? [],
    description:        car.description || '',
    governorate:        car.governorate || '',
    city:               car.city || '',
    latitude:           car.latitude ?? null,
    longitude:          car.longitude ?? null,
    isPriceNegotiable:  car.isPriceNegotiable ?? false,
    listingType:        (car.listingType as 'SALE' | 'RENTAL' | 'WANTED') ?? 'SALE',
    dailyPrice:         car.dailyPrice != null ? String(car.dailyPrice) : '',
    monthlyPrice:       car.monthlyPrice != null ? String(car.monthlyPrice) : '',
    withDriver:         car.withDriver ?? false,
    whatsapp:           car.whatsapp || '',
    contactPhone:       car.contactPhone || '',
  };
}

export function CarFormShell({ mode, id, initialData: propsInitialData }: CarFormShellProps) {
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const tc = useTranslations('colors');
  const locale = useLocale();
  const router = useRouter();
  const { addToast } = useToast();

  const fuelLabels  = fuelLabelsT(tm);
  const transLabels = transLabelsT(tm);
  const condLabels  = condLabelsT(tm);
  const extColors   = exteriorColorsT(tc);
  const intColors   = interiorColorsT(tc);

  const isEdit = mode === 'edit';

  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<ListingFormData>({ ...defaultListingData, ...propsInitialData });
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedTrimId,  setSelectedTrimId]  = useState('');
  const [selectedGov, setSelectedGov] = useState('');

  const initialImageIdsRef = useRef<string[]>([]);
  const hydratedRef = useRef(false);

  // API hooks
  const createCar  = useCreateCarListing();
  const updateCar  = useUpdateCarListing(id ?? '');
  const removeImage = useRemoveListingImage(id ?? '');
  const { images, setImages, uploadImages } = useDomainImages('cars');

  // Fetch existing listing in edit mode
  const { data: car, isLoading: isFetching, isError } = useCarListing(id ?? '');

  // Brand / model / trim dropdowns
  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useCarModels(selectedBrandId);
  const { data: trims  = [] } = useCarTrims(selectedModelId);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions        = getCities('OM', selectedGov, locale);

  // Hydrate form once when car data arrives in edit mode
  useEffect(() => {
    if (!isEdit || !car || hydratedRef.current) return;
    hydratedRef.current = true;
    setForm({ ...defaultListingData, ...mapCarToForm(car as any) });
    setSelectedGov(car.governorate ?? '');
    if ((car.images as any[])?.length) {
      const mapped: UploadedImage[] = (car.images as any[])
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((img, i) => ({
          id: img.id,
          url: getImageUrl(img.url) || img.url,
          isPrimary: img.isPrimary,
          order: i,
        }));
      setImages(mapped);
      initialImageIdsRef.current = mapped.filter((img) => img.id).map((img) => img.id as string);
    }
  }, [isEdit, car]);

  // Resolve brand ID once brands load (needed for model dropdown in edit mode)
  useEffect(() => {
    if (!form.make || !brands.length || selectedBrandId) return;
    const match = brands.find((b) => b.name.toLowerCase() === form.make.toLowerCase());
    if (match) setSelectedBrandId(match.id);
  }, [brands, form.make, selectedBrandId]);

  // Resolve model ID once models load
  useEffect(() => {
    if (!form.model || !models.length || selectedModelId) return;
    const match = models.find((m) => m.name.toLowerCase() === form.model.toLowerCase());
    if (match) setSelectedModelId(match.id);
  }, [models, form.model, selectedModelId]);

  // Resolve trim ID once trims load (edit mode)
  useEffect(() => {
    if (!form.trim || !trims.length || selectedTrimId) return;
    const match = trims.find((t) => t.name.toLowerCase() === form.trim.toLowerCase());
    if (match) setSelectedTrimId(match.id);
  }, [trims, form.trim, selectedTrimId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((updates: Partial<ListingFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  function handleBrandChange(brandId: string, name: string) {
    setSelectedBrandId(brandId);
    setSelectedModelId('');
    setSelectedTrimId('');
    setForm((prev) => ({ ...prev, make: name, model: '', trim: '', year: 0 }));
  }

  function handleModelChange(modelId: string, name: string) {
    setSelectedModelId(modelId);
    setSelectedTrimId('');
    setForm((prev) => ({ ...prev, model: name, trim: '', year: 0 }));
  }

  function handleTrimChange(trimId: string, trim: { name: string; engineCapacity: string | null; horsepower: number | null; transmission: string | null; driveType: string | null; fuelType: string | null; seats: number | null }) {
    setSelectedTrimId(trimId);
    setForm((prev) => ({
      ...prev,
      trim:         trim.name,
      ...(trim.engineCapacity && { engineSize:    trim.engineCapacity }),
      ...(trim.horsepower     && { horsepower:    String(trim.horsepower) }),
      ...(trim.transmission   && { transmission:  trim.transmission as any }),
      ...(trim.driveType      && { driveType:     trim.driveType }),
      ...(trim.fuelType       && { fuelType:      trim.fuelType as any }),
      ...(trim.seats          && { seats:         String(trim.seats) }),
    }));
  }

  async function handleSubmit() {
    setErrors([]);
    try {
      const isRental = form.listingType === 'RENTAL';
      const isWanted = form.listingType === 'WANTED';

      const payload: Record<string, unknown> = {
        title:              form.title,
        make:               form.make,
        model:              form.model,
        year:               form.year,
        ...(form.trim && { trim: form.trim }),
        price:              isRental || isWanted ? (form.price ? parseFloat(form.price) : 0) : parseFloat(form.price),
        currency:           form.currency,
        description:        form.description,
        isPriceNegotiable:  isRental ? false : form.isPriceNegotiable,
        listingType:        form.listingType,
      };

      if (form.mileage)            payload.mileage       = parseInt(form.mileage);
      if (form.fuelType)           payload.fuelType       = form.fuelType;
      if (form.transmission)       payload.transmission   = form.transmission;
      if (form.condition)          payload.condition      = form.condition;
      if (form.bodyType)           payload.bodyType       = form.bodyType;
      if (form.exteriorColor)      payload.exteriorColor  = form.exteriorColor;
      if (form.interiorColor)      payload.interior       = form.interiorColor;
      if (form.features.length)    payload.features       = form.features;
      if (form.engineSize)         payload.engineSize     = form.engineSize;
      if (form.horsepower)         payload.horsepower     = parseInt(form.horsepower);
      if (form.doors)              payload.doors          = parseInt(form.doors);
      if (form.seats)              payload.seats          = parseInt(form.seats);
      if (form.driveType)          payload.driveType      = form.driveType;
      if (form.governorate)        payload.governorate    = form.governorate;
      if (form.city)               payload.city           = form.city;
      if (form.latitude != null)   payload.latitude       = form.latitude;
      if (form.longitude != null)  payload.longitude      = form.longitude;
      if (form.whatsapp)           payload.whatsapp       = form.whatsapp;
      if (form.contactPhone)       payload.contactPhone   = form.contactPhone;

      if (isRental) {
        if (form.dailyPrice)   payload.dailyPrice   = parseFloat(form.dailyPrice);
        if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
        payload.withDriver = form.withDriver;
      }

      // Zod validation
      const validated = carListingSchema.parse(payload);

      if (isEdit && id) {
        await updateCar.mutateAsync(validated as Record<string, unknown>);

        // Delete removed images
        const currentIds = new Set(images.filter((img) => img.id).map((img) => img.id));
        const removedIds = initialImageIdsRef.current.filter((imgId) => !currentIds.has(imgId));
        for (const imgId of removedIds) {
          try { await removeImage.mutateAsync(imgId); } catch { /* already deleted */ }
        }

        // Upload new images
        const newImages = images.filter((img) => img.file);
        if (newImages.length > 0) {
          await uploadImages(id, newImages);
        }

        initialImageIdsRef.current = images.filter((img) => img.id).map((img) => img.id as string);
        addToast('success', tp('editListingSaved'));
        router.push(`/sale/car/${id}`);
      } else {
        const listing = await createCar.mutateAsync(validated as Record<string, unknown>);

        if (images.length > 0) {
          await uploadImages(listing.id, images);
        }

        addToast('success', tp('addCarSuccess'));
        router.push(`${form.listingType === 'RENTAL' ? '/rental' : '/sale'}/car/${listing.id}`);
      }
    } catch (err: any) {
      if (err?.name === 'ZodError') {
        setErrors(err.errors.map((e: any) => e.message));
      } else {
        const msg = err instanceof Error ? err.message : tp(isEdit ? 'editListingError' : 'addCarError');
        setErrors(msg.split('\n').filter(Boolean));
      }
    }
  }

  const steps = [
    { label: tp('lfStep1') },
    { label: tp('lfStep2') },
    { label: tp('lfStep3') },
  ];
  const { step, next, back } = useFormSteps(steps.length);

  // Edit-mode loading / error states
  if (isEdit && isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[var(--color-brand-navy)] text-4xl">progress_activity</span>
      </div>
    );
  }

  if (isEdit && (isError || !car)) {
    return <div className="p-8 text-center text-error">خطأ في تحميل البيانات</div>;
  }

  const canProceed =
    step === 0
      ? !!form.make && !!form.model && !!form.year
      : step === 1
      ? true
      : form.listingType === 'RENTAL'
      ? !!form.dailyPrice
      : form.listingType === 'WANTED'
      ? true
      : !!form.price;

  const formTitle = isEdit
    ? tp('editListingTitle')
    : form.listingType === 'RENTAL'
    ? tp('lfTitleRental')
    : form.listingType === 'WANTED'
    ? tp('lfTitleWanted')
    : tp('lfTitleSale');

  const isLoading   = isEdit ? updateCar.isPending : createCar.isPending;
  const submitLabel = tp(isEdit ? 'editListingSave' : 'addCarSubmit');

  return (
    <BaseFormShell
      steps={steps}
      currentStep={step}
      onNext={next}
      onBack={back}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitLabel={submitLabel}
      canProceed={canProceed}
      title={formTitle}
      errors={errors}
      onClearErrors={() => setErrors([])}
    >
      {step === 0 && (
        <Step1BasicInfo
          form={form}
          onChange={handleChange}
          images={images}
          onImagesChange={setImages}
          brands={brands}
          models={models}
          trims={trims}
          selectedBrandId={selectedBrandId}
          onBrandChange={handleBrandChange}
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          selectedTrimId={selectedTrimId}
          onTrimChange={handleTrimChange}
          isLoading={isLoading}
          condLabels={condLabels}
        />
      )}
      {step === 1 && (
        <Step2CarDetails
          form={form}
          onChange={handleChange}
          fuelLabels={fuelLabels}
          transLabels={transLabels}
          extColors={extColors}
          intColors={intColors}
        />
      )}
      {step === 2 && (
        <Step3AdDetails
          form={form}
          onChange={handleChange}
          selectedGov={selectedGov}
          onGovChange={setSelectedGov}
          governorateOptions={governorateOptions}
          cityOptions={cityOptions}
        />
      )}
    </BaseFormShell>
  );
}
