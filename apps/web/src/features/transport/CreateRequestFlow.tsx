'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import { ServiceTypeSelector } from './components/ServiceTypeSelector'
import { OMAN_GOVERNORATES } from './constants'
import { transportApi } from './api'
import type { TransportServiceType, CreateTransportRequestDto } from './types'

const STEP_KEYS = ['serviceType', 'route', 'cargo', 'timing', 'review'] as const

export function CreateRequestFlow() {
  const t = useTranslations('transport')
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // ── Form state ─────────────────────────────────
  const [serviceType, setServiceType] = useState<TransportServiceType | null>(null)
  const [fromGovernorate, setFromGovernorate] = useState('')
  const [fromCity, setFromCity] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [toGovernorate, setToGovernorate] = useState('')
  const [toCity, setToCity] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [cargoDescription, setCargoDescription] = useState('')
  const [weightTons, setWeightTons] = useState('')
  const [requiresHelper, setRequiresHelper] = useState(false)
  const [notes, setNotes] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isFlexible, setIsFlexible] = useState(false)
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [noBudget, setNoBudget] = useState(false)

  // ── Validation ─────────────────────────────────
  const canNext = (): boolean => {
    switch (step) {
      case 0:
        return !!serviceType
      case 1:
        return !!fromGovernorate && !!fromAddress && !!toGovernorate && !!toAddress
      case 2:
        return !!cargoDescription
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < STEP_KEYS.length - 1) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!serviceType) return
    setSubmitting(true)
    try {
      const dto: CreateTransportRequestDto = {
        serviceType,
        fromGovernorate,
        fromCity: fromCity || undefined,
        fromAddress,
        toGovernorate,
        toCity: toCity || undefined,
        toAddress,
        cargoDescription,
        weightTons: weightTons ? parseFloat(weightTons) : undefined,
        requiresHelper,
        notes: notes || undefined,
        scheduledAt: scheduledAt || undefined,
        isFlexible,
        budgetMin: !noBudget && budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: !noBudget && budgetMax ? parseFloat(budgetMax) : undefined,
      }
      const created = await transportApi.createRequest(dto)
      router.push(`/transport/requests/${created.id}`)
    } catch {
      /* silent */
    }
    setSubmitting(false)
  }

  const inputClass =
    'w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex-1">
      {/* Progress */}
      <div className="flex items-center gap-1 mb-8">
        {STEP_KEYS.map((key, idx) => (
          <div key={key} className="flex items-center flex-1">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors',
                idx <= step
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant/50',
              )}
            >
              {idx + 1}
            </div>
            {idx < STEP_KEYS.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-1',
                  idx < step ? 'bg-primary/40' : 'bg-outline-variant/20',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <h2 className="text-lg font-bold text-on-surface mb-6">
        {t(`steps.${STEP_KEYS[step]}`)}
      </h2>

      {/* ── Step 1: Service Type ────────────────────── */}
      {step === 0 && (
        <ServiceTypeSelector value={serviceType} onChange={setServiceType} />
      )}

      {/* ── Step 2: Route ──────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-[13px] font-bold text-on-surface mb-2">
              {t('fields.from')}
            </legend>
            <select
              value={fromGovernorate}
              onChange={(e) => setFromGovernorate(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('fields.governorate')}</option>
              {OMAN_GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              placeholder={t('fields.city')}
              className={inputClass}
            />
            <input
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder={t('fields.address')}
              className={inputClass}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-[13px] font-bold text-on-surface mb-2">
              {t('fields.to')}
            </legend>
            <select
              value={toGovernorate}
              onChange={(e) => setToGovernorate(e.target.value)}
              className={inputClass}
            >
              <option value="">{t('fields.governorate')}</option>
              {OMAN_GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              placeholder={t('fields.city')}
              className={inputClass}
            />
            <input
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={t('fields.address')}
              className={inputClass}
            />
          </fieldset>
        </div>
      )}

      {/* ── Step 3: Cargo ──────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">
              {t('fields.cargo')} *
            </label>
            <textarea
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">
              {t('fields.weight')}
            </label>
            <input
              type="number"
              step="0.1"
              value={weightTons}
              onChange={(e) => setWeightTons(e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresHelper}
              onChange={(e) => setRequiresHelper(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant accent-primary"
            />
            <span className="text-[13px] text-on-surface">{t('fields.requiresHelper')}</span>
          </label>
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">
              {t('fields.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Timing & Budget ────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">
              {t('fields.scheduledAt')}
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={isFlexible}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFlexible}
              onChange={(e) => {
                setIsFlexible(e.target.checked)
                if (e.target.checked) setScheduledAt('')
              }}
              className="w-4 h-4 rounded border-outline-variant accent-primary"
            />
            <span className="text-[13px] text-on-surface">{t('fields.flexible')}</span>
          </label>

          <div className="border-t border-outline-variant/20 pt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={noBudget}
                onChange={(e) => {
                  setNoBudget(e.target.checked)
                  if (e.target.checked) {
                    setBudgetMin('')
                    setBudgetMax('')
                  }
                }}
                className="w-4 h-4 rounded border-outline-variant accent-primary"
              />
              <span className="text-[13px] text-on-surface">{t('fields.noBudget')}</span>
            </label>
            {!noBudget && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-on-surface mb-1 block">
                    {t('fields.budgetMin')}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-on-surface mb-1 block">
                    {t('fields.budgetMax')}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5: Review ─────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10">
            <ReviewRow
              label={t('steps.serviceType')}
              value={serviceType ? t(`serviceTypes.${serviceType}`) : '—'}
            />
            <ReviewRow
              label={t('fields.from')}
              value={`${fromGovernorate} ${fromCity ? `- ${fromCity}` : ''}`}
            />
            <ReviewRow
              label={t('fields.to')}
              value={`${toGovernorate} ${toCity ? `- ${toCity}` : ''}`}
            />
            <ReviewRow label={t('fields.cargo')} value={cargoDescription} />
            {weightTons && (
              <ReviewRow label={t('fields.weight')} value={`${weightTons} ${t('fields.tons')}`} />
            )}
            <ReviewRow
              label={t('fields.scheduledAt')}
              value={
                scheduledAt
                  ? new Date(scheduledAt).toLocaleString('ar-EG')
                  : isFlexible
                    ? t('fields.flexible')
                    : t('fields.asap')
              }
            />
            {!noBudget && (budgetMin || budgetMax) && (
              <ReviewRow
                label={t('fields.budgetMin')}
                value={`${budgetMin || '0'} - ${budgetMax || '∞'} ر.ع.`}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Navigation buttons ─────────────────────── */}
      <div className="flex items-center gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={handlePrev}
            className="px-6 py-3 rounded-xl border border-outline-variant/40 text-[14px] font-medium text-on-surface hover:bg-surface-container transition-colors"
          >
            {t('previous')}
          </button>
        )}
        <div className="flex-1" />
        {step < STEP_KEYS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('next')}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary text-[14px] font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('publishing')}
              </>
            ) : (
              t('publish')
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Review Row ───────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start px-4 py-3">
      <span className="text-[12px] text-on-surface-variant shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-on-surface text-end ms-4 line-clamp-2">
        {value}
      </span>
    </div>
  )
}
