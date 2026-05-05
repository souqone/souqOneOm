'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { APP_STATUS_CONFIG, LICENSE_TYPE_CONFIG } from '@/lib/constants/jobs';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/image-utils';
import type { EmployerApplicationItem } from '@/lib/api/jobs';

interface ApplicantCardProps {
  app: EmployerApplicationItem;
  onUpdateStatus: (appId: string, status: 'ACCEPTED' | 'REJECTED') => void;
  isUpdating: boolean;
}

export function ApplicantCard({ app, onUpdateStatus, isUpdating }: ApplicantCardProps) {
  const tp = useTranslations('pages');
  const router = useRouter();
  const applicant = app.applicant;
  const name = applicant.displayName || applicant.username;
  const statusCfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.PENDING;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      {/* Applicant header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-[#0B2447] flex items-center justify-center text-on-primary font-semibold text-base overflow-hidden">
            {applicant.avatarUrl ? (
              <Image src={getImageUrl(applicant.avatarUrl) ?? ''} alt={name} fill className="object-cover" sizes="44px" />
            ) : (
              name[0]?.toUpperCase()
            )}
          </div>
          {app.driverProfile?.isVerified && (
            <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-[13px]">{name}</span>
            {(applicant.averageRating ?? 0) >= 4.5 && (
              <span className="text-yellow-500 text-[11px] font-bold">⭐ {applicant.averageRating}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {app.driverProfile?.licenseTypes.map((l) => {
              const cfg = LICENSE_TYPE_CONFIG[l];
              return (
                <span key={l} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                  {cfg ? tp(cfg.labelKey) : l}
                </span>
              );
            })}
            {(app.driverProfile?.experienceYears ?? 0) > 0 && (
              <span className="text-[10px] text-on-surface-variant/50">{app.driverProfile?.experienceYears}+ {tp('yearsExp')}</span>
            )}
            {applicant.governorate && (
              <span className="text-[10px] text-on-surface-variant/50">· {applicant.governorate}</span>
            )}
          </div>
        </div>

        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusCfg.color}`}>
          {tp(statusCfg.labelKey)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {app.status === 'PENDING' && (
          <>
            <Button onClick={() => onUpdateStatus(app.id, 'ACCEPTED')} disabled={isUpdating} size="sm"
              className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-[11px] font-bold shadow-sm shadow-primary/20 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-base">check</span>
              {tp('accept')}
            </Button>
            <Button variant="outline" onClick={() => onUpdateStatus(app.id, 'REJECTED')} disabled={isUpdating} size="sm"
              className="flex-1 h-11 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px] hover:text-error hover:border-error/20 hover:bg-error/5 transition-all">
              {tp('reject')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/messages?user=${applicant.id}`)}
              className="w-11 h-11 rounded-xl border-outline-variant/20 text-on-surface-variant">
              <span className="material-symbols-outlined text-base">chat</span>
            </Button>
          </>
        )}

        {app.status === 'ACCEPTED' && (
          <Button variant="outline" size="sm" onClick={() => router.push(`/messages?user=${applicant.id}`)}
            className="flex-1 h-11 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]">
            <span className="material-symbols-outlined text-base">chat</span>
            {tp('message') || 'مراسلة'}
          </Button>
        )}

        {app.driverProfile && (
          <Button variant="outline" size="sm" href={`/jobs/drivers/${app.driverProfile.id}`}
            className="w-11 h-11 rounded-xl text-on-surface-variant/40 hover:text-on-surface-variant border-outline-variant/15">
            <span className="material-symbols-outlined text-base">person</span>
          </Button>
        )}
      </div>
    </div>
  );
}
