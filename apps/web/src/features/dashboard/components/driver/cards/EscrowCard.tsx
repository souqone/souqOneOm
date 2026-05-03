'use client';

import { useTranslations } from 'next-intl';
import { ESCROW_STATUS_CONFIG } from '@/lib/constants/jobs';
import { Button } from '@/components/ui/button';
import type { EscrowItem } from '@/lib/api/jobs';

interface EscrowCardProps {
  escrow: EscrowItem;
  onDispute: (escrowId: string) => void;
}

export function EscrowCard({ escrow, onDispute }: EscrowCardProps) {
  const tp = useTranslations('pages');
  const cfg = ESCROW_STATUS_CONFIG[escrow.status] ?? ESCROW_STATUS_CONFIG.HELD;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDispute(escrow.id)}
          className="w-full h-9 rounded-xl mt-2 border-error/20 text-error text-[11px] hover:bg-error/5"
        >
          {tp('openDispute')}
        </Button>
      )}
    </div>
  );
}
