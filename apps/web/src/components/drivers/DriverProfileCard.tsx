'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { getImageUrl } from '@/lib/image-utils';
import { resolveLocationLabel } from '@/lib/location-data';
import { LICENSE_TYPE_CONFIG } from '@/lib/constants/jobs';
import { useInviteDriver } from '@/lib/api/jobs';
import { Button } from '@/components/ui/button';
import type { DriverProfileItem, JobItem } from '@/lib/api/jobs';

interface DriverProfileCardProps {
  profile: DriverProfileItem;
  variant?: 'default' | 'invite';
  activeJobs?: Pick<JobItem, 'id' | 'title'>[];
  selectedJobId?: string;
  onJobSelect?: (jobId: string) => void;
  onInvited?: (driverId: string) => void;
}

export function DriverProfileCard({
  profile,
  variant = 'default',
  activeJobs = [],
  selectedJobId,
  onJobSelect,
  onInvited,
}: DriverProfileCardProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const router = useRouter();
  const inviteMutation = useInviteDriver();
  const [localJob, setLocalJob] = useState(selectedJobId ?? '');

  const name = profile.user.displayName || profile.user.username;
  const jobId = selectedJobId ?? localJob;

  const handleInvite = () => {
    if (!jobId) return;
    inviteMutation.mutate(
      { jobId, driverId: profile.id },
      { onSuccess: () => onInvited?.(profile.id) },
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-[#0B2447] flex items-center justify-center text-on-primary font-semibold text-base overflow-hidden">
            {profile.user.avatarUrl ? (
              <Image
                src={getImageUrl(profile.user.avatarUrl) ?? ''}
                alt={name}
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              name[0]?.toUpperCase()
            )}
          </div>
          {profile.isVerified && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-[13px]">{name}</span>
            {(profile.averageRating ?? 0) >= 4.5 && (
              <span className="text-yellow-500 text-[11px] font-bold">⭐ {profile.averageRating}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {profile.licenseTypes.map((l) => {
              const cfg = LICENSE_TYPE_CONFIG[l];
              return (
                <span key={l} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                  {cfg ? tp(cfg.labelKey) : l}
                </span>
              );
            })}
            {(profile.experienceYears ?? 0) > 0 && (
              <span className="text-[10px] text-on-surface-variant/50">{profile.experienceYears}+ {tp('yearsExp')}</span>
            )}
            <span className="text-[10px] text-on-surface-variant/50">· {resolveLocationLabel(profile.governorate, locale) || profile.governorate}</span>
          </div>
        </div>

        {!profile.isAvailable && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/20 flex-shrink-0">
            {tp('driverUnavailable')}
          </span>
        )}
      </div>

      {/* Actions */}
      {variant === 'invite' ? (
        <div className="flex gap-2 mt-2">
          <select
            value={jobId}
            onChange={(e) => {
              setLocalJob(e.target.value);
              onJobSelect?.(e.target.value);
            }}
            className="flex-1 h-9 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[11px] px-2 text-on-surface focus:border-primary focus:outline-none"
          >
            <option value="">{tp('selectJob')}</option>
            {activeJobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
          <Button
            onClick={handleInvite}
            disabled={!jobId || inviteMutation.isPending}
            size="sm"
            className="h-9 px-4 rounded-xl bg-primary text-on-primary text-[11px] font-semibold shadow-sm shadow-primary/20 flex-shrink-0"
          >
            {tp('invite')}
          </Button>
          <Button
            onClick={() => router.push(`/jobs/drivers/${profile.id}`)}
            variant="outline"
            size="sm"
            className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">person</span>
          </Button>
        </div>
      ) : (
        <Button
          href={`/jobs/drivers/${profile.id}`}
          variant="outline"
          size="sm"
          className="w-full h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]"
        >
          {tp('viewProfile')}
        </Button>
      )}
    </div>
  );
}
