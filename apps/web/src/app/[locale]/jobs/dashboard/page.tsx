'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Plus, AlertCircle, ShieldCheck, Briefcase, Truck } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useMyJobs,
  useMyApplications,
  useMyDriverProfile,
  useMyEmployerProfile,
} from '@/lib/api';
import DashboardStatsRow from '@/features/jobs/components/DashboardStatsRow';
import MyPostsList from '@/features/jobs/components/MyPostsList';
import MyProposalsList from '@/features/jobs/components/MyProposalsList';
import { useWithdrawApplication } from '@/lib/api/jobs';
import {
  JOB_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
} from '@/features/jobs/constants';
import type { DriverJob, JobApplication } from '@/features/jobs/types';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const t = useTranslations('jobs')
  const { data: employer, isLoading: empLoading } = useMyEmployerProfile()
  const { data: driver, isLoading: drvLoading } = useMyDriverProfile()
  const { data: jobsData, isLoading: jobsLoading } = useMyJobs()
  const { data: appsData, isLoading: appsLoading } = useMyApplications()
  const withdrawApp = useWithdrawApplication()

  const [statusFilter, setStatusFilter] = useState('all')
  const [activeRole, setActiveRole] = useState<'employer' | 'driver'>('driver')
  const roleInitialized = useRef(false)

  // Set initial role once profiles finish loading (useState initial value can't use async data)
  useEffect(() => {
    if (!empLoading && !drvLoading && !roleInitialized.current) {
      roleInitialized.current = true
      if (employer) setActiveRole('employer')
    }
  }, [empLoading, drvLoading, employer])

  const isEmployer = !!employer
  const isDriver = !!driver
  const hasBothRoles = isEmployer && isDriver
  const loading = empLoading || drvLoading || jobsLoading || appsLoading

  // Map API items to feature types for components
  const myJobs: DriverJob[] = useMemo(() => {
    if (!jobsData?.items) return []
    return jobsData.items.map(j => ({
      id: j.id,
      userId: j.user?.id ?? '',
      user: {
        id: j.user?.id ?? '',
        username: j.user?.username ?? '',
        displayName: j.user?.displayName ?? undefined,
        avatarUrl: j.user?.avatarUrl ?? undefined,
        isVerified: j.user?.isVerified ?? false,
      },
      title: j.title,
      slug: j.slug,
      description: j.description,
      jobType: j.jobType,
      employmentType: j.employmentType,
      salary: j.salary ? Number(j.salary) : undefined,
      salaryPeriod: j.salaryPeriod ?? undefined,
      currency: j.currency,
      licenseTypes: j.licenseTypes as any,
      experienceYears: j.experienceYears ?? undefined,
      minAge: j.minAge ?? undefined,
      maxAge: j.maxAge ?? undefined,
      languages: j.languages,
      nationality: j.nationality ?? undefined,
      vehicleTypes: j.vehicleTypes,
      hasOwnVehicle: j.hasOwnVehicle,
      governorate: j.governorate,
      city: j.city ?? undefined,
      contactPhone: j.contactPhone ?? undefined,
      contactEmail: j.contactEmail ?? undefined,
      whatsapp: j.whatsapp ?? undefined,
      status: j.status as any,
      viewCount: j.viewCount,
      _count: { applications: j._count?.applications ?? 0 },
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    }))
  }, [jobsData])

  const myApps: JobApplication[] = useMemo(() => {
    if (!appsData) return []
    return appsData.map(a => ({
      id: a.id,
      jobId: a.jobId,
      applicantId: a.applicantId,
      status: a.status,
      message: a.message ?? undefined,
      resumeUrl: a.resumeUrl ?? undefined,
      createdAt: a.createdAt,
      job: {
        id: a.job.id,
        userId: a.job.userId,
        user: {
          id: a.job.user.id,
          username: a.job.user.username,
          displayName: a.job.user.displayName ?? undefined,
          avatarUrl: a.job.user.avatarUrl ?? undefined,
          isVerified: a.job.user.isVerified,
        },
        title: a.job.title,
        slug: '',
        description: '',
        jobType: a.job.jobType,
        employmentType: 'FULL_TIME' as const,
        salary: a.job.salary ? Number(a.job.salary) : undefined,
        salaryPeriod: (a.job.salaryPeriod ?? undefined) as any,
        currency: a.job.currency,
        licenseTypes: [],
        languages: [],
        vehicleTypes: [],
        hasOwnVehicle: false,
        governorate: a.job.governorate,
        status: a.job.status as any,
        viewCount: 0,
        _count: { applications: 0 },
        createdAt: a.createdAt,
        updatedAt: a.createdAt,
      },
    }))
  }, [appsData])

  const showEmployer = hasBothRoles ? activeRole === 'employer' : isEmployer
  const showDriver = hasBothRoles ? activeRole === 'driver' : isDriver

  // Stats
  const totalPosts = myJobs.length
  const totalProposals = showEmployer
    ? myJobs.reduce((s, j) => s + j._count.applications, 0)
    : myApps.length
  const acceptedCount = showEmployer
    ? myJobs.filter(j => j.status === 'CLOSED').length
    : myApps.filter(a => a.status === 'ACCEPTED').length
  const activeCount = showEmployer
    ? myJobs.filter(j => j.status === 'ACTIVE').length
    : myApps.filter(a => a.status === 'PENDING').length

  const statusOptions = showEmployer
    ? ['all', ...Object.keys(JOB_STATUS_LABELS)]
    : ['all', ...Object.keys(APPLICATION_STATUS_LABELS)]
  const statusLabels: Record<string, string> = {
    all: t('tabAll'),
    ACTIVE: t('statusActive'),
    CLOSED: t('statusClosed'),
    EXPIRED: t('statusExpired'),
    DRAFT: t('statusDraft'),
    PENDING: t('appPending'),
    ACCEPTED: t('appAccepted'),
    REJECTED: t('appRejected'),
    WITHDRAWN: t('appWithdrawn'),
  }

  const handleWithdraw = async (id: string) => {
    await withdrawApp.mutateAsync(id)
  }

  if (!loading && !isEmployer && !isDriver) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-brand-amber" />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface mb-2">{t('noProfileTitle')}</h1>
        <p className="text-sm text-on-surface-variant mb-6">{t('noProfileDesc')}</p>
        <Link href="/jobs/onboarding" className="btn-amber inline-flex px-6 py-3 text-sm font-bold">
          {t('createProfile')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-8 xl:px-10 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">{t('dashboardTitle')}</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {showEmployer ? t('dashboardEmployerSubtitle') : t('dashboardDriverSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/jobs/profile/edit"
            className="btn-outline flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
          >
            {t('editProfile')}
          </Link>
          {showEmployer && (
            <Link
              href="/jobs/new"
              className="btn-amber flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
            >
              <Plus size={16} />
              {t('postJob')}
            </Link>
          )}
        </div>
      </div>

      {/* Role Switcher Tabs — only when user has both profiles */}
      {hasBothRoles && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveRole('employer'); setStatusFilter('all') }}
            aria-pressed={activeRole === 'employer'}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeRole === 'employer'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <Briefcase size={16} />
            {t('asEmployer')}
          </button>
          <button
            onClick={() => { setActiveRole('driver'); setStatusFilter('all') }}
            aria-pressed={activeRole === 'driver'}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              activeRole === 'driver'
                ? 'bg-brand-amber text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <Truck size={16} />
            {t('asDriver')}
          </button>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat-skel-${i}`} className="card-base rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-dim" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-12 bg-surface-dim rounded-lg" />
                  <div className="h-3 w-20 bg-surface-dim rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DashboardStatsRow
          isEmployer={showEmployer}
          totalPosts={totalPosts}
          totalProposals={totalProposals}
          acceptedCount={acceptedCount}
          activeCount={activeCount}
        />
      )}

      {/* Verification Banner — driver only, not yet verified */}
      {!loading && showDriver && driver && !driver.isVerified && (
        <Link
          href="/jobs/verification"
          className="flex items-center gap-4 p-4 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-amber/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-brand-amber" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface">{t('verifyBannerTitle')}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{t('verifyBannerDesc')}</p>
          </div>
          <span className="text-xs font-bold text-brand-amber shrink-0">{t('verifyBannerCta')} ←</span>
        </Link>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {statusOptions.map(s => (
          <button
            key={`filter-${s}`}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
              statusFilter === s
                ? 'bg-brand-amber text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            )}
          >
            {statusLabels[s] ?? s}
            {s !== 'all' && (() => {
              const cnt = showEmployer
                ? myJobs.filter(j => j.status === s).length
                : myApps.filter(a => a.status === s).length
              return cnt > 0 ? (
                <span className="ms-1.5 opacity-80">{cnt}</span>
              ) : null
            })()}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`content-skel-${i}`} className="card-base rounded-2xl p-5 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 w-1/3 bg-surface-dim rounded-lg" />
                <div className="h-3 w-2/3 bg-surface-dim rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-dim rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : showEmployer ? (
        <MyPostsList jobs={myJobs} statusFilter={statusFilter} />
      ) : (
        <MyProposalsList
          applications={myApps}
          statusFilter={statusFilter}
          onWithdraw={handleWithdraw}
        />
      )}
    </div>
  )
}
