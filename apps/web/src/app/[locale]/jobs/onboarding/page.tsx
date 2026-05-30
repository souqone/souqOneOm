'use client';
import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { useCreateDriverProfile, useCreateEmployerProfile, useMyDriverProfile, useMyEmployerProfile } from '@/lib/api';
import { useToast } from '@/components/toast';
import {
  OMAN_GOVERNORATES, LICENSE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS,
  LANGUAGE_OPTIONS, STRINGS
} from '@/features/jobs/constants';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type ProfileType = 'DRIVER' | 'EMPLOYER' | null

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}

function OnboardingContent() {
  const t = useTranslations('jobs')
  const router = useRouter()
  const { addToast } = useToast()
  const [step, setStep] = useState(1)
  const [profileType, setProfileType] = useState<ProfileType>(null)
  const [submitting, setSubmitting] = useState(false)

  const driverSchema = z.object({
    licenseTypes: z.array(z.string()).min(1, t('selectAtLeastOneLicense')),
    experienceYears: z.number().optional(),
    vehicleTypes: z.array(z.string()),
    hasOwnVehicle: z.boolean(),
    bio: z.string().optional(),
    governorate: z.string().min(1, t('selectGovernorate')),
    city: z.string().optional(),
    contactPhone: z.string().optional(),
    whatsapp: z.string().optional(),
    languages: z.array(z.string()),
    nationality: z.string().optional(),
  })

  const employerSchema = z.object({
    companyName: z.string().optional(),
    companySize: z.string().optional(),
    industry: z.string().optional(),
    bio: z.string().optional(),
    governorate: z.string().min(1, t('selectGovernorate')),
    city: z.string().optional(),
    contactPhone: z.string().optional(),
    whatsapp: z.string().optional(),
  })

  type DriverFormData = z.infer<typeof driverSchema>
  type EmployerFormData = z.infer<typeof employerSchema>

  const { data: existingDriver, isLoading: loadingDriver } = useMyDriverProfile()
  const { data: existingEmployer, isLoading: loadingEmployer } = useMyEmployerProfile()

  const createDriver = useCreateDriverProfile()
  const createEmployer = useCreateEmployerProfile()

  const driverForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      licenseTypes: [],
      vehicleTypes: [],
      hasOwnVehicle: false,
      languages: [],
    },
  })

  const employerForm = useForm<EmployerFormData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {},
  })

  if (!loadingDriver && !loadingEmployer && existingDriver && existingEmployer) {
    router.replace('/jobs/dashboard')
    return null
  }

  const handleSelectType = (type: ProfileType) => {
    setProfileType(type)
    setStep(2)
  }

  const handleDriverSubmit = async (data: DriverFormData) => {
    setSubmitting(true)
    try {
      await createDriver.mutateAsync({
        ...data,
        licenseTypes: data.licenseTypes as never[],
      })
      addToast('success', t('driverProfileCreated'))
      router.push('/jobs/dashboard')
    } catch {
      addToast('error', t('profileCreateError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmployerSubmit = async (data: EmployerFormData) => {
    setSubmitting(true)
    try {
      await createEmployer.mutateAsync(data)
      addToast('success', t('employerProfileCreated'))
      router.push('/jobs/new')
    } catch {
      addToast('error', t('profileCreateError'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleArrayValue = (
    arr: string[],
    value: string,
    onChange: (v: string[]) => void
  ) => {
    if (arr.includes(value)) {
      onChange(arr.filter(v => v !== value))
    } else {
      onChange([...arr, value])
    }
  }

  if (loadingDriver || loadingEmployer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-9 w-24 bg-surface-dim rounded-full mx-auto" />
          <div className="h-8 bg-surface-dim rounded-xl w-1/2 mx-auto" />
          <div className="h-48 bg-surface-dim rounded-2xl" />
        </div>
      </div>
    )
  }

  if ((existingDriver || existingEmployer) && !profileType) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-on-surface text-center mb-2">{t('manageProfileTitle')}</h1>
        <p className="text-sm text-on-surface-variant text-center mb-8">{t('chooseAction')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {existingDriver && (
            <button
              onClick={() => router.push('/jobs/dashboard')}
              className="relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover border-brand-amber bg-amber-50"
            >
              <div className="absolute top-3 start-3">
                <CheckCircle size={18} className="text-brand-amber" fill="currentColor" />
              </div>
              <div className="text-4xl mb-3">🚛</div>
              <h3 className="font-extrabold text-base text-on-surface mb-1">{t('driverDashboard')}</h3>
              <p className="text-sm text-on-surface-variant">{t('manageDriverRequests')}</p>
            </button>
          )}
          {!existingDriver && (
            <button
              onClick={() => handleSelectType('DRIVER')}
              className="relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover border-outline-variant bg-white hover:border-outline"
            >
              <div className="text-4xl mb-3">🚛</div>
              <h3 className="font-extrabold text-base text-on-surface mb-1">{t('typeDriver')}</h3>
              <p className="text-sm text-on-surface-variant">{t('typeDriverDesc')}</p>
            </button>
          )}
          {existingEmployer && (
            <button
              onClick={() => router.push('/jobs/dashboard')}
              className="relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover border-brand-amber bg-amber-50"
            >
              <div className="absolute top-3 start-3">
                <CheckCircle size={18} className="text-brand-amber" fill="currentColor" />
              </div>
              <div className="text-4xl mb-3">👔</div>
              <h3 className="font-extrabold text-base text-on-surface mb-1">{t('myListings')}</h3>
              <p className="text-sm text-on-surface-variant">{t('manageJobs')}</p>
            </button>
          )}
          {!existingEmployer && (
            <button
              onClick={() => handleSelectType('EMPLOYER')}
              className="relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover border-outline-variant bg-white hover:border-outline"
            >
              <div className="text-4xl mb-3">👔</div>
              <h3 className="font-extrabold text-base text-on-surface mb-1">{t('typeEmployer')}</h3>
              <p className="text-sm text-on-surface-variant">{t('typeEmployerDesc')}</p>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Progress */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2].map(s => (
          <React.Fragment key={`step-${s}`}>
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
              step >= s ? 'bg-brand-amber text-white' : 'bg-surface-container text-on-surface-variant'
            )}>
              {step > s ? <CheckCircle size={16} /> : s}
            </div>
            {s < 2 && (
              <div className={cn(
                'h-0.5 w-16 rounded-full transition-all',
                step > s ? 'bg-brand-amber' : 'bg-outline-variant'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Choose Profile Type */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface text-center mb-2">{t('step1Title')}</h1>
          <p className="text-sm text-on-surface-variant text-center mb-8">{t('step1Subtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { type: 'DRIVER' as ProfileType, icon: '🚛', title: t('typeDriver'), desc: t('typeDriverDesc') },
              { type: 'EMPLOYER' as ProfileType, icon: '👔', title: t('typeEmployer'), desc: t('typeEmployerDesc') },
            ].map(option => (
              <button
                key={`type-${option.type}`}
                onClick={() => handleSelectType(option.type)}
                className={cn(
                  'relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover',
                  profileType === option.type
                    ? 'border-brand-amber bg-amber-50' :'border-outline-variant bg-white hover:border-outline'
                )}
              >
                {profileType === option.type && (
                  <div className="absolute top-3 start-3">
                    <CheckCircle size={18} className="text-brand-amber" fill="currentColor" />
                  </div>
                )}
                <div className="text-4xl mb-3">{option.icon}</div>
                <h3 className="font-extrabold text-base text-on-surface mb-1">{option.title}</h3>
                <p className="text-sm text-on-surface-variant">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2a — Driver Form */}
      {step === 2 && profileType === 'DRIVER' && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
          >
            <ChevronRight size={16} />
            {t('back')}
          </button>
          <h1 className="text-xl font-extrabold text-on-surface mb-6">{t('driverProfileTitle')}</h1>

          <form onSubmit={driverForm.handleSubmit(handleDriverSubmit)} className="space-y-5">

            {/* License Types */}
            <div className="card-base rounded-2xl p-5">
              <label className="block text-sm font-bold text-on-surface mb-3">
                {t('licenseTypesLabel')} <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => {
                  const selected = driverForm.watch('licenseTypes').includes(value)
                  return (
                    <button
                      key={`license-${value}`}
                      type="button"
                      onClick={() => toggleArrayValue(
                        driverForm.watch('licenseTypes'),
                        value,
                        v => driverForm.setValue('licenseTypes', v)
                      )}
                      className={cn(
                        'p-3 rounded-xl border-2 text-sm font-bold transition-all',
                        selected
                          ? 'border-brand-amber bg-amber-50 text-brand-amber' :'border-outline-variant text-on-surface hover:border-outline'
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
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('experienceYearsLabel')}</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  {...driverForm.register('experienceYears', { valueAsNumber: true })}
                  className="input-base text-sm w-full"
                  placeholder={t('placeholderExperience')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">{t('vehicleTypesLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPE_OPTIONS.map(vt => {
                    const selected = driverForm.watch('vehicleTypes').includes(vt)
                    return (
                      <button
                        key={`vt-${vt}`}
                        type="button"
                        onClick={() => toggleArrayValue(
                          driverForm.watch('vehicleTypes'),
                          vt,
                          v => driverForm.setValue('vehicleTypes', v)
                        )}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                          selected
                            ? 'border-brand-amber bg-amber-50 text-brand-amber' :'border-outline-variant text-on-surface hover:border-outline'
                        )}
                      >
                        {vt}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface" id="own-vehicle-label">{t('hasOwnVehicleLabel')}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={driverForm.watch('hasOwnVehicle')}
                  aria-labelledby="own-vehicle-label"
                  onClick={() => driverForm.setValue('hasOwnVehicle', !driverForm.watch('hasOwnVehicle'))}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
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
              <label className="block text-sm font-bold text-on-surface mb-2">{t('languagesLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => {
                  const selected = driverForm.watch('languages').includes(lang)
                  return (
                    <button
                      key={`lang-${lang}`}
                      type="button"
                      onClick={() => toggleArrayValue(
                        driverForm.watch('languages'),
                        lang,
                        v => driverForm.setValue('languages', v)
                      )}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                        selected
                          ? 'border-brand-amber bg-amber-50 text-brand-amber' :'border-outline-variant text-on-surface hover:border-outline'
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
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('bioLabel')}</label>
                <textarea
                  {...driverForm.register('bio')}
                  rows={3}
                  className="input-base text-sm w-full resize-none"
                  placeholder={t('placeholderBio')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">
                  {t('governorateLabel')} <span className="text-error">*</span>
                </label>
                <select {...driverForm.register('governorate')} className="input-base text-sm w-full">
                  <option value="">{t('selectGovernorateOption')}</option>
                  {OMAN_GOVERNORATES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {driverForm.formState.errors.governorate && (
                  <p className="text-xs text-error mt-1">{driverForm.formState.errors.governorate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('cityLabel')}</label>
                <input
                  {...driverForm.register('city')}
                  className="input-base text-sm w-full"
                  placeholder={t('placeholderCity')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">{t('contactPhoneLabel')}</label>
                  <input
                    {...driverForm.register('contactPhone')}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="input-base text-sm w-full"
                    placeholder="+968..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">{t('whatsappLabel')}</label>
                  <input
                    {...driverForm.register('whatsapp')}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="input-base text-sm w-full"
                    placeholder="+968..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60"
            >
              {submitting ? STRINGS.LOADING : t('createProfile')}
            </button>
          </form>
        </div>
      )}

      {/* Step 2b — Employer Form */}
      {step === 2 && profileType === 'EMPLOYER' && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
          >
            <ChevronRight size={16} />
            {t('back')}
          </button>
          <h1 className="text-xl font-extrabold text-on-surface mb-6">{t('employerProfileTitle')}</h1>

          <form onSubmit={employerForm.handleSubmit(handleEmployerSubmit)} className="space-y-5">

            <div className="card-base rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('companyNameLabel')}</label>
                <input
                  {...employerForm.register('companyName')}
                  className="input-base text-sm w-full"
                  placeholder={t('optional')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('companySizeLabel')}</label>
                <select {...employerForm.register('companySize')} className="input-base text-sm w-full">
                  <option value="">{t('optional')}</option>
                  <option value="1-10">{t('companySize1to10')}</option>
                  <option value="10-50">{t('companySize10to50')}</option>
                  <option value="50-200">{t('companySize50to200')}</option>
                  <option value="200-500">{t('companySize200to500')}</option>
                  <option value="500+">{t('companySize500plus')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('industryLabel')}</label>
                <input
                  {...employerForm.register('industry')}
                  className="input-base text-sm w-full"
                  placeholder={t('placeholderIndustry')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('companyBioLabel')}</label>
                <textarea
                  {...employerForm.register('bio')}
                  rows={3}
                  className="input-base text-sm w-full resize-none"
                  placeholder={t('placeholderCompanyBio')}
                />
              </div>
            </div>

            <div className="card-base rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">
                  {t('governorateLabel')} <span className="text-error">*</span>
                </label>
                <select {...employerForm.register('governorate')} className="input-base text-sm w-full">
                  <option value="">{t('selectGovernorateOption')}</option>
                  {OMAN_GOVERNORATES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {employerForm.formState.errors.governorate && (
                  <p className="text-xs text-error mt-1">{employerForm.formState.errors.governorate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">{t('cityLabel')}</label>
                <input
                  {...employerForm.register('city')}
                  className="input-base text-sm w-full"
                  placeholder={t('optional')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">{t('contactPhoneLabel')}</label>
                  <input
                    {...employerForm.register('contactPhone')}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="input-base text-sm w-full"
                    placeholder="+968..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">{t('whatsappLabel')}</label>
                  <input
                    {...employerForm.register('whatsapp')}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="input-base text-sm w-full"
                    placeholder="+968..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60"
            >
              {submitting ? STRINGS.LOADING : t('createProfile')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
