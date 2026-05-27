'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import {
  useMyDriverProfile,
  useMyEmployerProfile,
  useUpdateDriverProfile,
  useUpdateEmployerProfile,
} from '@/lib/api';
import { useToast } from '@/components/toast';
import {
  OMAN_GOVERNORATES,
  LICENSE_TYPE_LABELS,
  VEHICLE_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  STRINGS,
} from '@/features/jobs/constants';
import { cn } from '@/lib/utils';

const driverSchema = z.object({
  licenseTypes: z.array(z.string()).min(1, 'اختر نوع رخصة واحد على الأقل'),
  experienceYears: z.number().optional(),
  vehicleTypes: z.array(z.string()),
  hasOwnVehicle: z.boolean(),
  bio: z.string().optional(),
  governorate: z.string().min(1, 'اختر المحافظة'),
  city: z.string().optional(),
  contactPhone: z.string().optional(),
  whatsapp: z.string().optional(),
  languages: z.array(z.string()),
  nationality: z.string().optional(),
  isAvailable: z.boolean(),
})

const employerSchema = z.object({
  companyName: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  bio: z.string().optional(),
  governorate: z.string().min(1, 'اختر المحافظة'),
  city: z.string().optional(),
  contactPhone: z.string().optional(),
  whatsapp: z.string().optional(),
})

type DriverFormData = z.infer<typeof driverSchema>
type EmployerFormData = z.infer<typeof employerSchema>
type TabType = 'driver' | 'employer'

export default function EditProfilePage() {
  return (
    <JobsPageGuard role="any">
      <EditProfileContent />
    </JobsPageGuard>
  );
}

function EditProfileContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('driver')
  const [submitting, setSubmitting] = useState(false)

  const { data: driverProfile, isLoading: driverLoading } = useMyDriverProfile()
  const { data: employerProfile, isLoading: employerLoading } = useMyEmployerProfile()
  const updateDriver = useUpdateDriverProfile()
  const updateEmployer = useUpdateEmployerProfile()

  const hasDriver = !!driverProfile
  const hasEmployer = !!employerProfile
  const loading = driverLoading || employerLoading

  const driverForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      licenseTypes: [],
      vehicleTypes: [],
      hasOwnVehicle: false,
      languages: [],
      isAvailable: true,
    },
  })

  const employerForm = useForm<EmployerFormData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {},
  })

  useEffect(() => {
    if (driverProfile) {
      driverForm.reset({
        licenseTypes: (driverProfile.licenseTypes as string[]) ?? [],
        experienceYears: driverProfile.experienceYears ?? undefined,
        vehicleTypes: driverProfile.vehicleTypes ?? [],
        hasOwnVehicle: driverProfile.hasOwnVehicle ?? false,
        bio: driverProfile.bio ?? '',
        governorate: driverProfile.governorate ?? '',
        city: driverProfile.city ?? '',
        contactPhone: driverProfile.contactPhone ?? '',
        whatsapp: driverProfile.whatsapp ?? '',
        languages: driverProfile.languages ?? [],
        nationality: driverProfile.nationality ?? '',
        isAvailable: driverProfile.isAvailable ?? true,
      })
    }
  }, [driverProfile, driverForm])

  useEffect(() => {
    if (employerProfile) {
      employerForm.reset({
        companyName: employerProfile.companyName ?? '',
        companySize: employerProfile.companySize ?? '',
        industry: employerProfile.industry ?? '',
        bio: employerProfile.bio ?? '',
        governorate: employerProfile.governorate ?? '',
        city: employerProfile.city ?? '',
        contactPhone: employerProfile.contactPhone ?? '',
        whatsapp: employerProfile.whatsapp ?? '',
      })
    }
  }, [employerProfile, employerForm])

  useEffect(() => {
    if (!loading) {
      if (hasDriver) setActiveTab('driver')
      else if (hasEmployer) setActiveTab('employer')
    }
  }, [loading, hasDriver, hasEmployer])

  const toggleArrayValue = (arr: string[], value: string, onChange: (v: string[]) => void) => {
    onChange(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value])
  }

  const handleDriverSubmit = async (data: DriverFormData) => {
    setSubmitting(true)
    try {
      await updateDriver.mutateAsync({ ...data, licenseTypes: data.licenseTypes as never[] })
      addToast('success', 'تم تحديث بروفايل السائق بنجاح')
      router.push('/jobs/dashboard')
    } catch {
      addToast('error', 'حدث خطأ أثناء التحديث')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmployerSubmit = async (data: EmployerFormData) => {
    setSubmitting(true)
    try {
      await updateEmployer.mutateAsync(data)
      addToast('success', 'تم تحديث بروفايل صاحب العمل بنجاح')
      router.push('/jobs/dashboard')
    } catch {
      addToast('error', 'حدث خطأ أثناء التحديث')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-1/3 bg-surface-dim rounded-xl mx-auto" />
          <div className="h-48 bg-surface-dim rounded-2xl" />
          <div className="h-32 bg-surface-dim rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Back */}
      <button
        onClick={() => router.push('/jobs/dashboard')}
        className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
      >
        <ChevronRight size={16} />
        لوحة التحكم
      </button>

      <h1 className="text-xl font-extrabold text-on-surface mb-6">تعديل البروفايل</h1>

      {/* Tabs — show only if user has both profiles */}
      {hasDriver && hasEmployer && (
        <div className="flex gap-2 mb-6">
          {([
            { key: 'driver' as TabType, label: 'بروفايل السائق', emoji: '🚛' },
            { key: 'employer' as TabType, label: 'بروفايل صاحب العمل', emoji: '👔' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all',
                activeTab === tab.key
                  ? 'bg-brand-amber text-white border-brand-amber'
                  : 'border-outline-variant text-on-surface-variant hover:border-outline'
              )}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Driver Form */}
      {activeTab === 'driver' && hasDriver && (
        <form onSubmit={driverForm.handleSubmit(handleDriverSubmit)} className="space-y-5">

          {/* Availability Toggle */}
          <div className="card-base rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-on-surface">متاح للعمل حالياً</p>
              <p className="text-xs text-on-surface-variant mt-0.5">يظهر بروفايلك في قائمة السائقين المتاحين</p>
            </div>
            <button
              type="button"
              onClick={() => driverForm.setValue('isAvailable', !driverForm.watch('isAvailable'))}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                driverForm.watch('isAvailable') ? 'bg-primary' : 'bg-outline-variant'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                driverForm.watch('isAvailable') ? 'start-5' : 'start-0.5'
              )} />
            </button>
          </div>

          {/* License Types */}
          <div className="card-base rounded-2xl p-5">
            <label className="block text-sm font-bold text-on-surface mb-3">
              أنواع الرخص <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => {
                const selected = driverForm.watch('licenseTypes').includes(value)
                return (
                  <button
                    key={`lic-${value}`}
                    type="button"
                    onClick={() => toggleArrayValue(driverForm.watch('licenseTypes'), value, v => driverForm.setValue('licenseTypes', v))}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-bold transition-all',
                      selected ? 'border-brand-amber bg-amber-50 text-brand-amber' : 'border-outline-variant text-on-surface hover:border-outline'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {driverForm.formState.errors.licenseTypes && (
              <p className="text-xs text-error mt-1">{driverForm.formState.errors.licenseTypes.message}</p>
            )}
          </div>

          {/* Experience + Vehicle */}
          <div className="card-base rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">سنوات الخبرة</label>
              <input
                type="number" min={0} max={50}
                {...driverForm.register('experienceYears', { valueAsNumber: true })}
                className="input-base text-sm w-full"
                placeholder="مثال: 5"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">أنواع المركبات</label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPE_OPTIONS.map(vt => {
                  const selected = driverForm.watch('vehicleTypes').includes(vt)
                  return (
                    <button
                      key={`vt-${vt}`}
                      type="button"
                      onClick={() => toggleArrayValue(driverForm.watch('vehicleTypes'), vt, v => driverForm.setValue('vehicleTypes', v))}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                        selected ? 'border-brand-amber bg-amber-50 text-brand-amber' : 'border-outline-variant text-on-surface hover:border-outline'
                      )}
                    >
                      {vt}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface">يمتلك مركبته الخاصة</span>
              <button
                type="button"
                onClick={() => driverForm.setValue('hasOwnVehicle', !driverForm.watch('hasOwnVehicle'))}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors duration-200',
                  driverForm.watch('hasOwnVehicle') ? 'bg-primary' : 'bg-outline-variant'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                  driverForm.watch('hasOwnVehicle') ? 'start-5' : 'start-0.5'
                )} />
              </button>
            </div>
          </div>

          {/* Languages */}
          <div className="card-base rounded-2xl p-5">
            <label className="block text-sm font-bold text-on-surface mb-2">اللغات</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(lang => {
                const selected = driverForm.watch('languages').includes(lang)
                return (
                  <button
                    key={`lang-${lang}`}
                    type="button"
                    onClick={() => toggleArrayValue(driverForm.watch('languages'), lang, v => driverForm.setValue('languages', v))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      selected ? 'border-brand-amber bg-amber-50 text-brand-amber' : 'border-outline-variant text-on-surface hover:border-outline'
                    )}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bio + Location + Contact */}
          <div className="card-base rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">نبذة عنك</label>
              <textarea
                {...driverForm.register('bio')}
                rows={3}
                className="input-base text-sm w-full resize-none"
                placeholder="اكتب نبذة مختصرة عن خبرتك..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">
                المحافظة <span className="text-error">*</span>
              </label>
              <select {...driverForm.register('governorate')} className="input-base text-sm w-full">
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {driverForm.formState.errors.governorate && (
                <p className="text-xs text-error mt-1">{driverForm.formState.errors.governorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">المدينة</label>
              <input {...driverForm.register('city')} className="input-base text-sm w-full" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">رقم الهاتف</label>
                <input {...driverForm.register('contactPhone')} className="input-base text-sm w-full" placeholder="+968..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">واتساب</label>
                <input {...driverForm.register('whatsapp')} className="input-base text-sm w-full" placeholder="+968..." />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
            {submitting ? STRINGS.LOADING : 'حفظ التغييرات'}
          </button>
        </form>
      )}

      {/* Employer Form */}
      {activeTab === 'employer' && hasEmployer && (
        <form onSubmit={employerForm.handleSubmit(handleEmployerSubmit)} className="space-y-5">
          <div className="card-base rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">اسم الشركة</label>
              <input {...employerForm.register('companyName')} className="input-base text-sm w-full" placeholder="اختياري" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">حجم الشركة</label>
              <select {...employerForm.register('companySize')} className="input-base text-sm w-full">
                <option value="">اختياري</option>
                <option value="1-10">1-10 موظفين</option>
                <option value="10-50">10-50 موظف</option>
                <option value="50-200">50-200 موظف</option>
                <option value="200-500">200-500 موظف</option>
                <option value="500+">أكثر من 500</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">المجال</label>
              <input {...employerForm.register('industry')} className="input-base text-sm w-full" placeholder="مثال: نقل وشحن" />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">نبذة عن الشركة</label>
              <textarea
                {...employerForm.register('bio')}
                rows={3}
                className="input-base text-sm w-full resize-none"
                placeholder="اكتب نبذة مختصرة..."
              />
            </div>
          </div>

          <div className="card-base rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">
                المحافظة <span className="text-error">*</span>
              </label>
              <select {...employerForm.register('governorate')} className="input-base text-sm w-full">
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {employerForm.formState.errors.governorate && (
                <p className="text-xs text-error mt-1">{employerForm.formState.errors.governorate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1.5">المدينة</label>
              <input {...employerForm.register('city')} className="input-base text-sm w-full" placeholder="اختياري" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">رقم الهاتف</label>
                <input {...employerForm.register('contactPhone')} className="input-base text-sm w-full" placeholder="+968..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">واتساب</label>
                <input {...employerForm.register('whatsapp')} className="input-base text-sm w-full" placeholder="+968..." />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
            {submitting ? STRINGS.LOADING : 'حفظ التغييرات'}
          </button>
        </form>
      )}
    </div>
  )
}
