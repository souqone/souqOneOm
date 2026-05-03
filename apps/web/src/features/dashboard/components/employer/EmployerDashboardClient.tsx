'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import {
  useMyEmployerProfile,
  useMyJobs,
  useEmployerApplications,
  useMyEscrows,
  useUpdateApplicationStatus,
  useReleaseEscrow,
  useDisputeEscrow,
  useCloseJob,
} from '@/lib/api/jobs';
import { EmployerProfileStrip } from './EmployerProfileStrip';
import { EmployerProfileStripSkeleton } from './EmployerProfileStripSkeleton';
import { EmployerNavTabs } from './EmployerNavTabs';
import { EmployerNoProfileBanner } from './EmployerNoProfileBanner';
import { EmployerOverviewTab } from './tabs/EmployerOverviewTab';
import { EmployerJobsTab } from './tabs/EmployerJobsTab';
import { EmployerApplicationsTab } from './tabs/EmployerApplicationsTab';
import { EmployerEscrowTab } from './tabs/EmployerEscrowTab';
import { EmployerInviteTab } from './tabs/EmployerInviteTab';
import { PayEscrowModal } from './modals/PayEscrowModal';
import { useTranslations } from 'next-intl';
import type { EmployerTab } from './EmployerNavTabs';
import type { EmployerApplicationItem } from '@/lib/api/jobs';

export function EmployerDashboardClient() {
  const { user } = useAuth();
  const tp = useTranslations('pages');
  const qc = useQueryClient();
  const [tab, setTab] = useState<EmployerTab>('overview');
  const [jobFilter, setJobFilter] = useState<string | undefined>(undefined);
  const [payModalApp, setPayModalApp] = useState<EmployerApplicationItem | null>(null);

  const { data: employerProfile, isLoading: loadingProfile } = useMyEmployerProfile(!!user);
  const { data: jobsData, isLoading: loadingJobs } = useMyJobs();
  const { data: applications = [], isLoading: loadingApps } = useEmployerApplications();
  const { data: escrows = [], isLoading: loadingEscrows } = useMyEscrows();

  const updateStatusMutation = useUpdateApplicationStatus();
  const releaseMutation = useReleaseEscrow();
  const disputeMutation = useDisputeEscrow();
  const closeMutation = useCloseJob();

  const jobs = jobsData?.items ?? [];
  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE');
  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const heldEscrows = escrows.filter((e) => e.status === 'HELD');

  const counts = {
    jobs: activeJobs.length,
    apps: pendingApps.length,
    escrow: heldEscrows.length,
  };

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['employer-applications'] });
    qc.invalidateQueries({ queryKey: ['jobs'] });
    qc.invalidateQueries({ queryKey: ['my-escrows'] });
  }, [qc]);

  const handleUpdateStatus = useCallback((appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    updateStatusMutation.mutate({ applicationId: appId, status }, { onSuccess: invalidate });
  }, [updateStatusMutation, invalidate]);

  const handleRelease = useCallback((escrowId: string) => {
    releaseMutation.mutate(escrowId, { onSuccess: invalidate });
  }, [releaseMutation, invalidate]);

  const handleDispute = useCallback((escrowId: string) => {
    disputeMutation.mutate({ escrowId }, { onSuccess: invalidate });
  }, [disputeMutation, invalidate]);

  const handleCloseJob = useCallback((jobId: string) => {
    closeMutation.mutate(jobId, { onSuccess: invalidate });
  }, [closeMutation, invalidate]);

  const handleViewApps = useCallback((jobId: string) => {
    setJobFilter(jobId);
    setTab('apps');
  }, []);

  const userInfo = user
    ? { displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl, isVerified: user.isVerified, governorate: user.governorate }
    : { displayName: null, username: '', avatarUrl: null, isVerified: false, governorate: null };

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Profile strip */}
        {loadingProfile ? (
          <EmployerProfileStripSkeleton />
        ) : employerProfile ? (
          <EmployerProfileStrip profile={userInfo} employerProfile={employerProfile} />
        ) : null}

        {/* Mobile tabs */}
        {employerProfile && (
          <EmployerNavTabs active={tab} onChange={setTab} counts={counts} variant="tabs" className="md:hidden" />
        )}

        <div className="md:flex md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">
          {/* Desktop sidebar */}
          {employerProfile && (
            <aside className="hidden md:block w-64 flex-shrink-0 space-y-4 sticky top-20 self-start">
              <EmployerNavTabs active={tab} onChange={setTab} counts={counts} variant="sidebar" />
              <Link href="/jobs/new">
                <Button className="w-full h-10 rounded-xl bg-primary text-on-primary font-semibold text-[13px] shadow-md shadow-primary/20">
                  <span className="material-symbols-outlined text-base">add</span>
                  {tp('postNewJob')}
                </Button>
              </Link>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0 px-3 md:px-0 pt-3 md:pt-0 pb-24 md:pb-8" id="main-content">
            {!loadingProfile && !employerProfile && <EmployerNoProfileBanner />}

            {employerProfile && (
              <>
                {tab === 'overview' && (
                  <EmployerOverviewTab
                    jobs={jobs}
                    applications={applications}
                    onTabChange={setTab}
                    onCloseJob={handleCloseJob}
                    onViewApps={handleViewApps}
                    onUpdateStatus={handleUpdateStatus}
                    onRelease={handleRelease}
                    onDispute={handleDispute}
                    onOpenPay={setPayModalApp}
                    isUpdating={updateStatusMutation.isPending}
                  />
                )}
                {tab === 'jobs' && (
                  <EmployerJobsTab
                    jobs={jobs}
                    isLoading={loadingJobs}
                    onClose={handleCloseJob}
                    onViewApps={handleViewApps}
                    setTab={setTab}
                  />
                )}
                {tab === 'apps' && (
                  <EmployerApplicationsTab
                    applications={applications}
                    isLoading={loadingApps}
                    jobFilter={jobFilter}
                    onUpdateStatus={handleUpdateStatus}
                    onRelease={handleRelease}
                    onDispute={handleDispute}
                    onOpenPay={setPayModalApp}
                    isUpdating={updateStatusMutation.isPending}
                  />
                )}
                {tab === 'escrow' && (
                  <EmployerEscrowTab
                    escrows={escrows}
                    isLoading={loadingEscrows}
                    onRelease={handleRelease}
                    onDispute={handleDispute}
                  />
                )}
                {tab === 'invite' && (
                  <EmployerInviteTab activeJobs={activeJobs.map((j) => ({ id: j.id, title: j.title }))} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Post job FAB — mobile */}
      {employerProfile && (
        <div className="md:hidden fixed bottom-20 left-4 z-30">
          <Button href="/jobs/new"
            className="h-12 px-5 rounded-2xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-base">add</span>
            {tp('postNewJob')}
          </Button>
        </div>
      )}

      <div className="hidden md:block">
        <Footer />
      </div>

      <PayEscrowModal app={payModalApp} onClose={() => setPayModalApp(null)} />
    </AuthGuard>
  );
}
