'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from './shared';
import { useCreateCarService, useUpdateCarService, useRemoveServiceImage, type CarServiceItem } from '@/lib/api/services';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const SERVICE_TYPES = [
  { value: 'MAINTENANCE', key: 'svcMaintenance' },
  { value: 'CLEANING', key: 'svcCleaning' },
  { value: 'MODIFICATION', key: 'svcModification' },
  { value: 'INSPECTION', key: 'svcInspection' },
  { value: 'BODYWORK', key: 'svcBodywork' },
  { value: 'ACCESSORIES_INSTALL', key: 'svcAccessories' },
  { value: 'KEYS_LOCKS', key: 'svcKeys' },
  { value: 'TOWING', key: 'svcTowing' },
  { value: 'OTHER_SERVICE', key: 'svcOther' },
] as const;

const PROVIDER_TYPES = [
  { value: 'WORKSHOP', key: 'svcProvWorkshop' },
  { value: 'INDIVIDUAL', key: 'svcProvIndividual' },
  { value: 'MOBILE', key: 'svcProvMobile' },
  { value: 'COMPANY', key: 'svcProvCompany' },
] as const;

const DAYS = [
  { value: 'SAT', key: 'tripDaySat' },
  { value: 'SUN', key: 'tripDaySun' },
  { value: 'MON', key: 'tripDayMon' },
  { value: 'TUE', key: 'tripDayTue' },
  { value: 'WED', key: 'tripDayWed' },
  { value: 'THU', key: 'tripDayThu' },
  { value: 'FRI', key: 'tripDayFri' },
] as const;

const DEFAULT_FORM = {
  title: '',
  description: '',
  serviceType: '',
  providerType: 'WORKSHOP',
  providerName: '',
  specializations: [] as string[],
  priceFrom: '',
  priceTo: '',
  isHomeService: false,
  workingHoursOpen: '08:00',
  workingHoursClose: '20:00',
  workingDays: ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'] as string[],
  governorate: '',
  city: '',
  address: '',
  latitude: null as number | null,
  longitude: null as number | null,
  contactPhone: '',
  whatsapp: '',
  website: '',
};

export interface ServiceFormProps {
  mode: 'add' | 'edit';
  initialData?: CarServiceItem;
  id?: string;
}

export function ServiceForm({ mode, initialData, id }: ServiceFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const create = useCreateCarService();
  const update = useUpdateCarService();
  const removeImage = useRemoveServiceImage();
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
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      serviceType: initialData.serviceType ?? '',
      providerType: initialData.providerType ?? 'WORKSHOP',
      providerName: initialData.providerName ?? '',
      specializations: initialData.specializations ?? [],
      priceFrom: String(initialData.priceFrom ?? ''),
      priceTo: String(initialData.priceTo ?? ''),
      isHomeService: initialData.isHomeService ?? false,
      workingHoursOpen: initialData.workingHoursOpen ?? '08:00',
      workingHoursClose: initialData.workingHoursClose ?? '20:00',
      workingDays: initialData.workingDays ?? ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'],
      governorate: initialData.governorate ?? '',
      city: initialData.city ?? '',
      address: initialData.address ?? '',
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      contactPhone: initialData.contactPhone ?? '',
      whatsapp: initialData.whatsapp ?? '',
      website: initialData.website ?? '',
    });
    setSelectedGov(initialData.governorate ?? '');
    if (initialData.images?.length) {
      setImages(initialData.images.map(img => ({ id: img.id, url: img.url, isPrimary: img.isPrimary, order: img.order })));
    }
  }, [isEdit, initialData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const steps = [
    { label: tp('svcStepBasic') },
    { label: tp('svcStepDetails') },
    { label: tp('svcStepLocation') },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!form.serviceType && !!form.title && !!form.providerName :
    step === 1 ? true :
    !!form.governorate;

  async function handleSubmit() {
    setErrors([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        serviceType: form.serviceType,
        providerType: form.providerType,
        providerName: form.providerName,
        governorate: form.governorate,
        isHomeService: form.isHomeService,
        workingDays: form.workingDays,
      };
      if (form.specializations.length) payload.specializations = form.specializations;
      if (form.priceFrom) payload.priceFrom = parseFloat(form.priceFrom);
      if (form.priceTo) payload.priceTo = parseFloat(form.priceTo);
      if (form.workingHoursOpen) payload.workingHoursOpen = form.workingHoursOpen;
      if (form.workingHoursClose) payload.workingHoursClose = form.workingHoursClose;
      if (form.city) payload.city = form.city;
      if (form.address) payload.address = form.address;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;
      if (form.website) payload.website = form.website;

      if (isEdit && id) {
        await update.mutateAsync({ id, data: payload });
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/services/${id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('svcSuccess'));
        router.push(`/sale/service/${id}`);
      } else {
        const svc = await create.mutateAsync(payload);
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/services/${svc.id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('svcSuccess'));
        router.push(`/sale/service/${svc.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('svcError');
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

  const isLoading = isEdit ? update.isPending : create.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={isEdit ? tp('svcEditSubmit') : tp('svcSubmit')}
        canProceed={canProceed}
        title={isEdit ? tp('svcEditTitle') : tp('svcTitle')}
      >
        {/* ── Step 0: النوع والمزود والصور ── */}
        {step === 0 && (
          <div className="space-y-8">
            <FormSection icon="handyman" title={tp('svcLabelType')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('serviceType', t.value)}
                    className={chipCls(form.serviceType === t.value)}>
                    {tp(t.key)}
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection icon="add_photo_alternate" title={tp('svcLabelPhotos')}>
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
              <ImageUploader
                images={images.filter(img => !img.id)}
                onChange={newImgs => setImages(prev => [...prev.filter(img => img.id && !img.file), ...newImgs])}
                disabled={isLoading}
              />
            </FormSection>

            <FormSection icon="storefront" title={tp('svcLabelProvider')}>
              <div className="space-y-4">
                <FormInput label={tp('svcLabelTitle')} name="title" value={form.title} onChange={v => set('title', v)} placeholder={tp('svcPlaceholderTitle')} required />
                <FormInput label={tp('svcLabelProvName')} name="providerName" value={form.providerName} onChange={v => set('providerName', v)} placeholder={tp('svcPlaceholderProvName')} required />
                <div>
                  <label className={labelCls}>{tp('svcLabelProvType')}</label>
                  <div className="flex gap-3 flex-wrap mt-2">
                    {PROVIDER_TYPES.map(p => (
                      <button key={p.value} type="button" onClick={() => set('providerType', p.value)}
                        className={chipCls(form.providerType === p.value)}>
                        {tp(p.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 1: التفاصيل وساعات العمل ── */}
        {step === 1 && (
          <div className="space-y-8">
            <FormSection icon="description" title={tp('svcLabelDetails')}>
              <div className="space-y-4">
                <FormTextarea label={tp('svcLabelDesc')} name="description" value={form.description} onChange={v => set('description', v)} placeholder={tp('svcPlaceholderDesc')} rows={4} />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label={tp('svcLabelPriceFrom')} name="priceFrom" type="number" value={form.priceFrom} onChange={v => set('priceFrom', v)} placeholder="5.000" />
                  <FormInput label={tp('svcLabelPriceTo')} name="priceTo" type="number" value={form.priceTo} onChange={v => set('priceTo', v)} placeholder="50.000" />
                </div>
                <FormToggle name="isHomeService" label={tp('svcLabelHomeService')} checked={form.isHomeService} onChange={v => set('isHomeService', v)} />
              </div>
            </FormSection>

            <FormSection icon="schedule" title={tp('svcLabelHours')}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('svcLabelOpenTime')}</label>
                    <input type="time" value={form.workingHoursOpen} onChange={e => set('workingHoursOpen', e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tp('svcLabelCloseTime')}</label>
                    <input type="time" value={form.workingHoursClose} onChange={e => set('workingHoursClose', e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelWorkDays')}</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS.map(d => (
                      <button key={d.value} type="button"
                        onClick={() => set('workingDays', form.workingDays.includes(d.value) ? form.workingDays.filter(x => x !== d.value) : [...form.workingDays, d.value])}
                        className={chipCls(form.workingDays.includes(d.value))}>
                        {tp(d.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: الموقع والتواصل ── */}
        {step === 2 && (
          <div className="space-y-8">
            <FormSection icon="location_on" title={tp('svcLabelLocation')}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('svcLabelGov')}</label>
                    <select value={selectedGov} onChange={e => { setSelectedGov(e.target.value); set('governorate', e.target.value); set('city', ''); }} className={inputCls}>
                      <option value="">{tp('svcSelect')}</option>
                      {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('svcLabelCity')}</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} disabled={!selectedGov}>
                      <option value="">{tp('svcSelect')}</option>
                      {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <FormInput label={tp('svcLabelAddress')} name="address" value={form.address} onChange={v => set('address', v)} placeholder={tp('svcPlaceholderAddress')} />
                <div>
                  <label className={labelCls}>{tp('svcLabelMap')}</label>
                  <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/10">
                    <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon="contact_phone" title={tp('svcLabelContact')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{tp('svcLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('svcLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <FormInput label={tp('svcLabelWebsite')} name="website" type="url" value={form.website} onChange={v => set('website', v)} placeholder="https://..." />
              </div>
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
