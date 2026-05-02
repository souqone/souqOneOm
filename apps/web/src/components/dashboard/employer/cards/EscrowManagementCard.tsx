'use client';

import { useTranslations } from 'next-intl';
import { ESCROW_STATUS_CONFIG } from '@/lib/constants/jobs';
import { Button } from '@/components/ui/button';
import type { EscrowItem } from '@/lib/api/jobs';

interface EscrowManagementCardProps {
  escrow: EscrowItem;
  onRelease: (escrowId: string) => void;
  onDispute: (escrowId: string) => void;
}

export function EscrowManagementCard({ escrow, onRelease, onDispute }: EscrowManagementCardProps) {
  const tp = useTranslations('pages');
  const cfg = ESCROW_STATUS_CONFIG[escrow.status] ?? ESCROW_STATUS_CONFIG.HELD;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {cfg.icon}
          </span>
          <div>
            <p className="font-semibold text-on-surface text-[14px]">
              {Number(escrow.amount).toLocaleString('ar-OM')} {tp('currencyOMR')}
            </p>
            <p className="text-[10px] text-on-surface-variant/50 mt-0.5">
              {new Date(escrow.createdAt).toLocaleDateString('ar-OM')}
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.color}`}>
          {tp(cfg.labelKey)}
        </span>
      </div>

      {escrow.status === 'HELD' && (
        <div className="flex gap-2">
          <Button onClick={() => onRelease(escrow.id)} size="sm"
            className="flex-1 h-9 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold hover:bg-green-100">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {tp('releaseEscrow')}
          </Button>
          <Button variant="outline" onClick={() => onDispute(escrow.id)} size="sm"
            className="flex-1 h-9 rounded-xl border-error/20 text-error text-[11px] hover:bg-error/5">
            {tp('openDispute')}
          </Button>
        </div>
      )}
    </div>
  );
}
