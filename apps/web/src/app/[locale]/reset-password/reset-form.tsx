'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { InputField } from '@/features/auth/components/input-field';
import { OtpInput } from '@/features/auth/components/otp-input';
import { PasswordStrength } from '@/features/auth/components/password-strength';

export default function ResetForm() {
  const t = useTranslations('auth');
  const { data, switchView } = useAuthModal();
  const emailFromData = data.email || '';

  const [email, setEmail] = useState(emailFromData);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('enter6DigitCode'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('passwordMin8'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code: fullCode, newPassword }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {done ? (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-green-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2 className="font-bold text-xl text-on-surface mb-2">{t('passwordChanged')}</h2>
          <p className="text-on-surface-variant text-sm mb-8">
            {t('canLoginNow')}
          </p>
          <button
            onClick={() => switchView('login')}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl hover:brightness-110 hover:shadow-lg transition-all"
          >
            {t('loginBtn')}
            <span className="material-symbols-outlined text-base">login</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email (if not passed from forgot view) */}
          {!emailFromData && (
            <InputField
              label={t('emailLabel')}
              icon="mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="name@example.com"
            />
          )}

          {/* OTP */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {t('verificationCode')}
            </label>
            <OtpInput value={code} onChange={setCode} />
          </div>

          {/* New Password */}
          <div>
            <InputField
              label={t('newPassword')}
              icon="lock"
              isPassword
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              placeholder="••••••••"
            />
            <PasswordStrength password={newPassword} />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.join('').length !== 6}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl hover:brightness-110 hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                {t('changing')}
              </>
            ) : (
              t('changePassword')
            )}
          </button>
        </form>
      )}

      <p className="text-center text-on-surface-variant text-sm mt-5 font-medium">
        <button type="button" onClick={() => switchView('login')} className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline transition-all group">
          <span className="material-symbols-outlined icon-flip text-base transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1">arrow_back</span>
          {t('backToLogin')}
        </button>
      </p>
    </div>
  );
}

