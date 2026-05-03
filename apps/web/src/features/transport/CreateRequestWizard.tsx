'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { transportApi } from './api'
import type { TransportServiceType } from './types'
import { OMAN_GOVERNORATES, SERVICE_TYPES, SERVICE_TYPE_ICONS } from './constants'

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

// ─── Shared input styles ──────────────────────────────────────────────────────

const CLS = {
  label:    'block text-body-md font-body-md text-on-surface mb-1.5 font-bold',
  input:    'w-full rounded-xl border border-outline-variant/50 bg-surface-bright text-body-md font-body-md text-on-surface focus:ring-primary focus:border-primary px-4 h-[48px]',
  select:   'form-select w-full rounded-xl border border-outline-variant/50 bg-surface-bright text-body-md font-body-md text-on-surface focus:ring-primary focus:border-primary px-4 h-[48px]',
  textarea: 'w-full rounded-xl border border-outline-variant/50 bg-surface-bright text-body-md font-body-md text-on-surface focus:ring-primary focus:border-primary px-4 py-3 resize-none',
}

// ─── Step 1 — Service Type ────────────────────────────────────────────────────

function Step1({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-10">
      {SERVICE_TYPES.map(type => {
        const selected = data.serviceType === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => set('serviceType', type)}
            className={`flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-xl gap-3 aspect-square transition-all duration-200 relative
              ${selected
                ? 'border-2 border-brand-amber shadow-sm'
                : 'border border-outline-variant/10 hover:border-outline-variant/20 hover:shadow-lg outline outline-1 outline-outline-variant/10'}`}
          >
            {selected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-brand-amber rounded-full flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-sm">check</span>
              </div>
            )}
            <span
              className={`material-symbols-outlined text-4xl ${selected ? 'text-brand-amber' : 'text-brand-navy'}`}
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              {SERVICE_TYPE_ICONS[type]}
            </span>
            <span className="font-title-md text-on-surface font-bold text-center text-sm">
              {t(`serviceTypes.${type}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Step 2 — Route ───────────────────────────────────────────────────────────

function Step2({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="w-full space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10 space-y-4">
        <h3 className="text-title-lg font-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>my_location</span>
          {t('fields.from')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={CLS.label}>{t('fields.governorate')}</label>
            <select value={data.fromGovernorate} onChange={e => set('fromGovernorate', e.target.value)} className={CLS.select}>
              <option value="">-- اختر --</option>
              {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={CLS.label}>{t('fields.city')}</label>
            <input value={data.fromCity} onChange={e => set('fromCity', e.target.value)} className={CLS.input} placeholder="المدينة / الحي" />
          </div>
        </div>
        <div>
          <label className={CLS.label}>{t('fields.address')}</label>
          <textarea value={data.fromAddress} onChange={e => set('fromAddress', e.target.value)} className={CLS.textarea} rows={2} placeholder="العنوان التفصيلي لنقطة الالتقاط" />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_downward</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10 space-y-4">
        <h3 className="text-title-lg font-title-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-amber" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
          {t('fields.to')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={CLS.label}>{t('fields.governorate')}</label>
            <select value={data.toGovernorate} onChange={e => set('toGovernorate', e.target.value)} className={CLS.select}>
              <option value="">-- اختر --</option>
              {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={CLS.label}>{t('fields.city')}</label>
            <input value={data.toCity} onChange={e => set('toCity', e.target.value)} className={CLS.input} placeholder="المدينة / الحي" />
          </div>
        </div>
        <div>
          <label className={CLS.label}>{t('fields.address')}</label>
          <textarea value={data.toAddress} onChange={e => set('toAddress', e.target.value)} className={CLS.textarea} rows={2} placeholder="العنوان التفصيلي لنقطة التسليم" />
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 — Cargo ───────────────────────────────────────────────────────────

function Step3({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="w-full space-y-6">
      <div>
        <label className={CLS.label}>{t('fields.cargo')}</label>
        <textarea value={data.cargoDescription} onChange={e => set('cargoDescription', e.target.value)} className={CLS.textarea} rows={4} placeholder="مثال: ثلاجة + غسالة + كنبة + محتويات غرفة نوم واحدة" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={CLS.label}>{t('fields.weight')}</label>
          <div className="relative">
            <input type="number" min={0} step={0.5} value={data.weightTons} onChange={e => set('weightTons', e.target.value)} className={`${CLS.input} pl-16`} placeholder="0.0" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-body-md text-on-surface-variant">{t('fields.tons')}</span>
          </div>
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => set('requiresHelper', !data.requiresHelper)}
          className={`relative w-12 h-6 rounded-full transition-colors ${data.requiresHelper ? 'bg-primary' : 'bg-outline-variant'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${data.requiresHelper ? 'right-1' : 'right-7'}`} />
        </div>
        <span className="text-body-md font-body-md text-on-surface">{t('fields.requiresHelper')}</span>
      </label>
      <div>
        <label className={CLS.label}>{t('fields.notes')}</label>
        <textarea value={data.notes} onChange={e => set('notes', e.target.value)} className={CLS.textarea} rows={3} placeholder="أي تفاصيل إضافية مهمة للمزود" />
      </div>
    </div>
  )
}

// ─── Step 4 — Timing & Budget ─────────────────────────────────────────────────

function Step4({ data, set }: { data: WizardData; set: (k: keyof WizardData, v: WizardData[keyof WizardData]) => void }) {
  const t = useTranslations('transport')
  return (
    <div className="w-full space-y-6">
      <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10 space-y-4">
        <h3 className="text-title-lg font-title-lg text-on-surface">{t('fields.scheduledAt')}</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set('isFlexible', !data.isFlexible)}
            className={`relative w-12 h-6 rounded-full transition-colors ${data.isFlexible ? 'bg-primary' : 'bg-outline-variant'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${data.isFlexible ? 'right-1' : 'right-7'}`} />
          </div>
          <span className="text-body-md font-body-md text-on-surface">{t('fields.flexible')}</span>
        </label>
        {!data.isFlexible && (
          <div>
            <label className={CLS.label}>{t('fields.scheduledTime')}</label>
            <input type="datetime-local" value={data.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} className={CLS.input} />
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10 space-y-4">
        <h3 className="text-title-lg font-title-lg text-on-surface">الميزانية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={CLS.label}>{t('fields.budgetMin')}</label>
            <div className="relative">
              <input type="number" min={0} value={data.budgetMin} onChange={e => set('budgetMin', e.target.value)} className={`${CLS.input} pl-16`} placeholder="0" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-sm text-on-surface-variant">ر.ع.</span>
            </div>
          </div>
          <div>
            <label className={CLS.label}>{t('fields.budgetMax')}</label>
            <div className="relative">
              <input type="number" min={0} value={data.budgetMax} onChange={e => set('budgetMax', e.target.value)} className={`${CLS.input} pl-16`} placeholder="0" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-sm text-on-surface-variant">ر.ع.</span>
            </div>
          </div>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant">{t('fields.noBudget')}</p>
      </div>
    </div>
  )
}

// ─── Step 5 — Review ──────────────────────────────────────────────────────────

function Step5({ data }: { data: WizardData }) {
  const t = useTranslations('transport')
  const row = (label: string, value: string) => (
    <div className="flex justify-between items-start py-3 border-b border-outline-variant/20 last:border-0">
      <span className="text-body-md font-body-md text-on-surface-variant">{label}</span>
      <span className="text-body-md font-body-md text-on-surface font-bold text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )
  return (
    <div className="w-full space-y-4">
      <div className="bg-surface-container-lowest rounded-xl p-6 outline outline-1 outline-outline-variant/10">
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
      </div>
    </div>
  )
}

// ─── Progress Indicator ───────────────────────────────────────────────────────

const STEP_LABELS = ['serviceType', 'route', 'cargo', 'timing', 'review'] as const

function ProgressIndicator({ step }: { step: number }) {
  const t = useTranslations('transport')
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between px-2 md:px-6 mb-4">
        {STEP_LABELS.map((key, i) => {
          const n = i + 1
          const active = n === step
          const done   = n < step
          return (
            <div key={key} className={`flex flex-col items-center gap-2 relative z-10 ${!active && !done ? 'opacity-60' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                ${active ? 'bg-brand-amber text-on-primary'
                  : done  ? 'bg-primary text-on-primary'
                  : 'bg-surface-variant text-on-surface-variant outline outline-1 outline-outline-variant'}`}>
                {done ? <span className="material-symbols-outlined text-sm">check</span> : n}
              </div>
              <span className={`font-label-sm text-center text-[10px] font-bold ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {t(`steps.${key}`)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="w-full h-1 bg-surface-variant rounded-full relative overflow-hidden">
        <div
          className="absolute right-0 top-0 h-full bg-brand-amber rounded-full transition-all duration-500"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Step Validation ─────────────────────────────────────────────────────────

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

  const [step,      setStep]      = useState(1)
  const [data,      setData]      = useState<WizardData>(INIT)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const STEP_TITLES = [
    t('steps.serviceType') + ' — ماذا تريد أن تنقل؟',
    'من أين وإلى أين؟',
    'تفاصيل الحمولة',
    'التوقيت والميزانية',
    'مراجعة الطلب قبل النشر',
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
    <main className="pt-6 pb-12 px-page-padding-x-sm md:px-page-padding-x-md w-full max-w-[720px] mx-auto flex flex-col items-center">
      <ProgressIndicator step={step} />

      <h1 className="text-hero-md font-hero-md text-on-surface mb-8 text-center font-bold">
        {STEP_TITLES[step - 1]}
      </h1>

      {step === 1 && <Step1 data={data} set={set as Parameters<typeof Step1>[0]['set']} />}
      {step === 2 && <Step2 data={data} set={set as Parameters<typeof Step2>[0]['set']} />}
      {step === 3 && <Step3 data={data} set={set as Parameters<typeof Step3>[0]['set']} />}
      {step === 4 && <Step4 data={data} set={set as Parameters<typeof Step4>[0]['set']} />}
      {step === 5 && <Step5 data={data} />}

      {error && (
        <div className="w-full mt-4 bg-error-container text-on-error-container rounded-xl px-4 py-3 text-body-md font-body-md">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="w-full flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="bg-surface-variant text-on-surface px-6 py-3 rounded-full text-body-md font-body-md font-bold hover:bg-surface-dim transition-colors disabled:opacity-0 disabled:pointer-events-none flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          {t('previous')}
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance(step, data)}
            className="bg-gradient-to-br from-brand-amber to-[#D05000] text-on-primary font-title-lg px-10 py-3 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('next')}
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-br from-brand-amber to-[#D05000] text-on-primary font-title-lg px-10 py-3 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                {t('publishing')}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">send</span>
                {t('publish')}
              </>
            )}
          </button>
        )}
      </div>
    </main>
  )
}
