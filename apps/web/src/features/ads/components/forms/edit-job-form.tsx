'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { DetailSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useJob, useUpdateJob } from '@/lib/api/jobs';
import { useToast } from '@/components/toast';
import { getGovernorates } from '@/lib/location-data';
import { employmentOptionsT } from '@/lib/constants/jobs';
import { inputCls, labelCls, sectionCls, sectionTitleCls, chipCls, checkboxLabelCls, checkboxCls, checkboxTextCls } from '@/lib/constants/form-styles';
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

export function EditJobForm() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, isError, refetch } = useJob(id);
  const update = useUpdateJob();
  const router = useRouter();
  const { addToast } = useToast();
  const tp = useTranslations('pages');
  const locale = useLocale();
  const govs = getGovernorates('OM', locale);
  const tj = useTranslations('jobs');
  const empOptions = employmentOptionsT(tj);

  const [form, setForm] = useState({
    title: '',
    description: '',
    jobType: 'OFFERING' as 'OFFERING' | 'HIRING',
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (job && !initialized) {
      setForm({
        title: job.title ?? '',
        description: job.description ?? '',
        jobType: (job.jobType as 'OFFERING' | 'HIRING') ?? 'OFFERING',
        employmentType: job.employmentType ?? 'FULL_TIME',
        salary: job.salary ? String(job.salary) : '',
        salaryPeriod: job.salaryPeriod ?? 'MONTHLY',
        licenseTypes: job.licenseTypes ?? [],
        experienceYears: job.experienceYears != null ? String(job.experienceYears) : '',
        minAge: job.minAge != null ? String(job.minAge) : '',
        maxAge: job.maxAge != null ? String(job.maxAge) : '',
        languages: job.languages ?? [],
        nationality: job.nationality ?? '',
        vehicleTypes: job.vehicleTypes ?? [],
        hasOwnVehicle: job.hasOwnVehicle ?? false,
        governorate: job.governorate ?? '',
        city: job.city ?? '',
        contactPhone: job.contactPhone ?? '',
        contactEmail: job.contactEmail ?? '',
        whatsapp: job.whatsapp ?? '',
      });
      setInitialized(true);
    }
  }, [job, initialized]);

  function updateField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayItem(key: 'licenseTypes' | 'languages' | 'vehicleTypes', value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.governorate) {
      addToast('error', tp('jnErrRequired'));
      return;
    }

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description,
      jobType: form.jobType,
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
      await update.mutateAsync({ id, ...payload });
      addToast('success', tp('editListingSaved'));
      router.push(`/jobs/${id}`);
    } catch (err: unknown) {
      addToast('error', err instanceof Error ? err.message : tp('jnError'));
    }
  }

  if (isLoading) return <DetailSkeleton />;
  if (isError || !job) return <div className="pt-28 px-8"><ErrorState onRetry={refetch} /></div>;

  return (
    <main className="pt-[75px] pb-16 max-w-3xl mx-auto px-4 md:px-8">
      {/* ── Premium Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#004ac6] via-[#2563eb] to-[#0B2447]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0zm20 20h20v20H20z\' fill=\'%23fff\' fill-opacity=\'.4\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-50%] left-[-10%] w-[300px] h-[300px] rounded-full bg-white/[0.04] blur-3xl" />

        <div className="relative z-10 px-4 sm:px-6 md:px-8 py-8 sm:py-10 text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-sm">{tp('editListingTitle')}</h1>
          <p className="text-white/60 text-xs sm:text-sm max-w-md mx-auto">{job.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Type */}
        <div className={sectionCls}>
          <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">work</span>{tp('jnTypeLabel')}</h2>
          <div className="flex gap-3">
            {(['OFFERING', 'HIRING'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField('jobType', type)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  form.jobType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline bg-surface text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {type === 'OFFERING' ? 'person_search' : 'person_add'}
                </span>
                {type === 'OFFERING' ? tp('jnTypeOffering') : tp('jnTypeHiring')}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">edit_note</span>{tp('jnBasicTitle')}</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>{tp('jnLabelTitle')}</label>
              <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelDesc')}</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className={`${inputCls} min-h-[120px] resize-none`} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{tp('jnLabelEmployment')}</label>
                <select value={form.employmentType} onChange={(e) => updateField('employmentType', e.target.value)} className={inputCls}>
                  {empOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tp('jnLabelGovernorate')}</label>
                <select value={form.governorate} onChange={(e) => updateField('governorate', e.target.value)} className={inputCls} required>
                  <option value="">{tp('jnSelectGovernorate')}</option>
                  {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{tp('jnLabelCity')}</label>
                <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{tp('jnLabelNationality')}</label>
                <input type="text" value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className={sectionCls}>
          <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">payments</span>{tp('jnSalaryTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('jnLabelSalary')}</label>
              <input type="number" value={form.salary} onChange={(e) => updateField('salary', e.target.value)} className={inputCls} min={0} />
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelSalaryPeriod')}</label>
              <select value={form.salaryPeriod} onChange={(e) => updateField('salaryPeriod', e.target.value)} className={inputCls}>
                {SALARY_PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{tp(o.key)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className={sectionCls}>
          <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">checklist</span>{tp('jnRequirementsTitle')}</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>{tp('jnLabelLicense')}</label>
              <div className="flex flex-wrap gap-2">
                {LICENSE_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => toggleArrayItem('licenseTypes', o.value)}
                    className={chipCls(form.licenseTypes.includes(o.value))}>
                    {tp(o.key)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>{tp('jnLabelExperience')}</label>
                <input type="number" value={form.experienceYears} onChange={(e) => updateField('experienceYears', e.target.value)} className={inputCls} min={0} max={50} />
              </div>
              <div>
                <label className={labelCls}>{tp('jnLabelMinAge')}</label>
                <input type="number" value={form.minAge} onChange={(e) => updateField('minAge', e.target.value)} className={inputCls} min={18} />
              </div>
              <div>
                <label className={labelCls}>{tp('jnLabelMaxAge')}</label>
                <input type="number" value={form.maxAge} onChange={(e) => updateField('maxAge', e.target.value)} className={inputCls} max={70} />
              </div>
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelLanguages')}</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button key={lang.value} type="button" onClick={() => toggleArrayItem('languages', lang.value)}
                    className={chipCls(form.languages.includes(lang.value))}>
                    {tp(lang.key)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelVehicleTypes')}</label>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPE_OPTIONS.map((vt) => (
                  <button key={vt.value} type="button" onClick={() => toggleArrayItem('vehicleTypes', vt.value)}
                    className={chipCls(form.vehicleTypes.includes(vt.value))}>
                    {tp(vt.key)}
                  </button>
                ))}
              </div>
            </div>
            <label className={checkboxLabelCls}>
              <input type="checkbox" checked={form.hasOwnVehicle} onChange={(e) => updateField('hasOwnVehicle', e.target.checked)} className={checkboxCls} />
              <span className={checkboxTextCls}>{tp('jnHasOwnVehicle')}</span>
            </label>
          </div>
        </div>

        {/* Contact */}
        <div className={sectionCls}>
          <h2 className={sectionTitleCls}><span className="material-symbols-outlined text-primary text-lg">contact_phone</span>{tp('jnContactTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{tp('jnLabelPhone')}</label>
              <input type="tel" value={form.contactPhone} onChange={(e) => updateField('contactPhone', e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className={labelCls}>{tp('jnLabelWhatsapp')}</label>
              <input type="tel" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>{tp('jnLabelEmail')}</label>
              <input type="email" value={form.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} className={inputCls} dir="ltr" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={update.isPending}
            className="flex-1 bg-primary text-on-primary py-3.5 rounded-2xl text-sm font-black hover:brightness-110 transition-all disabled:opacity-50 shadow-lg">
            {update.isPending ? (
              <span className="flex items-center justify-center gap-2"><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>{tp('editListingUploading')}</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-base">save</span>{tp('editListingSave')}</span>
            )}
          </button>
          <button type="button" onClick={() => router.back()}
            className="bg-surface-container-low border border-outline-variant/20 text-on-surface-variant rounded-2xl px-8 py-3.5 text-sm font-bold hover:border-primary/40 transition-colors">
            {tp('jnCancel')}
          </button>
        </div>
      </form>
    </main>
  );
}
