'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { MapPin, CheckCircle, Truck, Star } from 'lucide-react';
import type { CarrierProfile } from '../types';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import { resolveLocationLabel } from '@/lib/location-data';
import { VEHICLE_TYPE_LABELS } from '../constants';
import { useTranslations } from 'next-intl';

interface CarrierCardProps {
  carrier: CarrierProfile;
}

export default function CarrierCard({ carrier }: CarrierCardProps) {
  const t = useTranslations('transport');
  const name = carrier.companyName || carrier.user.displayName || carrier.user.username || 'ناقل';

  return (
    <div className="card-base rounded-2xl p-4 hover:shadow-card-hover hover:border-[var(--color-brand-navy)]/30 transition-all duration-200 border border-[var(--color-outline)]" dir="rtl">
      {/* Top row: avatar + name + badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {carrier.user.avatarUrl ? (
            <img
              src={carrier.user.avatarUrl}
              alt={name}
              loading="lazy"
              className="w-12 h-12 rounded-full object-cover border-2 border-[var(--color-outline-variant)]"
            />
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0',
              getAvatarColor(carrier.userId)
            )}>
              {getInitials(name)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[var(--color-on-surface)]">{name}</span>
              {carrier.isVerified && (
                <CheckCircle size={14} className="text-[var(--color-brand-navy)] shrink-0" fill="currentColor" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              <MapPin size={11} />
              <span>{resolveLocationLabel(carrier.governorate) ?? carrier.governorate}{carrier.city ? ` · ${carrier.city}` : ''}</span>
            </div>
          </div>
        </div>
        
        {/* Availability Badge */}
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
            carrier.isAvailable
              ? 'bg-[var(--color-brand-green-light)] text-green-800 border border-green-200' 
              : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)]'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              carrier.isAvailable ? 'bg-green-600' : 'bg-gray-400'
            )} />
            {carrier.isAvailable ? t('status.AVAILABLE') : t('status.UNAVAILABLE')}
          </span>
        </div>
      </div>

      {/* Stats / Rating */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-[var(--color-brand-amber)]" fill="currentColor" />
          <span className="text-sm font-bold text-[var(--color-on-surface)]">{carrier.averageRating > 0 ? carrier.averageRating.toFixed(1) : t('noRating')}</span>
          <span className="text-xs text-[var(--color-on-surface-muted)]">({carrier.reviewCount})</span>
        </div>
        <div className="w-px h-4 bg-[var(--color-outline)]" />
        <div className="flex items-center gap-1.5">
          <Truck size={14} className="text-[var(--color-brand-navy)]" />
          <span className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
            {carrier.completedTrips} {t('tripsCompleted')}
          </span>
        </div>
      </div>

      {/* Vehicles Tags */}
      {carrier.vehicleTypes && carrier.vehicleTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {carrier.vehicleTypes.slice(0, 3).map(vt => (
            <span
              key={`vehicle-${carrier.id}-${vt}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-brand-navy)]/5 text-[var(--color-brand-navy)] border border-[var(--color-brand-navy)]/10"
            >
              {VEHICLE_TYPE_LABELS[vt] ?? vt}
            </span>
          ))}
          {carrier.vehicleTypes.length > 3 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
              +{carrier.vehicleTypes.length - 3}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`/transport/carriers/${carrier.id}`}
        className="block w-full text-center text-sm py-2 rounded-xl font-bold transition-colors bg-[var(--color-brand-navy)] text-white hover:bg-[var(--color-brand-navy)]/90"
      >
        {t('viewProfile')}
      </Link>
    </div>
  );
}
