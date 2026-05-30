'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Clock, Eye, Users, Phone, MessageCircle,
  Mail, CheckCircle, AlertCircle, ArrowRight, X,
  Star, Briefcase
} from 'lucide-react';
import ProposalCard from '@/features/jobs/components/ProposalCard';
import RatingBadges from '@/features/jobs/components/RatingBadges';
import {
  useJob,
  useJobApplications,
  useMyApplications,
  useApplyToJob,
  useUpdateApplicationStatus,
  useWithdrawApplication,
  useCloseJob,
} from '@/lib/api/jobs';
import type { DriverJob, JobApplication } from '@/features/jobs/types';
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_PERIOD_LABELS,
  LANGUAGE_LABELS,
  NATIONALITY_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  STRINGS,
} from '@/features/jobs/constants';
import { useAuth } from '@/providers/auth-provider';
import { useMyDriverProfile, useMyEmployerProfile } from '@/lib/api/jobs';
import { timeAgo, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ConfirmDialog from '@/components/confirm-dialog';

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="card-base rounded-2xl p-6 mb-4">
        <div className="flex gap-3 mb-4">
          <div className="h-7 w-20 bg-surface-dim rounded-full" />
          <div className="h-7 w-16 bg-surface-dim rounded-full" />
        </div>
        <div className="h-7 w-3/4 bg-surface-dim rounded-xl mb-3" />
        <div className="h-5 w-1/2 bg-surface-dim rounded-xl mb-4" />
        <div className="flex gap-3">
          <div className="h-5 w-24 bg-surface-dim rounded-xl" />
          <div className="h-5 w-20 bg-surface-dim rounded-xl" />
        </div>
      </div>
      <div className="card-base rounded-2xl p-6 mb-4">
        <div className="h-5 w-1/3 bg-surface-dim rounded-xl mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`skel-detail-${i}`} className="h-4 bg-surface-dim rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function JobDetailClient() {
  const t = useTranslations('jobs')
  const params = useParams()
  const jobId = (params?.id as string) ?? ''
  const { user, isAuthenticated } = useAuth()

  const { data: driverProfile } = useMyDriverProfile(isAuthenticated)
  const { data: employerProfile } = useMyEmployerProfile(isAuthenticated)
  const isDriver = !!driverProfile
  const isEmployer = !!employerProfile

  const { data: jobData, isLoading: loading, error: jobError } = useJob(jobId)
  const job = jobData as unknown as DriverJob | undefined
  const { data: applicationsData, isLoading: appsLoading, refetch: refetchApps } = useJobApplications(jobId)
  // applicationsData is paginated { items, meta } — extract items (owner-only endpoint)
  const applications = (applicationsData?.items ?? []) as unknown as JobApplication[]

  const { data: myAppsData } = useMyApplications()

  const applyMutation = useApplyToJob()
  const updateStatusMutation = useUpdateApplicationStatus()
  const withdrawMutation = useWithdrawApplication()
  const closeMutation = useCloseJob()

  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [closingJob, setClosingJob] = useState(false)
  // Proposals collapsed by default — owners expand on demand, non-owners rarely need it
  const [appsExpanded, setAppsExpanded] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const applySchema = z.object({
    message: z.string().min(10, t('messageTooShort')).max(500, t('messageTooLong')),
    resumeUrl: z.string().url(t('invalidUrl')).optional().or(z.literal('')),
  })
  type ApplyFormData = z.infer<typeof applySchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
  })

  const isJobOwner = job?.userId === user?.id
  // Non-owners: own application comes from /applications/my (owner-only getApplications returns 404 for non-owners)
  const ownApplication = (!isJobOwner && isAuthenticated)
    ? myAppsData?.find(a => a.jobId === job?.id)
    : undefined
  const alreadyApplied = !!ownApplication

  const canApply =
    isAuthenticated &&
    !isJobOwner &&
    !alreadyApplied &&
    job?.status === 'ACTIVE' &&
    ((job.jobType === 'HIRING' && isDriver) || (job.jobType === 'OFFERING' && isEmployer))

  const onSubmitProposal = async (data: ApplyFormData) => {
    if (!job) return
    try {
      await applyMutation.mutateAsync({
        jobId: job.id,
        message: data.message,
        resumeUrl: data.resumeUrl || undefined,
      })
      setSubmitSuccess(true)
      reset()
      refetchApps()
    } catch {
      // error handled inline
    }
  }

  const handleAccept = async (appId: string) => {
    await updateStatusMutation.mutateAsync({ applicationId: appId, status: 'ACCEPTED' })
    refetchApps()
  }

  const handleReject = async (appId: string) => {
    await updateStatusMutation.mutateAsync({ applicationId: appId, status: 'REJECTED' })
    refetchApps()
  }

  const handleWithdraw = async (appId: string) => {
    await withdrawMutation.mutateAsync(appId)
    refetchApps()
  }

  const handleCloseJob = async () => {
    if (!job) return
    setClosingJob(true)
    try {
      await closeMutation.mutateAsync(job.id)
    } finally {
      setClosingJob(false)
      setCloseConfirmOpen(false)
    }
  }

  if (jobError) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-12">
        <div className="card-base rounded-2xl p-8 text-center max-w-md mx-auto">
          <AlertCircle size={40} className="text-error mx-auto mb-3" />
          <h2 className="font-bold text-base text-on-surface mb-2">خطأ في التحميل</h2>
          <p className="text-sm text-on-surface-variant mb-4">تعذّر تحميل الوظيفة. تحقق من الاتصال وحاول مرة أخرى.</p>
          <Link href="/jobs/browse" className="btn-primary text-sm">
            العودة للوظائف
          </Link>
        </div>
      </div>
    )
  }

  const statusColor = job ? (JOB_STATUS_COLORS[job.status] ?? '#6b7280') : '#6b7280'
  const statusLabel = job ? (JOB_STATUS_LABELS[job.status] ?? job.status) : ''

  const employerInfo = job?.jobType === 'HIRING'
    ? job.employerProfile
    : null

  const driverInfo = job?.jobType === 'OFFERING'
    ? job.driverProfile
    : null

  const posterName = job?.jobType === 'HIRING' ? (employerInfo?.companyName ?? job?.user.displayName ??'')
    : (driverInfo?.user.displayName ?? job?.user.displayName ?? '')

  const showStickyApplyCTA =
    !loading && job && !isJobOwner && !alreadyApplied && canApply && !submitSuccess

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 pb-24 lg:pb-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-5">
        <Link href="/jobs/browse" className="hover:text-primary transition-colors font-bold">
          {STRINGS.BROWSE_JOBS}
        </Link>
        <ArrowRight size={14} className="rotate-180" />
        <span className="text-on-surface truncate max-w-xs">
          {loading ? '...' : job?.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Column: Main Content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {loading ? (
            <DetailSkeleton />
          ) : job ? (
            <>
              {/* Job Header Card */}
              <div className="card-base rounded-2xl p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={job.jobType === 'HIRING' ? 'badge-hiring' : 'badge-offering'}>
                      {job.jobType === 'HIRING' ? STRINGS.HIRING : STRINGS.OFFERING}
                    </span>
                    <span className="status-pill">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: statusColor }}
                      />
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {job.viewCount} مشاهدة
                    </span>
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                </div>

                <h1 className="text-xl font-extrabold text-on-surface mb-3 leading-snug">
                  {job.title}
                </h1>

                {/* Poster info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden',
                    !job.user.avatarUrl && getAvatarColor(job.userId)
                  )}>
                    {job.user.avatarUrl ? (
                      <img src={job.user.avatarUrl} alt={posterName} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(posterName)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{posterName}</span>
                      {job.user.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                          <CheckCircle size={10} />
                          {STRINGS.VERIFIED}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <MapPin size={11} />
                      {resolveLocationLabel(job.governorate) ?? job.governorate}{job.city ? ` · ${job.city}` : ''}
                    </div>
                  </div>
                </div>

                {/* Driver rating for OFFERING */}
                {driverInfo && (
                  <div className="bg-surface-container-low rounded-xl p-3 mb-4">
                    <RatingBadges
                      rating={driverInfo.averageRating}
                      completionRate={driverInfo.completionRate}
                      responseTime={driverInfo.responseTimeHours}
                      completedJobs={driverInfo.completedJobs}
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* Salary Card */}
              {(job.salary || job.salaryPeriod) && (
                <div className="card-base rounded-2xl p-6">
                  <h2 className="font-bold text-base text-on-surface mb-3">الراتب المتوقع</h2>
                  <div className="flex items-baseline gap-1.5" dir="ltr">
                    <span className="text-sm font-bold text-brand-amber opacity-70">
                      {job.currency === 'OMR' ? 'ر.ع' : job.currency}
                      {job.salaryPeriod && job.salaryPeriod !== 'NEGOTIABLE'
                        ? ` / ${SALARY_PERIOD_LABELS[job.salaryPeriod]}`
                        : ''}
                    </span>
                    <span className="text-3xl font-extrabold text-brand-amber font-tabular">
                      {job.salary ?? '—'}
                    </span>
                    {job.salaryPeriod === 'NEGOTIABLE' && (
                      <span className="text-sm text-on-surface-variant">(قابل للتفاوض)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Description Card */}
              <div className="card-base rounded-2xl p-6">
                <h2 className="font-bold text-base text-on-surface mb-3">تفاصيل الإعلان</h2>
                <p className="text-sm text-on-surface leading-loose whitespace-pre-line">
                  {job.description}
                </p>

                {/* Contact Info */}
                {(job.contactPhone || job.whatsapp || job.contactEmail) && (
                  <div className="mt-5 pt-4 border-t border-outline-variant">
                    <p className="text-xs font-bold text-on-surface-variant mb-3">معلومات التواصل</p>
                    <div className="flex flex-wrap gap-3">
                      {job.contactPhone && (
                        <a
                          href={`tel:${job.contactPhone}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <Phone size={14} className="text-primary" />
                          {job.contactPhone}
                        </a>
                      )}
                      {job.whatsapp && (
                        <a
                          href={`https://wa.me/${job.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle size={14} />
                          واتساب
                        </a>
                      )}
                      {job.contactEmail && (
                        <a
                          href={`mailto:${job.contactEmail}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface text-sm font-bold text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <Mail size={14} className="text-primary" />
                          {job.contactEmail}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements / Profile Card */}
              <div className="card-base rounded-2xl p-6">
                <h2 className="font-bold text-base text-on-surface mb-4">
                  {job.jobType === 'HIRING' ? 'متطلبات الوظيفة' : 'المؤهلات والخبرات'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.licenseTypes.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-2">نوع الرخصة</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.licenseTypes.map(lt => (
                          <span key={`detail-lic-${lt}`} className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-container text-primary">
                            🪪 {LICENSE_TYPE_LABELS[lt] ?? lt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-2">نوع التوظيف</p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-surface text-on-surface">
                      <Clock size={11} />
                      {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
                    </span>
                  </div>
                  {job.experienceYears !== undefined && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-1">الخبرة المطلوبة</p>
                      <p className="text-sm font-bold text-on-surface">{job.experienceYears}+ سنوات</p>
                    </div>
                  )}
                  {job.vehicleTypes.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-2">أنواع المركبات</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.vehicleTypes.map(vt => (
                          <span key={`detail-veh-${vt}`} className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface text-on-surface-variant">
                            🚛 {vt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-1">مركبة خاصة</p>
                    <p className="text-sm font-bold text-on-surface">
                      {job.hasOwnVehicle ? '✅ يمتلك مركبة' : '❌ لا يمتلك'}
                    </p>
                  </div>
                  {job.nationality && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-1">الجنسية</p>
                      <p className="text-sm font-bold text-on-surface">🌍 {NATIONALITY_LABELS[job.nationality!] ?? job.nationality}</p>
                    </div>
                  )}
                  {job.languages.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-2">اللغات</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.languages.map(lang => (
                          <span key={`detail-lang-${lang}`} className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface text-on-surface-variant">
                            💬 {LANGUAGE_LABELS[lang] ?? lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(job.minAge || job.maxAge) && (
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant mb-1">الفئة العمرية</p>
                      <p className="text-sm font-bold text-on-surface">
                        {job.minAge ?? '—'} – {job.maxAge ?? '—'} سنة
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposals Section */}
              <div className="card-base rounded-2xl overflow-hidden">
                <button
                  onClick={() => setAppsExpanded(!appsExpanded)}
                  className="w-full flex items-center justify-between p-5 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-base text-on-surface">العروض المقدمة</h2>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                      {job?._count?.applications ?? applications.length}
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    className={cn(
                      'text-on-surface-variant transition-transform duration-200',
                      appsExpanded ? 'rotate-90' : '-rotate-90'
                    )}
                  />
                </button>

                {appsExpanded && (
                  <div className="border-t border-outline-variant p-5 space-y-3">
                    {appsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skel-app-${i}`} className="animate-pulse card-base rounded-2xl p-4">
                          <div className="flex gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-surface-dim" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-1/3 bg-surface-dim rounded-lg" />
                              <div className="h-3 w-1/2 bg-surface-dim rounded-lg" />
                            </div>
                          </div>
                          <div className="h-4 bg-surface-dim rounded-lg mb-2" />
                          <div className="h-4 w-2/3 bg-surface-dim rounded-lg" />
                        </div>
                      ))
                    ) : applications.length === 0 ? (
                      <div className="text-center py-8">
                        <Users size={28} className="text-on-surface-variant mx-auto mb-2" />
                        <p className="text-sm font-bold text-on-surface mb-1">{STRINGS.EMPTY_PROPOSALS}</p>
                        <p className="text-xs text-on-surface-variant">لم يصل أي عرض لهذا الإعلان بعد</p>
                      </div>
                    ) : (
                      applications.map(app => (
                        <ProposalCard
                          key={`proposal-${app.id}`}
                          application={app}
                          isJobOwner={isJobOwner}
                          isOwnProposal={app.applicantId === user?.id}
                          isAuthenticated={isAuthenticated}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onWithdraw={handleWithdraw}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* Apply Form — most important CTA */}
            {!loading && job && !isJobOwner && (
              <div id="apply-sidebar" className="card-base rounded-2xl p-5">
                {!isAuthenticated ? (
                  <div className="text-center py-4">
                    <p className="text-sm font-bold text-on-surface mb-3">سجّل دخولك لتقديم عرض</p>
                    {/* C-2: redirect back to this job after login */}
                    <Link href={`/login?redirect=/jobs/${jobId}`} className="btn-primary text-sm font-bold py-2.5 w-full block text-center">
                      {STRINGS.LOGIN}
                    </Link>
                  </div>
                ) : alreadyApplied && ownApplication ? (
                  <div>
                    <h3 className="font-bold text-sm text-on-surface mb-3">عرضك المقدم</h3>
                    <div className="p-3 bg-surface-container-low rounded-xl mb-3">
                      <p className="text-xs text-on-surface-variant mb-1">رسالتك:</p>
                      <p className="text-sm text-on-surface line-clamp-3">{ownApplication.message}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="status-pill">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: APPLICATION_STATUS_COLORS[ownApplication.status] ?? '#f59e0b' }} />
                        {APPLICATION_STATUS_LABELS[ownApplication.status] ?? ownApplication.status}
                      </span>
                      {ownApplication.status === 'PENDING' && (
                        <button onClick={() => handleWithdraw(ownApplication.id)} className="text-xs font-bold text-error hover:underline">
                          {STRINGS.WITHDRAW}
                        </button>
                      )}
                    </div>
                  </div>
                ) : canApply ? (
                  <div>
                    <h3 className="font-bold text-sm text-on-surface mb-4">{STRINGS.APPLY}</h3>
                    {submitSuccess ? (
                      <div className="text-center py-4">
                        <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-green-700">تم إرسال عرضك بنجاح!</p>
                        <p className="text-xs text-on-surface-variant mt-1">سيتواصل معك صاحب الإعلان قريباً</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit(onSubmitProposal)} noValidate>
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-on-surface mb-1.5">
                            رسالتك التعريفية <span className="text-error me-1">*</span>
                          </label>
                          <textarea
                            {...register('message')}
                            rows={4}
                            placeholder={t('applyMessagePlaceholder')}
                            className={cn('input-base resize-none text-sm', errors.message && 'border-error focus:ring-error focus:border-error')}
                          />
                          {errors.message && <p className="mt-1 text-xs text-error">{errors.message.message}</p>}
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-on-surface mb-1.5">رابط السيرة الذاتية (اختياري)</label>
                          <input
                            {...register('resumeUrl')}
                            type="url"
                            placeholder="https://..."
                            className={cn('input-base text-sm', errors.resumeUrl && 'border-error focus:ring-error focus:border-error')}
                          />
                          {errors.resumeUrl && <p className="mt-1 text-xs text-error">{errors.resumeUrl.message}</p>}
                        </div>
                        <button type="submit" disabled={applyMutation.isPending} className="btn-amber w-full flex items-center justify-center gap-2">
                          {applyMutation.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {applyMutation.isPending ? 'جاري الإرسال...' : STRINGS.SUBMIT_PROPOSAL}
                        </button>
                      </form>
                    )}
                  </div>
                ) : job.status !== 'ACTIVE' ? (
                  <div className="text-center py-4">
                    <AlertCircle size={24} className="text-on-surface-variant mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant">هذا الإعلان {statusLabel}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Briefcase size={24} className="text-on-surface-variant mx-auto mb-2" />
                    <p className="text-sm font-bold text-on-surface mb-1">
                      {job.jobType === 'HIRING' ? 'مخصص للسائقين فقط' : 'مخصص لأصحاب العمل فقط'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {job.jobType === 'HIRING' ? 'يجب أن يكون لديك بروفايل سائق للتقديم' : 'يجب أن يكون لديك بروفايل صاحب عمل للتقديم'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Employer Info Card (for HIRING jobs) */}
            {!loading && job?.jobType === 'HIRING' && employerInfo && (
              <div className="card-base rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0',
                    getAvatarColor(employerInfo.userId)
                  )}>
                    {getInitials(employerInfo.companyName ?? employerInfo.user.displayName ?? 'ش')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-on-surface truncate">
                        {employerInfo.companyName ?? employerInfo.user.displayName}
                      </span>
                      {employerInfo.user.isVerified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                          <CheckCircle size={9} />
                          موثّق
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {resolveLocationLabel(employerInfo.governorate) ?? employerInfo.governorate}
                      {employerInfo.industry ? ` · ${employerInfo.industry}` : ''}
                    </p>
                  </div>
                </div>

                {employerInfo.reviewCount > 0 ? (
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} fill="#f59e0b" className="text-amber-500" />
                    <span className="text-sm font-bold text-on-surface">
                      {employerInfo.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      ({employerInfo.reviewCount} {STRINGS.REVIEWS})
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface text-on-surface-variant mb-3">
                    جديد
                  </span>
                )}

                <Link
                  href={`/jobs/employers/${employerInfo.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface transition-colors"
                >
                  <Briefcase size={14} />
                  عرض بروفايل صاحب العمل
                </Link>
              </div>
            )}

            {/* Job Owner Management Panel — last */}
            {!loading && isJobOwner && job && (
              <div className="card-base rounded-2xl p-5">
                <h3 className="font-bold text-sm text-on-surface mb-4">إدارة الإعلان</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-surface-container-low rounded-xl">
                    <p className="text-xl font-extrabold text-primary font-tabular">{job._count.applications}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">عرض</p>
                  </div>
                  <div className="text-center p-3 bg-surface-container-low rounded-xl">
                    <p className="text-xl font-extrabold text-brand-amber font-tabular">{job.viewCount}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">مشاهدة</p>
                  </div>
                  <div className="text-center p-3 bg-surface-container-low rounded-xl">
                    <p className="text-xs font-bold text-on-surface mt-1">{timeAgo(job.createdAt)}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">نُشر</p>
                  </div>
                </div>
                {job.status === 'ACTIVE' && (
                  <button
                    onClick={() => setCloseConfirmOpen(true)}
                    disabled={closingJob}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-error/40 text-error text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-95"
                  >
                    {closingJob ? <span className="animate-spin w-4 h-4 border-2 border-error border-t-transparent rounded-full" /> : <X size={15} />}
                    {STRINGS.CLOSE_JOB}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C-6: Sticky mobile CTA — visible only on mobile for eligible applicants */}
      {showStickyApplyCTA && (
        <div
          className="lg:hidden fixed start-0 end-0 z-40 bg-white/95 backdrop-blur-sm border-t border-outline-variant px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
          style={{ bottom: 'calc(53px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={() => document.getElementById('apply-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="btn-amber w-full flex items-center justify-center gap-2 py-3 text-sm font-bold"
          >
            {STRINGS.APPLY}
          </button>
        </div>
      )}

      {/* Close Job Confirmation */}
      <ConfirmDialog
        open={closeConfirmOpen}
        title="تأكيد إغلاق الإعلان"
        description={`هل تريد إغلاق إعلان "${job?.title}"؟ لن يتمكن المتقدمون من إرسال عروض جديدة بعد الإغلاق.`}
        confirmLabel="إغلاق الإعلان"
        cancelLabel="إلغاء"
        variant="warning"
        loading={closingJob}
        onConfirm={handleCloseJob}
        onCancel={() => setCloseConfirmOpen(false)}
      />
    </div>
  )
}
