'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Users, ChevronDown, ChevronUp, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import type { DriverJob, JobApplication } from '@/features/jobs/types';
import { useJobApplications, useDeleteJob, useCloseJob, useUpdateApplicationStatus } from '@/lib/api/jobs';
import ProposalCard from '@/features/jobs/components/ProposalCard';
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  EMPLOYMENT_TYPE_LABELS,
  STRINGS,
} from '@/features/jobs/constants';
import { timeAgo } from '@/lib/utils';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';
import ConfirmDialog from '@/components/confirm-dialog';

interface MyPostsListProps {
  jobs: DriverJob[]
  statusFilter: string
}

type PostWithApps = DriverJob & { apps?: JobApplication[]; appsLoading?: boolean; appsOpen?: boolean }

export default function MyPostsList({ jobs, statusFilter }: MyPostsListProps) {
  const [posts, setPosts] = useState<PostWithApps[]>(jobs.map(j => ({ ...j })))
  const deleteJob = useDeleteJob()
  const closeJob = useCloseJob()
  const updateAppStatus = useUpdateApplicationStatus()

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: 'delete' | 'close';
    jobId: string;
    jobTitle: string;
  }>({ open: false, type: 'delete', jobId: '', jobTitle: '' })
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Per-job toggle loading state
  const [toggleLoadingIds, setToggleLoadingIds] = useState<Set<string>>(new Set())

  const filtered = statusFilter === 'all'
    ? posts
    : posts.filter(p => p.status === statusFilter)

  const toggleApps = async (jobId: string) => {
    const post = posts.find(p => p.id === jobId)
    if (!post) return
    if (post.appsOpen) {
      setPosts(prev => prev.map(p => p.id === jobId ? { ...p, appsOpen: false } : p))
      return
    }
    setToggleLoadingIds(prev => new Set(prev).add(jobId))
    setPosts(prev => prev.map(p => p.id === jobId ? { ...p, appsOpen: true, appsLoading: true } : p))
    // InlineProposals will call the hook itself; remove loading indicator after a tick
    setTimeout(() => {
      setToggleLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }, 600)
  }

  const openConfirm = (type: 'delete' | 'close', jobId: string, jobTitle: string) => {
    setConfirmState({ open: true, type, jobId, jobTitle })
  }

  const handleConfirm = async () => {
    setConfirmLoading(true)
    try {
      if (confirmState.type === 'delete') {
        await deleteJob.mutateAsync(confirmState.jobId)
        setPosts(prev => prev.filter(p => p.id !== confirmState.jobId))
      } else {
        await closeJob.mutateAsync(confirmState.jobId)
        setPosts(prev => prev.map(p => p.id === confirmState.jobId ? { ...p, status: 'CLOSED' } : p))
      }
      setConfirmState(prev => ({ ...prev, open: false }))
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleAccept = async (appId: string, jobId: string) => {
    await updateAppStatus.mutateAsync({ applicationId: appId, status: 'ACCEPTED' })
    setPosts(prev => prev.map(p =>
      p.id === jobId
        ? { ...p, apps: p.apps?.map(a => a.id === appId ? { ...a, status: 'ACCEPTED' as const } : a) }
        : p
    ))
  }

  const handleReject = async (appId: string, jobId: string) => {
    await updateAppStatus.mutateAsync({ applicationId: appId, status: 'REJECTED' })
    setPosts(prev => prev.map(p =>
      p.id === jobId
        ? { ...p, apps: p.apps?.map(a => a.id === appId ? { ...a, status: 'REJECTED' as const } : a) }
        : p
    ))
  }

  if (filtered.length === 0) {
    return (
      <JobEmptyState
        title={STRINGS.EMPTY_POSTS}
        description="لم تنشر أي إعلانات في هذه الفئة بعد. أنشئ إعلانك الأول الآن."
        ctaLabel="أنشئ إعلاناً"
        ctaHref="/jobs/new"
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        {filtered.map(post => {
          const statusColor = JOB_STATUS_COLORS[post.status] ?? '#6b7280'
          const statusLabel = JOB_STATUS_LABELS[post.status] ?? post.status
          const isHiring = post.jobType === 'HIRING'
          const isToggleLoading = toggleLoadingIds.has(post.id)

          return (
            <div key={`mypost-${post.id}`} className="card-base rounded-2xl overflow-hidden">
              {/* Post Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={isHiring ? 'badge-hiring' : 'badge-offering'}>
                      {isHiring ? STRINGS.HIRING : STRINGS.OFFERING}
                    </span>
                    <span className="status-pill">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: statusColor }}
                      />
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* C-5: Fixed href — links to the job detail page, not browse */}
                    <Link
                      href={`/jobs/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-surface transition-colors text-on-surface-variant"
                      aria-label={`عرض إعلان ${post.title} في صفحة جديدة`}
                      title="عرض الإعلان"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    {post.status === 'ACTIVE' && (
                      <button
                        onClick={() => openConfirm('close', post.id, post.title)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-on-surface-variant hover:text-brand-amber transition-colors"
                        aria-label={`إغلاق إعلان ${post.title}`}
                        title={STRINGS.CLOSE_JOB}
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => openConfirm('delete', post.id, post.title)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors"
                      aria-label={`حذف إعلان ${post.title}`}
                      title={STRINGS.DELETE}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-on-surface mb-1 line-clamp-2">{post.title}</h3>
                <p className="text-xs text-on-surface-variant mb-3">
                  {post.governorate}{post.city ? ` · ${post.city}` : ''} · {EMPLOYMENT_TYPE_LABELS[post.employmentType] ?? post.employmentType} · {timeAgo(post.createdAt)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {post.viewCount}
                    </span>
                    <button
                      onClick={() => toggleApps(post.id)}
                      disabled={isToggleLoading}
                      className="flex items-center gap-1.5 font-bold text-primary hover:underline transition-colors disabled:opacity-60"
                    >
                      {isToggleLoading
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Users size={12} />
                      }
                      {post._count.applications} عرض
                      {!isToggleLoading && (post.appsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  </div>

                  <button
                    onClick={() => toggleApps(post.id)}
                    disabled={isToggleLoading}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-surface-container-low text-primary hover:bg-surface-container transition-colors disabled:opacity-60"
                  >
                    {isToggleLoading
                      ? <Loader2 size={12} className="animate-spin" />
                      : STRINGS.VIEW_PROPOSALS
                    }
                    {!isToggleLoading && (post.appsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </button>
                </div>
              </div>

              {/* Inline Proposals */}
              {post.appsOpen && (
                <InlineProposals
                  jobId={post.id}
                  onAccept={(appId) => handleAccept(appId, post.id)}
                  onReject={(appId) => handleReject(appId, post.id)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.type === 'delete' ? 'تأكيد حذف الإعلان' : 'تأكيد إغلاق الإعلان'}
        description={
          confirmState.type === 'delete'
            ? `هل أنت متأكد من حذف إعلان "${confirmState.jobTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `هل تريد إغلاق إعلان "${confirmState.jobTitle}"؟ لن يتمكن المتقدمون من إرسال عروض جديدة.`
        }
        confirmLabel={confirmState.type === 'delete' ? 'حذف' : 'إغلاق'}
        cancelLabel="إلغاء"
        variant={confirmState.type === 'delete' ? 'danger' : 'warning'}
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />
    </>
  )
}

function InlineProposals({ jobId, onAccept, onReject }: { jobId: string; onAccept: (id: string) => Promise<void>; onReject: (id: string) => Promise<void> }) {
  const { data, isLoading } = useJobApplications(jobId)
  const apps = data?.items ?? []

  return (
    <div className="border-t border-outline-variant bg-surface p-4 space-y-3">
      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div key={`skel-inline-${jobId}-${i}`} className="animate-pulse card-base rounded-2xl p-4">
            <div className="flex gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-surface-dim" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-surface-dim rounded-lg" />
                <div className="h-3 w-1/2 bg-surface-dim rounded-lg" />
              </div>
            </div>
            <div className="h-4 bg-surface-dim rounded-lg" />
          </div>
        ))
      ) : apps.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-4">
          {STRINGS.EMPTY_PROPOSALS}
        </p>
      ) : (
        apps.map(app => (
          <ProposalCard
            key={`inline-app-${app.id}`}
            application={app as any}
            isJobOwner={true}
            isOwnProposal={false}
            isAuthenticated={true}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))
      )}
    </div>
  )
}
