'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from './shared';
import { useCreateEquipmentListing, useUpdateEquipmentListing, useRemoveEquipmentImage, type EquipmentListingItem } from '@/lib/api/equipment';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const EQUIP_TYPE_KEYS = [
  { value: 'EXCAVATOR', labelKey: 'eqExcavator', icon: 'precision_manufacturing' },
  { value: 'CRANE', labelKey: 'eqCrane', icon: 'switch_access_2' },
  { value: 'LOADER', labelKey: 'eqLoader', icon: 'front_loader' },
  { value: 'BULLDOZER', labelKey: 'eqBulldozer', icon: 'agriculture' },
  { value: 'FORKLIFT', labelKey: 'eqForklift', icon: 'forklift' },
  { value: 'CONCRETE_MIXER', labelKey: 'eqConcreteMixer', icon: 'blender' },
  { value: 'GENERATOR', labelKey: 'eqGenerator', icon: 'bolt' },
  { value: 'COMPRESSOR', labelKey: 'eqCompressor', icon: 'air' },
  { value: 'SCAFFOLDING', labelKey: 'eqScaffolding', icon: 'construction' },
  { value: 'WELDING_MACHINE', labelKey: 'eqWelding', icon: 'hardware' },
  { value: 'TRUCK', labelKey: 'eqTruck', icon: 'local_shipping' },
  { value: 'DUMP_TRUCK', labelKey: 'eqDumpTruck', icon: 'local_shipping' },
  { value: 'WATER_TANKER', labelKey: 'eqWaterTanker', icon: 'water_drop' },
  { value: 'LIGHT_EQUIPMENT', labelKey: 'eqLightEquip', icon: 'build' },
  { value: 'OTHER_EQUIPMENT', labelKey: 'eqOther', icon: 'category' },
] as const;

const CONDITION_KEYS = [
  { value: 'NEW', labelKey: 'eqCondNew' },
  { value: 'LIKE_NEW', labelKey: 'eqCondLikeNew' },
  { value: 'GOOD', labelKey: 'eqCondGood' },
  { value: 'USED', labelKey: 'eqCondUsed' },
  { value: 'FAIR', labelKey: 'eqCondFair' },
] as const;

const EQUIP_FEATURE_LABELS = [
  'GPS', 'مكيف هواء', 'كاميرا', 'مسجل رقمي', 'بلوتوث', 'شاشات',
  'رافعة هيدروليكية', 'بوكسة أوتوماتيك', 'مولّد احتياطي', 'أضواء عمل', 'مرسوم', 'بيانات الساعات',
] as const;

const DEFAULT_FORM = {
  listingType: '',
  equipmentType: '',
  title: '',
  description: '',
  make: '',
  model: '',
  year: '',
  condition: 'USED',
  capacity: '',
  power: '',
  weight: '',
  hoursUsed: '',
  features: [] as string[],
  price: '',
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  isPriceNegotiable: false,
  withOperator: false,
  deliveryAvailable: false,
  minRentalDays: '',
  depositAmount: '',
  insuranceIncluded: false,
  availableFrom: '',
  availableTo: '',
  cancellationPolicy: '',
  governorate: '',
  city: '',
  latitude: null as number | null,
  longitude: null as number | null,
  contactPhone: '',
  whatsapp: '',
};

export interface EquipmentFormProps {
  mode: 'add' | 'edit';
  initialData?: EquipmentListingItem;
  id?: string;
}

export function EquipmentForm({ mode, initialData, id }: EquipmentFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createEquip = useCreateEquipmentListing();
  const updateEquip = useUpdateEquipmentListing();
  const removeImage = useRemoveEquipmentImage();
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
      listingType: initialData.listingType ?? '',
      equipmentType: initialData.equipmentType ?? '',
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      make: initialData.make ?? '',
      model: initialData.model ?? '',
      year: String(initialData.year ?? ''),
      condition: initialData.condition ?? 'USED',
      capacity: initialData.capacity ?? '',
      power: initialData.power ?? '',
      weight: initialData.weight ?? '',
      hoursUsed: String(initialData.hoursUsed ?? ''),
      features: initialData.features ?? [],
      price: String(initialData.price ?? ''),
      dailyPrice: String(initialData.dailyPrice ?? ''),
      weeklyPrice: String(initialData.weeklyPrice ?? ''),
      monthlyPrice: String(initialData.monthlyPrice ?? ''),
      isPriceNegotiable: initialData.isPriceNegotiable ?? false,
      withOperator: initialData.withOperator ?? false,
      deliveryAvailable: initialData.deliveryAvailable ?? false,
      minRentalDays: String(initialData.minRentalDays ?? ''),
      depositAmount: String(initialData.depositAmount ?? ''),
      insuranceIncluded: initialData.insuranceIncluded ?? false,
      availableFrom: initialData.availableFrom?.slice(0, 10) ?? '',
      availableTo: initialData.availableTo?.slice(0, 10) ?? '',
      cancellationPolicy: initialData.cancellationPolicy ?? '',
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

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const isRent = form.listingType === 'EQUIPMENT_RENT';

  const allSteps = [
    { label: tp('eqStepType'), icon: 'category' },
    { label: tp('eqStepSpecs'), icon: 'settings' },
    { label: tp('eqStepPrice'), icon: 'payments' },
    { label: tp('eqStepPhotos'), icon: 'photo_camera' },
  ];
  const steps = isEdit ? allSteps.slice(1) : allSteps;
  const maxStep = steps.length - 1;
  const displayStep = isEdit ? step + 1 : step;

  const canProceed =
    displayStep === 0 ? !!(form.listingType && form.equipmentType) :
    displayStep === 1 ? !!(form.title && form.description) :
    displayStep === 2 ? (isRent ? !!(form.dailyPrice || form.monthlyPrice) : !!form.price) :
    true;

  async function handleSubmit() {
    setErrors([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        equipmentType: form.equipmentType,
        listingType: form.listingType,
        condition: form.condition,
      };

      if (form.make) payload.make = form.make;
      if (form.model) payload.model = form.model;
      if (form.year) payload.year = Number(form.year);
      if (form.capacity) payload.capacity = form.capacity;
      if (form.power) payload.power = form.power;
      if (form.weight) payload.weight = form.weight;
      if (form.hoursUsed) payload.hoursUsed = Number(form.hoursUsed);
      if (form.features.length) payload.features = form.features;
      if (form.price) payload.price = Number(form.price);
      if (form.dailyPrice) payload.dailyPrice = Number(form.dailyPrice);
      if (form.weeklyPrice) payload.weeklyPrice = Number(form.weeklyPrice);
      if (form.monthlyPrice) payload.monthlyPrice = Number(form.monthlyPrice);
      payload.isPriceNegotiable = form.isPriceNegotiable;
      payload.withOperator = form.withOperator;
      payload.deliveryAvailable = form.deliveryAvailable;
      if (form.minRentalDays) payload.minRentalDays = Number(form.minRentalDays);
      if (form.depositAmount) payload.depositAmount = Number(form.depositAmount);
      if (isRent) payload.insuranceIncluded = form.insuranceIncluded;
      if (form.availableFrom) payload.availableFrom = form.availableFrom;
      if (form.availableTo) payload.availableTo = form.availableTo;
      if (form.cancellationPolicy) payload.cancellationPolicy = form.cancellationPolicy;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      const redirectBase = `${isRent ? '/rental' : '/sale'}/equipment/`;

      if (isEdit && id) {
        await updateEquip.mutateAsync({ id, data: payload });
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/equipment/${id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('eqSuccess'));
        router.push(`${redirectBase}${id}`);
      } else {
        const result = await createEquip.mutateAsync(payload);
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/equipment/${result.id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('eqSuccess'));
        router.push(`${redirectBase}${result.id}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : tp('eqError');
      setErrors([msg]);
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

  const isLoading = isEdit ? updateEquip.isPending : createEquip.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={isEdit ? tp('eqEditSubmit') : tp('eqSubmit')}
        canProceed={canProceed}
        title={isEdit ? tp('eqEditTitle') : tp('eqTitle')}
      >
        {/* ── Step 0: نوع الإعلان ونوع المعدة (add only) ── */}
        {displayStep === 0 && (
          <div className="space-y-8">
            <FormSection icon="category" title={tp('eqLabelAdType')}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'EQUIPMENT_SALE', lKey: 'eqTypeSale' as const, i: 'sell', dKey: 'eqTypeSaleDesc' as const },
                  { v: 'EQUIPMENT_RENT', lKey: 'eqTypeRent' as const, i: 'car_rental', dKey: 'eqTypeRentDesc' as const },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => set('listingType', opt.v)}
                    className={`p-4 rounded-2xl border-2 text-start transition-all ${form.listingType === opt.v ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                    <span className="material-symbols-outlined text-2xl text-primary mb-2 block">{opt.i}</span>
                    <p className="font-bold text-sm">{tp(opt.lKey)}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{tp(opt.dKey)}</p>
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection icon="construction" title={tp('eqLabelEquipType')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {EQUIP_TYPE_KEYS.map(t => (
                  <button key={t.value} type="button" onClick={() => set('equipmentType', t.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${form.equipmentType === t.value ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                    <span className="material-symbols-outlined text-xl text-primary">{t.icon}</span>
                    <span className="text-[10px] font-bold">{tp(t.labelKey)}</span>
                  </button>
                ))}
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 1: المواصفات ── */}
        {displayStep === 1 && (
          <div className="space-y-6">
            <FormSection icon="edit_note" title={tp('eqLabelBasicInfo')}>
              <div className="space-y-4">
                <FormInput label={tp('eqLabelTitle')} name="title" value={form.title} onChange={v => set('title', v)} placeholder={tp('eqPlaceholderTitle')} required />
                <FormTextarea label={tp('eqLabelDesc')} name="description" value={form.description} onChange={v => set('description', v)} placeholder={tp('eqPlaceholderDesc')} rows={4} />
              </div>
            </FormSection>

            <FormSection icon="settings" title={tp('eqLabelTechSpecs')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label={tp('eqLabelBrand')} name="make" value={form.make} onChange={v => set('make', v)} placeholder="Caterpillar" />
                <FormInput label={tp('eqLabelModel')} name="model" value={form.model} onChange={v => set('model', v)} placeholder="320D" />
                <FormInput label={tp('eqLabelYear')} name="year" type="number" value={form.year} onChange={v => set('year', v)} placeholder="2020" />
                <div>
                  <label className={labelCls}>{tp('eqLabelCondition')}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CONDITION_KEYS.map(c => (
                      <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                        className={chipCls(form.condition === c.value)}>{tp(c.labelKey)}</button>
                    ))}
                  </div>
                </div>
                <FormInput label={tp('eqLabelCapacity')} name="capacity" value={form.capacity} onChange={v => set('capacity', v)} placeholder="20 ton" />
                <FormInput label={tp('eqLabelPower')} name="power" value={form.power} onChange={v => set('power', v)} placeholder="150 HP" />
                <FormInput label={tp('eqLabelWeight')} name="weight" value={form.weight} onChange={v => set('weight', v)} placeholder="22,000 kg" />
                <FormInput label={tp('eqLabelHours')} name="hoursUsed" type="number" value={form.hoursUsed} onChange={v => set('hoursUsed', v)} placeholder="5000" />
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: السعر والإتاحة ── */}
        {displayStep === 2 && (
          <div className="space-y-6">
            <FormSection icon="payments" title={tp('eqLabelPrice')}>
              <div className="space-y-4">
                {!isRent ? (
                  <FormInput label={tp('eqLabelSalePrice')} name="price" type="number" value={form.price} onChange={v => set('price', v)} placeholder="0.000" />
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <FormInput label={tp('eqLabelDaily')} name="dailyPrice" type="number" value={form.dailyPrice} onChange={v => set('dailyPrice', v)} />
                    <FormInput label={tp('eqLabelWeekly')} name="weeklyPrice" type="number" value={form.weeklyPrice} onChange={v => set('weeklyPrice', v)} />
                    <FormInput label={tp('eqLabelMonthly')} name="monthlyPrice" type="number" value={form.monthlyPrice} onChange={v => set('monthlyPrice', v)} />
                  </div>
                )}
                <div className="flex flex-wrap gap-5 mt-2">
                  <FormToggle name="isPriceNegotiable" label={tp('eqLabelNegotiable')} checked={form.isPriceNegotiable} onChange={v => set('isPriceNegotiable', v)} />
                  <FormToggle name="withOperator" label={tp('eqLabelWithOperator')} checked={form.withOperator} onChange={v => set('withOperator', v)} />
                  <FormToggle name="deliveryAvailable" label={tp('eqLabelDelivery')} checked={form.deliveryAvailable} onChange={v => set('deliveryAvailable', v)} />
                </div>
              </div>
            </FormSection>

            {isRent && (
              <FormSection icon="car_rental" title={tp('eqStepPrice')}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label={tp('eqLabelMinRental')} name="minRentalDays" type="number" value={form.minRentalDays} onChange={v => set('minRentalDays', v)} />
                    <FormInput label={tp('eqLabelDeposit')} name="depositAmount" type="number" value={form.depositAmount} onChange={v => set('depositAmount', v)} placeholder={tp('eqPlaceholderOptional')} />
                    <FormInput label={tp('eqLabelAvailableFrom')} name="availableFrom" type="date" value={form.availableFrom} onChange={v => set('availableFrom', v)} />
                    <FormInput label={tp('eqLabelAvailableTo')} name="availableTo" type="date" value={form.availableTo} onChange={v => set('availableTo', v)} />
                  </div>
                  <FormToggle name="insuranceIncluded" label={tp('eqLabelInsurance')} checked={form.insuranceIncluded} onChange={v => set('insuranceIncluded', v)} />
                  <FormTextarea label={tp('eqLabelCancellation')} name="cancellationPolicy" value={form.cancellationPolicy} onChange={v => set('cancellationPolicy', v)} placeholder={tp('eqPlaceholderCancellation')} rows={3} />
                </div>
              </FormSection>
            )}

            <FormSection icon="star" title={tp('eqLabelFeatures')}>
              <div className="flex flex-wrap gap-2">
                {EQUIP_FEATURE_LABELS.map(label => (
                  <button key={label} type="button"
                    onClick={() => set('features', form.features.includes(label) ? form.features.filter(f => f !== label) : [...form.features, label])}
                    className={chipCls(form.features.includes(label))}>{label}</button>
                ))}
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 3: الموقع والتواصل والصور ── */}
        {displayStep === 3 && (
          <div className="space-y-6">
            <FormSection icon="location_on" title={tp('eqLabelLocationContact')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('eqLabelGovernorate')}</label>
                  <select className={inputCls} value={selectedGov} onChange={e => {
                    setSelectedGov(e.target.value);
                    set('governorate', e.target.value);
                    set('city', '');
                  }}>
                    <option value="">{tp('eqSelectGovernorate')}</option>
                    {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelCity')}</label>
                  <select className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} disabled={!selectedGov}>
                    <option value="">{tp('eqPlaceholderCity')}</option>
                    {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('eqLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
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

            <FormSection icon="photo_camera" title={tp('eqLabelPhotos')}>
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
