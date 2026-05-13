'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthSpinner() {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center gap-3">
      <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  // ── Unified loading state (SSR + client first render) ────────────────────
  // `mounted` is false on both server and client's first render, so both
  // render the spinner → eliminates the hydration mismatch.
  // After mount, useEffect fires and `mounted` becomes true, then the real
  // auth state takes over.
  const [mounted, setMounted] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      openAuth('login');
    }
  }, [mounted, isLoading, isAuthenticated, openAuth]);

  if (!mounted || isLoading) {
    return <AuthSpinner />;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
