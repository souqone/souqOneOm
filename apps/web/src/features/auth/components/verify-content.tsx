'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/toast';
import { apiRequest } from '@/lib/auth';
import { OtpInput } from './otp-input';

export default function VerifyEmailContent() {
  const { user, isAuthenticated } = useAuth();
  const { close, executePending } = useAuthModal();
  const t = useTranslations('auth');
  const { addToast } = useToast();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await apiRequest('/auth/resend-verification', { method: 'POST' });
      addToast('success', t('newCodeSent'));
      setCountdown(60);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('resendError'));
    } finally {
      setResending(false);
    }
  }, [addToast, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      addToast('warning', t('enter6Digits'));
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ code: fullCode }),
      });
      addToast('success', t('emailVerified'));
      executePending();
      close();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : t('codeInvalid'));
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-2xl">mark_email_read</span>
        </div>
        <p className="text-on-surface-variant text-sm">
          {t('weSentCode')}
        </p>
        <p className="text-on-surface font-bold text-sm mt-1">{user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <OtpInput value={code} onChange={setCode} disabled={loading} />

        <button
          type="submit"
          disabled={loading || code.join('').length !== 6}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl hover:brightness-110 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              {t('verifying')}
            </>
          ) : (
            t('confirm')
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-on-surface-variant">
        {t('didntReceiveCode')}{' '}
        {countdown > 0 ? (
          <span className="text-on-surface-variant/60 font-medium">
            {t('resendAfter', { countdown })}
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary font-bold hover:underline transition-colors disabled:opacity-50"
          >
            {resending ? t('resending') : t('resend')}
          </button>
        )}
      </div>

      <button
        onClick={close}
        className="mt-3 w-full text-center text-sm text-on-surface-variant/60 hover:text-on-surface transition-colors"
      >
        {t('skipNow')}
      </button>
    </div>
  );
}
