'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Eye, Users, Trash2, X, ChevronDown, ChevronUp
} from 'lucide-react';
import ProposalCard from '@/features/jobs/components/ProposalCard';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';
import {
  useMyJobs,
  useJobApplications,
  useUpdateApplicationStatus,
  useDeleteJob,
  useUpdateJob,
} from '@/lib/api/jobs';
import type { DriverJob, JobApplication } from '@/features/jobs/types';
import {
  JOB_STATUS_LABELS, JOB_STATUS_COLORS, STRINGS
} from '@/features/jobs/constants';
import { useAuth } from '@/providers/auth-provider';
import { timeAgo, cn } from '@/lib/utils';

export default function MyPostsPage() {
  const { isAuthenticated } = useAuth()

  const { data: jobsData, isLoading: loading, error, refetch } = useMyJobs()
  const jobs = (jobsData?.items ?? []) as unknown as DriverJob[]

  const deleteMutation = useDeleteJob()
  const updateMutation = useUpdateJob()

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredJobs = statusFilter === 'ALL'
    ? jobs
    : jobs.filter(j => j.status === statusFilter)

  const handleDelete = async (jobId: string) => {
    if (!confirm(STRINGS.CONFIRM_DELETE)) return
    await deleteMutation.mutateAsync(jobId)
    refetch()
  }

  const handleClose = async (jobId: string) => {
    await updateMutation.mutateAsync({ id: jobId, status: 'CLOSED' })
    refetch()
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-12 text-center">
        <p className="text-sm text-on-surface-variant mb-4">{STRINGS.LOGIN_REQUIRED}</p>
        <Link href="/jobs/browse" className="btn-primary text-sm">
          {STRINGS.LOGIN}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">{STRINGS.MY_POSTS}</h1>
          <p className="text-sm text-on-surface-variant mt-1">إدارة إعلاناتك ومتابعة العروض المقدمة</p>
        </div>
        <Link
          href="/jobs/new"
          className="btn-amber text-sm flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <Plus size={16} />
          إعلان جديد
        </Link>
      </div>

      {/* Status Filter Tabs */}
      {jobs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {['ALL', 'ACTIVE', 'CLOSED', 'EXPIRED'].map(st => (
            <button
              key={`filter-${st}`}
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                statusFilter === st
                  ? 'bg-primary text-white border-primary' :'border-outline-variant text-on-surface-variant hover:border-outline'
              )}
            >
              {st === 'ALL' ? 'الكل' : JOB_STATUS_LABELS[st] ?? st}
              {st !== 'ALL' && (
                <span className="ms-1 text-xs opacity-70">
                  ({jobs.filter(j => j.status === st).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skel-my-${i}`} className="animate-pulse card-base rounded-2xl p-5 h-28" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card-base rounded-2xl p-6 text-center">
          <p className="text-sm text-error font-bold mb-3">{STRINGS.ERROR_GENERIC}</p>
          <button onClick={() => refetch()} className="text-primary text-sm font-bold hover:underline">
            حاول مرة أخرى
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && jobs.length === 0 && (
        <JobEmptyState
          title={STRINGS.EMPTY_MY_POSTS}
          description="لم تنشر أي إعلان وظيفة بعد. ابدأ الآن!"
          ctaLabel="أنشئ إعلان"
          ctaHref="/jobs/new"
        />
      )}

      {/* Jobs List */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="space-y-3">
          {filteredJobs.map(job => {
            const isExpanded = expandedJobId === job.id
            const statusColor = JOB_STATUS_COLORS[job.status] ?? '#6b7280'

            return (
              <div key={`mypost-${job.id}`} className="card-base rounded-2xl overflow-hidden">
                {/* Job Row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={job.jobType === 'HIRING' ? 'badge-hiring' : 'badge-offering'}>
                          {job.jobType === 'HIRING' ? STRINGS.HIRING : STRINGS.OFFERING}
                        </span>
                        <span className="status-pill">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: statusColor }} />
                          {JOB_STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-on-surface hover:text-primary transition-colors line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {job.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {job._count.applications} عرض
                        </span>
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {job._count.applications > 0 && (
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1"
                        >
                          <Users size={12} />
                          {job._count.applications}
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                      {job.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleClose(job.id)}
                          className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors p-1.5"
                          title={STRINGS.CLOSE_JOB}
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors p-1.5"
                        title={STRINGS.DELETE}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded — applications */}
                {isExpanded && (
                  <ApplicationsPanel jobId={job.id} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ApplicationsPanel({ jobId }: { jobId: string }) {
  const { user } = useAuth()
  const { data: apps, isLoading, refetch } = useJobApplications(jobId)
  const applications = (apps ?? []) as unknown as JobApplication[]
  const updateStatus = useUpdateApplicationStatus()

  const handleAccept = async (appId: string) => {
    await updateStatus.mutateAsync({ applicationId: appId, status: 'ACCEPTED' })
    refetch()
  }

  const handleReject = async (appId: string) => {
    await updateStatus.mutateAsync({ applicationId: appId, status: 'REJECTED' })
    refetch()
  }

  return (
    <div className="border-t border-outline-variant px-5 py-4 space-y-3 bg-surface-container-low">
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div key={`skel-apps-${i}`} className="animate-pulse card-base rounded-2xl p-4 h-20" />
        ))
      ) : applications.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-4">{STRINGS.EMPTY_PROPOSALS}</p>
      ) : (
        applications.map(app => (
          <ProposalCard
            key={`apps-${app.id}`}
            application={app}
            isJobOwner={true}
            isOwnProposal={app.applicantId === user?.id}
            isAuthenticated={!!user}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))
      )}
    </div>
  )
}
