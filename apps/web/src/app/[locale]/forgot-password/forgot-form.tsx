'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { InputField } from '@/features/auth/components/input-field';
import { apiRequest } from '@/lib/auth';

export default function ForgotForm() {
  const t = useTranslations('auth');
  const { switchView } = useAuthModal();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!success ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <InputField
            label={t('emailLabel')}
            icon="mail"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder={t('emailPlaceholder')}
            error={error || undefined}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl hover:brightness-110 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                {t('sending')}
              </>
            ) : (
              <>
                {t('sendResetCode')}
                <span className="material-symbols-outlined text-base">send</span>
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-green-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              mark_email_read
            </span>
          </div>
          <h3 className="font-bold text-lg text-on-surface mb-2">{t('sentSuccess')}</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
            {t('sentDesc')} <strong className="text-on-surface">{email}</strong>{', '}{t('checkInbox')}
          </p>
          <button
            type="button"
            onClick={() => switchView('reset', { email })}
            className="btn-primary mt-6 w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl hover:brightness-110 hover:shadow-lg transition-all"
          >
            {t('enterCode')}
            <span className="material-symbols-outlined icon-flip text-base">arrow_back</span>
          </button>
        </div>
      )}

      <p className="text-center text-on-surface-variant text-sm mt-5 font-medium">
        {t('rememberedPassword')}{' '}
        <button type="button" onClick={() => switchView('login')} className="text-primary font-bold hover:underline transition-all">
          {t('backToLogin')}
        </button>
      </p>
    </div>
  );
}
