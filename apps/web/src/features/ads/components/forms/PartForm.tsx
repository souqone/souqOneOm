'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from './shared';
import { useCreatePart, useUpdatePart, useRemovePartImage, type SparePartItem } from '@/lib/api/parts';
import { useBrands } from '@/lib/api/cars';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, chipCls, checkboxCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const PART_CATEGORIES = [
  { value: 'ENGINE', key: 'partCatEngine' },
  { value: 'BODY', key: 'partCatBody' },
  { value: 'ELECTRICAL', key: 'partCatElectrical' },
  { value: 'SUSPENSION', key: 'partCatSuspension' },
  { value: 'BRAKES', key: 'partCatBrakes' },
  { value: 'INTERIOR', key: 'partCatInterior' },
  { value: 'TIRES', key: 'partCatTires' },
  { value: 'BATTERIES', key: 'partCatBatteries' },
  { value: 'OILS', key: 'partCatOils' },
  { value: 'ACCESSORIES', key: 'partCatAccessories' },
  { value: 'OTHER', key: 'partCatOther' },
] as const;

const PART_CONDITIONS = [
  { value: 'NEW', key: 'partCondNew' },
  { value: 'USED', key: 'partCondUsed' },
  { value: 'REFURBISHED', key: 'partCondRefurb' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

const DEFAULT_FORM = {
  title: '',
  description: '',
  partCategory: '',
  condition: 'USED',
  partNumber: '',
  compatibleMakes: [] as string[],
  compatibleModels: [] as string[],
  yearFrom: '',
  yearTo: '',
  isOriginal: false,
  price: '',
  isPriceNegotiable: false,
  governorate: '',
  city: '',
  latitude: null as number | null,
  longitude: null as number | null,
  contactPhone: '',
  whatsapp: '',
};

export interface PartFormProps {
  mode: 'add' | 'edit';
  initialData?: SparePartItem;
  id?: string;
}

export function PartForm({ mode, initialData, id }: PartFormProps) {
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
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedGov, setSelectedGov] = useState('');
  const [brandsOpen, setBrandsOpen] = useState(false);
  const brandsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (brandsRef.current && !brandsRef.current.contains(e.target as Node)) setBrandsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function set<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleBrand(name: string) {
    set('compatibleMakes', form.compatibleMakes.includes(name)
      ? form.compatibleMakes.filter(b => b !== name)
      : [...form.compatibleMakes, name]);
  }

  useEffect(() => {
    if (!isEdit || !initialData) return;
    setForm({
      ...DEFAULT_FORM,
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      partCategory: initialData.partCategory ?? '',
      condition: initialData.condition ?? 'USED',
      partNumber: initialData.partNumber ?? '',
      compatibleMakes: initialData.compatibleMakes ?? [],
      compatibleModels: initialData.compatibleModels ?? [],
      yearFrom: String(initialData.yearFrom ?? ''),
      yearTo: String(initialData.yearTo ?? ''),
      isOriginal: initialData.isOriginal ?? false,
      price: String(initialData.price ?? ''),
      isPriceNegotiable: initialData.isPriceNegotiable ?? false,
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

  const steps = [
    { label: tp('partStepBasic') },
    { label: tp('partStepDetails') },
    { label: tp('partStepPrice') },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!form.partCategory && !!form.title :
    step === 1 ? true :
    !!form.price;

  async function handleSubmit() {
    setErrors([]);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        partCategory: form.partCategory,
        condition: form.condition,
        price: parseFloat(form.price),
        isPriceNegotiable: form.isPriceNegotiable,
      };
      if (form.partNumber) payload.partNumber = form.partNumber;
      if (form.compatibleMakes.length) payload.compatibleMakes = form.compatibleMakes;
      if (form.compatibleModels.length) payload.compatibleModels = form.compatibleModels;
      if (form.yearFrom) payload.yearFrom = parseInt(form.yearFrom);
      if (form.yearTo) payload.yearTo = parseInt(form.yearTo);
      if (form.isOriginal) payload.isOriginal = true;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      if (isEdit && id) {
        await updatePart.mutateAsync({ id, data: payload });
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/parts/${id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('partSuccess'));
        router.push(`/sale/part/${id}`);
      } else {
        const part = await createPart.mutateAsync(payload);
        for (const img of images) {
          if (img.file) {
            const fd = new FormData();
            fd.append('file', img.file);
            fd.append('isPrimary', String(img.isPrimary));
            await apiFetch(`/uploads/parts/${part.id}/images`, { method: 'POST', body: fd });
          }
        }
        addToast('success', tp('partSuccess'));
        router.push(`/sale/part/${part.id}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tp('partError');
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

  const isLoading = isEdit ? updatePart.isPending : createPart.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={isEdit ? tp('partEditSubmit') : tp('partSubmit')}
        canProceed={canProceed}
        title={isEdit ? tp('partEditTitle') : tp('partTitle')}
      >
        {/* ── Step 0: الفئة والمعلومات الأساسية ── */}
        {step === 0 && (
          <div className="space-y-8">
            <FormSection icon="settings" title={tp('partLabelSection')}>
              <div className="flex items-center gap-3 bg-surface-container-low/50 dark:bg-surface-container-high/30 rounded-xl px-4 py-3 mb-4 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg">garage_home</span>
                <span className="text-sm text-on-surface-variant">{tp('partBreadcrumb1')}</span>
                <span className="material-symbols-outlined icon-flip text-on-surface-variant/30 text-xs">chevron_left</span>
                <span className="text-sm font-bold text-on-surface">{tp('partBreadcrumb2')}</span>
              </div>
              <label className={labelCls}>{tp('partLabelCategory')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {PART_CATEGORIES.map(c => (
                  <button key={c.value} type="button" onClick={() => set('partCategory', c.value)}
                    className={chipCls(form.partCategory === c.value)}>
                    {tp(c.key)}
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection icon="add_photo_alternate" title={tp('partLabelPhotos')}>
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

            <FormSection icon="edit_note" title={tp('partLabelBasicInfo')}>
              <div className="space-y-4">
                <FormInput label={tp('partLabelTitle')} name="title" value={form.title} onChange={v => set('title', v)} placeholder={tp('partPlaceholderTitle')} required />
                <div>
                  <label className={labelCls}>{tp('partLabelCondition')}</label>
                  <div className="flex gap-3 mt-2">
                    {PART_CONDITIONS.map(c => (
                      <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                        className={chipCls(form.condition === c.value) + ' flex-1'}>
                        {tp(c.key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 1: التفاصيل ── */}
        {step === 1 && (
          <div className="space-y-8">
            <FormSection icon="info" title={tp('partLabelDetailsSection')}>
              <div className="space-y-4">
                <FormInput label={tp('partLabelOEM')} name="partNumber" value={form.partNumber} onChange={v => set('partNumber', v)} placeholder={tp('partPlaceholderOptional')} />

                <div ref={brandsRef} className="relative">
                  <label className={labelCls}>{tp('partLabelBrands')}</label>
                  <button
                    type="button"
                    onClick={() => setBrandsOpen(!brandsOpen)}
                    className={inputCls + ' flex items-center justify-between text-start w-full mt-1.5'}
                  >
                    <span className={form.compatibleMakes.length ? 'text-on-surface' : 'text-on-surface-variant/50'}>
                      {form.compatibleMakes.length
                        ? form.compatibleMakes.map(m => {
                            const b = brands.find(br => br.name === m);
                            return b?.nameAr || b?.name || m;
                          }).join(', ')
                        : tp('partSelect')}
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
                  </button>
                  {brandsOpen && (
                    <div className="absolute z-50 top-full mt-1 inset-x-0 max-h-52 overflow-y-auto rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-lg py-1">
                      {brands.map(b => (
                        <label key={b.id} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-container-low transition-colors cursor-pointer text-sm">
                          <input type="checkbox" checked={form.compatibleMakes.includes(b.name)} onChange={() => toggleBrand(b.name)} className={checkboxCls} />
                          <span className="text-on-surface">{b.nameAr || b.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelYearFrom')}</label>
                    <select value={form.yearFrom} onChange={e => set('yearFrom', e.target.value)} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelYearTo')}</label>
                    <select value={form.yearTo} onChange={e => set('yearTo', e.target.value)} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {YEAR_OPTIONS.filter(y => !form.yearFrom || y >= parseInt(form.yearFrom)).map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <FormToggle name="isOriginal" label={tp('partLabelOriginal')} checked={form.isOriginal} onChange={v => set('isOriginal', v)} />
                <FormTextarea label={tp('partLabelDesc')} name="description" value={form.description} onChange={v => set('description', v)} placeholder={tp('partPlaceholderDesc')} rows={4} />
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: السعر والموقع ── */}
        {step === 2 && (
          <div className="space-y-8">
            <FormSection icon="sell" title={tp('partLabelPrice')}>
              <div className="space-y-4">
                <FormInput label={tp('partLabelPriceOMR')} name="price" type="number" value={form.price} onChange={v => set('price', v)} placeholder="0.000" required />
                <FormToggle name="isPriceNegotiable" label={tp('partLabelNegotiable')} checked={form.isPriceNegotiable} onChange={v => set('isPriceNegotiable', v)} />
              </div>
            </FormSection>

            <FormSection icon="location_on" title={tp('partLabelLocationContact')}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelGov')}</label>
                    <select value={selectedGov} onChange={e => { setSelectedGov(e.target.value); set('governorate', e.target.value); set('city', ''); }} className={inputCls}>
                      <option value="">{tp('partSelect')}</option>
                      {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelCity')}</label>
                    <select value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} disabled={!selectedGov}>
                      <option value="">{tp('partSelect')}</option>
                      {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('partLabelMap')}</label>
                  <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/10">
                    <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>{tp('partLabelPhone')}</label>
                    <div className="flex items-center gap-0">
                      <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                      <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{tp('partLabelWhatsapp')}</label>
                    <div className="flex items-center gap-0">
                      <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                      <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" className={inputCls + ' rounded-s-none'} dir="ltr" />
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
