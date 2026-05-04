'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { transportApi } from './api'
import type { VehicleType, TransportServiceType } from './types'
import { OMAN_GOVERNORATES, SERVICE_TYPES } from './constants'
import {
  FormSection, FormInput, FormTextarea, FormSelect,
  FormPhoneInput, FormChipGroup, FormErrorDisplay,
} from '@/features/ads/components/forms/shared'
import type { ChipOption } from '@/features/ads/components/forms/shared'

const VEHICLE_TYPE_OPTIONS: ChipOption[] = [
  { value: 'PICKUP',      label: 'ونيت (Pickup)',      icon: 'airport_shuttle' },
  { value: 'VAN',         label: 'فان (Van)',            icon: 'airport_shuttle' },
  { value: 'TRUCK_SMALL', label: 'دينا (Small Truck)',  icon: 'local_shipping'  },
  { value: 'TRUCK_LARGE', label: 'تريلا (Large Truck)', icon: 'local_shipping'  },
  { value: 'TRAILER',     label: 'سطحة (Flatbed)',       icon: 'flatware'        },
  { value: 'TIPPER',      label: 'قلاب (Tipper)',        icon: 'construction'    },
  { value: 'CRANE',       label: 'ونش (Crane)',           icon: 'precision_manufacturing' },
  { value: 'EXCAVATOR',   label: 'حفار (Excavator)',     icon: 'agriculture'     },
  { value: 'OTHER',       label: 'أخرى',                 icon: 'more_horiz'      },
]

const SERVICE_LABELS: Record<TransportServiceType, string> = {
  GOODS:        'بضائع عامة',
  FURNITURE:    'أثاث',
  CONSTRUCTION: 'مواد بناء',
  HEAVY:        'معدات ثقيلة',
  BACKLOAD:     'حمولات راجعة',
  EQUIPMENT:    'تأجير معدات',
}

const SERVICE_TYPE_OPTIONS: ChipOption[] = SERVICE_TYPES.map(s => ({
  value: s,
  label: SERVICE_LABELS[s],
  icon: 'cases',
}))

const GOV_OPTIONS = OMAN_GOVERNORATES.map(g => ({ value: g, label: g }))

export default function CarrierRegisterShell() {
  const t = useTranslations('transport')
  const router = useRouter()

  const [companyName,  setCompanyName]  = useState('')
  const [bio,          setBio]          = useState('')
  const [governorate,  setGovernorate]  = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [whatsapp,     setWhatsapp]     = useState('')
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [serviceTypes, setServiceTypes] = useState<TransportServiceType[]>([])
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)

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

  return (
    <main className="py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-[680px]">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-sm">
            <span className="material-symbols-outlined text-[40px] text-primary">local_shipping</span>
          </div>
          <h1 className="text-2xl font-black text-on-surface">{t('register.title')}</h1>
          <p className="text-sm text-on-surface-variant mt-2">{t('register.subtitle')}</p>
        </div>

        <div className="space-y-6">

          {/* Section 1 — Basic info */}
          <FormSection icon="corporate_fare" title="المعلومات الأساسية">
            <div className="space-y-4">
              <FormInput
                label={t('fields.companyName')}
                name="companyName"
                value={companyName}
                onChange={setCompanyName}
                placeholder="أدخل الاسم الرسمي للمنشأة"
              />
              <FormTextarea
                label={t('fields.bio')}
                name="bio"
                value={bio}
                onChange={setBio}
                rows={4}
                placeholder="صف بإيجاز نطاق عملك وخبراتك..."
              />
            </div>
          </FormSection>

          {/* Section 2 — Vehicle types */}
          <FormSection icon="rv_hookup" title={t('fields.vehicleTypes')}>
            <p className="text-xs text-on-surface-variant/60 mb-3">اختر كل أنواع المركبات التي تمتلكها — يمكن اختيار أكثر من نوع</p>
            <FormChipGroup
              options={VEHICLE_TYPE_OPTIONS}
              value={vehicleTypes}
              onChange={v => setVehicleTypes(v as VehicleType[])}
              multiSelect
              variant="card"
              columns={3}
            />
          </FormSection>

          {/* Section 3 — Service types */}
          <FormSection icon="cases" title={t('fields.serviceTypesLabel')}>
            <p className="text-xs text-on-surface-variant/60 mb-3">اختر أنواع الخدمات التي تقدمها — يمكن اختيار أكثر من نوع</p>
            <FormChipGroup
              options={SERVICE_TYPE_OPTIONS}
              value={serviceTypes}
              onChange={v => setServiceTypes(v as TransportServiceType[])}
              multiSelect
              columns={3}
            />
          </FormSection>

          {/* Section 4 — Location & contact */}
          <FormSection icon="location_on" title="الموقع والتواصل">
            <div className="space-y-4">
              <FormSelect
                label={t('fields.governorate')}
                name="governorate"
                value={governorate}
                onChange={setGovernorate}
                options={GOV_OPTIONS}
                placeholder="اختر المحافظة الرئيسية لعملك..."
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormPhoneInput
                  label={t('fields.contactPhone')}
                  name="contactPhone"
                  value={contactPhone}
                  onChange={setContactPhone}
                />
                <FormPhoneInput
                  label={t('fields.whatsapp')}
                  name="whatsapp"
                  value={whatsapp}
                  onChange={setWhatsapp}
                />
              </div>
            </div>
          </FormSection>

          <FormErrorDisplay errors={error ? [error] : []} onClose={() => setError(null)} />

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-black text-sm hover:brightness-110 active:scale-[0.97] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting
              ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> جارٍ الإنشاء...</>
              : <><span>{t('actions.createProfile')}</span><span className="material-symbols-outlined text-sm">arrow_left_alt</span></>}
          </button>
          <p className="text-xs text-center text-on-surface-variant">
            بالنقر على &ldquo;إنشاء البروفايل&rdquo;، أنت توافق على الشروط والأحكام.
          </p>

        </div>
      </div>
    </main>
  )
}
