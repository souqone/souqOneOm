'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getImageUrl } from '@/lib/image-utils';
import { LICENSE_TYPE_CONFIG } from '@/lib/constants/jobs';
import type { DriverProfileItem } from '@/lib/api/jobs';

interface UserInfo {
  displayName?: string | null;
  username: string;
  avatarUrl?: string | null;
}

interface DriverProfileStripProps {
  profile: UserInfo;
  driverProfile: DriverProfileItem;
}

export function DriverProfileStrip({ profile, driverProfile }: DriverProfileStripProps) {
  const tp = useTranslations('pages');
  const name = profile.displayName || profile.username;

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
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="relative w-14 h-14 rounded-2xl bg-white/20 border border-white/20 backdrop-blur-sm flex items-center justify-center text-on-primary font-semibold text-2xl overflow-hidden">
            {profile.avatarUrl ? (
              <Image
                src={getImageUrl(profile.avatarUrl) || ''}
                alt={name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              name[0]?.toUpperCase()
            )}
          </div>
          <div
            className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-[#0B2447]
              ${driverProfile.isAvailable ? 'bg-green-400' : 'bg-on-surface-variant/40'}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-on-primary font-semibold text-[15px] leading-tight">{name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {driverProfile.licenseTypes.map((l) => {
              const cfg = LICENSE_TYPE_CONFIG[l];
              return (
                <span
                  key={l}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-on-primary/15 text-on-primary/90 backdrop-blur-sm border border-on-primary/10"
                >
                  {cfg ? tp(cfg.labelKey) : l}
                </span>
              );
            })}
            <span className="text-on-primary/50 text-[10px]">
              ⭐ {driverProfile.averageRating ?? 0} ({driverProfile.reviewCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
