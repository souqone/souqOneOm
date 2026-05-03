'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthModal } from '@/providers/auth-modal-provider';
import type { AuthView } from '@/providers/auth-modal-provider';
import LoginForm from '@/app/[locale]/login/login-form';
import RegisterForm from '@/app/[locale]/register/register-form';
import ForgotForm from '@/app/[locale]/forgot-password/forgot-form';
import ResetForm from '@/app/[locale]/reset-password/reset-form';
import VerifyEmailContent from './verify-content';
import LogoArIcon from '@/components/icons/logo-ar';
import LogoEnIcon from '@/components/icons/logo-en';
import { useHandleOutSide } from '@/hooks/use-handle-outside';
import { useRouter } from '@/i18n/navigation';

const VIEW_META: Record<Exclude<AuthView, null>, { titleKey: string; subtitleKey: string }> = {
  login:    { titleKey: 'loginTitle',          subtitleKey: 'loginSubtitle' },
  register: { titleKey: 'registerTitle',       subtitleKey: 'registerSubtitle' },
  forgot:   { titleKey: 'forgotPasswordTitle', subtitleKey: 'forgotPasswordSubtitle' },
  reset:    { titleKey: 'resetPasswordTitle',  subtitleKey: 'resetPasswordSubtitle' },
  verify:   { titleKey: 'verifyEmailTitle',    subtitleKey: 'verifyEmailSubtitle' },
};

export function AuthOverlay() {
  const { view, isOpen, message, close } = useAuthModal();
  const locale = useLocale();
  const t = useTranslations('auth');
  const router = useRouter();

  const dismiss = useCallback(() => {
    close();
    router.push('/');
  }, [close, router]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const modalRef = useRef(null);

  useHandleOutSide(modalRef, () => dismiss())

  // Close on Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss();
  }, [dismiss]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  if (!isOpen || !view) return null;

  const meta = VIEW_META[view];
  

  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center backdrop-blur-xl transition-colors duration-200 bg-brand-navy/45 dark:bg-black/60"
    >
      <div
        className="w-full sm:w-auto flex flex-col items-center"
        ref={modalRef}
      >

        {/* Card */}
        <div className="auth-sheet">
          {/* Drag handle — mobile only */}
          {/* <div className="auth-drag-handle" /> */}
          <div className="pt-4 pb-2 items-center justify-center hidden sm:flex">
          {locale === 'ar' ? (
            <LogoArIcon className='w-60 h-12'/>
          ) : (
            <LogoEnIcon className='w-60 text-[#004AC6] h-7.75'/>
          )}
        </div>

          {/* Title */}
          <div className="py-3 text-center border-b border-outline-variant/15 dark:border-outline-variant/25">
            <h2 className="text-on-surface text-base font-bold mb-0.5">
              {message || t(meta.titleKey)}
            </h2>
            <p className="text-on-surface-variant text-[11px]">
              {t(meta.subtitleKey)}
            </p>
          </div>

          {/* Body */}
          <div className="pt-3">
            {view === 'login' && <LoginForm />}
            {view === 'register' && <RegisterForm />}
            {view === 'forgot' && <ForgotForm />}
            {view === 'reset' && <ResetForm />}
            {view === 'verify' && <VerifyEmailContent />}
          </div>
        </div>
      </div>
    </div>
  );
}
