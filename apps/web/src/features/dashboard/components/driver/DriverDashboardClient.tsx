'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  useMyDriverProfile,
  useMyApplications,
  useMyInvites,
  useMyEscrows,
  useRecommendedJobs,
  useRespondToInvite,
  useWithdrawApplication,
  useDisputeEscrow,
} from '@/lib/api/jobs';
import { DriverProfileStrip } from './DriverProfileStrip';
import { DriverProfileStripSkeleton } from './DriverProfileStripSkeleton';
import { DriverNavTabs } from './DriverNavTabs';
import { DriverAvailabilityToggle } from './DriverAvailabilityToggle';
import { DriverVerificationBanner } from './DriverVerificationBanner';
import { DriverNoProfileBanner } from './DriverNoProfileBanner';
import { DriverOverviewTab } from './tabs/DriverOverviewTab';
import { DriverApplicationsTab } from './tabs/DriverApplicationsTab';
import { DriverInvitesTab } from './tabs/DriverInvitesTab';
import { DriverEscrowTab } from './tabs/DriverEscrowTab';
import { DriverRecommendationsTab } from './tabs/DriverRecommendationsTab';
import type { DriverTab } from './DriverNavTabs';

export function DriverDashboardClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<DriverTab>('overview');

  const { data: driverProfile, isLoading: loadingProfile } = useMyDriverProfile(!!user);
  const { data: applications = [], isLoading: loadingApps } = useMyApplications();
  const { data: invites = [], isLoading: loadingInvites } = useMyInvites();
  const { data: escrows = [], isLoading: loadingEscrows } = useMyEscrows();
  const { data: recommendations = [], isLoading: loadingRecs } = useRecommendedJobs();

  const withdrawMutation = useWithdrawApplication();
  const respondMutation = useRespondToInvite();
  const disputeMutation = useDisputeEscrow();

  const pendingAppsCount = applications.filter((a) => a.status === 'PENDING').length;
  const pendingInvitesCount = invites.filter((i) => i.status === 'PENDING').length;
  const heldEscrowCount = escrows.filter((e) => e.status === 'HELD').length;

  const counts = {
    apps: pendingAppsCount,
    invites: pendingInvitesCount,
    escrow: heldEscrowCount,
    recs: recommendations.length,
  };

  const handleWithdraw = useCallback((id: string) => {
    withdrawMutation.mutate(id);
  }, [withdrawMutation]);

  const handleChat = useCallback((userId: string) => {
    router.push(`/messages?user=${userId}`);
  }, [router]);

  const handleDispute = useCallback((escrowId: string) => {
    disputeMutation.mutate({ escrowId });
  }, [disputeMutation]);

  const handleRespondInvite = useCallback((inviteId: string, status: 'ACCEPTED' | 'DECLINED') => {
    respondMutation.mutate({ inviteId, status });
  }, [respondMutation]);

  const userInfo = user
    ? { displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl }
    : { displayName: null, username: '', avatarUrl: null };

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        {loadingProfile ? (
          <DriverProfileStripSkeleton />
        ) : driverProfile ? (
          <DriverProfileStrip profile={userInfo} driverProfile={driverProfile} />
        ) : null}

        {/* Mobile tabs */}
        {driverProfile && (
          <DriverNavTabs
            active={tab}
            onChange={setTab}
            counts={counts}
            variant="tabs"
            className="md:hidden"
          />
        )}

        <div className="md:flex md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">
          {/* Desktop sidebar */}
          {driverProfile && (
            <aside className="hidden md:block w-64 flex-shrink-0 space-y-4 sticky top-20 self-start">
              <DriverNavTabs
                active={tab}
                onChange={setTab}
                counts={counts}
                variant="sidebar"
              />
              <DriverAvailabilityToggle isAvailable={driverProfile.isAvailable} />
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0 px-3 md:px-0 pt-3 md:pt-0 pb-24 md:pb-8" id="main-content">
            {!loadingProfile && !driverProfile && <DriverNoProfileBanner />}
            {driverProfile && !driverProfile.isVerified && <DriverVerificationBanner />}

            {driverProfile && (
              <>
                {tab === 'overview' && (
                  <DriverOverviewTab
                    applications={applications}
                    recommendations={recommendations}
                    pendingInvitesCount={pendingInvitesCount}
                    onWithdraw={handleWithdraw}
                    onChat={handleChat}
                    onDispute={handleDispute}
                    setTab={setTab}
                  />
                )}
                {tab === 'apps' && (
                  <DriverApplicationsTab
                    applications={applications}
                    isLoading={loadingApps}
                    onWithdraw={handleWithdraw}
                    onChat={handleChat}
                    onDispute={handleDispute}
                  />
                )}
                {tab === 'invites' && (
                  <DriverInvitesTab
                    invites={invites}
                    isLoading={loadingInvites}
                    onRespond={handleRespondInvite}
                    isResponding={respondMutation.isPending}
                  />
                )}
                {tab === 'escrow' && (
                  <DriverEscrowTab
                    escrows={escrows}
                    isLoading={loadingEscrows}
                    onDispute={handleDispute}
                  />
                )}
                {tab === 'recs' && (
                  <DriverRecommendationsTab
                    recommendations={recommendations}
                    isLoading={loadingRecs}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
    </AuthGuard>
  );
}
