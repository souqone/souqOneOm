'use client'

import dynamic from 'next/dynamic'
import { useFormContext, useController } from 'react-hook-form'
import { MapPin, ArrowDown, Navigation, LocateFixed } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { CreateRequestFormData } from './CreateRequestWizard'
import { OMAN_GOVERNORATES } from '../constants'
import { useTranslations } from 'next-intl'

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] flex items-center justify-center"
      style={{ height: '280px' }}
    >
      <span className="text-sm text-[var(--color-on-surface-muted)]">جارٍ تحميل الخريطة…</span>
    </div>
  ),
})

export default function Step2Route() {
  const { register, watch, control, formState: { errors } } = useFormContext<CreateRequestFormData>()

  const fromGov = watch('fromGovernorate')
  const toGov   = watch('toGovernorate')

  const { field: fromLatField } = useController({ name: 'fromLat', control })
  const { field: fromLngField } = useController({ name: 'fromLng', control })
  const { field: toLatField }   = useController({ name: 'toLat',   control })
  const { field: toLngField }   = useController({ name: 'toLng',   control })

  const [pinMode, setPinMode] = useState<'from' | 'to'>('from')
  const [showMap, setShowMap] = useState(false)

  const t = useTranslations('transport.steps')
  const tCommon = useTranslations('transport')

  const fromLatLng: [number, number] | null =
    fromLatField.value != null && fromLngField.value != null
      ? [fromLatField.value as number, fromLngField.value as number]
      : null

  const toLatLng: [number, number] | null =
    toLatField.value != null && toLngField.value != null
      ? [toLatField.value as number, toLngField.value as number]
      : null

  const handleFromChange = useCallback(([lat, lng]: [number, number]) => {
    fromLatField.onChange(lat)
    fromLngField.onChange(lng)
    setPinMode('to')
  }, [fromLatField, fromLngField])

  const handleToChange = useCallback(([lat, lng]: [number, number]) => {
    toLatField.onChange(lat)
    toLngField.onChange(lng)
  }, [toLatField, toLngField])

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl text-[var(--color-on-surface)] mb-1" style={{ fontWeight: 700 }}>
          {t('route')}
        </h2>
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          {t('routeDesc')}
        </p>
      </div>

      {/* Route visual */}
      {(fromGov || toGov) && (
        <div className="bg-[var(--color-surface-container)] rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="flex flex-col items-center gap-0">
            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-green-50" />
            <div className="w-0 border-r-2 border-dashed border-amber-400 h-8 my-1" />
            <div className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-50" />
          </div>
          <div className="flex flex-col justify-between gap-2 min-w-0 flex-1">
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">{fromGov || '—'}</span>
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">{toGov || '—'}</span>
          </div>
          {fromGov && toGov && (
            <span className="text-xs font-bold text-[var(--color-brand-amber)] bg-[var(--color-brand-amber)]/10 px-2.5 py-1 rounded-full">
              {t('routeSelected')}
            </span>
          )}
        </div>
      )}

      <div className="space-y-5">
        {/* From section */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center">
              <MapPin size={13} className="text-green-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">{tCommon('fields.from')}</h3>
            {fromLatLng && (
              <span className="mr-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <LocateFixed size={10} className="inline ml-0.5" />
                {fromLatLng[0].toFixed(4)}, {fromLatLng[1].toFixed(4)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                {tCommon('fields.governorate')} <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('fromGovernorate')}
                className={`input-base text-sm ${errors.fromGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">{tCommon('fields.selectGovernorate')}</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`from-gov-step2-${gov}`} value={gov}>{gov}</option>
                ))}
              </select>
              {errors.fromGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.fromGovernorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                {tCommon('fields.city')}
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">({tCommon('fields.optional')})</span>
              </label>
              <input {...register('fromCity')} type="text" placeholder={t('fromCityExample')} className="input-base text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              {tCommon('fields.address')} <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              {t('fromAddressDesc')}
            </p>
            <textarea
              {...register('fromAddress')}
              rows={2}
              placeholder={t('fromAddressExample')}
              className={`input-base text-sm resize-none ${errors.fromAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.fromAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.fromAddress.message}</p>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-amber)]/10 flex items-center justify-center">
            <ArrowDown size={18} className="text-[var(--color-brand-amber)]" />
          </div>
        </div>

        {/* To section */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center">
              <MapPin size={13} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-sm text-[var(--color-on-surface)]">{tCommon('fields.to')}</h3>
            {toLatLng && (
              <span className="mr-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <LocateFixed size={10} className="inline ml-0.5" />
                {toLatLng[0].toFixed(4)}, {toLatLng[1].toFixed(4)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                {tCommon('fields.governorate')} <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                {...register('toGovernorate')}
                className={`input-base text-sm ${errors.toGovernorate ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">{tCommon('fields.selectGovernorate')}</option>
                {OMAN_GOVERNORATES.map((gov) => (
                  <option key={`to-gov-step2-${gov}`} value={gov}>{gov}</option>
                ))}
              </select>
              {errors.toGovernorate && (
                <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.toGovernorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
                {tCommon('fields.city')}
                <span className="text-[var(--color-on-surface-muted)] font-normal mr-1">({tCommon('fields.optional')})</span>
              </label>
              <input {...register('toCity')} type="text" placeholder={t('toCityExample')} className="input-base text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] mb-1.5">
              {tCommon('fields.address')} <span className="text-[var(--color-error)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--color-on-surface-muted)] mb-2">
              {t('toAddressDesc')}
            </p>
            <textarea
              {...register('toAddress')}
              rows={2}
              placeholder={t('toAddressExample')}
              className={`input-base text-sm resize-none ${errors.toAddress ? 'border-[var(--color-error)]' : ''}`}
            />
            {errors.toAddress && (
              <p className="mt-1 text-xs text-[var(--color-error)] font-semibold">{errors.toAddress.message}</p>
            )}
          </div>
        </div>

        {/* ── Map section ─────────────────────────────────── */}
        <div className="border border-[var(--color-outline-variant)] rounded-2xl p-4">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-sm font-bold text-[var(--color-on-surface)]"
          >
            <span className="flex items-center gap-2">
              <Navigation size={15} className="text-[var(--color-brand-navy)]" />
              {t('selectOnMap')}
              <span className="text-xs font-normal text-[var(--color-on-surface-muted)]">({tCommon('fields.optional')})</span>
            </span>
            <span className="text-[var(--color-on-surface-muted)] text-xs">{showMap ? `▲ ${t('hide')}` : `▼ ${t('show')}`}</span>
          </button>

          {showMap && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                <span className="text-[var(--color-on-surface-variant)]">{t('clickOnMapToSelect')}</span>
                <button
                  type="button"
                  onClick={() => setPinMode('from')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    pinMode === 'from'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                  {tCommon('fields.from')} {fromLatLng && '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => setPinMode('to')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    pinMode === 'to'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                  {tCommon('fields.to')} {toLatLng && '✓'}
                </button>
                {(fromLatLng || toLatLng) && (
                  <button
                    type="button"
                    onClick={() => {
                      fromLatField.onChange(null); fromLngField.onChange(null)
                      toLatField.onChange(null);   toLngField.onChange(null)
                    }}
                    className="mr-auto text-xs text-[var(--color-error)] hover:underline"
                  >
                    {t('clearPins')}
                  </button>
                )}
              </div>

              <RouteMap
                mode={pinMode}
                fromLatLng={fromLatLng}
                toLatLng={toLatLng}
                onFromChange={handleFromChange}
                onToChange={handleToChange}
              />

              <p className="text-[11px] text-[var(--color-on-surface-muted)]">
                {t('mapOptionalDesc')}
              </p>
            </div>
          )}
        </div>
        {/* ── END map section ──────────────────────────────── */}

      </div>
    </div>
  )
}
