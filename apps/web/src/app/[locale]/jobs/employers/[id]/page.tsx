'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Calendar, Star, Briefcase, AlertCircle, RefreshCw } from 'lucide-react';
import JobCard from '@/features/jobs/components/JobCard';
import { useEmployer, useJobs } from '@/lib/api/jobs';
import { STRINGS } from '@/features/jobs/constants';
import { getInitials, getAvatarColor, timeAgo, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';
import type { DriverJob } from '@/features/jobs/types';

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-32 bg-surface-dim rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-32 bg-surface-dim rounded-2xl" />
        </div>
        <div className="h-48 bg-surface-dim rounded-2xl" />
      </div>
    </div>
  )
}

export default function EmployerProfilePage() {
  const params = useParams()
  const id = params?.id as string

  const { data: employer, isLoading: loading, isError, refetch } = useEmployer(id)
  const { data: jobsData } = useJobs(
    employer ? { userId: employer.userId, limit: '3' } : {},
    !!employer
  )

  const recentJobs = (jobsData?.items ?? []).map(j => ({
    id: j.id,
    userId: j.user?.id ?? '',
    user: { id: j.user?.id ?? '', username: j.user?.username ?? '', displayName: j.user?.displayName ?? undefined, avatarUrl: j.user?.avatarUrl ?? undefined, isVerified: j.user?.isVerified ?? false },
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
    languages: j.languages,
    vehicleTypes: j.vehicleTypes,
    hasOwnVehicle: j.hasOwnVehicle,
    governorate: j.governorate,
    city: j.city ?? undefined,
    status: j.status as any,
    viewCount: j.viewCount,
    _count: { applications: j._count?.applications ?? 0 },
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  }) as DriverJob)

  if (loading) return <ProfileSkeleton />

  if (isError || !employer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle size={40} className="text-error mx-auto mb-3" />
        <p className="font-bold text-on-surface mb-4">{STRINGS.ERROR_GENERIC ?? 'صاحب العمل غير موجود'}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm font-bold text-primary hover:underline mx-auto"
        >
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const name = employer.companyName ?? employer.user.displayName ?? employer.user.username

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">

      {/* Profile Header Banner */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-6 pt-8"
        style={{ background: 'linear-gradient(135deg, #0B2447 0%, #1a3a6b 100%)' }}
      >
        <div className="flex items-end gap-3">
          <div className={cn(
            'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white shadow-lg shrink-0',
            getAvatarColor(employer.userId)
          )}>
            {getInitials(name)}
          </div>
          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">{name}</h1>
              {employer.user.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  ✓ {STRINGS.VERIFIED}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm mt-1 flex-wrap">
              {employer.industry && (
                <span className="flex items-center gap-1">
                  <Briefcase size={13} />
                  {employer.industry}
                </span>
              )}
              {employer.companySize && (
                <span>{employer.companySize} موظف</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {resolveLocationLabel(employer.governorate) ?? employer.governorate}{employer.city ? ` · ${employer.city}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                عضو منذ {timeAgo(employer.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="card-base rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm font-bold text-amber-500">
            <Star size={16} fill="currentColor" />
            {(employer.averageRating ?? 0).toFixed(1)} ({employer.reviewCount} {STRINGS.REVIEWS})
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant">
            <Briefcase size={16} />
            {recentJobs.length}+ إعلان منشور
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Bio */}
          {employer.bio && (
            <div className="card-base rounded-2xl p-5">
              <h2 className="font-bold text-sm text-on-surface-variant mb-2">نبذة عن الشركة</h2>
              <p className="text-sm text-on-surface leading-relaxed">{employer.bio}</p>
            </div>
          )}

          {/* Recent Jobs */}
          {recentJobs.length > 0 && (
            <div>
              <h2 className="font-bold text-base text-on-surface mb-3">أحدث الإعلانات</h2>
              <div className="space-y-3">
                {recentJobs.map(job => (
                  <JobCard key={`emp-job-${job.id}`} job={job} />
                ))}
              </div>
              <Link
                href="/jobs/browse"
                className="block text-center text-sm font-bold text-primary hover:underline mt-3"
              >
                عرض جميع الإعلانات
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="card-base rounded-2xl p-5 lg:sticky lg:top-24">
            <h2 className="font-bold text-sm text-on-surface mb-4">التواصل</h2>

            {employer.whatsapp && (
              <a
                href={`https://wa.me/${employer.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors mb-3"
              >
                <MessageCircle size={16} />
                واتساب
              </a>
            )}

            {employer.contactPhone && (
              <a
                href={`tel:${employer.contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-outline-variant hover:bg-surface text-on-surface font-bold text-sm transition-colors"
              >
                <Phone size={16} />
                {employer.contactPhone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
