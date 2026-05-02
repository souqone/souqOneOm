'use client';

import { useTranslations } from 'next-intl';
import { EscrowCard } from '../cards/EscrowCard';
import { DriverEmptyState } from '../empty/DriverEmptyState';
import type { EscrowItem } from '@/lib/api/jobs';

interface DriverEscrowTabProps {
  escrows: EscrowItem[];
  isLoading: boolean;
  onDispute: (escrowId: string) => void;
}

export function DriverEscrowTab({ escrows, isLoading, onDispute }: DriverEscrowTabProps) {
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
    return (
      <DriverEmptyState
        icon="payments"
        title={tp('noEscrowTitle')}
        desc={tp('noEscrowDesc')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {escrows.map((escrow) => (
        <EscrowCard key={escrow.id} escrow={escrow} onDispute={onDispute} />
      ))}
    </div>
  );
}
