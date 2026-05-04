'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { transportApi } from './api'
import type { TransportServiceType } from './types'
import { OMAN_GOVERNORATES, SERVICE_TYPES, SERVICE_TYPE_ICONS } from './constants'
import { MultiStepForm } from '@/components/ui/multi-step-form'
import {
  FormSection, FormInput, FormTextarea, FormSelect,
  FormToggle, FormChipGroup, FormErrorDisplay,
} from '@/features/ads/components/forms/shared'
import type { ChipOption } from '@/features/ads/components/forms/shared'
import { inputCls, labelCls } from '@/lib/constants/form-styles'

// ─── Form State ───────────────────────────────────────────────────────────────

interface WizardData {
  serviceType: TransportServiceType | null
  fromGovernorate: string
  fromCity: string
  fromAddress: string
  toGovernorate: string
  toCity: string
  toAddress: string
  cargoDescription: string
  weightTons: string
  requiresHelper: boolean
  notes: string
  isFlexible: boolean
  scheduledAt: string
  budgetMin: string
  budgetMax: string
}

const INIT: WizardData = {
  serviceType: null,
  fromGovernorate: '', fromCity: '', fromAddress: '',
  toGovernorate: '',  toCity: '',  toAddress: '',
  cargoDescription: '', weightTons: '', requiresHelper: false,
  notes: '', isFlexible: false, scheduledAt: '',
  budgetMin: '', budgetMax: '',
}

// ─── Governorate options ──────────────────────────────────────────────────────

const GOV_OPTIONS = OMAN_GOVERNORATES.map(g => ({ value: g, label: g }))

// ─── Step 1 — Service Type ────────────────────────────────────────────────────

function Step1({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  const options: ChipOption[] = SERVICE_TYPES.map(type => ({
    value: type,
    label: t(`serviceTypes.${type}`),
    icon: SERVICE_TYPE_ICONS[type],
  }))
  return (
    <FormSection icon="local_shipping" title="نوع الخدمة المطلوبة">
      <FormChipGroup
        options={options}
        value={data.serviceType ?? ''}
        onChange={v => set('serviceType', (v as string as TransportServiceType) || null)}
        variant="card"
        columns={3}
      />
    </FormSection>
  )
}

// ─── Step 2 — Route ───────────────────────────────────────────────────────────

function Step2({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="space-y-6">
      <FormSection icon="my_location" title={t('fields.from')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label={t('fields.governorate')}
              name="fromGovernorate"
              value={data.fromGovernorate}
              onChange={v => set('fromGovernorate', v)}
              options={GOV_OPTIONS}
              placeholder="-- اختر --"
            />
            <FormInput
              label={t('fields.city')}
              name="fromCity"
              value={data.fromCity}
              onChange={v => set('fromCity', v)}
              placeholder="المدينة / الحي"
            />
          </div>
          <FormTextarea
            label={t('fields.address')}
            name="fromAddress"
            value={data.fromAddress}
            onChange={v => set('fromAddress', v)}
            rows={2}
            placeholder="العنوان التفصيلي لنقطة الالتقاط"
          />
        </div>
      </FormSection>

      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">arrow_downward</span>
        </div>
      </div>

      <FormSection icon="location_on" title={t('fields.to')}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label={t('fields.governorate')}
              name="toGovernorate"
              value={data.toGovernorate}
              onChange={v => set('toGovernorate', v)}
              options={GOV_OPTIONS}
              placeholder="-- اختر --"
            />
            <FormInput
              label={t('fields.city')}
              name="toCity"
              value={data.toCity}
              onChange={v => set('toCity', v)}
              placeholder="المدينة / الحي"
            />
          </div>
          <FormTextarea
            label={t('fields.address')}
            name="toAddress"
            value={data.toAddress}
            onChange={v => set('toAddress', v)}
            rows={2}
            placeholder="العنوان التفصيلي لنقطة التسليم"
          />
        </div>
      </FormSection>
    </div>
  )
}

// ─── Step 3 — Cargo ───────────────────────────────────────────────────────────

function Step3({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <FormSection icon="inventory_2" title="تفاصيل الحمولة">
      <div className="space-y-4">
        <FormTextarea
          label={t('fields.cargo')}
          name="cargoDescription"
          value={data.cargoDescription}
          onChange={v => set('cargoDescription', v)}
          rows={4}
          placeholder="مثال: ثلاجة + غسالة + كنبة + محتويات غرفة نوم واحدة"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label={t('fields.weight')}
            name="weightTons"
            type="number"
            value={data.weightTons}
            onChange={v => set('weightTons', v)}
            min={0}
            step={0.5}
            placeholder="0.0"
            suffix={<span className="text-sm text-on-surface-variant">{t('fields.tons')}</span>}
          />
        </div>
        <FormToggle
          name="requiresHelper"
          label={t('fields.requiresHelper')}
          checked={data.requiresHelper}
          onChange={v => set('requiresHelper', v)}
        />
        <FormTextarea
          label={t('fields.notes')}
          name="notes"
          value={data.notes}
          onChange={v => set('notes', v)}
          rows={3}
          placeholder="أي تفاصيل إضافية مهمة للمزود"
        />
      </div>
    </FormSection>
  )
}

// ─── Step 4 — Timing & Budget ─────────────────────────────────────────────────

function Step4({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="space-y-6">
      <FormSection icon="schedule" title={t('fields.scheduledAt')}>
        <div className="space-y-4">
          <FormToggle
            name="isFlexible"
            label={t('fields.flexible')}
            checked={data.isFlexible}
            onChange={v => set('isFlexible', v)}
          />
          {!data.isFlexible && (
            <div>
              <label className={labelCls}>{t('fields.scheduledTime')}</label>
              <input
                type="datetime-local"
                value={data.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                className={inputCls}
              />
            </div>
          )}
        </div>
      </FormSection>

      <FormSection icon="payments" title="الميزانية">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label={t('fields.budgetMin')}
              name="budgetMin"
              type="number"
              value={data.budgetMin}
              onChange={v => set('budgetMin', v)}
              min={0}
              placeholder="0"
              suffix={<span className="text-sm text-on-surface-variant">ر.ع.</span>}
            />
            <FormInput
              label={t('fields.budgetMax')}
              name="budgetMax"
              type="number"
              value={data.budgetMax}
              onChange={v => set('budgetMax', v)}
              min={0}
              placeholder="0"
              suffix={<span className="text-sm text-on-surface-variant">ر.ع.</span>}
            />
          </div>
          <p className="text-xs text-on-surface-variant/60">{t('fields.noBudget')}</p>
        </div>
      </FormSection>
    </div>
  )
}

// ─── Step 5 — Review ──────────────────────────────────────────────────────────

function Step5({ data }: { data: WizardData }) {
  const t = useTranslations('transport')
  const row = (label: string, value: string) => (
    <div className="flex justify-between items-start py-3 border-b border-outline-variant/20 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-bold text-on-surface text-end max-w-[60%]">{value || '—'}</span>
    </div>
  )
  return (
    <FormSection icon="fact_check" title="مراجعة الطلب قبل النشر">
      {row('نوع الخدمة', data.serviceType ? t(`serviceTypes.${data.serviceType}`) : '—')}
      {row('من', [data.fromGovernorate, data.fromCity, data.fromAddress].filter(Boolean).join(' — '))}
      {row('إلى', [data.toGovernorate, data.toCity, data.toAddress].filter(Boolean).join(' — '))}
      {row(t('fields.cargo'), data.cargoDescription)}
      {row(t('fields.weight'), data.weightTons ? `${data.weightTons} ${t('fields.tons')}` : '—')}
      {row(t('fields.requiresHelper'), data.requiresHelper ? 'نعم' : 'لا')}
      {row('الوقت', data.isFlexible ? t('fields.flexible') : data.scheduledAt || t('fields.asap'))}
      {row('الميزانية', data.budgetMin || data.budgetMax
        ? `${data.budgetMin || 0} – ${data.budgetMax || 0} ر.ع.`
        : t('fields.budgetNotSet'))}
      {data.notes && row(t('fields.notes'), data.notes)}
    </FormSection>
  )
}

// ─── Step Validation ──────────────────────────────────────────────────────────

function canAdvance(step: number, data: WizardData): boolean {
  if (step === 1) return data.serviceType !== null
  if (step === 2) return !!data.fromGovernorate && !!data.fromAddress && !!data.toGovernorate && !!data.toAddress
  if (step === 3) return !!data.cargoDescription.trim()
  if (step === 4) return data.isFlexible || !!data.scheduledAt
  return true
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function CreateRequestWizard() {
  const t = useTranslations('transport')
  const router = useRouter()

  const [step,       setStep]       = useState(1)
  const [data,       setData]       = useState<WizardData>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const steps = [
    { label: t('steps.serviceType'), icon: 'local_shipping' },
    { label: t('steps.route'),       icon: 'route' },
    { label: t('steps.cargo'),       icon: 'inventory_2' },
    { label: t('steps.timing'),      icon: 'schedule' },
    { label: t('steps.review'),      icon: 'fact_check' },
  ]

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!data.serviceType) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await transportApi.createRequest({
        serviceType:      data.serviceType,
        fromGovernorate:  data.fromGovernorate,
        fromCity:         data.fromCity  || undefined,
        fromAddress:      data.fromAddress,
        toGovernorate:    data.toGovernorate,
        toCity:           data.toCity    || undefined,
        toAddress:        data.toAddress,
        cargoDescription: data.cargoDescription,
        weightTons:       data.weightTons ? parseFloat(data.weightTons) : undefined,
        requiresHelper:   data.requiresHelper,
        notes:            data.notes     || undefined,
        isFlexible:       data.isFlexible,
        scheduledAt:      (!data.isFlexible && data.scheduledAt) ? data.scheduledAt : undefined,
        budgetMin:        data.budgetMin  ? parseFloat(data.budgetMin)  : undefined,
        budgetMax:        data.budgetMax  ? parseFloat(data.budgetMax)  : undefined,
      })
      router.push(`/transport/requests/${res.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، حاول مجدداً')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="pt-6 pb-12 px-4 sm:px-6 w-full max-w-[720px] mx-auto">
      <MultiStepForm
        steps={steps}
        currentStep={step - 1}
        onNext={() => setStep(s => s + 1)}
        onBack={() => setStep(s => s - 1)}
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitLabel={t('publish')}
        canProceed={canAdvance(step, data)}
        title="طلب نقل جديد"
      >
        {step === 1 && <Step1 data={data} set={set as Parameters<typeof Step1>[0]['set']} />}
        {step === 2 && <Step2 data={data} set={set as Parameters<typeof Step2>[0]['set']} />}
        {step === 3 && <Step3 data={data} set={set as Parameters<typeof Step3>[0]['set']} />}
        {step === 4 && <Step4 data={data} set={set as Parameters<typeof Step4>[0]['set']} />}
        {step === 5 && <Step5 data={data} />}
      </MultiStepForm>

      <FormErrorDisplay errors={error ? [error] : []} onClose={() => setError(null)} />
    </main>
  )
}
