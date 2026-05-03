'use client';

import { useTranslations } from 'next-intl';
import { InviteCard } from '../cards/InviteCard';
import { InviteCardSkeleton } from '../cards/InviteCardSkeleton';
import { DriverEmptyState } from '../empty/DriverEmptyState';
import type { JobInviteItem } from '@/lib/api/jobs';

interface DriverInvitesTabProps {
  invites: JobInviteItem[];
  isLoading: boolean;
  onRespond: (inviteId: string, status: 'ACCEPTED' | 'DECLINED') => void;
  isResponding: boolean;
}

export function DriverInvitesTab({ invites, isLoading, onRespond, isResponding }: DriverInvitesTabProps) {
  const tp = useTranslations('pages');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <InviteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <DriverEmptyState
        icon="mail_off"
        title={tp('noInvitesTitle')}
        desc={tp('noInvitesDesc')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((inv) => (
        <InviteCard key={inv.id} inv={inv} onRespond={onRespond} isResponding={isResponding} />
      ))}
    </div>
  );
}
