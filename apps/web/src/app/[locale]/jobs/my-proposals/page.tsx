'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMyApplications, useWithdrawApplication } from '@/lib/api';
import { resolveLocationLabel } from '@/lib/location-data';
import { timeAgo, cn } from '@/lib/utils';
import { STRINGS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/features/jobs/constants';
import JobEmptyState from '@/features/jobs/components/JobEmptyState';

const STATUS_TABS = [
  { value: 'all', label: 'الكل' },
  { value: 'PENDING',   label: APPLICATION_STATUS_LABELS['PENDING'] },
  { value: 'ACCEPTED',  label: APPLICATION_STATUS_LABELS['ACCEPTED'] },
  { value: 'REJECTED',  label: APPLICATION_STATUS_LABELS['REJECTED'] },
  { value: 'WITHDRAWN', label: APPLICATION_STATUS_LABELS['WITHDRAWN'] },
];

function MyProposalsContent() {
  const { data: applications, isLoading, isError, refetch } = useMyApplications();
  const withdrawMutation = useWithdrawApplication();
  const [statusFilter, setStatusFilter] = useState('all');

  const items = applications ?? [];
  const filtered = statusFilter === 'all'
    ? items
    : items.filter((a) => a.status === statusFilter);

  const totalCount = items.length;
  const acceptedCount = items.filter((a) => a.status === 'ACCEPTED').length;
  const pendingCount = items.filter((a) => a.status === 'PENDING').length;

  async function handleWithdraw(appId: string) {
    if (!confirm('هل تريد سحب هذا العرض؟')) return;
    await withdrawMutation.mutateAsync(appId);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-on-surface">{STRINGS.MY_PROPOSALS}</h1>
          <p className="text-sm text-on-surface-variant mt-1">متابعة عروضك المقدمة على الوظائف</p>
        </div>

        {/* Stats Row */}
        {!isLoading && !isError && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {[
              { label: 'عروض مقدمة', value: totalCount, color: 'text-primary' },
              { label: 'مقبولة', value: acceptedCount, color: 'text-green-600' },
              { label: 'بانتظار الرد', value: pendingCount, color: 'text-amber-500' },
            ].map((stat) => (
              <div key={stat.label} className="card-base rounded-2xl p-4 text-center">
                <span className={`text-2xl font-extrabold font-tabular ${stat.color}`}>{stat.value}</span>
                <p className="text-xs text-on-surface-variant mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-surface rounded-xl p-1 mb-6 w-fit overflow-x-auto max-w-full">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150',
                statusFilter === tab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (<>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-base rounded-2xl p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-2/3 bg-surface-dim rounded-xl" />
                  <div className="h-5 w-16 bg-surface-dim rounded-full" />
                </div>
                <div className="h-4 w-1/3 bg-surface-dim rounded-xl mb-3" />
                <div className="h-4 w-full bg-surface-dim rounded-xl" />
              </div>
            ))}
          </div>
          </>
        ) : isError ? (
          <div className="card-base rounded-2xl p-6 text-center mb-6">
            <AlertCircle size={32} className="text-error mx-auto mb-3" />
            <p className="text-sm font-bold text-on-surface mb-2">{STRINGS.ERROR_GENERIC}</p>
            <button onClick={() => refetch()} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline mx-auto">
              <RefreshCw size={14} />
              إعادة المحاولة
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <JobEmptyState
            title={STRINGS.EMPTY_PROPOSALS}
            description="تصفّح الوظائف المتاحة وقدّم عروضك."
            ctaLabel="تصفّح الوظائف"
            ctaHref="/jobs/browse"
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const statusColor = APPLICATION_STATUS_COLORS[app.status] ?? '#6b7280';
              const statusLabel = APPLICATION_STATUS_LABELS[app.status] ?? app.status;
              return (
                <div key={app.id} className="card-base rounded-2xl p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-sm text-on-surface">{app.job.title}</h3>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Employer + Location */}
                  <p className="text-xs text-on-surface-variant mb-2">
                    {app.job.user?.displayName || app.job.user?.username || ''}
                    {app.job.governorate ? ` · ${resolveLocationLabel(app.job.governorate) ?? app.job.governorate}` : ''}
                    <span className="text-outline mx-1">·</span>
                    {timeAgo(app.createdAt)}
                  </p>

                  {/* Message preview */}
                  {app.message && (
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
                      رسالتي: &ldquo;{app.message}&rdquo;
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/jobs/${app.jobId}`} className="text-xs font-bold text-primary hover:underline">
                      عرض الإعلان
                    </Link>
                    {app.status === 'PENDING' && (
                      <button
                        onClick={() => handleWithdraw(app.id)}
                        disabled={withdrawMutation.isPending}
                        className="text-xs font-bold text-error hover:underline disabled:opacity-50"
                      >
                        سحب العرض
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

export default function MyProposalsPage() {
  return (
    <JobsPageGuard role="driver">
      <MyProposalsContent />
    </JobsPageGuard>
  );
}
