'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from './shared';
import { useCreateBusListing, useUpdateBusListing, useRemoveBusImage, type BusListingItem } from '@/lib/api/buses';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const BUS_LISTING_TYPE_KEYS = [
  { value: 'BUS_SALE', labelKey: 'busTypeSale', icon: 'sell', descKey: 'busTypeSaleDesc' },
  { value: 'BUS_SALE_WITH_CONTRACT', labelKey: 'busTypeSaleContract', icon: 'assignment', descKey: 'busTypeSaleContractDesc' },
  { value: 'BUS_RENT', labelKey: 'busTypeRent', icon: 'car_rental', descKey: 'busTypeRentDesc' },
  { value: 'BUS_CONTRACT', labelKey: 'busTypeContract', icon: 'request_quote', descKey: 'busTypeContractDesc' },
] as const;

const BUS_TYPE_KEYS = [
  { value: 'MINI_BUS', labelKey: 'busSizeMini', descKey: 'busSizeMiniDesc' },
  { value: 'MEDIUM_BUS', labelKey: 'busSizeMedium', descKey: 'busSizeMediumDesc' },
  { value: 'LARGE_BUS', labelKey: 'busSizeLarge', descKey: 'busSizeLargeDesc' },
  { value: 'COASTER', labelKey: 'busSizeCoaster', descKey: 'busSizeCoasterDesc' },
  { value: 'SCHOOL_BUS', labelKey: 'busSizeSchool', descKey: 'busSizeSchoolDesc' },
] as const;

const CONTRACT_TYPE_KEYS = [
  { value: 'SCHOOL', labelKey: 'busContractSchool' },
  { value: 'COMPANY', labelKey: 'busContractCompany' },
  { value: 'GOVERNMENT', labelKey: 'busContractGov' },
  { value: 'TOURISM', labelKey: 'busContractTourism' },
  { value: 'OTHER_CONTRACT', labelKey: 'busContractOther' },
] as const;

const FUEL_TYPE_KEYS = [
  { value: 'DIESEL', labelKey: 'busFuelDiesel' },
  { value: 'PETROL', labelKey: 'busFuelPetrol' },
  { value: 'HYBRID', labelKey: 'busFuelHybrid' },
  { value: 'ELECTRIC', labelKey: 'busFuelElectric' },
] as const;

const CONDITION_KEYS = [
  { value: 'NEW', labelKey: 'busCondNew' },
  { value: 'LIKE_NEW', labelKey: 'busCondLikeNew' },
  { value: 'USED', labelKey: 'busCondUsed' },
  { value: 'GOOD', labelKey: 'busCondGood' },
  { value: 'FAIR', labelKey: 'busCondFair' },
] as const;

const BUS_FEATURE_KEYS = [
  'busFeatAC', 'busFeatWifi', 'busFeatScreens', 'busFeatUSB', 'busFeatLeather', 'busFeatSeatbelt',
  'busFeatCamera', 'busFeatGPS', 'busFeatLuggage', 'busFeatHydraulic', 'busFeatFridge', 'busFeatMic',
] as const;

const DEFAULT_FORM = {
  busListingType: '',
  busType: '',
  title: '',
  description: '',
  make: '',
  model: '',
  year: '',
  capacity: '',
  mileage: '',
  fuelType: '',
  transmission: '',
  condition: 'USED',
  features: [] as string[],
  plateNumber: '',
  price: '',
  isPriceNegotiable: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: '',
  dailyPrice: '',
  monthlyPrice: '',
  minRentalDays: '',
  withDriver: false,
  deliveryAvailable: false,
  depositAmount: '',
  insuranceIncluded: false,
  availableFrom: '',
  availableTo: '',
  cancellationPolicy: '',
  requestPassengers: '',
  requestRoute: '',
  requestSchedule: '',
  governorate: '',
  city: '',
  latitude: null as number | null,
  longitude: null as number | null,
  contactPhone: '',
  whatsapp: '',
};

export interface BusFormProps {
  mode: 'add' | 'edit';
  initialData?: BusListingItem;
  id?: string;
}

export function BusForm({ mode, initialData, id }: BusFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createBus = useCreateBusListing();
  const updateBus = useUpdateBusListing();
  const removeImage = useRemoveBusImage();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedGov, setSelectedGov] = useState('');

  function set<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!isEdit || !initialData) return;
    setForm({
      ...DEFAULT_FORM,
      busListingType: initialData.busListingType ?? '',
      busType: initialData.busType ?? '',
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      make: initialData.make ?? '',
      model: initialData.model ?? '',
      year: String(initialData.year ?? ''),
      capacity: String(initialData.capacity ?? ''),
      mileage: String(initialData.mileage ?? ''),
      fuelType: initialData.fuelType ?? '',
      transmission: initialData.transmission ?? '',
      condition: initialData.condition ?? 'USED',
      features: initialData.features ?? [],
      plateNumber: initialData.plateNumber ?? '',
      price: String(initialData.price ?? ''),
      isPriceNegotiable: initialData.isPriceNegotiable ?? false,
      contractType: initialData.contractType ?? '',
      contractClient: initialData.contractClient ?? '',
      contractMonthly: String(initialData.contractMonthly ?? ''),
      contractDuration: String(initialData.contractDuration ?? ''),
      contractExpiry: initialData.contractExpiry?.slice(0, 10) ?? '',
      dailyPrice: String(initialData.dailyPrice ?? ''),
      monthlyPrice: String(initialData.monthlyPrice ?? ''),
      minRentalDays: String(initialData.minRentalDays ?? ''),
      withDriver: initialData.withDriver ?? false,
      deliveryAvailable: initialData.deliveryAvailable ?? false,
      depositAmount: String(initialData.depositAmount ?? ''),
      insuranceIncluded: initialData.insuranceIncluded ?? false,
      availableFrom: initialData.availableFrom?.slice(0, 10) ?? '',
      availableTo: initialData.availableTo?.slice(0, 10) ?? '',
      cancellationPolicy: initialData.cancellationPolicy ?? '',
      requestPassengers: String(initialData.requestPassengers ?? ''),
      requestRoute: initialData.requestRoute ?? '',
      requestSchedule: initialData.requestSchedule ?? '',
      governorate: initialData.governorate ?? '',
      city: initialData.city ?? '',
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      contactPhone: initialData.contactPhone ?? '',
      whatsapp: initialData.whatsapp ?? '',
    });
    setSelectedGov(initialData.governorate ?? '');
    if (initialData.images?.length) {
      setImages(initialData.images.map(img => ({ id: img.id, url: img.url, isPrimary: img.isPrimary, order: img.order })));
    }
  }, [isEdit, initialData]);

  const locale_key = locale;
  const governorateOptions = getGovernorates('OM', locale_key);
  const cityOptions = getCities('OM', selectedGov, locale_key);

  const isContract = form.busListingType === 'BUS_CONTRACT';
  const isSale = form.busListingType === 'BUS_SALE' || form.busListingType === 'BUS_SALE_WITH_CONTRACT';
  const isRent = form.busListingType === 'BUS_RENT';
  const hasContract = form.busListingType === 'BUS_SALE_WITH_CONTRACT' || isContract;

  const allSteps = [
    { label: tp('busStepAdType') },
    { label: tp('busStepBusInfo') },
    { label: isContract ? tp('busStepContractDetails') : tp('busStepPriceDetails') },
    { label: tp('busStepLocationPhotos') },
  ];
  const steps = isEdit ? allSteps.slice(1) : allSteps;
  const maxStep = steps.length - 1;
  const displayStep = isEdit ? step + 1 : step;

  const canProceed =
    displayStep === 0 ? !!form.busListingType && !!form.busType :
    displayStep === 1 ? !!form.title && !!form.make && !!form.year && !!form.capacity :
    displayStep === 2 ? (isSale ? !!form.price : isRent ? (!!form.dailyPrice || !!form.monthlyPrice) : true) :
    true;

  async function handleSubmit() {
    setErrors([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || form.title,
        busListingType: form.busListingType,
        busType: form.busType || 'MEDIUM_BUS',
        make: form.make || tp('busUnspecified'),
        model: form.model || tp('busUnspecified'),
        year: parseInt(form.year) || new Date().getFullYear(),
        capacity: parseInt(form.capacity) || 30,
      };

      if (form.mileage) payload.mileage = parseInt(form.mileage);
      if (form.fuelType) payload.fuelType = form.fuelType;
      if (form.transmission) payload.transmission = form.transmission;
      if (form.condition) payload.condition = form.condition;
      if (form.features.length) payload.features = form.features;
      if (form.plateNumber) payload.plateNumber = form.plateNumber;
      if (form.price) payload.price = parseFloat(form.price);
      if (isSale) payload.isPriceNegotiable = form.isPriceNegotiable;
      if (form.contractType) payload.contractType = form.contractType;
      if (form.contractClient) payload.contractClient = form.contractClient;
      if (form.contractMonthly) payload.contractMonthly = parseFloat(form.contractMonthly);
      if (form.contractDuration) payload.contractDuration = parseInt(form.contractDuration);
      if (form.contractExpiry) payload.contractExpiry = form.contractExpiry;
      if (form.dailyPrice) payload.dailyPrice = parseFloat(form.dailyPrice);
      if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
      if (form.minRentalDays) payload.minRentalDays = parseInt(form.minRentalDays);
      payload.withDriver = form.withDriver;
      payload.deliveryAvailable = form.deliveryAvailable;
      if (form.depositAmount) payload.depositAmount = parseFloat(form.depositAmount);
      if (isRent) payload.insuranceIncluded = form.insuranceIncluded;
      if (form.availableFrom) payload.availableFrom = form.availableFrom;
      if (form.availableTo) payload.availableTo = form.availableTo;
      if (form.cancellationPolicy) payload.cancellationPolicy = form.cancellationPolicy;
      if (form.requestPassengers) payload.requestPassengers = parseInt(form.requestPassengers);
      if (form.requestRoute) payload.requestRoute = form.requestRoute;
      if (form.requestSchedule) payload.requestSchedule = form.requestSchedule;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      const redirectPath = `${form.busListingType === 'BUS_RENT' ? '/rental' : '/sale'}/bus/`;

      if (isEdit && id) {
        await updateBus.mutateAsync({ id, data: payload });
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/buses/${id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('busSuccess'));
        router.push(`${redirectPath}${id}`);
      } else {
        const bus = await createBus.mutateAsync(payload);
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/buses/${bus.id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('busSuccess'));
        router.push(`${redirectPath}${bus.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('busError');
      setErrors(msg.split('\n').filter(Boolean));
    }
  }

  async function handleRemoveExistingImage(imageId: string) {
    try {
      await removeImage.mutateAsync(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      addToast('error', 'فشل حذف الصورة');
    }
  }

  const isLoading = isEdit ? updateBus.isPending : createBus.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={isEdit ? tp('busEditSubmit') : tp('busSubmit')}
        canProceed={canProceed}
        title={isEdit ? tp('busEditTitle') : tp('busTitle')}
      >
        {/* ── Step 0: نوع الإعلان (add mode only) ── */}
        {displayStep === 0 && (
          <div className="space-y-8">
            <FormSection icon="category" title={tp('busLabelAdType')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUS_LISTING_TYPE_KEYS.map(t => (
                  <button key={t.value} type="button" onClick={() => set('busListingType', t.value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-start ${form.busListingType === t.value ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-outline-variant/20 hover:border-outline-variant/40'}`}>
                    <span className={`material-symbols-outlined text-2xl mt-0.5 ${form.busListingType === t.value ? 'text-primary' : 'text-on-surface-variant'}`}>{t.icon}</span>
                    <div>
                      <p className="font-black text-on-surface text-sm">{tp(t.labelKey)}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{tp(t.descKey)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </FormSection>

            {form.busListingType && (
              <FormSection icon="directions_bus" title={tp('busLabelBusType')}>
                <div className="flex flex-wrap gap-2">
                  {BUS_TYPE_KEYS.map(b => (
                    <button key={b.value} type="button" onClick={() => set('busType', b.value)}
                      className={chipCls(form.busType === b.value)}>
                      {tp(b.labelKey)} <span className="text-[10px] opacity-60">({tp(b.descKey)})</span>
                    </button>
                  ))}
                </div>
              </FormSection>
            )}
          </div>
        )}

        {/* ── Step 1: بيانات الباص ── */}
        {displayStep === 1 && (
          <div className="space-y-8">
            <FormSection icon="edit" title={tp('busLabelBasicInfo')}>
              <div className="space-y-4">
                <FormInput label={tp('busLabelAdTitle')} name="title" value={form.title} onChange={v => set('title', v)} placeholder={tp('busPlaceholderBus')} required />
                <FormTextarea label={tp('busLabelDescription')} name="description" value={form.description} onChange={v => set('description', v)} placeholder={tp('busPlaceholderDesc')} rows={4} />
              </div>
            </FormSection>

            <FormSection icon="directions_bus" title={tp('busLabelBusData')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label={tp('busLabelBrand')} name="make" value={form.make} onChange={v => set('make', v)} placeholder={tp('busPlaceholderBrand')} />
                <FormInput label={tp('busLabelModel')} name="model" value={form.model} onChange={v => set('model', v)} placeholder="Rosa, Coaster" />
                <FormInput label={tp('busLabelYear')} name="year" type="number" value={form.year} onChange={v => set('year', v)} placeholder="2020" />
                <FormInput label={tp('busLabelCapacity')} name="capacity" type="number" value={form.capacity} onChange={v => set('capacity', v)} placeholder="30" />
                <FormInput label={tp('busLabelMileage')} name="mileage" type="number" value={form.mileage} onChange={v => set('mileage', v)} placeholder="100000" />
                <FormInput label={tp('busLabelPlate')} name="plateNumber" value={form.plateNumber} onChange={v => set('plateNumber', v)} />
              </div>
            </FormSection>

            <FormSection icon="tune" title={tp('busLabelSpecs')}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>{tp('busLabelFuel')}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {FUEL_TYPE_KEYS.map(f => (
                        <button key={f.value} type="button" onClick={() => set('fuelType', f.value)}
                          className={chipCls(form.fuelType === f.value)}>{tp(f.labelKey)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelTransmission')}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[{ value: 'AUTOMATIC', labelKey: 'busTransAutomatic' as const }, { value: 'MANUAL', labelKey: 'busTransManual' as const }].map(t => (
                        <button key={t.value} type="button" onClick={() => set('transmission', t.value)}
                          className={chipCls(form.transmission === t.value)}>{tp(t.labelKey)}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('busLabelCondition')}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CONDITION_KEYS.map(c => (
                      <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                        className={chipCls(form.condition === c.value)}>{tp(c.labelKey)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon="star" title={tp('busLabelFeatures')}>
              <div className="flex flex-wrap gap-2.5">
                {BUS_FEATURE_KEYS.map(key => {
                  const label = tp(key);
                  return (
                    <button key={key} type="button"
                      onClick={() => set('features', form.features.includes(label) ? form.features.filter(x => x !== label) : [...form.features, label])}
                      className={chipCls(form.features.includes(label))}>{label}</button>
                  );
                })}
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: السعر / العقد / الإيجار ── */}
        {displayStep === 2 && (
          <div className="space-y-8">
            {isSale && (
              <FormSection icon="payments" title={tp('busLabelPrice')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label={tp('busLabelSalePrice')} name="price" type="number" value={form.price} onChange={v => set('price', v)} placeholder="8000" />
                  <div className="flex items-end pb-1">
                    <FormToggle name="isPriceNegotiable" label={tp('busLabelNegotiable')} checked={form.isPriceNegotiable} onChange={v => set('isPriceNegotiable', v)} />
                  </div>
                </div>
              </FormSection>
            )}

            {hasContract && (
              <FormSection icon="assignment" title={tp('busLabelContractAttached')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{tp('busLabelContractType')}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CONTRACT_TYPE_KEYS.map(c => (
                        <button key={c.value} type="button" onClick={() => set('contractType', c.value)}
                          className={chipCls(form.contractType === c.value)}>{tp(c.labelKey)}</button>
                      ))}
                    </div>
                  </div>
                  <FormInput label={tp('busLabelClientName')} name="contractClient" value={form.contractClient} onChange={v => set('contractClient', v)} placeholder={tp('busPlaceholderClient')} />
                  <FormInput label={tp('busLabelMonthlySalary')} name="contractMonthly" type="number" value={form.contractMonthly} onChange={v => set('contractMonthly', v)} placeholder="400" />
                  <FormInput label={tp('busLabelContractDuration')} name="contractDuration" type="number" value={form.contractDuration} onChange={v => set('contractDuration', v)} placeholder="12" />
                  <FormInput label={tp('busLabelContractExpiry')} name="contractExpiry" type="date" value={form.contractExpiry} onChange={v => set('contractExpiry', v)} />
                </div>
              </FormSection>
            )}

            {isContract && (
              <FormSection icon="request_quote" title={tp('busLabelContractDetails')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label={tp('busLabelPassengers')} name="requestPassengers" type="number" value={form.requestPassengers} onChange={v => set('requestPassengers', v)} placeholder="30" />
                  <div>
                    <label className={labelCls}>{tp('busLabelSchedule')}</label>
                    <select className={inputCls} value={form.requestSchedule} onChange={e => set('requestSchedule', e.target.value)}>
                      <option value="">{tp('lfSelect')}</option>
                      <option value="daily">{tp('busScheduleDaily')}</option>
                      <option value="weekly">{tp('busScheduleWeekly')}</option>
                      <option value="monthly">{tp('busScheduleMonthly')}</option>
                      <option value="one_trip">{tp('busScheduleOneTrip')}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FormInput label={tp('busLabelRoute')} name="requestRoute" value={form.requestRoute} onChange={v => set('requestRoute', v)} placeholder={tp('busPlaceholderRoute')} />
                  </div>
                  <FormInput label={tp('busLabelMonthlyBudget')} name="price" type="number" value={form.price} onChange={v => set('price', v)} placeholder={tp('busPlaceholderOptional')} />
                </div>
              </FormSection>
            )}

            {isRent && (
              <FormSection icon="car_rental" title={tp('busLabelRentalPrices')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label={tp('busLabelDailyPrice')} name="dailyPrice" type="number" value={form.dailyPrice} onChange={v => set('dailyPrice', v)} placeholder="70" />
                  <FormInput label={tp('busLabelMonthlyPrice')} name="monthlyPrice" type="number" value={form.monthlyPrice} onChange={v => set('monthlyPrice', v)} placeholder="1500" />
                  <FormInput label={tp('busLabelMinRental')} name="minRentalDays" type="number" value={form.minRentalDays} onChange={v => set('minRentalDays', v)} placeholder="1" />
                  <FormInput label={tp('busLabelDeposit')} name="depositAmount" type="number" value={form.depositAmount} onChange={v => set('depositAmount', v)} placeholder={tp('busPlaceholderOptional')} />
                  <FormInput label={tp('busLabelAvailableFrom')} name="availableFrom" type="date" value={form.availableFrom} onChange={v => set('availableFrom', v)} />
                  <FormInput label={tp('busLabelAvailableTo')} name="availableTo" type="date" value={form.availableTo} onChange={v => set('availableTo', v)} />
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <FormToggle name="withDriver" label={tp('busLabelWithDriver')} checked={form.withDriver} onChange={v => set('withDriver', v)} />
                  <FormToggle name="deliveryAvailable" label={tp('busLabelDelivery')} checked={form.deliveryAvailable} onChange={v => set('deliveryAvailable', v)} />
                  <FormToggle name="insuranceIncluded" label={tp('busLabelInsurance')} checked={form.insuranceIncluded} onChange={v => set('insuranceIncluded', v)} />
                </div>
                <div className="mt-4">
                  <FormTextarea label={tp('busLabelCancellation')} name="cancellationPolicy" value={form.cancellationPolicy} onChange={v => set('cancellationPolicy', v)} placeholder={tp('busPlaceholderCancellation')} rows={3} />
                </div>
              </FormSection>
            )}
          </div>
        )}

        {/* ── Step 3: الموقع والتواصل والصور ── */}
        {displayStep === 3 && (
          <div className="space-y-8">
            <FormSection icon="location_on" title={tp('busLabelLocation')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('busLabelGovernorate')}</label>
                  <select className={inputCls} value={selectedGov} onChange={e => {
                    setSelectedGov(e.target.value);
                    set('governorate', e.target.value);
                    set('city', '');
                  }}>
                    <option value="">{tp('busSelectGovernorate')}</option>
                    {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('busLabelCity')}</label>
                  <select className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} disabled={!selectedGov}>
                    <option value="">{tp('busSelectCity')}</option>
                    {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 rounded-xl overflow-hidden border border-outline-variant/10">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat: number, lng: number) => { set('latitude', lat); set('longitude', lng); }}
                />
              </div>
            </FormSection>

            <FormSection icon="call" title={tp('busLabelContact')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('busLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('busLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon="photo_camera" title={tp('busLabelPhotos')}>
              {isEdit && images.filter(img => img.id && !img.file).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {images.filter(img => img.id && !img.file).map(img => (
                    <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => img.id && handleRemoveExistingImage(img.id)}
                        className="absolute top-0.5 end-0.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUploader images={images.filter(img => !img.id)} onChange={newImgs => setImages(prev => [...prev.filter(img => img.id && !img.file), ...newImgs])} maxImages={10} />
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
