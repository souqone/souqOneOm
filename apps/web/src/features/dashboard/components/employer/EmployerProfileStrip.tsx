'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/image-utils';
import type { EmployerProfileItem } from '@/lib/api/jobs';

interface UserInfo {
  displayName?: string | null;
  username: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  governorate?: string | null;
}

interface EmployerProfileStripProps {
  profile: UserInfo;
  employerProfile: EmployerProfileItem;
}

export function EmployerProfileStrip({ profile, employerProfile }: EmployerProfileStripProps) {
  const tp = useTranslations('pages');
  const name = employerProfile.companyName || profile.displayName || profile.username;

  return (
    <div className="relative bg-gradient-to-bl from-primary via-[#1d4ed8] to-[#0B2447] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h30v30H0zm30 30h30v30H30z' fill='%23fff' fill-opacity='.5'/%3E%3C/svg%3E\")",
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 px-4 pt-5 pb-8 flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-2xl bg-on-primary/20 border border-on-primary/20 flex items-center justify-center text-on-primary font-semibold text-2xl backdrop-blur-sm overflow-hidden flex-shrink-0">
          {profile.avatarUrl ? (
            <Image
              src={getImageUrl(profile.avatarUrl) ?? ''}
              alt={name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            name[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-on-primary font-semibold text-[15px] leading-tight">{name}</p>
            {profile.isVerified && (
              <span className="bg-on-primary/20 text-on-primary/90 text-[9px] font-bold px-2 py-0.5 rounded-full border border-on-primary/20">
                {tp('verified')} ✓
              </span>
            )}
          </div>
          <p className="text-on-primary/60 text-[11px] mt-0.5">
            {[employerProfile.industry, profile.governorate].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}
