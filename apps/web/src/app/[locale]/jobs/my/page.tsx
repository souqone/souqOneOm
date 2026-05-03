'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import { useMyJobs, useJobApplications, useUpdateApplicationStatus, useUpdateJob, useDeleteJob } from '@/lib/api';
import type { JobItem } from '@/lib/api';
import { useToast } from '@/components/toast';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

export default function MyJobsPage() {
  return (
    <JobsPageGuard role="any">
      <MyJobsContent />
    </JobsPageGuard>
  );
}

function MyJobsContent() {
  const { addToast } = useToast();
  const { data, isLoading, isError, refetch } = useMyJobs();
  const jobs = data?.items;
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const tp = useTranslations('pages');
  const locale = useLocale();

  const jobTypeLabels: Record<string, string> = {
    OFFERING: tp('myJobsTypeOffering'), HIRING: tp('myJobsTypeHiring'),
  };
  const statusLabels: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: tp('myJobsStatusActive'), color: 'bg-green-100 text-green-700' },
    CLOSED: { label: tp('myJobsStatusClosed'), color: 'bg-red-100 text-red-700' },
    EXPIRED: { label: tp('myJobsStatusExpired'), color: 'bg-gray-100 text-gray-600' },
  };

  async function handleToggleStatus(job: JobItem) {
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await updateJob.mutateAsync({ id: job.id, status: newStatus });
      addToast('success', newStatus === 'CLOSED' ? tp('myJobsClosed') : tp('myJobsActivated'));
      refetch();
    } catch (err: any) {
      addToast('error', err?.message || tp('myJobsUpdateFailed'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(tp('myJobsDeleteConfirm'))) return;
    try {
      await deleteJob.mutateAsync(id);
      addToast('success', tp('myJobsDeleted'));
      refetch();
    } catch (err: any) {
      addToast('error', err?.message || tp('myJobsDeleteFailed'));
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              <span className="material-symbols-outlined text-primary align-middle text-3xl ms-2">work</span>
              {tp('myJobsTitle')}
            </h1>
            <p className="text-on-surface-variant">{tp('myJobsSubtitle')}</p>
          </div>
          <Link href="/jobs/new" className="bg-primary text-on-primary hover:brightness-110 rounded-lg shadow-ambient px-6 py-3 text-sm font-bold shrink-0">
            <span className="material-symbols-outlined text-lg align-middle ms-1">add</span>
            {tp('myJobsNewListing')}
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-surface-container-lowest rounded-xl p-6 h-32" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">error</span>
            <p className="text-xl font-bold mb-4">{tp('myJobsError')}</p>
            <button onClick={() => refetch()} className="bg-primary text-on-primary hover:brightness-110 rounded-lg px-6 py-3 text-sm font-bold">{tp('myJobsRetry')}</button>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">work_off</span>
            <p className="text-xl font-bold text-on-surface mb-2">{tp('myJobsEmpty')}</p>
            <p className="text-on-surface-variant mb-6">{tp('myJobsEmptyDesc')}</p>
            <Link href="/jobs/new" className="bg-primary text-on-primary hover:brightness-110 rounded-lg shadow-ambient px-6 py-3 text-sm font-bold">{tp('myJobsAddListing')}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const st = statusLabels[job.status] ?? { label: job.status, color: 'bg-gray-100 text-gray-600' };
              const isExpanded = expandedJob === job.id;
              return (
                <div key={job.id} className="bg-surface-container-lowest rounded-xl overflow-hidden">
                  {/* Job row */}
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          <span className="text-[0.6rem] bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full">
                            {jobTypeLabels[job.jobType]}
                          </span>
                        </div>
                        <Link href={`/jobs/${job.id}`} className="font-bold text-on-surface hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-1 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {resolveLocationLabel(job.governorate, locale) || job.governorate}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            {job.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">group</span>
                            {tp('myJobsApplicationCount', { count: job._count?.applications ?? 0 })}
                          </span>
                          <span>{new Date(job.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {(job._count?.applications ?? 0) > 0 && (
                          <button
                            onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                            className="bg-primary/10 text-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">group</span>
                            {tp('myJobsApplications')} ({job._count?.applications})
                            <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(job)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            job.status === 'ACTIVE'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {job.status === 'ACTIVE' ? tp('myJobsClose') : tp('myJobsActivate')}
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded applications */}
                  {isExpanded && (
                    <ApplicationsList jobId={job.id} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function ApplicationsList({ jobId }: { jobId: string }) {
  const { addToast } = useToast();
  const { data: applications, isLoading, refetch } = useJobApplications(jobId);
  const updateAppStatus = useUpdateApplicationStatus();
  const tp = useTranslations('pages');
  const locale = useLocale();

  const appStatusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: tp('myJobsAppStatusPending'), color: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { label: tp('myJobsAppStatusAccepted'), color: 'bg-green-100 text-green-700' },
    REJECTED: { label: tp('myJobsAppStatusRejected'), color: 'bg-red-100 text-red-700' },
    WITHDRAWN: { label: tp('myJobsAppStatusWithdrawn') || 'تم السحب', color: 'bg-gray-100 text-gray-600' },
  };

  async function handleStatus(applicationId: string, status: 'ACCEPTED' | 'REJECTED') {
    try {
      await updateAppStatus.mutateAsync({ applicationId, status });
      addToast('success', status === 'ACCEPTED' ? tp('myJobsAppAccepted') : tp('myJobsAppRejected'));
      refetch();
    } catch (err: any) {
      addToast('error', err?.message || tp('myJobsAppUpdateFailed'));
    }
  }

  if (isLoading) {
    return (
      <div className="border-t border-surface-container-low p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-surface-container-low rounded-xl" />
          <div className="h-16 bg-surface-container-low rounded-xl" />
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="border-t border-surface-container-low p-5 text-center text-sm text-on-surface-variant">
        {tp('myJobsNoApplications')}
      </div>
    );
  }

  return (
    <div className="border-t border-surface-container-low p-5 space-y-3">
      <h4 className="text-sm font-bold text-on-surface-variant mb-3">{tp('myJobsIncomingApps', { count: applications.length })}</h4>
      {applications.map((app) => {
        const appSt = appStatusLabels[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' };
        return (
          <div key={app.id} className="bg-surface-container-low rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {app.applicant.avatarUrl ? (
                <Image src={getImageUrl(app.applicant.avatarUrl) || ''} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{app.applicant.displayName || app.applicant.username}</p>
                {app.applicant.governorate && (
                  <p className="text-xs text-on-surface-variant">{resolveLocationLabel(app.applicant.governorate, locale) || app.applicant.governorate}</p>
                )}
                {app.message && (
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">&ldquo;{app.message}&rdquo;</p>
                )}
                <p className="text-[0.6rem] text-on-surface-variant mt-1">
                  {new Date(app.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${appSt.color}`}>{appSt.label}</span>
              {app.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatus(app.id, 'ACCEPTED')}
                    disabled={updateAppStatus.isPending}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {tp('myJobsAccept')}
                  </button>
                  <button
                    onClick={() => handleStatus(app.id, 'REJECTED')}
                    disabled={updateAppStatus.isPending}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {tp('myJobsReject')}
                  </button>
                </>
              )}
              {app.applicant.phone && (
                <a href={`tel:${app.applicant.phone}`} className="bg-surface-container text-on-surface-variant p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">call</span>
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
