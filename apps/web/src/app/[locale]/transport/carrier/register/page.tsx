'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { transportApi } from '@/features/transport/api'
import { OMAN_GOVERNORATES, SERVICE_TYPES, SERVICE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from '@/features/transport/constants'
import type { TransportServiceType, VehicleType } from '@/features/transport/types'

const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]

export default function CarrierRegisterPage() {
  const t = useTranslations('transport')
  const router = useRouter()

  const [companyName, setCompanyName] = useState('')
  const [bio, setBio] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [serviceTypes, setServiceTypes] = useState<TransportServiceType[]>([])
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleVehicle = (v: VehicleType) =>
    setVehicleTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  const toggleService = (s: TransportServiceType) =>
    setServiceTypes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const canSubmit = vehicleTypes.length > 0 && serviceTypes.length > 0 && governorate

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await transportApi.createCarrierProfile({
        companyName: companyName || undefined,
        bio: bio || undefined,
        vehicleTypes,
        serviceTypes,
        governorate,
        city: city || undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
      })
      router.push('/transport/carrier/dashboard')
    } catch { /* silent */ }
    setIsSubmitting(false)
  }

  const inputClass = 'w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors'

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-on-surface mb-2">{t('register.title')}</h1>
        <p className="text-[14px] text-on-surface-variant mb-8">{t('register.subtitle')}</p>

        <div className="space-y-6">
          {/* Company name */}
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.companyName')}</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} />
          </div>

          {/* Bio */}
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.bio')}</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className={inputClass} />
          </div>

          {/* Vehicle types */}
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-3 block">{t('fields.vehicleTypes')} *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VEHICLE_TYPES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVehicle(v)}
                  className={clsx(
                    'px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all',
                    vehicleTypes.includes(v)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-outline-variant/80'
                  )}
                >
                  {VEHICLE_TYPE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Service types */}
          <div>
            <label className="text-[13px] font-medium text-on-surface mb-3 block">{t('fields.serviceTypesLabel')} *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_TYPES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium border transition-all',
                    serviceTypes.includes(s)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-outline-variant/80'
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">{SERVICE_TYPE_ICONS[s]}</span>
                  {t(`serviceTypes.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.governorate')} *</label>
              <select value={governorate} onChange={e => setGovernorate(e.target.value)} className={inputClass}>
                <option value="">{t('fields.governorate')}</option>
                {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.city')}</label>
              <input value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.contactPhone')}</label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[13px] font-medium text-on-surface mb-1.5 block">{t('fields.whatsapp')}</label>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full py-3 rounded-full bg-primary text-on-primary text-[14px] font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('actions.createProfile')}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
