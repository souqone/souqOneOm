'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { MultiStepForm } from '@/components/ui/multi-step-form';
import { FormSection, FormErrorDisplay, FormToggle, FormTextarea, FormInput } from './shared';
import { useCreateOperatorListing, useUpdateOperatorListing, type OperatorListingItem } from '@/lib/api/equipment';
import { useToast } from '@/components/toast';
import { getGovernorates, getCities, type LocationOption } from '@/lib/location-data';
import { inputCls, labelCls, chipCls } from '@/lib/constants/form-styles';
import { useTranslations, useLocale } from 'next-intl';

const LocationPicker = dynamic(() => import('@/components/map/location-picker'), { ssr: false });

const OPERATOR_TYPES = [
  { value: 'DRIVER', labelKey: 'opTypeDriver', icon: 'drive_eta', descKey: 'opTypeDriverDesc' },
  { value: 'OPERATOR', labelKey: 'opTypeOperator', icon: 'precision_manufacturing', descKey: 'opTypeOperatorDesc' },
  { value: 'TECHNICIAN', labelKey: 'opTypeTechnician', icon: 'build', descKey: 'opTypeTechnicianDesc' },
  { value: 'MAINTENANCE', labelKey: 'opTypeMaintenance', icon: 'handyman', descKey: 'opTypeMaintenanceDesc' },
] as const;

const EQUIP_TYPES = [
  { value: 'EXCAVATOR', key: 'opExcavator' }, { value: 'CRANE', key: 'opCrane' },
  { value: 'LOADER', key: 'opLoader' }, { value: 'BULLDOZER', key: 'opBulldozer' },
  { value: 'FORKLIFT', key: 'opForklift' }, { value: 'CONCRETE_MIXER', key: 'opConcreteMixer' },
  { value: 'GENERATOR', key: 'opGenerator' }, { value: 'COMPRESSOR', key: 'opCompressor' },
  { value: 'TRUCK', key: 'opTruck' }, { value: 'DUMP_TRUCK', key: 'opDumpTruck' },
  { value: 'WATER_TANKER', key: 'opWaterTanker' }, { value: 'LIGHT_EQUIPMENT', key: 'opLightEquip' },
] as const;

const DEFAULT_FORM = {
  operatorType: '',
  title: '',
  description: '',
  specializations: '',
  experienceYears: '',
  equipmentTypes: [] as string[],
  certifications: '',
  dailyRate: '',
  hourlyRate: '',
  isPriceNegotiable: false,
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
  const [selectedGov, setSelectedGov] = useState('');

  function set<K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (!isEdit || !initialData) return;
    setForm({
      ...DEFAULT_FORM,
      operatorType: initialData.operatorType ?? '',
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      specializations: (initialData.specializations ?? []).join(', '),
      experienceYears: String(initialData.experienceYears ?? ''),
      equipmentTypes: initialData.equipmentTypes ?? [],
      certifications: (initialData.certifications ?? []).join(', '),
      dailyRate: String(initialData.dailyRate ?? ''),
      hourlyRate: String(initialData.hourlyRate ?? ''),
      isPriceNegotiable: initialData.isPriceNegotiable ?? false,
      governorate: initialData.governorate ?? '',
      city: initialData.city ?? '',
      latitude: initialData.latitude ?? null,
      longitude: initialData.longitude ?? null,
      contactPhone: initialData.contactPhone ?? '',
      whatsapp: initialData.whatsapp ?? '',
    });
    setSelectedGov(initialData.governorate ?? '');
  }, [isEdit, initialData]);

  const governorateOptions = getGovernorates('OM', locale);
  const cityOptions = getCities('OM', selectedGov, locale);

  const steps = [
    { label: tp('opStepType'), icon: 'engineering' },
    { label: tp('opStepInfo'), icon: 'description' },
    { label: tp('opStepPrice'), icon: 'payments' },
  ];
  const maxStep = steps.length - 1;

  const canProceed =
    step === 0 ? !!form.operatorType :
    step === 1 ? !!(form.title && form.description) :
    true;

  async function handleSubmit() {
    setErrors([]);
    const errs: string[] = [];
    if (!form.title) errs.push(tp('opErrTitle'));
    if (!form.description) errs.push(tp('opErrDesc'));
    if (errs.length) { setErrors(errs); return; }

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        operatorType: form.operatorType,
        specializations: form.specializations ? form.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
        equipmentTypes: form.equipmentTypes.length ? form.equipmentTypes : undefined,
        isPriceNegotiable: form.isPriceNegotiable,
      };
      if (form.experienceYears) payload.experienceYears = Number(form.experienceYears);
      if (form.dailyRate) payload.dailyRate = Number(form.dailyRate);
      if (form.hourlyRate) payload.hourlyRate = Number(form.hourlyRate);
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
        {/* ── Step 0: نوع الخدمة ── */}
        {step === 0 && (
          <FormSection icon="engineering" title={tp('opLabelServiceType')}>
            <div className="grid grid-cols-2 gap-3">
              {OPERATOR_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('operatorType', t.value)}
                  className={`p-4 rounded-2xl border-2 text-start transition-all ${form.operatorType === t.value ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'}`}>
                  <span className="material-symbols-outlined text-2xl text-primary mb-2 block">{t.icon}</span>
                  <p className="font-bold text-sm">{tp(t.labelKey)}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">{tp(t.descKey)}</p>
                </button>
              ))}
            </div>
          </FormSection>
        )}

        {/* ── Step 1: البيانات والتخصصات ── */}
        {step === 1 && (
          <div className="space-y-6">
            <FormSection icon="edit_note" title={tp('opLabelBasicInfo')}>
              <div className="space-y-4">
                <FormInput label={tp('opLabelTitle')} name="title" value={form.title} onChange={v => set('title', v)} placeholder={tp('opPlaceholderTitle')} required />
                <FormTextarea label={tp('opLabelDesc')} name="description" value={form.description} onChange={v => set('description', v)} placeholder={tp('opPlaceholderDesc')} rows={4} />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label={tp('opLabelExperience')} name="experienceYears" type="number" value={form.experienceYears} onChange={v => set('experienceYears', v)} placeholder="10" />
                  <FormInput label={tp('opLabelSpecializations')} name="specializations" value={form.specializations} onChange={v => set('specializations', v)} placeholder={tp('opPlaceholderSpec')} />
                </div>
                <FormInput label={tp('opLabelCerts')} name="certifications" value={form.certifications} onChange={v => set('certifications', v)} placeholder={tp('opPlaceholderCerts')} />
              </div>
            </FormSection>

            <FormSection icon="construction" title={tp('opLabelEquipTypes')}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {EQUIP_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => set('equipmentTypes', form.equipmentTypes.includes(t.value) ? form.equipmentTypes.filter(x => x !== t.value) : [...form.equipmentTypes, t.value])}
                    className={chipCls(form.equipmentTypes.includes(t.value))}>
                    {tp(t.key)}
                  </button>
                ))}
              </div>
            </FormSection>
          </div>
        )}

        {/* ── Step 2: السعر والموقع ── */}
        {step === 2 && (
          <div className="space-y-6">
            <FormSection icon="payments" title={tp('opLabelPrices')}>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <FormInput label={tp('opLabelDailyRate')} name="dailyRate" type="number" value={form.dailyRate} onChange={v => set('dailyRate', v)} />
                <FormInput label={tp('opLabelHourlyRate')} name="hourlyRate" type="number" value={form.hourlyRate} onChange={v => set('hourlyRate', v)} />
              </div>
              <FormToggle name="isPriceNegotiable" label={tp('opLabelNegotiable')} checked={form.isPriceNegotiable} onChange={v => set('isPriceNegotiable', v)} />
            </FormSection>

            <FormSection icon="location_on" title={tp('opLabelLocationContact')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelCls}>{tp('opLabelGov')}</label>
                  <select className={inputCls} value={selectedGov} onChange={e => {
                    setSelectedGov(e.target.value);
                    set('governorate', e.target.value);
                    set('city', '');
                  }}>
                    <option value="">{tp('opSelectGov')}</option>
                    {governorateOptions.map((g: LocationOption) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('opLabelCity')}</label>
                  <select className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} disabled={!selectedGov}>
                    <option value="">{tp('opSelectCity')}</option>
                    {cityOptions.map((c: LocationOption) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{tp('opLabelPhone')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{tp('opLabelWhatsapp')}</label>
                  <div className="flex items-center gap-0">
                    <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-high text-sm font-semibold text-on-surface-variant select-none">🇴🇲 +968</span>
                    <input type="tel" className={inputCls + ' rounded-s-none'} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))} placeholder="9XXXXXXX" dir="ltr" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-outline-variant/10">
                <LocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => { set('latitude', lat); set('longitude', lng); }} />
              </div>
            </FormSection>
          </div>
        )}
      </MultiStepForm>

      <FormErrorDisplay errors={errors} onClose={() => setErrors([])} />
    </>
  );
}
