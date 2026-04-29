'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { useCreateBusListing } from '@/lib/api/buses';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { API_BASE } from '@/lib/config';
import { getGovernorates, getCities } from '@/lib/location-data';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
import { FormErrorOverlay } from '@/components/form-error-overlay';
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

export function AddBusForm() {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '';
  const createBus = useCreateBusListing();
  const { addToast } = useToast();
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [form, setForm] = useState({
    busListingType: initialType,
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
    // sale
    price: '',
    isPriceNegotiable: false,
    // contract
    contractType: '',
    contractClient: '',
    contractMonthly: '',
    contractDuration: '',
    contractExpiry: '',
    // rental
    dailyPrice: '',
    monthlyPrice: '',
    minRentalDays: '',
    withDriver: false,
    deliveryAvailable: false,
    // contract request
    requestPassengers: '',
    requestRoute: '',
    requestSchedule: '',
    // location
    governorate: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
    contactPhone: '',
    whatsapp: '',
  });

  const [selectedGov, setSelectedGov] = useState('');
  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const isContract = form.busListingType === 'BUS_CONTRACT';
  const isSale = form.busListingType === 'BUS_SALE' || form.busListingType === 'BUS_SALE_WITH_CONTRACT';
  const isRent = form.busListingType === 'BUS_RENT';
  const hasContract = form.busListingType === 'BUS_SALE_WITH_CONTRACT';

  const steps = isContract
    ? [{ label: tp('busStepContractType') }, { label: tp('busStepContractDetails') }, { label: tp('busStepContractLocation') }]
    : [{ label: tp('busStepAdType') }, { label: tp('busStepBusInfo') }, { label: tp('busStepPriceDetails') }, { label: tp('busStepLocationPhotos') }];

  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!form.busListingType && (isContract || !!form.busType) :
    step === 1 ? (isContract ? !!form.title && !!form.requestPassengers : !!form.title && !!form.make && !!form.year && !!form.capacity) :
    step === 2 ? (isContract ? true : (isSale ? !!form.price : isRent ? (!!form.dailyPrice || !!form.monthlyPrice) : true)) :
    true;

  async function handleSubmit() {
    setErrorMessages([]);
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

      // Sale fields
      if (form.price) payload.price = parseFloat(form.price);
      payload.isPriceNegotiable = form.isPriceNegotiable;

      // Contract fields
      if (form.contractType) payload.contractType = form.contractType;
      if (form.contractClient) payload.contractClient = form.contractClient;
      if (form.contractMonthly) payload.contractMonthly = parseFloat(form.contractMonthly);
      if (form.contractDuration) payload.contractDuration = parseInt(form.contractDuration);
      if (form.contractExpiry) payload.contractExpiry = form.contractExpiry;

      // Rental fields
      if (form.dailyPrice) payload.dailyPrice = parseFloat(form.dailyPrice);
      if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
      if (form.minRentalDays) payload.minRentalDays = parseInt(form.minRentalDays);
      payload.withDriver = form.withDriver;
      payload.deliveryAvailable = form.deliveryAvailable;

      // Contract request
      if (form.requestPassengers) payload.requestPassengers = parseInt(form.requestPassengers);
      if (form.requestRoute) payload.requestRoute = form.requestRoute;
      if (form.requestSchedule) payload.requestSchedule = form.requestSchedule;

      // Location
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      const bus = await createBus.mutateAsync(payload);

      // Upload images
      if (images.length > 0) {
        const token = getAuthToken();
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await fetch(`${API_BASE}/api/v1/uploads/buses/${bus.id}/images`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd,
            });
          }
        }
      }

      addToast('success', tp('busSuccess'));
      router.push(`/sale/bus/${bus.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('busError');
      setErrorMessages(msg.split('\n').filter(Boolean));
    }
  }

  const isLoading = createBus.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={tp('busSubmit')}
        canProceed={canProceed}
        title={tp('busTitle')}
      >
        {/* ── Step 0: Listing Type ── */}
        {step === 0 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">category</span>{tp('busLabelAdType')}</h2>
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
            </section>

            {!isContract && form.busListingType && (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">directions_bus</span>{tp('busLabelBusType')}</h2>
                <div className="flex flex-wrap gap-2">
                  {BUS_TYPE_KEYS.map(b => (
                    <button key={b.value} type="button" onClick={() => set('busType', b.value)}
                      className={chipCls(form.busType === b.value)}>
                      {tp(b.labelKey)} <span className="text-[10px] opacity-60">({tp(b.descKey)})</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Step 1: Bus Details / Contract Request Details ── */}
        {step === 1 && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">edit</span>{tp('busLabelBasicInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>{tp('busLabelAdTitle')}</label>
                  <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder={isContract ? tp('busPlaceholderContract') : tp('busPlaceholderBus')} />
                </div>
                <div>
                  <label className={labelCls}>{tp('busLabelDescription')}</label>
                  <textarea className={inputCls + ' min-h-[100px]'} rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder={tp('busPlaceholderDesc')} />
                </div>
              </div>
            </section>

            {isContract ? (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">request_quote</span>{tp('busLabelContractDetails')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('busLabelPassengers')}</label>
                    <input type="number" className={inputCls} value={form.requestPassengers} onChange={e => set('requestPassengers', e.target.value)} placeholder="30" />
                  </div>
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
                    <label className={labelCls}>{tp('busLabelRoute')}</label>
                    <input className={inputCls} value={form.requestRoute} onChange={e => set('requestRoute', e.target.value)} placeholder={tp('busPlaceholderRoute')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{tp('busLabelContractType')}</label>
                    <div className="flex flex-wrap gap-2">
                      {CONTRACT_TYPE_KEYS.map(c => (
                        <button key={c.value} type="button" onClick={() => set('contractType', c.value)}
                          className={chipCls(form.contractType === c.value)}>{tp(c.labelKey)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelMonthlyBudget')}</label>
                    <input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder={tp('busPlaceholderOptional')} />
                  </div>
                </div>
              </section>
            ) : (
              <>
                <section className={sectionCls}>
                  <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">directions_bus</span>{tp('busLabelBusData')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{tp('busLabelBrand')}</label>
                      <input className={inputCls} value={form.make} onChange={e => set('make', e.target.value)} placeholder={tp('busPlaceholderBrand')} />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelModel')}</label>
                      <input className={inputCls} value={form.model} onChange={e => set('model', e.target.value)} placeholder="Rosa, Coaster" />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelYear')}</label>
                      <input type="number" className={inputCls} value={form.year} onChange={e => set('year', e.target.value)} placeholder="2020" />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelCapacity')}</label>
                      <input type="number" className={inputCls} value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="30" />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelMileage')}</label>
                      <input type="number" className={inputCls} value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="100000" />
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelPlate')}</label>
                      <input className={inputCls} value={form.plateNumber} onChange={e => set('plateNumber', e.target.value)} />
                    </div>
                  </div>
                </section>

                <section className={sectionCls}>
                  <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">tune</span>{tp('busLabelSpecs')}</h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>{tp('busLabelFuel')}</label>
                        <div className="flex flex-wrap gap-2">
                          {FUEL_TYPE_KEYS.map(f => (
                            <button key={f.value} type="button" onClick={() => set('fuelType', f.value)}
                              className={chipCls(form.fuelType === f.value)}>{tp(f.labelKey)}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>{tp('busLabelTransmission')}</label>
                        <div className="flex flex-wrap gap-2">
                          {[{ value: 'AUTOMATIC', labelKey: 'busTransAutomatic' as const }, { value: 'MANUAL', labelKey: 'busTransManual' as const }].map(t => (
                            <button key={t.value} type="button" onClick={() => set('transmission', t.value)}
                              className={chipCls(form.transmission === t.value)}>{tp(t.labelKey)}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>{tp('busLabelCondition')}</label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITION_KEYS.map(c => (
                          <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                            className={chipCls(form.condition === c.value)}>{tp(c.labelKey)}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={sectionCls}>
                  <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">star</span>{tp('busLabelFeatures')}</h2>
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
                </section>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Price / Contract / Rental ── */}
        {step === 2 && !isContract && (
          <div className="space-y-8">
            {isSale && (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">payments</span>{tp('busLabelPrice')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('busLabelSalePrice')}</label>
                    <input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder="8000" />
                  </div>
                  <div className="flex items-end">
                    <label className={checkboxLabelCls}>
                      <input type="checkbox" checked={form.isPriceNegotiable} onChange={e => set('isPriceNegotiable', e.target.checked)} className={checkboxCls} />
                      <span className={checkboxTextCls}>{tp('busLabelNegotiable')}</span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {hasContract && (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">assignment</span>{tp('busLabelContractAttached')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{tp('busLabelContractType')}</label>
                    <div className="flex flex-wrap gap-2">
                      {CONTRACT_TYPE_KEYS.map(c => (
                        <button key={c.value} type="button" onClick={() => set('contractType', c.value)}
                          className={chipCls(form.contractType === c.value)}>{tp(c.labelKey)}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelClientName')}</label>
                    <input className={inputCls} value={form.contractClient} onChange={e => set('contractClient', e.target.value)} placeholder={tp('busPlaceholderClient')} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelMonthlySalary')}</label>
                    <input type="number" className={inputCls} value={form.contractMonthly} onChange={e => set('contractMonthly', e.target.value)} placeholder="400" />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelContractDuration')}</label>
                    <input type="number" className={inputCls} value={form.contractDuration} onChange={e => set('contractDuration', e.target.value)} placeholder="12" />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelContractExpiry')}</label>
                    <input type="date" className={inputCls} value={form.contractExpiry} onChange={e => set('contractExpiry', e.target.value)} />
                  </div>
                </div>
              </section>
            )}

            {isRent && (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">car_rental</span>{tp('busLabelRentalPrices')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('busLabelDailyPrice')}</label>
                    <input type="number" className={inputCls} value={form.dailyPrice} onChange={e => set('dailyPrice', e.target.value)} placeholder="70" />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelMonthlyPrice')}</label>
                    <input type="number" className={inputCls} value={form.monthlyPrice} onChange={e => set('monthlyPrice', e.target.value)} placeholder="1500" />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('busLabelMinRental')}</label>
                    <input type="number" className={inputCls} value={form.minRentalDays} onChange={e => set('minRentalDays', e.target.value)} placeholder="1" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={form.withDriver} onChange={e => set('withDriver', e.target.checked)} className={checkboxCls} />
                    <span className={checkboxTextCls}>{tp('busLabelWithDriver')}</span>
                  </label>
                  <label className={checkboxLabelCls}>
                    <input type="checkbox" checked={form.deliveryAvailable} onChange={e => set('deliveryAvailable', e.target.checked)} className={checkboxCls} />
                    <span className={checkboxTextCls}>{tp('busLabelDelivery')}</span>
                  </label>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Last Step: Location + Images ── */}
        {step === maxStep && (
          <div className="space-y-8">
            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">location_on</span>{tp('busLabelLocation')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('busLabelGovernorate')}</label>
                  <select className={inputCls} value={selectedGov} onChange={e => { setSelectedGov(e.target.value); set('governorate', e.target.value); set('city', ''); }}>
                    <option value="">{tp('busSelectGovernorate')}</option>
                    {governorateOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('busLabelCity')}</label>
                  <select className={inputCls} value={form.city} onChange={e => set('city', e.target.value)}>
                    <option value="">{tp('busSelectCity')}</option>
                    {cityOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
            </section>

            <section className={sectionCls}>
              <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">call</span>{tp('busLabelContact')}</h2>
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
            </section>

            {!isContract && (
              <section className={sectionCls}>
                <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">photo_camera</span>{tp('busLabelPhotos')}</h2>
                <ImageUploader images={images} onChange={setImages} maxImages={10} />
              </section>
            )}
          </div>
        )}
      </MultiStepForm>

      <FormErrorOverlay messages={errorMessages} onClose={() => setErrorMessages([])} />
    </>
  );
}
