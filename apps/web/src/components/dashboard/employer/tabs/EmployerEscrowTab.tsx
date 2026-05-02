'use client';

import { useTranslations } from 'next-intl';
import { EscrowManagementCard } from '../cards/EscrowManagementCard';
import { NoEscrowState } from '../empty/NoEscrowState';
import type { EscrowItem } from '@/lib/api/jobs';

interface EmployerEscrowTabProps {
  escrows: EscrowItem[];
  isLoading: boolean;
  onRelease: (escrowId: string) => void;
  onDispute: (escrowId: string) => void;
}

export function EmployerEscrowTab({ escrows, isLoading, onRelease, onDispute }: EmployerEscrowTabProps) {
  const tp = useTranslations('pages');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 space-y-3" aria-hidden>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-surface-container-high animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 rounded-full bg-surface-container-high animate-pulse" />
                  <div className="h-2.5 w-16 rounded-full bg-surface-container-high animate-pulse" />
                </div>
              </div>
              <div className="h-5 w-14 rounded-full bg-surface-container-high animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return <NoEscrowState />;
  }

  const held = escrows.filter((e) => e.status === 'HELD');
  const others = escrows.filter((e) => e.status !== 'HELD');

  return (
    <div className="space-y-4">
      {held.length > 0 && (
        <div>
          <h3 className="font-semibold text-on-surface text-[13px] mb-2">{tp('escrowHeldLabel')}</h3>
          <div className="space-y-3">
            {held.map((e) => <EscrowManagementCard key={e.id} escrow={e} onRelease={onRelease} onDispute={onDispute} />)}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <h3 className="font-semibold text-on-surface text-[13px] mb-2">{tp('escrowHistory')}</h3>
          <div className="space-y-3">
            {others.map((e) => <EscrowManagementCard key={e.id} escrow={e} onRelease={onRelease} onDispute={onDispute} />)}
          </div>
        </div>
      )}
    </div>
  );
}
