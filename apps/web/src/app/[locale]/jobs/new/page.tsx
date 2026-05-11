'use client';
import React, { useState, Suspense } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { useCreateJob } from '@/lib/api/jobs';
import {
  LICENSE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS,
  LANGUAGE_OPTIONS, EMPLOYMENT_TYPE_LABELS, SALARY_PERIOD_LABELS, STRINGS
} from '@/features/jobs/constants';
import { formatSalary, cn } from '@/lib/utils';
import { getGovernorates, getCities } from '@/lib/location-data';
import type { JobType, EmploymentType, SalaryPeriod } from '@/features/jobs/types';

const STEPS = [
  { num: 1, label: 'نوع الإعلان' },
  { num: 2, label: 'التفاصيل' },
  { num: 3, label: 'المراجعة' },
]

const jobSchema = z.object({
  jobType: z.enum(['HIRING', 'OFFERING']),
  title: z.string().min(3, 'العنوان مطلوب'),
  description: z.string().min(10, 'الوصف مطلوب (10 أحرف على الأقل)'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'TEMPORARY', 'CONTRACT']),
  salary: z.number().optional(),
  salaryPeriod: z.enum(['DAILY', 'MONTHLY', 'YEARLY', 'NEGOTIABLE']).optional(),
  licenseTypes: z.array(z.string()),
  experienceYears: z.number().optional(),
  vehicleTypes: z.array(z.string()),
  hasOwnVehicle: z.boolean(),
  nationality: z.string().optional(),
  languages: z.array(z.string()),
  governorate: z.string().min(1, 'المحافظة مطلوبة'),
  city: z.string().optional(),
  contactPhone: z.string().optional(),
  whatsapp: z.string().optional(),
  contactEmail: z.string().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

function CreateJobContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as JobType) ?? 'HIRING'
  const createJob = useCreateJob()

  const [step, setStep] = useState(1)

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: initialType,
      licenseTypes: [],
      vehicleTypes: [],
      hasOwnVehicle: false,
      languages: [],
      employmentType: 'FULL_TIME',
    },
  })

  const watchedValues = form.watch()

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

  const handleNext = async () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      const valid = await form.trigger([
        'title', 'description', 'employmentType', 'governorate'
      ])
      if (valid) setStep(3)
    }
  }

  const handleSubmit = async (data: JobFormData) => {
    try {
      const job = await createJob.mutateAsync({
        ...data,
        licenseTypes: data.licenseTypes as never[],
        jobType: data.jobType as JobType,
        employmentType: data.employmentType as EmploymentType,
        salaryPeriod: data.salaryPeriod as SalaryPeriod | undefined,
        currency: 'OMR',
      })
      router.push(`/jobs/${job.id}`)
    } catch {
      // handle error
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, idx) => (
          <React.Fragment key={`step-${s.num}`}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                step > s.num ? 'bg-brand-amber text-white' :
                step === s.num ? 'bg-brand-amber text-white ring-4 ring-amber-100': 'bg-surface-container text-on-surface-variant'
              )}>
                {step > s.num ? <CheckCircle size={16} /> : s.num}
              </div>
              <span className={cn(
                'text-xs font-bold hidden sm:block',
                step === s.num ? 'text-brand-amber' : 'text-on-surface-variant'
              )}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 w-12 rounded-full mb-4 transition-all',
                step > s.num ? 'bg-brand-amber' : 'bg-outline-variant'
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1 — Job Type */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface text-center mb-2">نوع الإعلان</h1>
          <p className="text-sm text-on-surface-variant text-center mb-8">حدد نوع إعلانك</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { type: 'HIRING' as JobType, icon: '👔', title: 'أبحث عن سائق', desc: 'أنا صاحب عمل' },
              { type: 'OFFERING' as JobType, icon: '🚛', title: 'أعرض خدماتي', desc: 'أنا سائق' },
            ].map(option => {
              const selected = watchedValues.jobType === option.type
              return (
                <button
                  key={`type-${option.type}`}
                  type="button"
                  onClick={() => form.setValue('jobType', option.type)}
                  className={cn(
                    'relative p-6 rounded-2xl border-2 text-start transition-all duration-200 hover:shadow-card-hover',
                    selected
                      ? 'border-brand-amber bg-amber-50' :'border-outline-variant bg-white hover:border-outline'
                  )}
                >
                  {selected && (
                    <div className="absolute top-3 start-3">
                      <CheckCircle size={18} className="text-brand-amber" fill="currentColor" />
                    </div>
                  )}
                  <div className="text-4xl mb-3">{option.icon}</div>
                  <h3 className="font-extrabold text-base text-on-surface mb-1">{option.title}</h3>
                  <p className="text-sm text-on-surface-variant">{option.desc}</p>
                </button>
              )
            })}
          </div>

          <button onClick={handleNext} className="btn-amber w-full py-3 text-base font-bold">
            التالي
          </button>
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
          >
            <ChevronRight size={16} />
            رجوع
          </button>
          <h1 className="text-xl font-extrabold text-on-surface mb-6">تفاصيل الإعلان</h1>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="card-base rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-on-surface-variant">المعلومات الأساسية</h2>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">
                  عنوان الإعلان <span className="text-error">*</span>
                </label>
                <input
                  {...form.register('title')}
                  className="input-base text-sm w-full"
                  placeholder="مثال: مطلوب سائق شاحنة ثقيلة"
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">
                  الوصف <span className="text-error">*</span>
                </label>
                <textarea
                  {...form.register('description')}
                  rows={4}
                  className="input-base text-sm w-full resize-none"
                  placeholder="اكتب وصفاً تفصيلياً للوظيفة..."
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-error mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">نوع الدوام</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <button
                      key={`emp-${value}`}
                      type="button"
                      onClick={() => form.setValue('employmentType', value as EmploymentType)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                        watchedValues.employmentType === value
                          ? 'border-brand-amber bg-amber-50 text-brand-amber' :'border-outline-variant text-on-surface hover:border-outline'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Salary */}
            <div className="card-base rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-on-surface-variant">الراتب</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">المبلغ (اختياري)</label>
                  <input
                    type="number"
                    min={0}
                    {...form.register('salary', { valueAsNumber: true })}
                    className="input-base text-sm w-full"
                    placeholder="مثال: 300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">الفترة</label>
                  <select {...form.register('salaryPeriod')} className="input-base text-sm w-full">
                    <option value="">اختر</option>
                    {Object.entries(SALARY_PERIOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="card-base rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-on-surface-variant">
                {watchedValues.jobType === 'HIRING' ? 'المتطلبات' : 'المؤهلات'}
              </h2>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">أنواع الرخص</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => {
                    const selected = watchedValues.licenseTypes.includes(value)
                    return (
                      <button
                        key={`lic-${value}`}
                        type="button"
                        onClick={() => toggleArrayValue(
                          watchedValues.licenseTypes,
                          value,
                          v => form.setValue('licenseTypes', v)
                        )}
                        className={cn(
                          'p-2.5 rounded-xl border text-xs font-bold transition-all',
                          selected
                            ? 'border-brand-amber bg-amber-50 text-brand-amber' :'border-outline-variant text-on-surface hover:border-outline'
                        )}
                      >
                        🪪 {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">سنوات الخبرة</label>
                <input
                  type="number"
                  min={0}
                  {...form.register('experienceYears', { valueAsNumber: true })}
                  className="input-base text-sm w-full"
                  placeholder="اختياري"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">أنواع المركبات</label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPE_OPTIONS.map(vt => {
                    const selected = watchedValues.vehicleTypes.includes(vt)
                    return (
                      <button
                        key={`vt-${vt}`}
                        type="button"
                        onClick={() => toggleArrayValue(
                          watchedValues.vehicleTypes,
                          vt,
                          v => form.setValue('vehicleTypes', v)
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
                <span className="text-sm font-bold text-on-surface">يمتلك مركبته الخاصة</span>
                <button
                  type="button"
                  onClick={() => form.setValue('hasOwnVehicle', !watchedValues.hasOwnVehicle)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors duration-200',
                    watchedValues.hasOwnVehicle ? 'bg-primary' : 'bg-outline-variant'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                    watchedValues.hasOwnVehicle ? 'start-5' : 'start-0.5'
                  )} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">اللغات</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => {
                    const selected = watchedValues.languages.includes(lang)
                    return (
                      <button
                        key={`lang-${lang}`}
                        type="button"
                        onClick={() => toggleArrayValue(
                          watchedValues.languages,
                          lang,
                          v => form.setValue('languages', v)
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
            </div>

            {/* Location & Contact */}
            <div className="card-base rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-sm text-on-surface-variant">الموقع والتواصل</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">
                    المحافظة <span className="text-error">*</span>
                  </label>
                  <select
                    {...form.register('governorate')}
                    onChange={e => {
                      form.setValue('governorate', e.target.value)
                      form.setValue('city', '')
                    }}
                    className="input-base text-sm w-full"
                  >
                    <option value="">اختر المحافظة</option>
                    {getGovernorates('OM').map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                  {form.formState.errors.governorate && (
                    <p className="text-xs text-error mt-1">{form.formState.errors.governorate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">الولاية</label>
                  <select {...form.register('city')} className="input-base text-sm w-full" disabled={!watchedValues.governorate}>
                    <option value="">اختر الولاية</option>
                    {watchedValues.governorate && getCities('OM', watchedValues.governorate).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">رقم الهاتف</label>
                  <input {...form.register('contactPhone')} className="input-base text-sm w-full" placeholder="+968..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-1.5">واتساب</label>
                  <input {...form.register('whatsapp')} className="input-base text-sm w-full" placeholder="+968..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1.5">البريد الإلكتروني</label>
                <input {...form.register('contactEmail')} type="email" className="input-base text-sm w-full" placeholder="اختياري" />
              </div>
            </div>

            <button onClick={handleNext} className="btn-amber w-full py-3 text-base font-bold">
              التالي — المراجعة
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
          >
            <ChevronRight size={16} />
            رجوع
          </button>
          <h1 className="text-xl font-extrabold text-on-surface mb-6">مراجعة الإعلان</h1>

          <div className="card-base rounded-2xl p-5 space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <span className={watchedValues.jobType === 'HIRING' ? 'badge-hiring' : 'badge-offering'}>
                {watchedValues.jobType === 'HIRING' ? STRINGS.HIRING : STRINGS.OFFERING}
              </span>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">العنوان</p>
              <p className="font-bold text-on-surface">{watchedValues.title}</p>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">الوصف</p>
              <p className="text-sm text-on-surface leading-relaxed">{watchedValues.description}</p>
            </div>

            {watchedValues.salary && (
              <div>
                <p className="text-xs text-on-surface-variant">الراتب</p>
                <p className="font-bold text-brand-amber">
                  {formatSalary(watchedValues.salary, watchedValues.salaryPeriod, 'ر.ع.')}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-on-surface-variant">الموقع</p>
              <p className="font-bold text-on-surface">
                {getGovernorates('OM').find(g => g.value === watchedValues.governorate)?.label ?? watchedValues.governorate}{watchedValues.city ? ` · ${getCities('OM', watchedValues.governorate).find(c => c.value === watchedValues.city)?.label ?? watchedValues.city}` : ''}
              </p>
            </div>

            {watchedValues.licenseTypes.length > 0 && (
              <div>
                <p className="text-xs text-on-surface-variant mb-1">الرخص</p>
                <div className="flex flex-wrap gap-1.5">
                  {watchedValues.licenseTypes.map(lt => (
                    <span key={`rev-lic-${lt}`} className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-container text-primary">
                      {LICENSE_TYPE_LABELS[lt] ?? lt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={createJob.isPending}
            className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60"
          >
            {createJob.isPending ? STRINGS.LOADING : 'نشر الإعلان'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CreateJobPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">{STRINGS.LOADING}</div>}>
        <CreateJobContent />
      </Suspense>
    </AuthGuard>
  )
}
