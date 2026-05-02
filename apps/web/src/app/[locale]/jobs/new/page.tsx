'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { JobsPageGuard } from '@/components/jobs/jobs-page-guard';
import { useCreateJob } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/toast';
import { getGovernorates } from '@/lib/location-data';
import { employmentOptionsT } from '@/lib/constants/jobs';
import { useTranslations, useLocale } from 'next-intl';


const LICENSE_OPTIONS = [
  { value: 'LIGHT', key: 'jnLicLight' },
  { value: 'HEAVY', key: 'jnLicHeavy' },
  { value: 'TRANSPORT', key: 'jnLicTransport' },
  { value: 'BUS', key: 'jnLicBus' },
  { value: 'MOTORCYCLE', key: 'jnLicMotorcycle' },
];

const SALARY_PERIOD_OPTIONS = [
  { value: 'MONTHLY', key: 'jnPeriodMonthly' },
  { value: 'DAILY', key: 'jnPeriodDaily' },
  { value: 'YEARLY', key: 'jnPeriodYearly' },
  { value: 'NEGOTIABLE', key: 'jnPeriodNegotiable' },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'SEDAN', key: 'jnVtSedan' },
  { value: 'SUV', key: 'jnVtSUV' },
  { value: 'LIGHT_TRUCK', key: 'jnVtLightTruck' },
  { value: 'HEAVY_TRUCK', key: 'jnVtHeavyTruck' },
  { value: 'BUS', key: 'jnVtBus' },
  { value: 'LIMO', key: 'jnVtLimo' },
  { value: 'VAN', key: 'jnVtVan' },
  { value: 'PICKUP', key: 'jnVtPickup' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ARABIC', key: 'jnLangArabic' },
  { value: 'ENGLISH', key: 'jnLangEnglish' },
  { value: 'URDU', key: 'jnLangUrdu' },
  { value: 'HINDI', key: 'jnLangHindi' },
  { value: 'BENGALI', key: 'jnLangBengali' },
  { value: 'FILIPINO', key: 'jnLangFilipino' },
];

export default function NewJobPage() {
  return (
    <JobsPageGuard role="any">
      <Suspense>
        <NewJobContent />
      </Suspense>
    </JobsPageGuard>
  );
}

function NewJobContent() {
  const tp = useTranslations('pages');
  const tj = useTranslations('jobs');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const createJob = useCreateJob();
  const locale = useLocale();
  const govs = getGovernorates('OM', locale);
  const empOptions = employmentOptionsT(tj);
  const qc = useQueryClient();
  const driverProfile   = qc.getQueryData<{ id: string }>(['driver-profile', 'me']);
  const employerProfile = qc.getQueryData<{ id: string }>(['employer-profile', 'me']);
  const hasDriver   = !!driverProfile;
  const hasEmployer = !!employerProfile;

  const forcedType: 'OFFERING' | 'HIRING' | null =
    hasDriver && !hasEmployer ? 'OFFERING' :
    hasEmployer && !hasDriver ? 'HIRING' : null;

  const paramType = (searchParams.get('type') ?? 'OFFERING') as 'OFFERING' | 'HIRING';

  const [form, setForm] = useState({
    title: '',
    description: '',
    jobType: paramType as 'OFFERING' | 'HIRING',
    employmentType: 'FULL_TIME',
    salary: '',
    salaryPeriod: 'MONTHLY',
    licenseTypes: [] as string[],
    experienceYears: '',
    minAge: '',
    maxAge: '',
    languages: [] as string[],
    nationality: '',
    vehicleTypes: [] as string[],
    hasOwnVehicle: false,
    governorate: '',
    city: '',
    contactPhone: '',
    contactEmail: '',
    whatsapp: '',
  });

  function updateField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (forcedType) updateField('jobType', forcedType);
  }, [forcedType]);

  function toggleArrayItem(key: 'licenseTypes' | 'languages' | 'vehicleTypes', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.governorate) {
      addToast('error', tp('jnErrRequired'));
      return;
    }

    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      jobType: forcedType ?? form.jobType,
      employmentType: form.employmentType,
      governorate: form.governorate,
      licenseTypes: form.licenseTypes,
      languages: form.languages,
      vehicleTypes: form.vehicleTypes,
      hasOwnVehicle: form.hasOwnVehicle,
    };

    if (form.salary) payload.salary = Number(form.salary);
    if (form.salaryPeriod) payload.salaryPeriod = form.salaryPeriod;
    if (form.experienceYears) payload.experienceYears = Number(form.experienceYears);
    if (form.minAge) payload.minAge = Number(form.minAge);
    if (form.maxAge) payload.maxAge = Number(form.maxAge);
    if (form.nationality) payload.nationality = form.nationality;
    if (form.city) payload.city = form.city;
    if (form.contactPhone) payload.contactPhone = form.contactPhone;
    if (form.contactEmail) payload.contactEmail = form.contactEmail;
    if (form.whatsapp) payload.whatsapp = form.whatsapp;

    try {
      const result = await createJob.mutateAsync(payload);
      addToast('success', tp('jnSuccess'));
      router.push(`/jobs/${result.id}`);
    } catch (err: any) {
      addToast('error', err?.message || tp('jnError'));
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="material-symbols-outlined text-primary align-middle text-3xl ms-2">add_circle</span>
          {tp('jnTitle')}
        </h1>
        <p className="text-on-surface-variant mb-8">{tp('jnSubtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Type Toggle — hidden when role is forced */}
          <div className="glass-card rounded-xl p-6">
            <label className="block font-bold text-sm mb-3">{tp('jnTypeLabel')}</label>
            {forcedType ? (
              <div className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm border-2 ${
                forcedType === 'OFFERING'
                  ? 'border-brand-green bg-brand-green/10 text-brand-green'
                  : 'border-primary bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined">
                  {forcedType === 'OFFERING' ? 'person_search' : 'person_add'}
                </span>
                {forcedType === 'OFFERING' ? tp('jnTypeOffering') : tp('jnTypeHiring')}
              </div>
            ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('jobType', 'OFFERING')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                  form.jobType === 'OFFERING'
                    ? 'border-brand-green bg-brand-green/10 text-brand-green'
                    : 'border-outline bg-surface text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">person_search</span>
                {tp('jnTypeOffering')}
              </button>
              <button
                type="button"
                onClick={() => updateField('jobType', 'HIRING')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all border-2 ${
                  form.jobType === 'HIRING'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline bg-surface text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">person_add</span>
                {tp('jnTypeHiring')}
              </button>
            </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              {tp('jnBasicTitle')}
            </h2>
            <div>
              <label className="block text-sm font-bold mb-1">{tp('jnLabelTitle')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={form.jobType === 'OFFERING' ? tp('jnPlaceholderTitleOffering') : tp('jnPlaceholderTitleHiring')}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
               
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">{tp('jnLabelDesc')}</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder={tp('jnPlaceholderDesc')}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none min-h-[120px] resize-none"
               
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelEmployment')}</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => updateField('employmentType', e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm"
                >
                  {empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelGovernorate')}</label>
                <select
                  value={form.governorate}
                  onChange={(e) => updateField('governorate', e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm"
                >
                  <option value="">{tp('jnSelectGovernorate')}</option>
                  {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelCity')}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder={tp('jnPlaceholderCity')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelNationality')}</label>
                <input
                  type="text"
                  value={form.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  placeholder={tp('jnPlaceholderNationality')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              {tp('jnSalaryTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelSalary')}</label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={(e) => updateField('salary', e.target.value)}
                  placeholder={tp('jnPlaceholderSalary')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelSalaryPeriod')}</label>
                <select
                  value={form.salaryPeriod}
                  onChange={(e) => updateField('salaryPeriod', e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm"
                >
                  {SALARY_PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{tp(o.key)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              {tp('jnRequirementsTitle')}
            </h2>

            {/* License Types */}
            <div>
              <label className="block text-sm font-bold mb-2">{tp('jnLabelLicense')}</label>
              <div className="flex flex-wrap gap-2">
                {LICENSE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleArrayItem('licenseTypes', o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      form.licenseTypes.includes(o.value)
                        ? 'bg-primary text-on-primary shadow-ambient'
                        : 'bg-surface border border-outline text-on-surface hover:border-primary'
                    }`}
                  >
                    {tp(o.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelExperience')}</label>
                <input
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => updateField('experienceYears', e.target.value)}
                  placeholder={tp('jnPlaceholderExperience')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  min={0}
                  max={50}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelMinAge')}</label>
                <input
                  type="number"
                  value={form.minAge}
                  onChange={(e) => updateField('minAge', e.target.value)}
                  placeholder={tp('jnPlaceholderMinAge')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  min={18}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelMaxAge')}</label>
                <input
                  type="number"
                  value={form.maxAge}
                  onChange={(e) => updateField('maxAge', e.target.value)}
                  placeholder={tp('jnPlaceholderMaxAge')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  max={70}
                />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-bold mb-2">{tp('jnLabelLanguages')}</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => toggleArrayItem('languages', lang.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      form.languages.includes(lang.value)
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface border border-outline text-on-surface hover:border-primary'
                    }`}
                  >
                    {tp(lang.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Types */}
            <div>
              <label className="block text-sm font-bold mb-2">{tp('jnLabelVehicleTypes')}</label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPE_OPTIONS.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => toggleArrayItem('vehicleTypes', vt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      form.vehicleTypes.includes(vt.value)
                        ? 'bg-primary text-on-primary shadow-ambient'
                        : 'bg-surface border border-outline text-on-surface hover:border-primary'
                    }`}
                  >
                    {tp(vt.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Has own vehicle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasOwnVehicle}
                onChange={(e) => updateField('hasOwnVehicle', e.target.checked)}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-sm font-bold">{tp('jnHasOwnVehicle')}</span>
            </label>
          </div>

          {/* Contact */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contact_phone</span>
              {tp('jnContactTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelPhone')}</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder={tp('jnPlaceholderPhone')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{tp('jnLabelWhatsapp')}</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder={tp('jnPlaceholderPhone')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold mb-1">{tp('jnLabelEmail')}</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={createJob.isPending}
              className="bg-primary text-on-primary hover:brightness-110 rounded-lg shadow-ambient flex-1 py-4 text-base font-bold disabled:opacity-50"
            >
              {createJob.isPending ? tp('jnSubmitting') : tp('jnSubmit')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-surface border border-outline text-on-surface-variant rounded-lg px-8 py-4 font-bold hover:border-primary transition-colors"
            >
              {tp('jnCancel')}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
