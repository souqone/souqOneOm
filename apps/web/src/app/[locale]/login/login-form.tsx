'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/auth';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { useTranslations } from 'next-intl';
import { GoogleSignInButton } from '@/components/google-sign-in';
import { InputField } from '@/features/auth/components/input-field';

export default function LoginForm() {
  const t = useTranslations('auth');
  const { login: authLogin } = useAuth();
  const { close, executePending, switchView } = useAuthModal();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  function navigateAfterLogin() {
    executePending();
    close();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ accessToken: string; refreshToken?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await authLogin(result.accessToken, result.refreshToken);
      navigateAfterLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unexpectedError');
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Email */}
        <InputField
          label={t('emailLabel')}
          icon="mail"
          type="email"
          required
          autoFocus
          iconClassName='rtl:inset-s-3! ltr:inset-e-3!'
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder={t('emailPlaceholder')}
        />

        {/* Password */}
        <InputField
          label={t('passwordLabel')}
          hint={t('forgotPassword')}
          onHintClick={() => switchView('forgot')}
          icon="lock"
          isPassword
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          placeholder="••••••••"
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-3 py-2.5 rounded-lg text-[12px] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-[38px] sm:h-[42px] flex items-center justify-center gap-2 font-bold text-[12px] sm:text-sm rounded-xl hover:brightness-110 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              {t('loggingIn')}
            </>
          ) : (
            <>
              {t('loginBtn')}
              <span className="material-symbols-outlined text-base">login</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-3 sm:my-4">
        <div className="h-px flex-1 bg-outline-variant/20" />
        <span className="text-[11px] text-on-surface-variant/50 font-medium">{t('or')}</span>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>

      {/* Google Sign-In */}
      <GoogleSignInButton onError={setError} onSuccess={navigateAfterLogin} />

      {/* Register link */}
      <p className="text-center text-on-surface-variant text-[12px] mt-3 sm:mt-4 font-medium">
        {t('noAccount')}{' '}
        <button type="button" onClick={() => switchView('register')} className="text-primary font-bold hover:underline transition-all">
          {t('createNewAccount')}
        </button>
      </p>
    </div>
  );
}
