'use client';
import React from 'react';
import Link from 'next/link';
import { ExternalLink, RotateCcw } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { JobApplication } from '@/features/jobs/types';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  SALARY_PERIOD_LABELS,
  STRINGS,
} from '@/features/jobs/constants';
import { timeAgo, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';

interface MyProposalsListProps {
  applications: JobApplication[]
  statusFilter: string
  onWithdraw: (id: string) => void
}

export default function MyProposalsList({
  applications,
  statusFilter,
  onWithdraw,
}: MyProposalsListProps) {
  const locale = useLocale()
  const filtered = statusFilter === 'all'
    ? applications
    : applications.filter(a => a.status === statusFilter)

  if (filtered.length === 0) {
    return (
      <JobEmptyState
        title={STRINGS.EMPTY_PROPOSALS}
        description="لم تقدّم أي عروض بعد. تصفّح الوظائف المتاحة وقدّم عرضك الأول."
        ctaLabel="تصفّح الوظائف"
        ctaHref="/jobs/browse"
      />
    )
  }

  return (
    <div className="space-y-4">
      {filtered.map(app => {
        const statusColor = APPLICATION_STATUS_COLORS[app.status] ?? '#9ca3af'
        const statusLabel = APPLICATION_STATUS_LABELS[app.status] ?? app.status
        const job = app.job

        return (
          <div key={`myapp-${app.id}`} className="card-base rounded-2xl p-5">
            {/* Job info header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {job && (
                    <span className={job.jobType === 'HIRING' ? 'badge-hiring' : 'badge-offering'}>
                      {job.jobType === 'HIRING' ? STRINGS.HIRING : STRINGS.OFFERING}
                    </span>
                  )}
                  <span className="status-pill">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: statusColor }}
                    />
                    {statusLabel}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-surface line-clamp-2">
                  {job?.title ?? 'وظيفة'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {job?.user?.displayName || job?.user?.username || ''}
                  {job?.governorate ? ` · ${resolveLocationLabel(job.governorate, locale) ?? job.governorate}` : ''}
                  <span className="text-outline mx-1">·</span>
                  {timeAgo(app.createdAt)}
                </p>
              </div>
              {job && (
                <Link
                  href={`/jobs/browse?id=${job.id}`}
                  className="p-2 rounded-xl hover:bg-surface transition-colors text-on-surface-variant shrink-0"
                  title="عرض الإعلان"
                >
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>

            {/* Message preview */}
            {app.message && (
              <div className="bg-surface-container-low rounded-xl p-3 mb-3">
                <p className="text-xs text-on-surface-variant mb-1">رسالتي:</p>
                <p className="text-sm text-on-surface line-clamp-2">{app.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                {job?.salary && (
                  <span className="font-bold text-brand-amber">
                    {job.salary} {job.currency}
                    {job.salaryPeriod && job.salaryPeriod !== 'NEGOTIABLE'
                      ? `/${SALARY_PERIOD_LABELS[job.salaryPeriod] ?? job.salaryPeriod}`
                      : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {job && (
                  <Link
                    href={`/jobs/browse?id=${job.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-container-low text-primary hover:bg-surface-container transition-colors"
                  >
                    <ExternalLink size={12} />
                    عرض الإعلان
                  </Link>
                )}
                {app.status === 'PENDING' && (
                  <button
                    onClick={() => onWithdraw(app.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold',
                      'bg-surface text-on-surface-variant hover:bg-red-50 hover:text-error transition-colors active:scale-95'
                    )}
                  >
                    <RotateCcw size={12} />
                    {STRINGS.WITHDRAW}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
