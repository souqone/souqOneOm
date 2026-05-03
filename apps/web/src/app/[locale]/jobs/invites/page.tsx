'use client';

import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import { useMyInvites, useRespondToInvite } from '@/lib/api';
import type { JobInviteItem } from '@/lib/api';
import { useToast } from '@/components/toast';

export default function InvitesPage() {
  return (
    <JobsPageGuard role="any">
      <InvitesContent />
    </JobsPageGuard>
  );
}

function InvitesContent() {
  const { addToast } = useToast();
  const { data: invites, isLoading } = useMyInvites();
  const respond = useRespondToInvite();

  async function handleRespond(inviteId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      await respond.mutateAsync({ inviteId, status });
      addToast('success', status === 'ACCEPTED' ? 'تم قبول الدعوة' : 'تم رفض الدعوة');
    } catch (err: any) {
      addToast('error', err?.message || 'حدث خطأ');
    }
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { label: 'مقبولة', color: 'bg-green-100 text-green-700' },
    DECLINED: { label: 'مرفوضة', color: 'bg-red-100 text-red-700' },
  };

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">mail</span>
          دعوات الوظائف
        </h1>
        <p className="text-on-surface-variant mb-8">الدعوات التي تلقيتها من أصحاب العمل</p>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-surface-container-low rounded w-2/3 mb-3" />
                <div className="h-4 bg-surface-container-low rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !invites || invites.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">mail_lock</span>
            <p className="text-lg font-bold text-on-surface-variant">لا توجد دعوات حاليا</p>
            <Link href="/jobs" className="text-primary text-sm font-bold mt-2 inline-block">تصفح الوظائف</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} onRespond={handleRespond} isPending={respond.isPending} statusLabels={statusLabels} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function InviteCard({
  invite,
  onRespond,
  isPending,
  statusLabels,
}: {
  invite: JobInviteItem;
  onRespond: (id: string, status: 'ACCEPTED' | 'DECLINED') => void;
  isPending: boolean;
  statusLabels: Record<string, { label: string; color: string }>;
}) {
  const st = statusLabels[invite.status] || statusLabels.PENDING;

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 rounded-xl overflow-hidden shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {invite.job && (
            <Link href={`/jobs/${invite.job.id}`} className="font-extrabold text-on-surface hover:text-primary transition-colors text-lg block truncate">
              {invite.job.title}
            </Link>
          )}
          {invite.job?.user && (
            <p className="text-sm text-on-surface-variant mt-1">
              من: <span className="font-bold">{invite.job.user.displayName || invite.job.user.username}</span>
            </p>
          )}
          {invite.message && (
            <p className="text-sm text-on-surface-variant mt-2 bg-surface-container-low rounded-lg p-3">
              &ldquo;{invite.message}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${st.color}`}>{st.label}</span>
            <span className="text-xs text-on-surface-variant">
              {new Date(invite.createdAt).toLocaleDateString('ar-OM')}
            </span>
          </div>
        </div>
      </div>

      {invite.status === 'PENDING' && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-outline-variant/10">
          <button
            onClick={() => onRespond(invite.id, 'ACCEPTED')}
            disabled={isPending}
            className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            قبول
          </button>
          <button
            onClick={() => onRespond(invite.id, 'DECLINED')}
            disabled={isPending}
            className="flex-1 bg-surface-container-low text-on-surface-variant py-2.5 rounded-lg font-bold text-sm hover:bg-surface-container transition disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            رفض
          </button>
        </div>
      )}
    </div>
  );
}
