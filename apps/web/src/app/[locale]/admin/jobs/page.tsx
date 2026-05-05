'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { useAdminJobs, useAdminJobStats, useAdminUpdateJob, useAdminDeleteJob } from '@/lib/api/admin-jobs';
import { useAdminVerifications, useAdminReviewVerification } from '@/lib/api';
import { useToast } from '@/components/toast';
import { useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

export default function AdminJobsPage() {
  return (
    <AuthGuard>
      <AdminJobsContent />
    </AuthGuard>
  );
}

function AdminJobsContent() {
  const locale = useLocale();
  const { addToast } = useToast();
  const [tab, setTab] = useState<'stats' | 'jobs' | 'verifications'>('stats');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats, isLoading: statsLoading } = useAdminJobStats();
  const { data: jobsData, isLoading: jobsLoading } = useAdminJobs({ page, status: statusFilter || undefined });
  const { data: verifications, isLoading: verLoading } = useAdminVerifications('PENDING');
  const updateJob = useAdminUpdateJob();
  const deleteJob = useAdminDeleteJob();
  const reviewVerification = useAdminReviewVerification();

  const tabs = [
    { key: 'stats' as const, label: 'الإحصائيات', icon: 'analytics' },
    { key: 'jobs' as const, label: 'الوظائف', icon: 'work' },
    { key: 'verifications' as const, label: 'طلبات التوثيق', icon: 'verified_user' },
  ];

  async function handleSuspend(id: string) {
    try {
      await updateJob.mutateAsync({ id, data: { status: 'CLOSED' } });
      addToast('success', 'تم تعليق الوظيفة');
    } catch { addToast('error', 'فشل في تعليق الوظيفة'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    try {
      await deleteJob.mutateAsync(id);
      addToast('success', 'تم حذف الوظيفة');
    } catch { addToast('error', 'فشل في حذف الوظيفة'); }
  }

  async function handleReview(id: string, decision: 'APPROVED' | 'REJECTED') {
    try {
      await reviewVerification.mutateAsync({ id, decision, rejectionReason: decision === 'REJECTED' ? 'رُفض من الإدارة' : undefined });
      addToast('success', decision === 'APPROVED' ? 'تم قبول التوثيق' : 'تم رفض التوثيق');
    } catch { addToast('error', 'حدث خطأ'); }
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-6xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
          لوحة إدارة الوظائف
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                tab === t.key ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div>
            {statsLoading ? (
              <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-surface-container-low rounded-xl" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon="work" label="إجمالي الوظائف" value={stats.jobs.total} sub={`${stats.jobs.active} نشطة`} />
                <StatCard icon="description" label="التقديمات" value={stats.applications.total} sub={`${stats.applications.accepted} مقبولة`} />
                <StatCard icon="person" label="السائقون" value={stats.drivers.total} sub={`${stats.drivers.verified} موثّق`} />
                <StatCard icon="business" label="أصحاب العمل" value={stats.employers.total} />
                <StatCard icon="verified_user" label="توثيق معلّق" value={stats.verifications.pending} color="text-yellow-600" />
              </div>
            ) : null}
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div>
            <div className="flex gap-2 mb-4">
              {['', 'ACTIVE', 'CLOSED', 'EXPIRED'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {s || 'الكل'}
                </button>
              ))}
            </div>

            {jobsLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-surface-container-low rounded-lg" />)}
              </div>
            ) : jobsData?.items.length ? (
              <>
                <div className="space-y-2">
                  {jobsData.items.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-lg">
                      <div>
                        <p className="font-bold text-sm">{job.title}</p>
                        <p className="text-xs text-on-surface-variant">
                          {job.user.displayName || job.user.username} · {resolveLocationLabel(job.governorate, locale) || job.governorate} · {job._count.applications} طلب
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          job.status === 'CLOSED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{job.status}</span>
                        {job.status === 'ACTIVE' && (
                          <button onClick={() => handleSuspend(job.id)} className="text-xs text-yellow-600 hover:underline font-bold">تعليق</button>
                        )}
                        <button onClick={() => handleDelete(job.id)} className="text-xs text-red-600 hover:underline font-bold">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
                {jobsData.meta.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 text-sm bg-surface-container-low rounded disabled:opacity-30">السابق</button>
                    <span className="px-3 py-1 text-sm">{page} / {jobsData.meta.totalPages}</span>
                    <button disabled={page >= jobsData.meta.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 text-sm bg-surface-container-low rounded disabled:opacity-30">التالي</button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-on-surface-variant py-8">لا توجد وظائف</p>
            )}
          </div>
        )}

        {/* Verifications Tab */}
        {tab === 'verifications' && (
          <div>
            {verLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-surface-container-low rounded-lg" />)}
              </div>
            ) : verifications?.length ? (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">
                          {v.driverProfile?.user.displayName || v.driverProfile?.user.username}
                        </p>
                        <p className="text-xs text-on-surface-variant">{v.driverProfile?.user.email}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(v.createdAt).toLocaleDateString('ar-OM-u-nu-latn')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(v.id, 'APPROVED')}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                        >قبول</button>
                        <button
                          onClick={() => handleReview(v.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                        >رفض</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-on-surface-variant py-8">لا توجد طلبات توثيق معلّقة</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-lg ${color || 'text-primary'}`}>{icon}</span>
        <span className="text-xs font-bold text-on-surface-variant">{label}</span>
      </div>
      <p className="text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  );
}
