'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { useMyDriverProfile, useMyEmployerProfile } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import type { JobProfileRole } from '@/hooks/use-require-job-profile';

interface JobsPageGuardProps {
  role: JobProfileRole;
  children: React.ReactNode;
}

/**
 * Full-page guard for jobs pages that require a profile.
 * Shows loading → redirects to login/onboarding if not satisfied → renders children.
 */
export function JobsPageGuard({ role, children }: JobsPageGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  const { data: driver, isLoading: driverLoading } = useMyDriverProfile(isAuthenticated);
  const { data: employer, isLoading: employerLoading } = useMyEmployerProfile(isAuthenticated);

  const profileLoading = driverLoading || employerLoading;
  const hasDriver = !!driver;
  const hasEmployer = !!employer;

  const satisfied =
    role === 'any'      ? hasDriver || hasEmployer :
    role === 'driver'   ? hasDriver :
    role === 'employer' ? hasEmployer : false;

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!isAuthenticated) {
      openAuth('login');
      return;
    }

    if (!satisfied) {
      router.replace('/jobs/onboarding');
    }
  }, [authLoading, profileLoading, isAuthenticated, satisfied, openAuth, router]);

  if (authLoading || profileLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-16 max-w-5xl mx-auto px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-low dark:bg-surface-container rounded-lg w-1/3" />
            <div className="h-64 bg-surface-container-low dark:bg-surface-container rounded-2xl" />
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated || !satisfied) return null;

  return <>{children}</>;
}
