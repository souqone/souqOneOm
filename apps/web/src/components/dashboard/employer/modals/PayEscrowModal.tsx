'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePayForApplication } from '@/lib/api/jobs';
import { Button } from '@/components/ui/button';
import type { EmployerApplicationItem } from '@/lib/api/jobs';

interface PayEscrowModalProps {
  app: EmployerApplicationItem | null;
  onClose: () => void;
}

export function PayEscrowModal({ app, onClose }: PayEscrowModalProps) {
  const tp = useTranslations('pages');
  const payMutation = usePayForApplication();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (app) setAmount(0);
  }, [app]);

  if (!app) return null;

  const applicantName = app.applicant.displayName || app.applicant.username;

  const handlePay = async () => {
    if (amount <= 0) return;
    await payMutation.mutateAsync({ applicationId: app.id, amount });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl border border-outline-variant/15 p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="mb-4">
          <h2 className="font-semibold text-on-surface text-lg">{tp('payEscrowTitle')}</h2>
          <p className="text-on-surface-variant/70 text-sm mt-1">{tp('payEscrowDesc', { name: applicantName })}</p>
        </div>

        {/* Amount input */}
        <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-4 text-center my-4">
          <p className="text-[11px] text-primary/60 mb-1">{tp('amountOMR')}</p>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="w-full text-center text-3xl font-black text-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            min={0}
            step={0.001}
            placeholder="0"
          />
          <p className="text-[10px] text-primary/40 mt-1">{tp('escrowExplainer')}</p>
        </div>

        {/* Safety note */}
        <div className="flex items-start gap-2 text-[11px] text-on-surface-variant/60 mb-4">
          <span className="material-symbols-outlined text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <p>{tp('escrowSafetyNote')}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handlePay}
            disabled={payMutation.isPending || amount <= 0}
            className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold text-[13px] shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {payMutation.isPending && (
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            )}
            {tp('confirmPayment')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full h-10 rounded-2xl text-on-surface-variant text-sm"
          >
            {tp('cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
