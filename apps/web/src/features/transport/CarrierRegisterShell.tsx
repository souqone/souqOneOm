'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { transportApi } from './api'
import type { VehicleType, TransportServiceType } from './types'
import { OMAN_GOVERNORATES, SERVICE_TYPES } from './constants'

const VEHICLE_TYPES: { val: VehicleType; label: string; icon: string }[] = [
  { val: 'PICKUP',      label: 'ونيت (Pickup)',     icon: 'airport_shuttle' },
  { val: 'VAN',         label: 'فان (Van)',           icon: 'airport_shuttle' },
  { val: 'TRUCK_SMALL', label: 'دينا (Small Truck)', icon: 'local_shipping'  },
  { val: 'TRUCK_LARGE', label: 'تريلا (Large Truck)', icon: 'local_shipping' },
  { val: 'TRAILER',     label: 'سطحة (Flatbed)',      icon: 'flatware'       },
  { val: 'TIPPER',      label: 'قلاب (Tipper)',       icon: 'construction'   },
  { val: 'CRANE',       label: 'ونش (Crane)',          icon: 'precision_manufacturing' },
  { val: 'EXCAVATOR',   label: 'حفار (Excavator)',    icon: 'agriculture'    },
  { val: 'OTHER',       label: 'أخرى',                icon: 'more_horiz'     },
]

const SERVICE_LABELS: Record<TransportServiceType, string> = {
  GOODS:        'بضائع عامة',
  FURNITURE:    'أثاث',
  CONSTRUCTION: 'مواد بناء',
  HEAVY:        'معدات ثقيلة',
  BACKLOAD:     'حمولات راجعة',
  EQUIPMENT:    'تأجير معدات',
}

const INP = 'w-full h-10 bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/40 rounded-lg px-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-brand-amber transition-colors'
const SEL = `form-select ${INP} appearance-none`

export default function CarrierRegisterShell() {
  const t = useTranslations('transport')
  const router = useRouter()

  const [companyName, setCompanyName] = useState('')
  const [bio,         setBio]         = useState('')
  const [governorate, setGovernorate] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whatsapp,    setWhatsapp]    = useState('')
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [serviceTypes, setServiceTypes] = useState<TransportServiceType[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  function toggleVehicle(v: VehicleType) {
    setVehicleTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }
  function toggleService(s: TransportServiceType) {
    setServiceTypes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function submit() {
    if (!governorate || vehicleTypes.length === 0 || serviceTypes.length === 0) {
      setError('يرجى تحديد المحافظة وأنواع المركبات والخدمات')
      return
    }
    setSubmitting(true); setError(null)
    try {
      await transportApi.createCarrierProfile({
        companyName: companyName || undefined,
        bio:         bio         || undefined,
        vehicleTypes,
        serviceTypes,
        governorate,
        contactPhone: contactPhone || undefined,
        whatsapp:     whatsapp     || undefined,
      })
      router.push('/transport/carrier/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'حدث خطأ، حاول مجدداً')
    } finally { setSubmitting(false) }
  }

  function CheckCard({ checked, label, icon }: { checked: boolean; label: string; icon: string }) {
    return (
      <div className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest transition-all hover:border-outline-variant/40 hover:shadow-sm h-full cursor-pointer
        ${checked ? 'border-brand-amber bg-brand-amber/5 shadow-sm' : 'border-outline-variant/20'}`}>
        <span className={`material-symbols-outlined transition-colors ${checked ? 'text-brand-amber' : 'text-on-surface-variant'}`}
          style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
        <span className={`font-label-sm text-label-sm text-center transition-colors ${checked ? 'text-brand-amber' : 'text-on-surface-variant'}`}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <main className="py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-[680px]">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-amber/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-amber/20 shadow-sm">
            <span className="material-symbols-outlined text-[40px] text-brand-amber"
              style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
          </div>
          <h1 className="font-hero-md text-hero-md text-on-surface">{t('register.title')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">{t('register.subtitle')}</p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden">
          {/* Section 1 — Basic info */}
          <div className="p-6 sm:p-8 border-b border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              <h2 className="font-title-lg text-title-lg text-on-surface">المعلومات الأساسية</h2>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">{t('fields.companyName')}</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={INP} placeholder="أدخل الاسم الرسمي للمنشأة" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">{t('fields.bio')}</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 hover:border-outline-variant/40 rounded-lg p-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-brand-amber transition-colors h-28 resize-none"
                  placeholder="صف بإيجاز نطاق عملك وخبراتك..." />
              </div>
            </div>
          </div>

          {/* Section 2 — Vehicle types */}
          <div className="p-6 sm:p-8 border-b border-outline-variant/10 bg-surface/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">rv_hookup</span>
                <h2 className="font-title-lg text-title-lg text-on-surface">{t('fields.vehicleTypes')}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container py-1 px-3 rounded-full">اختر متعدد</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VEHICLE_TYPES.map(v => (
                <label key={v.val} className="cursor-pointer" onClick={() => toggleVehicle(v.val)}>
                  <CheckCard checked={vehicleTypes.includes(v.val)} label={v.label} icon={v.icon} />
                </label>
              ))}
            </div>
          </div>

          {/* Section 3 — Service types */}
          <div className="p-6 sm:p-8 border-b border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">cases</span>
                <h2 className="font-title-lg text-title-lg text-on-surface">{t('fields.serviceTypesLabel')}</h2>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container py-1 px-3 rounded-full">اختر متعدد</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map(s => (
                <label key={s} className="cursor-pointer" onClick={() => toggleService(s)}>
                  <CheckCard checked={serviceTypes.includes(s)} label={SERVICE_LABELS[s]} icon="cases" />
                </label>
              ))}
            </div>
          </div>

          {/* Section 4 — Location & contact */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h2 className="font-title-lg text-title-lg text-on-surface">الموقع والتواصل</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div className="sm:col-span-2">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">{t('fields.governorate')}</label>
                <div className="relative">
                  <select value={governorate} onChange={e => setGovernorate(e.target.value)} className={SEL}>
                    <option value="">اختر المحافظة الرئيسية لعملك...</option>
                    {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">{t('fields.contactPhone')}</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                  className={INP} placeholder="+968 9X XXX XXX" dir="ltr" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2">{t('fields.whatsapp')}</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  className={INP} placeholder="+968 9X XXX XXX" dir="ltr" />
              </div>
            </div>

            {error && (
              <p className="text-body-sm text-error mb-4 bg-error-container rounded-lg p-3">{error}</p>
            )}

            <button onClick={submit} disabled={submitting}
              className="w-full bg-gradient-to-br from-brand-amber to-tertiary-container text-on-primary font-title-lg text-title-lg py-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting
                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                : <><span>{t('actions.createProfile')}</span>
                   <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_left_alt</span></>}
            </button>
            <p className="font-body-sm text-body-sm text-center text-on-surface-variant mt-4">
              بالنقر على &ldquo;إنشاء البروفايل&rdquo;، أنت توافق على الشروط والأحكام.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
