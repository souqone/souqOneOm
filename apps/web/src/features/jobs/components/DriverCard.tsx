'use client';
import React from 'react';
import Link from 'next/link';
import { MapPin, CheckCircle } from 'lucide-react';
import type { DriverProfile } from '../types';
import { LICENSE_TYPE_LABELS } from '../constants';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';
import RatingBadges from './RatingBadges';

interface DriverCardProps {
  driver: DriverProfile
}

export default function DriverCard({ driver }: DriverCardProps) {
  const name = driver.user.displayName ?? driver.user.username

  return (
    <div className="card-base rounded-2xl p-4 hover:shadow-card-hover hover:border-outline transition-all duration-200">
      {/* Top row: avatar + name + badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {driver.user.avatarUrl ? (
            <img
              src={driver.user.avatarUrl}
              alt={name}
              loading="lazy"
              className="w-12 h-12 rounded-full object-cover border-2 border-outline-variant"
            />
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
              getAvatarColor(driver.userId)
            )}>
              {getInitials(name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-on-surface">{name}</span>
              {driver.isVerified && (
                <CheckCircle size={14} className="text-primary shrink-0" fill="currentColor" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-0.5">
              <MapPin size={11} />
              <span>{resolveLocationLabel(driver.governorate) ?? driver.governorate}{driver.city ? ` · ${driver.city}` : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
            driver.isAvailable
              ? 'bg-green-50 text-green-700 border border-green-200' :'bg-surface-container text-on-surface-variant border border-outline-variant'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              driver.isAvailable ? 'bg-green-500' : 'bg-gray-400'
            )} />
            {driver.isAvailable ? 'متاح الآن' : 'غير متاح'}
          </span>
        </div>
      </div>

      {/* Rating badges */}
      <div className="mb-3">
        <RatingBadges
          rating={driver.averageRating}
          completionRate={driver.completionRate}
          responseTime={driver.responseTimeHours}
          completedJobs={driver.completedJobs}
          size="sm"
        />
      </div>

      {/* License chips */}
      {driver.licenseTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {driver.licenseTypes.map(lt => (
            <span
              key={`license-${driver.id}-${lt}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-surface-container text-primary"
            >
              🪪 {LICENSE_TYPE_LABELS[lt] ?? lt}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/jobs/drivers/${driver.id}`}
        className="block w-full text-center btn-outline text-sm py-2 rounded-xl font-bold hover:bg-surface-container transition-colors"
      >
        عرض الملف الشخصي
      </Link>
    </div>
  )
}
