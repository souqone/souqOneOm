'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ImageUploader, type UploadedImage } from './image-uploader';
import { useBrands, useCarModels, useCarYears } from '@/lib/api';
import { getGovernorates, getCities } from '@/lib/location-data';
import { fuelLabels as fuelLabelsT, transmissionLabels as transLabelsT, conditionLabels as condLabelsT, cancelLabels as cancelLabelsT, exteriorColors as exteriorColorsT, interiorColors as interiorColorsT, BODY_OPTIONS, DRIVE_OPTIONS, CANCEL_OPTIONS } from '@/lib/constants/mappings';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from '@/features/ads/components/forms/shared';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

export interface ListingFormData {
  title: string;
  make: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  condition: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  engineSize: string;
  horsepower: string;
  doors: string;
  seats: string;
  driveType: string;
  description: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isPriceNegotiable: boolean;
  listingType: 'SALE' | 'RENTAL' | 'WANTED';
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  minRentalDays: string;
  depositAmount: string;
  kmLimitPerDay: string;
  withDriver: boolean;
  deliveryAvailable: boolean;
  insuranceIncluded: boolean;
  cancellationPolicy: string;
}

const defaultData: ListingFormData = {
  title: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  price: '',
  currency: 'OMR',
  mileage: '',
  fuelType: '',
  transmission: '',
  condition: '',
  bodyType: '',
  exteriorColor: '',
  interiorColor: '',
  features: [],
  engineSize: '',
  horsepower: '',
  doors: '',
  seats: '',
  driveType: '',
  description: '',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  isPriceNegotiable: false,
  listingType: 'SALE',
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  minRentalDays: '1',
  depositAmount: '',
  kmLimitPerDay: '',
  withDriver: false,
  deliveryAvailable: false,
  insuranceIncluded: false,
  cancellationPolicy: '',
};

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  initialImages?: UploadedImage[];
  onSubmit: (data: Record<string, unknown>, images: UploadedImage[]) => Promise<void>;
  isLoading: boolean;
  errorMessages: string[];
  onClearErrors: () => void;
  submitLabel: string;
  title?: string;
}

const CAR_FEATURE_KEYS = [
  'lfFeatureTouchscreen', 'lfFeatureRearCamera', 'lfFeature360Camera', 'lfFeatureParkingSensors',
  'lfFeatureGPS', 'lfFeatureSeatHeaters', 'lfFeatureSeatCooling', 'lfFeatureLeatherSeats',
  'lfFeatureSunroof', 'lfFeatureBluetooth', 'lfFeatureCarPlay', 'lfFeatureAndroidAuto',
  'lfFeatureCruiseControl', 'lfFeatureSmartKey', 'lfFeatureRemoteStart', 'lfFeatureAutoAC',
  'lfFeatureLED', 'lfFeatureAudio', 'lfFeatureRainSensor', 'lfFeatureRemoteOpen',
  'lfFeatureElectricMirrors', 'lfFeatureElectricWindows', 'lfFeatureLaneAssist', 'lfFeatureAutoBrake',
  'lfFeatureWirelessCharger', 'lfFeatureBlindSpot', 'lfFeatureAdaptiveCruise',
] as const;

const fuelOptions = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'];
const transOptions = ['AUTOMATIC', 'MANUAL'];
const condOptions = ['NEW', 'USED', 'LIKE_NEW'];
const bodyOptions = [...BODY_OPTIONS];
const driveOptions = [...DRIVE_OPTIONS];

const cancelOptions = [...CANCEL_OPTIONS];

export function ListingForm({ initialData, initialImages, onSubmit, isLoading, errorMessages, onClearErrors, submitLabel, title: customTitle }: ListingFormProps) {
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const tc = useTranslations('colors');
  const locale = useLocale();
  const fuelLabels = fuelLabelsT(tm);
  const transLabels = transLabelsT(tm);
  const condLabels = condLabelsT(tm);
  const cancelLabels_ = cancelLabelsT(tm);
  const extColors = exteriorColorsT(tc);
  const intColors = interiorColorsT(tc);
  const [form, setForm] = useState<ListingFormData>({ ...defaultData, ...initialData });
  const [images, setImages] = useState<UploadedImage[]>(initialImages ?? []);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useCarModels(selectedBrandId);
  const { data: years = [] } = useCarYears(selectedModelId);

  const [selectedGov, setSelectedGov] = useState('');
  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  useEffect(() => {
    if (initialData) setForm((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    if (initialImages) setImages(initialImages);
  }, [initialImages]);

  // Auto-select brand dropdown from initialData.make once brands are loaded
  useEffect(() => {
    if (!initialData?.make || !brands.length || selectedBrandId) return;
    const match = brands.find(b => b.name.toLowerCase() === initialData.make!.toLowerCase());
    if (match) setSelectedBrandId(match.id);
  }, [brands, initialData?.make, selectedBrandId]);

  // Auto-select model dropdown from initialData.model once models are loaded
  useEffect(() => {
    if (!initialData?.model || !models.length || selectedModelId) return;
    const match = models.find(m => m.name.toLowerCase() === initialData.model!.toLowerCase());
    if (match) setSelectedModelId(match.id);
  }, [models, initialData?.model, selectedModelId]);

  // Auto-set governorate from initialData.governorate once governorateOptions are available
  useEffect(() => {
    if (!initialData?.governorate || selectedGov) return;
    const match = governorateOptions.find(g => g.label === initialData.governorate);
    if (match) setSelectedGov(match.value);
  }, [governorateOptions, initialData?.governorate, selectedGov]);

  function set<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isRental = form.listingType === 'RENTAL';
    const isWanted = form.listingType === 'WANTED';
    const payload: Record<string, unknown> = {
      title: form.title,
      make: form.make,
      model: form.model,
      year: form.year,
      price: isRental || isWanted ? (form.price ? parseFloat(form.price) : 0) : parseFloat(form.price),
      currency: form.currency,
      description: form.description,
      isPriceNegotiable: isRental ? false : form.isPriceNegotiable,
      listingType: form.listingType,
    };
    if (form.mileage) payload.mileage = parseInt(form.mileage);
    if (form.fuelType) payload.fuelType = form.fuelType;
    if (form.transmission) payload.transmission = form.transmission;
    if (form.condition) payload.condition = form.condition;
    if (form.bodyType) payload.bodyType = form.bodyType;
    if (form.exteriorColor) payload.exteriorColor = form.exteriorColor;
    if (form.interiorColor) payload.interior = form.interiorColor;
    if (form.features.length > 0) payload.features = form.features;
    if (form.engineSize) payload.engineSize = form.engineSize;
    if (form.horsepower) payload.horsepower = parseInt(form.horsepower);
    if (form.doors) payload.doors = parseInt(form.doors);
    if (form.seats) payload.seats = parseInt(form.seats);
    if (form.driveType) payload.driveType = form.driveType;
    if (form.governorate) payload.governorate = form.governorate;
    if (form.city) payload.city = form.city;
    if (form.latitude) payload.latitude = form.latitude;
    if (form.longitude) payload.longitude = form.longitude;

    if (isRental) {
      if (form.dailyPrice) payload.dailyPrice = parseFloat(form.dailyPrice);
      if (form.weeklyPrice) payload.weeklyPrice = parseFloat(form.weeklyPrice);
      if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
      if (form.minRentalDays) payload.minRentalDays = parseInt(form.minRentalDays);
      if (form.depositAmount) payload.depositAmount = parseFloat(form.depositAmount);
      if (form.kmLimitPerDay) payload.kmLimitPerDay = parseInt(form.kmLimitPerDay);
      payload.withDriver = form.withDriver;
      payload.deliveryAvailable = form.deliveryAvailable;
      payload.insuranceIncluded = form.insuranceIncluded;
      if (form.cancellationPolicy) payload.cancellationPolicy = form.cancellationPolicy;
    }

    await onSubmit(payload, images);
  }

  const [step, setStep] = useState(0);


  const steps = [
    { label: tp('lfStep1') },
    { label: tp('lfStep2') },
    { label: tp('lfStep3') },
  ];

  const canProceedStep0 = !!form.make && !!form.model && !!form.year;
  const canProceedStep1 = true;
  const canProceedStep2 = form.listingType === 'RENTAL' ? !!form.dailyPrice : form.listingType === 'WANTED' ? true : !!form.price;
  const canProceed = step === 0 ? canProceedStep0 : step === 1 ? canProceedStep1 : canProceedStep2;

  return (
    <MultiStepForm
      steps={steps}
      currentStep={step}
      onNext={() => { setStep(s => Math.min(s + 1, steps.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
      isLoading={isLoading}
      submitLabel={submitLabel}
      canProceed={canProceed}
      title={customTitle || (form.listingType === 'RENTAL' ? tp('lfTitleRental') : form.listingType === 'WANTED' ? tp('lfTitleWanted') : tp('lfTitleSale'))}
    >
      {/* ═══ Step 1: البيانات الأساسية ═══ */}
      {step === 0 && (
        <div className="space-y-8">
          {/* Listing Type Toggle */}
          <FormSection icon="sell" title={tp('lfSectionLabel')}>
            <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
              <span className="text-primary text-lg">🚗</span>
              <span className="text-sm text-on-surface-variant">{tp('lfCategoryName')}</span>
              <span className="text-on-surface-variant/40 mx-1">›</span>
              <span className="text-sm font-bold text-on-surface">{form.listingType === 'RENTAL' ? tp('lfCatRental') : form.listingType === 'WANTED' ? tp('lfCatWanted') : tp('lfCatSale')}</span>
            </div>
            <div className="flex gap-2 mt-4">
              {[
                { value: 'SALE' as const, label: tp('lfTypeSale'), icon: 'sell' },
                { value: 'RENTAL' as const, label: tp('lfTypeRental'), icon: 'car_rental' },
                { value: 'WANTED' as const, label: tp('lfTypeWanted'), icon: 'search' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('listingType', opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    form.listingType === opt.value
                      ? opt.value === 'WANTED' ? 'bg-orange-500 text-white shadow-lg' : 'bg-primary text-white shadow-lg'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </FormSection>

          {/* Images */}
          <FormSection icon="add_photo_alternate" title={tp('lfUploadTitle')}>
            <ImageUploader images={images} onChange={setImages} disabled={isLoading} />
            <p className="text-xs text-on-surface-variant mt-3">{tp('lfUploadHint')}</p>
          </FormSection>

          {/* Basic Info */}
          <FormSection icon="directions_car" title={tp('lfBasicInfoTitle')}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfBrand')}</label>
                  <select required value={selectedBrandId} onChange={(e) => {
                    const brand = brands.find(b => b.id === e.target.value);
                    setSelectedBrandId(e.target.value);
                    setSelectedModelId('');
                    set('make', brand?.name ?? '');
                    set('model', '');
                    set('year', 0);
                  }} className={inputCls}>
                    <option value="">{tp('lfSelectBrand')}</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.nameAr || b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfModel')}</label>
                  <select required value={selectedModelId} onChange={(e) => {
                    const model = models.find(m => m.id === e.target.value);
                    setSelectedModelId(e.target.value);
                    set('model', model?.name ?? '');
                    set('year', 0);
                  }} className={inputCls} disabled={!selectedBrandId}>
                    <option value="">{selectedBrandId ? tp('lfSelectModel') : tp('lfSelectBrandFirst')}</option>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.nameAr || m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfYear')}</label>
                  <select required value={form.year || ''} onChange={(e) => set('year', parseInt(e.target.value))} className={inputCls} disabled={!selectedModelId}>
                    <option value="">{selectedModelId ? tp('lfSelectYear') : tp('lfSelectModelFirst')}</option>
                    {years.map((y) => <option key={y.id} value={y.year}>{y.year}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfCondition')}</label>
                  <div className="flex gap-3">
                    {condOptions.map((c) => (
                      <button key={c} type="button" onClick={() => set('condition', c)}
                        className={chipCls(form.condition === c) + ' flex-1'}>
                        {condLabels[c]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfMileage')}</label>
                  <input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} placeholder={tp('lfMileagePlaceholder')} className={inputCls} />
                </div>
              </div>
            </div>
          </FormSection>
        </div>
      )}

      {/* ═══ Step 2: تفاصيل السيارة والملكية ═══ */}
      {step === 1 && (
        <div className="space-y-8">
          <FormSection icon="tune" title={tp('lfCarDetailsTitle')}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfFuelType')}</label>
                  <select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)} className={inputCls}>
                    <option value="">{tp('lfSelect')}</option>
                    {fuelOptions.map((f) => <option key={f} value={f}>{fuelLabels[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfTransmission')}</label>
                  <select value={form.transmission} onChange={(e) => set('transmission', e.target.value)} className={inputCls}>
                    <option value="">{tp('lfSelect')}</option>
                    {transOptions.map((t) => <option key={t} value={t}>{transLabels[t]}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfBodyType')}</label>
                  <select value={form.bodyType} onChange={(e) => set('bodyType', e.target.value)} className={inputCls}>
                    <option value="">{tp('lfSelect')}</option>
                    {bodyOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfDriveType')}</label>
                  <select value={form.driveType} onChange={(e) => set('driveType', e.target.value)} className={inputCls}>
                    <option value="">{tp('lfSelect')}</option>
                    {driveOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfExteriorColor')}</label>
                  <div className="relative">
                    <select value={form.exteriorColor} onChange={(e) => set('exteriorColor', e.target.value)} className={inputCls} style={{ paddingInlineEnd: '2.5rem' }}>
                      <option value="">{tp('lfSelectColor')}</option>
                      {extColors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {form.exteriorColor && (
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-outline-variant/30 shadow-sm" style={{ backgroundColor: extColors.find(c => c.value === form.exteriorColor)?.hex || '#ccc' }} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfInteriorColor')}</label>
                  <div className="relative">
                    <select value={form.interiorColor} onChange={(e) => set('interiorColor', e.target.value)} className={inputCls} style={{ paddingInlineEnd: '2.5rem' }}>
                      <option value="">{tp('lfSelectColor')}</option>
                      {intColors.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {form.interiorColor && (
                      <span className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-outline-variant/30 shadow-sm" style={{ backgroundColor: intColors.find(c => c.value === form.interiorColor)?.hex || '#ccc' }} />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>{tp('lfEngineSize')}</label>
                  <input type="text" value={form.engineSize} onChange={(e) => set('engineSize', e.target.value)} placeholder="2.5L" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('lfHorsepower')}</label>
                  <input type="number" value={form.horsepower} onChange={(e) => set('horsepower', e.target.value)} placeholder="200" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{tp('lfDoors')}</label>
                  <input type="number" value={form.doors} onChange={(e) => set('doors', e.target.value)} placeholder="4" className={inputCls} />
                </div>
              </div>
            </div>
          </FormSection>

          {/* Features / Amenities */}
          <section className={sectionCls}>
            <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">star</span>{tp('lfFeaturesTitle')} <span className="text-xs font-normal text-on-surface-variant ms-1">({tp('lfFeaturesCount', { count: form.features.length })})</span></h2>
            <div className="flex flex-wrap gap-2.5">
              {CAR_FEATURE_KEYS.map((key) => {
                const label = tp(key);
                const selected = form.features.includes(label);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        features: selected
                          ? prev.features.filter((f) => f !== label)
                          : [...prev.features, label],
                      }));
                    }}
                    className={chipCls(selected)}
                  >
                    {selected && <span className="ms-1">✓</span>} {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Rental-specific fields */}
          {form.listingType === 'RENTAL' && (
            <FormSection icon="car_rental" title={tp('lfRentalDetailsTitle')}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>{tp('lfMinRentalDays')}</label>
                    <input type="number" min="1" value={form.minRentalDays} onChange={(e) => set('minRentalDays', e.target.value)} placeholder="1" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('lfKmLimitPerDay')}</label>
                    <input type="number" value={form.kmLimitPerDay} onChange={(e) => set('kmLimitPerDay', e.target.value)} placeholder="250" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('lfCancelPolicy')}</label>
                    <select value={form.cancellationPolicy} onChange={(e) => set('cancellationPolicy', e.target.value)} className={inputCls}>
                      <option value="">{tp('lfSelect')}</option>
                      {cancelOptions.map((c) => <option key={c} value={c}>{cancelLabels_[c]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormToggle name="withDriver" label={tp('lfWithDriver')} checked={form.withDriver} onChange={(v) => set('withDriver', v)} />
                  <FormToggle name="deliveryAvailable" label={tp('lfDeliveryAvailable')} checked={form.deliveryAvailable} onChange={(v) => set('deliveryAvailable', v)} />
                  <FormToggle name="insuranceIncluded" label={tp('lfInsuranceIncluded')} checked={form.insuranceIncluded} onChange={(v) => set('insuranceIncluded', v)} />
                </div>
              </div>
            </FormSection>
          )}
        </div>
      )}

      {/* ═══ Step 3: تفاصيل الإعلان وبيانات الاتصال ═══ */}
      {step === 2 && (
        <div className="space-y-8">
          <FormSection icon="edit_note" title={tp('lfAdDetailsTitle')}>
            <div className="space-y-5">
              <FormInput label={tp('lfAdTitle')} name="title" value={form.title} onChange={(v) => set('title', v)} type="text" required placeholder={tp('lfAdTitlePlaceholder')} />
              <FormTextarea label={tp('lfDescription')} name="description" value={form.description} onChange={(v) => set('description', v)} placeholder={tp('lfDescriptionPlaceholder')} rows={4} />
            </div>
          </FormSection>

          {/* Pricing */}
          <FormSection icon="payments" title={form.listingType === 'RENTAL' ? tp('lfPricingRental') : form.listingType === 'WANTED' ? tp('lfPricingWanted') : tp('lfPricingSale')}>
            {form.listingType === 'WANTED' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('lfBudgetLabel')}</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder={tp('lfBudgetPlaceholder')} className={inputCls} />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant">{tp('lfBudgetHint')}</p>
              </div>
            ) : form.listingType === 'SALE' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('lfSalePrice')}</label>
                    <input type="number" required step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.000" className={inputCls} />
                  </div>
                </div>
                <FormToggle name="isPriceNegotiable" label={tp('lfNegotiable')} checked={form.isPriceNegotiable} onChange={(v) => set('isPriceNegotiable', v)} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>{tp('lfDailyPrice')}</label>
                    <input type="number" required step="0.001" value={form.dailyPrice} onChange={(e) => set('dailyPrice', e.target.value)} placeholder="15.000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('lfWeeklyPrice')}</label>
                    <input type="number" step="0.001" value={form.weeklyPrice} onChange={(e) => set('weeklyPrice', e.target.value)} placeholder="90.000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('lfMonthlyPrice')}</label>
                    <input type="number" step="0.001" value={form.monthlyPrice} onChange={(e) => set('monthlyPrice', e.target.value)} placeholder="300.000" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('lfDepositAmount')}</label>
                  <input type="number" step="0.001" value={form.depositAmount} onChange={(e) => set('depositAmount', e.target.value)} placeholder="50.000" className={inputCls} />
                </div>
              </div>
            )}
          </FormSection>

          {/* Location */}
          <FormSection icon="location_on" title={tp('lfLocationTitle')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{tp('lfGovernorate')}</label>
                <select value={selectedGov} onChange={(e) => {
                  setSelectedGov(e.target.value);
                  set('governorate', e.target.value);
                  set('city', '');
                }} className={inputCls}>
                  <option value="">{tp('lfSelectGovernorate')}</option>
                  {governorateOptions.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tp('lfCity')}</label>
                <select value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} disabled={!selectedGov}>
                  <option value="">{tp('lfSelectCity')}</option>
                  {cityOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <label className={labelCls}>{tp('lfMapLabel')}</label>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => {
                  set('latitude', lat);
                  set('longitude', lng);
                }}
              />
            </div>
          </FormSection>

        </div>
      )}

      <FormErrorDisplay errors={errorMessages} onClose={onClearErrors} />
    </MultiStepForm>
  );
}
