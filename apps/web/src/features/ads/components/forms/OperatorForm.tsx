'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import {
  FormSection, FormErrorDisplay, FormToggle,
  FormTextarea, FormInput, FormChipGroup, FormPhoneInput, FormPriceInput,
} from './shared';
import { useCreateOperatorListing, useUpdateOperatorListing, type OperatorListingItem } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const OPERATOR_TYPES = [
  { value: 'CRANE_OPERATOR',     label: 'مشغّل رافعة',       icon: 'precision_manufacturing' },
  { value: 'EXCAVATOR_OPERATOR', label: 'مشغّل حفار',        icon: 'construction' },
  { value: 'FORKLIFT_OPERATOR',  label: 'مشغّل رافعة شوكية', icon: 'forklift' },
  { value: 'TRUCK_DRIVER',       label: 'سائق شاحنة',        icon: 'local_shipping' },
  { value: 'BULLDOZER_OPERATOR', label: 'مشغّل بلدوزر',      icon: 'agriculture' },
  { value: 'HEAVY_EQUIPMENT',    label: 'معدات ثقيلة عامة',  icon: 'engineering' },
  { value: 'OTHER_OPERATOR',     label: 'أخرى',              icon: 'more_horiz' },
];

const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'CRANE',           label: 'رافعة' },
  { value: 'EXCAVATOR',       label: 'حفار' },
  { value: 'LOADER',          label: 'لودر' },
  { value: 'BULLDOZER',       label: 'بلدوزر' },
  { value: 'FORKLIFT',        label: 'رافعة شوكية' },
  { value: 'CONCRETE_MIXER',  label: 'خلاط خرسانة' },
  { value: 'GENERATOR',       label: 'مولّد كهربائي' },
  { value: 'COMPRESSOR',      label: 'ضاغط هواء' },
  { value: 'TRUCK',           label: 'شاحنة' },
  { value: 'DUMP_TRUCK',      label: 'شاحنة قلاّبة' },
  { value: 'WATER_TANKER',    label: 'صهريج ماء' },
  { value: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة' },
  { value: 'OTHER_EQUIPMENT', label: 'أخرى' },
];

const DEFAULT_FORM = {
  operatorType: '',
  title: '',
  description: '',
  specializations: [] as string[],
  experienceYears: '' as number | '',
  equipmentTypes: [] as string[],
  certifications: [] as string[],
  dailyRate: '' as number | '',
  hourlyRate: '' as number | '',
  isPriceNegotiable: false,
  isAvailable: true,
  governorate: '',
  city: '',
  latitude: null as number | null,
  longitude: null as number | null,
  contactPhone: '',
  whatsapp: '',
};

export interface OperatorFormProps {
  mode: 'add' | 'edit';
  initialData?: OperatorListingItem;
  id?: string;
}

export function OperatorForm({ mode, initialData, id }: OperatorFormProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const createOp = useCreateOperatorListing();
  const updateOp = useUpdateOperatorListing();
  const { addToast } = useToast();

  const isEdit = mode === 'edit';
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newCert, setNewCert] = useState('');

  function set<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addCertification() {
    const trimmed = newCert.trim();
    if (!trimmed || form.certifications.includes(trimmed)) return;
    set('certifications', [...form.certifications, trimmed]);
    setNewCert('');
  }

  function removeCertification(index: number) {
    set('certifications', form.certifications.filter((_, i) => i !== index));
  }

  useEffect(() => {
    if (!isEdit || !initialData) return;
    setForm({
      ...DEFAULT_FORM,
      operatorType: initialData.operatorType ?? '',
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      specializations: initialData.specializations ?? [],
      experienceYears: initialData.experienceYears != null ? Number(initialData.experienceYears) : '',
      equipmentTypes: initialData.equipmentTypes ?? [],
      certifications: initialData.certifications ?? [],
      dailyRate: initialData.dailyRate != null ? Number(initialData.dailyRate) : '',
      hourlyRate: initialData.hourlyRate != null ? Number(initialData.hourlyRate) : '',
      isPriceNegotiable: initialData.isPriceNegotiable ?? false,
      isAvailable: true,
      governorate: initialData.governorate ?? '',
      city: initialData.city ?? '',
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      contactPhone: initialData.contactPhone ?? '',
      whatsapp: initialData.whatsapp ?? '',
    });
  }, [isEdit, initialData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', form.governorate, locale);

  const steps = [
    { label: 'نوع المشغّل',     icon: 'engineering' },
    { label: 'الخبرة والمؤهلات', icon: 'verified' },
    { label: 'الأجر والموقع',    icon: 'payments' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!form.operatorType :
    step === 1 ? !!(form.title && form.description) :
    !!form.governorate;

  async function handleSubmit() {
    setErrors([]);
    const errs: string[] = [];
    if (!form.title || form.title.length < 3) errs.push('أدخل عنوان الإعلان (3 أحرف على الأقل)');
    if (!form.description || form.description.length < 10) errs.push('أدخل وصف الخبرة (10 أحرف على الأقل)');
    if (!form.governorate) errs.push('اختر المحافظة');
    if (errs.length) { setErrors(errs); return; }

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        operatorType: form.operatorType,
        specializations: form.specializations,
        certifications: form.certifications,
        equipmentTypes: form.equipmentTypes.length ? form.equipmentTypes : undefined,
        isPriceNegotiable: form.isPriceNegotiable,
      };
      if (form.experienceYears !== '') payload.experienceYears = form.experienceYears;
      if (form.dailyRate !== '') payload.dailyRate = form.dailyRate;
      if (form.hourlyRate !== '') payload.hourlyRate = form.hourlyRate;
      if (form.governorate) payload.governorate = form.governorate;
      if (form.city) payload.city = form.city;
      if (form.latitude) payload.latitude = form.latitude;
      if (form.longitude) payload.longitude = form.longitude;
      if (form.contactPhone) payload.contactPhone = form.contactPhone;
      if (form.whatsapp) payload.whatsapp = form.whatsapp;

      if (isEdit && id) {
        await updateOp.mutateAsync({ id, data: payload });
        addToast('success', tp('opSuccess'));
        router.push(`/equipment/operators/${id}`);
      } else {
        const result = await createOp.mutateAsync(payload);
        addToast('success', tp('opSuccess'));
        router.push(`/equipment/operators/${result.id}`);
      }
    } catch (e: unknown) {
      setErrors([e instanceof Error ? e.message : tp('opError')]);
    }
  }

  const isLoading = isEdit ? updateOp.isPending : createOp.isPending;

  return (
    <>
      <MultiStepForm
        steps={steps}
        currentStep={step}
        onNext={() => { setStep(s => Math.min(s + 1, maxStep)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBack={() => { setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel={isEdit ? tp('opEditSubmit') : tp('opSubmit')}
        canProceed={canProceed}
        title={isEdit ? tp('opEditTitle') : tp('opTitle')}
      >

        {/* ── Step 0: نوع المشغّل والمعدات ── */}
        {step === 0 && (
          <div className="space-y-8">
            <FormSection icon="engineering" title="نوع المشغّل">
              <FormChipGroup
                options={OPERATOR_TYPES}
                value={form.operatorType}
                onChange={v => set('operatorType', v as string)}
                variant="card"
                columns={2}
              />
            </FormSection>

            <FormSection icon="handyman" title="أنواع المعدات">
              <p className="text-xs text-on-surface-variant/60 mb-3">
                اختر كل أنواع المعدات التي تتقنها — يمكن اختيار أكثر من نوع
              </p>
              <FormChipGroup
                options={EQUIPMENT_TYPE_OPTIONS}
                value={form.equipmentTypes}
                onChange={v => set('equipmentTypes', v as string[])}
                multiSelect
                columns={3}
              />
            </FormSection>
          </div>
        )}

        {/* ── Step 1: الخبرة والمؤهلات ── */}
        {step === 1 && (
          <div className="space-y-8">
            <FormSection icon="person" title="البيانات الأساسية">
              <div className="space-y-4">
                <FormInput
                  label="عنوان الإعلان"
                  name="title"
                  value={form.title}
                  onChange={v => set('title', v)}
                  required
                  placeholder="مثال: مشغّل رافعة — خبرة 10 سنوات — مسقط"
                  hint="اجعل العنوان واضحاً ومميزاً"
                />
                <FormTextarea
                  label="الوصف"
                  name="description"
                  value={form.description}
                  onChange={v => set('description', v)}
                  required
                  placeholder="اشرح خبرتك ومهاراتك بالتفصيل..."
                  rows={4}
                  maxLength={1000}
                  showCount
                />
                <FormInput
                  label="سنوات الخبرة"
                  name="experienceYears"
                  type="number"
                  value={form.experienceYears}
                  onChange={v => set('experienceYears', v === '' ? '' : Number(v))}
                  min={0}
                  max={50}
                  placeholder="مثال: 10"
                  hint="عدد سنوات الخبرة الكلية في تشغيل المعدات"
                />
              </div>
            </FormSection>

            <FormSection icon="verified" title="الشهادات والمؤهلات">
              <p className="text-xs text-on-surface-variant/60 mb-3">
                أضف رخصك وشهاداتك المهنية — تزيد من مصداقية إعلانك
              </p>
              {form.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.certifications.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                      {c}
                      <button type="button" onClick={() => removeCertification(i)} className="hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined text-sm leading-none">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={newCert}
                  onChange={e => setNewCert(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
                  placeholder="رخصة تشغيل درجة أولى، شهادة السلامة..."
                />
                <button
                  type="button"
                  onClick={addCertification}
                  className="shrink-0 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  + إضافة
                </button>
              </div>
            </FormSection>

            <FormSection icon="event_available" title="التوفر">
              <FormToggle
                name="isAvailable"
                label="متاح للعمل الفوري"
                description="سيظهر إعلانك في نتائج البحث للطلبات العاجلة"
                checked={form.isAvailable}
                onChange={v => set('isAvailable', v)}
              />
            </FormSection>
          </div>
        )}

        {/* ── Step 2: الأجر والموقع والتواصل ── */}
        {step === 2 && (
          <div className="space-y-8">
            <FormSection icon="payments" title="الأجر">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormPriceInput
                  label="الأجر اليومي"
                  name="dailyRate"
                  value={form.dailyRate}
                  onChange={v => set('dailyRate', v)}
                  hint="السعر باليوم بالريال العماني"
                />
                <FormPriceInput
                  label="الأجر بالساعة"
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={v => set('hourlyRate', v)}
                  hint="السعر بالساعة بالريال العماني"
                />
              </div>
              <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                اتركهما فارغين إذا كان الأجر يُحدد حسب الاتفاق
              </p>
              <div className="mt-3">
                <FormToggle
                  name="isPriceNegotiable"
                  label="الأجر قابل للتفاوض"
                  description="سيظهر وسم 'قابل للتفاوض' على إعلانك"
                  checked={form.isPriceNegotiable}
                  onChange={v => set('isPriceNegotiable', v)}
                />
              </div>
            </FormSection>

            <FormSection icon="location_on" title="الموقع">
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
              <div className="mt-4 rounded-xl overflow-hidden border border-outline-variant/10">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }}
                />
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
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
