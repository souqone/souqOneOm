'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { ImageUploader, type UploadedImage } from '@/features/ads/components/image-uploader';
import {
  FormSection, FormErrorDisplay, FormToggle,
  FormTextarea, FormInput, FormChipGroup, FormPhoneInput, FormPriceInput,
} from './shared';
import { useCreateCarService, useUpdateCarService, useRemoveServiceImage, type CarServiceItem } from '@/lib/api/services';
import { apiFetch } from '@/lib/auth';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const SERVICE_TYPES = [
  { value: 'MAINTENANCE',         label: 'صيانة',           icon: 'build' },
  { value: 'CLEANING',            label: 'غسيل وتنظيف',    icon: 'local_car_wash' },
  { value: 'INSPECTION',          label: 'فحص',             icon: 'search' },
  { value: 'BODYWORK',            label: 'بناء وتوبير',     icon: 'car_repair' },
  { value: 'TOWING',              label: 'سحب وإنقاذ',      icon: 'rv_hookup' },
  { value: 'MODIFICATION',        label: 'تعديلات',         icon: 'tune' },
  { value: 'KEYS_LOCKS',          label: 'مفاتيح وأقفال',  icon: 'key' },
  { value: 'ACCESSORIES_INSTALL', label: 'تركيب إكسسوار',  icon: 'settings_input_component' },
  { value: 'OTHER_SERVICE',       label: 'أخرى',            icon: 'more_horiz' },
];

const PROVIDER_TYPES = [
  { value: 'WORKSHOP', label: 'ورشة',   icon: 'garage',         desc: 'موقع ثابت' },
  { value: 'MOBILE',   label: 'متنقل',  icon: 'local_shipping', desc: 'يأتي إليك' },
  { value: 'BOTH',     label: 'كلاهما', icon: 'sync_alt',       desc: 'ورشة ومتنقل' },
];

const WEEKDAYS = [
  { value: 'SAT', label: 'السبت' },
  { value: 'SUN', label: 'الأحد' },
  { value: 'MON', label: 'الاثنين' },
  { value: 'TUE', label: 'الثلاثاء' },
  { value: 'WED', label: 'الأربعاء' },
  { value: 'THU', label: 'الخميس' },
  { value: 'FRI', label: 'الجمعة' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'ص' : 'م';
  const padded = String(i).padStart(2, '0') + ':00';
  return { value: padded, label: `${h}:00 ${ampm}` };
});

const DEFAULT_FORM = {
  title: '',
  description: '',
  serviceType: '',
  providerType: 'WORKSHOP',
  providerName: '',
  specializations: [] as string[],
  priceFrom: '' as number | '',
  priceTo: '' as number | '',
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
  const [newSpec, setNewSpec] = useState('');

  function set<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addSpecialization() {
    const trimmed = newSpec.trim();
    if (!trimmed || form.specializations.includes(trimmed)) return;
    set('specializations', [...form.specializations, trimmed]);
    setNewSpec('');
  }

  function removeSpecialization(index: number) {
    set('specializations', form.specializations.filter((_, i) => i !== index));
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
      priceFrom: initialData.priceFrom != null ? Number(initialData.priceFrom) : '',
      priceTo: initialData.priceTo != null ? Number(initialData.priceTo) : '',
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
    if (initialData.images?.length) {
      setImages(initialData.images.map(img => ({ id: img.id, url: img.url, isPrimary: img.isPrimary, order: img.order })));
    }
  }, [isEdit, initialData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', form.governorate, locale);

  const steps = [
    { label: 'نوع الخدمة',      icon: 'home_repair_service' },
    { label: 'تفاصيل الخدمة',   icon: 'article' },
    { label: 'الموقع والتواصل', icon: 'location_on' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!(form.serviceType && form.providerType) :
    step === 1 ? !!(form.title && form.providerName && form.description) :
    !!form.governorate;

  async function handleSubmit() {
    setErrors([]);
    const errs: string[] = [];
    if (!form.title || form.title.length < 3) errs.push('أدخل اسم الخدمة (3 أحرف على الأقل)');
    if (!form.providerName) errs.push('أدخل اسم المزوّد');
    if (!form.description || form.description.length < 10) errs.push('أدخل وصف الخدمة (10 أحرف على الأقل)');
    if (form.priceFrom !== '' && form.priceTo !== '' && Number(form.priceTo) < Number(form.priceFrom)) {
      errs.push('السعر الأقصى يجب أن يكون أكبر من الأدنى');
    }
    if (!form.governorate) errs.push('اختر المحافظة');
    if (errs.length) { setErrors(errs); return; }

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
      if (form.priceFrom !== '') payload.priceFrom = form.priceFrom;
      if (form.priceTo !== '') payload.priceTo = form.priceTo;
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

        {/* ── Step 0: نوع الخدمة ── */}
        {step === 0 && (
          <div className="space-y-8">
            <FormSection icon="home_repair_service" title="نوع الخدمة">
              <FormChipGroup
                options={SERVICE_TYPES}
                value={form.serviceType}
                onChange={v => set('serviceType', v as string)}
                variant="card"
                columns={3}
              />
            </FormSection>

            <FormSection icon="storefront" title="نوع المزوّد">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PROVIDER_TYPES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('providerType', p.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-start ${
                      form.providerType === p.value
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest dark:bg-surface-container'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl shrink-0 ${form.providerType === p.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {p.icon}
                    </span>
                    <div>
                      <p className="font-black text-sm text-on-surface">{p.label}</p>
                      <p className="text-xs text-on-surface-variant">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection icon="photo_camera" title="صور الخدمة">
              <p className="text-xs text-on-surface-variant/60 mb-3">
                أضف صوراً للورشة أو المعدات — تزيد من مصداقية إعلانك
              </p>
              {isEdit && images.filter(img => img.id && !img.file).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {images.filter(img => img.id && !img.file).map(img => (
                    <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => img.id && handleRemoveExistingImage(img.id)}
                        className="absolute top-0.5 end-0.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUploader
                images={images.filter(img => !img.id)}
                onChange={newImgs => setImages(prev => [...prev.filter(img => img.id && !img.file), ...newImgs])}
                maxImages={10}
                disabled={isLoading}
              />
            </FormSection>
          </div>
        )}

        {/* ── Step 1: تفاصيل الخدمة ── */}
        {step === 1 && (
          <div className="space-y-8">
            <FormSection icon="info" title="البيانات الأساسية">
              <div className="space-y-4">
                <FormInput
                  label="اسم الخدمة"
                  name="title"
                  value={form.title}
                  onChange={v => set('title', v)}
                  required
                  placeholder="مثال: ورشة صيانة تويوتا — الخوض"
                  hint="اجعل الاسم واضحاً ومميزاً"
                />
                <FormInput
                  label="اسم المزوّد / الورشة"
                  name="providerName"
                  value={form.providerName}
                  onChange={v => set('providerName', v)}
                  required
                  placeholder="اسم الشركة أو الشخص"
                />
                <FormTextarea
                  label="وصف الخدمة"
                  name="description"
                  value={form.description}
                  onChange={v => set('description', v)}
                  required
                  placeholder="اشرح خدماتك بالتفصيل — ماذا تقدم؟ ما هي مميزاتك؟"
                  rows={4}
                  maxLength={1000}
                  showCount
                />
              </div>
            </FormSection>

            <FormSection icon="star" title="التخصصات">
              <p className="text-xs text-on-surface-variant/60 mb-3">
                أضف تخصصاتك لتظهر في نتائج البحث المناسبة
              </p>
              {form.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.specializations.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                      {s}
                      <button type="button" onClick={() => removeSpecialization(i)} className="hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm leading-none">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={newSpec}
                  onChange={e => setNewSpec(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialization(); } }}
                  placeholder="سيارات يابانية، ناقل حركة أوتوماتيك..."
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="shrink-0 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  + إضافة
                </button>
              </div>
            </FormSection>

            <FormSection icon="payments" title="التسعير">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormPriceInput
                  label="السعر من"
                  name="priceFrom"
                  value={form.priceFrom}
                  onChange={v => set('priceFrom', v)}
                  hint="أدنى سعر للخدمة"
                />
                <FormPriceInput
                  label="السعر إلى"
                  name="priceTo"
                  value={form.priceTo}
                  onChange={v => set('priceTo', v)}
                  hint="أعلى سعر للخدمة"
                />
              </div>
              <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                اتركهما فارغين إذا كان السعر يُحدد حسب الطلب
              </p>
              <div className="mt-3">
                <FormToggle
                  name="isHomeService"
                  label="خدمة منزلية متاحة"
                  description="يمكنك التنقل إلى موقع العميل"
                  checked={form.isHomeService}
                  onChange={v => set('isHomeService', v)}
                />
              </div>
            </FormSection>

            <FormSection icon="schedule" title="أوقات العمل">
              <div className="space-y-4">
                <FormChipGroup
                  label="أيام الدوام"
                  options={WEEKDAYS}
                  value={form.workingDays}
                  onChange={v => set('workingDays', v as string[])}
                  multiSelect
                  columns={4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>يفتح الساعة</label>
                    <select
                      className={inputCls}
                      value={form.workingHoursOpen}
                      onChange={e => set('workingHoursOpen', e.target.value)}
                    >
                      <option value="">-- اختر --</option>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>يغلق الساعة</label>
                    <select
                      className={inputCls}
                      value={form.workingHoursClose}
                      onChange={e => set('workingHoursClose', e.target.value)}
                    >
                      <option value="">-- اختر --</option>
                      {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: الموقع والتواصل ── */}
        {step === 2 && (
          <div className="space-y-8">
            <FormSection icon="location_on" title="الموقع">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>المحافظة <span className="text-error">*</span></label>
                    <select
                      className={inputCls}
                      value={form.governorate}
                      onChange={e => { set('governorate', e.target.value); set('city', ''); }}
                    >
                      <option value="">اختر المحافظة</option>
                      {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>المدينة</label>
                    <select
                      className={inputCls}
                      value={form.city}
                      onChange={e => set('city', e.target.value)}
                      disabled={!form.governorate}
                    >
                      <option value="">{form.governorate ? 'اختر المدينة' : 'اختر المحافظة أولاً'}</option>
                      {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <FormInput
                  label="العنوان التفصيلي"
                  name="address"
                  value={form.address}
                  onChange={v => set('address', v)}
                  placeholder="مثال: طريق الخوض، بجوار مسجد..."
                  hint="يساعد العملاء على إيجادك بسهولة"
                />
                <div>
                  <label className={labelCls}>الموقع على الخريطة</label>
                  <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant/10">
                    <LocationPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }}
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon="call" title="بيانات التواصل">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormPhoneInput
                  label="رقم الهاتف"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={v => set('contactPhone', v)}
                />
                <FormPhoneInput
                  label="واتساب"
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={v => set('whatsapp', v)}
                />
              </div>
              <div className="mt-4">
                <FormInput
                  label="الموقع الإلكتروني"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={v => set('website', v)}
                  placeholder="https://example.com"
                  prefix={<span className="material-symbols-outlined text-base text-on-surface-variant/40">language</span>}
                />
              </div>
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
