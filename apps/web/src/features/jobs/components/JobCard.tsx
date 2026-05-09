'use client';
import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, Eye } from 'lucide-react';
import type { DriverJob } from '../types';
import {
  LICENSE_TYPE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  NATIONALITY_LABELS,
  STRINGS,
} from '../constants';
import { timeAgo, formatSalary, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';
import RatingBadges from './RatingBadges';

interface JobCardProps {
  job: DriverJob
}

export default function JobCard({ job }: JobCardProps) {
  const isHiring = job.jobType === 'HIRING'
  const poster = isHiring
    ? (job.employerProfile?.companyName ?? job.user.displayName ?? job.user.username)
    : (job.driverProfile?.user.displayName ?? job.user.displayName ?? job.user.username)

  const statusColor = JOB_STATUS_COLORS[job.status] ?? '#6b7280'
  const statusLabel = JOB_STATUS_LABELS[job.status] ?? job.status

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block group card-base hover:shadow-card-hover hover:border-outline transition-all duration-200 rounded-2xl overflow-hidden h-full"
    >
      <div className="p-4">
        {/* Top row: type badge + status */}
        <div className="flex items-center justify-between mb-3">
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

        {/* Title */}
        <h3 className="font-bold text-base text-on-surface line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {job.title}
        </h3>

        {/* Poster + Location */}
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mb-2">
          <div className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0',
            getAvatarColor(job.userId)
          )}>
            {getInitials(poster)}
          </div>
          <span className="truncate font-bold text-on-surface">{poster}</span>
          <span className="text-outline">·</span>
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{resolveLocationLabel(job.governorate) ?? job.governorate}{job.city ? ` · ${job.city}` : ''}</span>
        </div>

        {/* Rating badges for OFFERING jobs */}
        {!isHiring && job.driverProfile && (
          <div className="mb-2">
            <RatingBadges
              rating={job.driverProfile.averageRating}
              completionRate={job.driverProfile.completionRate}
              responseTime={job.driverProfile.responseTimeHours}
              completedJobs={job.driverProfile.completedJobs}
              size="sm"
            />
          </div>
        )}

        {/* Description preview */}
        <p className="text-sm text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
          {job.description}
        </p>

        {/* Divider */}
        <div className="border-t border-outline-variant mb-3" />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.licenseTypes.slice(0, 2).map(lt => (
            <span
              key={`tag-license-${job.id}-${lt}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-container text-primary"
            >
              🪪 {LICENSE_TYPE_LABELS[lt] ?? lt}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface text-on-surface-variant">
            <Clock size={10} />
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
          </span>
          {job.nationality && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface text-on-surface-variant">
              🌍 {NATIONALITY_LABELS[job.nationality!] ?? job.nationality}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-outline-variant mb-3" />

        {/* Bottom row: stats + salary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {STRINGS.APPLICATIONS_COUNT(job._count.applications)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {job.viewCount}
            </span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
          <span className="text-sm font-bold text-brand-amber font-tabular">
            {formatSalary(job.salary, job.salaryPeriod, job.currency)}
          </span>
        </div>
      </div>
    </Link>
  )
}
