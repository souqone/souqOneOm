'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Calendar, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import RatingBadges from '@/features/jobs/components/RatingBadges';
import { useDriver } from '@/lib/api/jobs';
import { LICENSE_TYPE_LABELS, STRINGS } from '@/features/jobs/constants';
import { getInitials, getAvatarColor, timeAgo, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-32 bg-surface-dim rounded-2xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-32 bg-surface-dim rounded-2xl" />
          <div className="h-24 bg-surface-dim rounded-2xl" />
        </div>
        <div className="h-48 bg-surface-dim rounded-2xl" />
      </div>
    </div>
  )
}

export default function DriverProfilePage() {
  const params = useParams()
  const id = params?.id as string

  const { data: driver, isLoading: loading, isError, refetch } = useDriver(id)

  if (loading) return <ProfileSkeleton />

  if (isError || !driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle size={40} className="text-error mx-auto mb-3" />
        <p className="font-bold text-on-surface mb-4">{STRINGS.ERROR_GENERIC ?? 'السائق غير موجود'}</p>
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

  const name = driver.user.displayName ?? driver.user.username

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">

      {/* Profile Header Banner */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-6 pt-8"
        style={{ background: 'linear-gradient(135deg, #0B2447 0%, #1a3a6b 100%)' }}
      >
        <div className="flex items-end gap-3">
          {driver.user.avatarUrl ? (
            <img
              src={driver.user.avatarUrl}
              alt={name}
              loading="lazy"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg shrink-0"
            />
          ) : (
            <div className={cn(
              'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white shadow-lg shrink-0',
              getAvatarColor(driver.userId)
            )}>
              {getInitials(name)}
            </div>
          )}
          <div className="flex-1 pb-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">{name}</h1>
              {driver.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                  <CheckCircle size={12} fill="currentColor" />
                  {STRINGS.VERIFIED}
                </span>
              )}
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
                driver.isAvailable
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-white/10 text-white/60 border border-white/20'
              )}>
                <span className={cn('w-1.5 h-1.5 rounded-full', driver.isAvailable ? 'bg-green-400' : 'bg-gray-400')} />
                {driver.isAvailable ? STRINGS.AVAILABLE : STRINGS.UNAVAILABLE}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 text-sm mt-1">
              <MapPin size={13} />
              <span>{resolveLocationLabel(driver.governorate) ?? driver.governorate}{driver.city ? ` · ${driver.city}` : ''}</span>
              <span className="text-white/40">·</span>
              <Calendar size={13} />
              <span>عضو منذ {timeAgo(driver.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="card-base rounded-2xl p-4 mb-6">
        <RatingBadges
          rating={driver.averageRating ?? 0}
          completionRate={undefined}
          responseTime={undefined}
          completedJobs={undefined}
          size="md"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Bio */}
          {driver.bio && (
            <div className="card-base rounded-2xl p-5">
              <h2 className="font-bold text-sm text-on-surface-variant mb-2">نبذة عن السائق</h2>
              <p className="text-sm text-on-surface leading-relaxed">{driver.bio}</p>
            </div>
          )}

          {/* License Types */}
          {driver.licenseTypes.length > 0 && (
            <div className="card-base rounded-2xl p-5">
              <h2 className="font-bold text-sm text-on-surface-variant mb-3">أنواع الرخص</h2>
              <div className="flex flex-wrap gap-2">
                {driver.licenseTypes.map(lt => (
                  <span
                    key={`license-${lt}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-surface-container text-primary"
                  >
                    🪪 {LICENSE_TYPE_LABELS[lt] ?? lt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Types */}
          {driver.vehicleTypes.length > 0 && (
            <div className="card-base rounded-2xl p-5">
              <h2 className="font-bold text-sm text-on-surface-variant mb-3">أنواع المركبات</h2>
              <div className="flex flex-wrap gap-2">
                {driver.vehicleTypes.map(vt => (
                  <span
                    key={`vehicle-${vt}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-surface text-on-surface border border-outline-variant"
                  >
                    🚛 {vt}
                  </span>
                ))}
              </div>
              {driver.hasOwnVehicle && (
                <p className="text-xs text-green-600 font-bold mt-2">✓ يمتلك مركبته الخاصة</p>
              )}
            </div>
          )}

          {/* Languages */}
          {driver.languages.length > 0 && (
            <div className="card-base rounded-2xl p-5">
              <h2 className="font-bold text-sm text-on-surface-variant mb-3">اللغات</h2>
              <div className="flex flex-wrap gap-2">
                {driver.languages.map(lang => (
                  <span
                    key={`lang-${lang}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold bg-surface text-on-surface border border-outline-variant"
                  >
                    🌐 {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="card-base rounded-2xl p-5">
            <h2 className="font-bold text-sm text-on-surface-variant mb-3">معلومات إضافية</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {driver.experienceYears != null && (
                <div>
                  <span className="text-on-surface-variant text-xs">سنوات الخبرة</span>
                  <p className="font-bold text-on-surface">{driver.experienceYears} سنة</p>
                </div>
              )}
              {driver.nationality && (
                <div>
                  <span className="text-on-surface-variant text-xs">الجنسية</span>
                  <p className="font-bold text-on-surface">{driver.nationality}</p>
                </div>
              )}
              <div>
                <span className="text-on-surface-variant text-xs">المحافظة</span>
                <p className="font-bold text-on-surface">{resolveLocationLabel(driver.governorate) ?? driver.governorate}{driver.city ? ` · ${driver.city}` : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar — 1/3 */}
        <div className="space-y-4">
          <div className="card-base rounded-2xl p-5 lg:sticky lg:top-24">
            <h2 className="font-bold text-sm text-on-surface mb-4">التواصل</h2>

            {driver.whatsapp && (
              <a
                href={`https://wa.me/${driver.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors mb-3"
              >
                <MessageCircle size={16} />
                واتساب
              </a>
            )}

            {driver.contactPhone && (
              <a
                href={`tel:${driver.contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-outline-variant hover:bg-surface text-on-surface font-bold text-sm transition-colors mb-3"
              >
                <Phone size={16} />
                {driver.contactPhone}
              </a>
            )}

            <Link
              href="/jobs/browse?jobType=HIRING"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-surface text-primary font-bold text-sm transition-colors"
            >
              دعوته للتقدم
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
