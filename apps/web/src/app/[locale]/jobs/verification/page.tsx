'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import { useMyVerificationStatus, useSubmitVerification, useMyDriverProfile } from '@/lib/api';
import { useUploadImage } from '@/lib/api/uploads';
import { useToast } from '@/components/toast';
import { Link } from '@/i18n/navigation';

export default function VerificationPage() {
  return (
    <JobsPageGuard role="driver">
      <VerificationContent />
    </JobsPageGuard>
  );
}

function VerificationContent() {
  const { addToast } = useToast();
  const { data: profile, isLoading: profileLoading } = useMyDriverProfile();
  const { data: verifications, isLoading: verLoading } = useMyVerificationStatus();
  const submitVerification = useSubmitVerification();
  const uploadImage = useUploadImage();

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const isLoading = profileLoading || verLoading;
  const latestVerification = verifications?.[0];
  const hasPending = latestVerification?.status === 'PENDING';
  const isVerified = profile && 'isVerified' in profile && (profile as any).isVerified;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!licenseFile || !idFile) {
      addToast('error', 'يرجى رفع صورة الرخصة وصورة الهوية');
      return;
    }

    setUploading(true);
    try {
      const [licenseResult, idResult] = await Promise.all([
        uploadImage.mutateAsync(licenseFile),
        uploadImage.mutateAsync(idFile),
      ]);

      await submitVerification.mutateAsync({
        licenseImageUrl: licenseResult.url,
        idImageUrl: idResult.url,
        notes: notes || undefined,
      });

      addToast('success', 'تم إرسال طلب التوثيق بنجاح');
      setLicenseFile(null);
      setIdFile(null);
      setNotes('');
    } catch (err: any) {
      addToast('error', err?.message || 'حدث خطأ أثناء الإرسال');
    } finally {
      setUploading(false);
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    PENDING: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700', icon: 'hourglass_top' },
    APPROVED: { label: 'مقبول ✓', color: 'bg-green-100 text-green-700', icon: 'verified' },
    REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: 'cancel' },
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none';

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-low rounded w-1/2" />
            <div className="h-48 bg-surface-container-low rounded" />
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">person_off</span>
          <h1 className="text-2xl font-extrabold mb-2">لا يوجد بروفايل سائق</h1>
          <p className="text-on-surface-variant mb-6">يجب إنشاء بروفايل سائق أولاً لطلب التوثيق</p>
          <Link href="/jobs/onboarding" className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:brightness-110 transition">
            إنشاء بروفايل
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
          توثيق الحساب
        </h1>
        <p className="text-on-surface-variant mb-8">
          وثّق حسابك كسائق لزيادة فرصك في الحصول على وظائف
        </p>

        {/* Current Status */}
        {isVerified && (
          <div className="glass-card rounded-xl p-6 mb-6 text-center">
            <span className="material-symbols-outlined text-5xl text-green-600 mb-3 block">verified</span>
            <h2 className="text-xl font-extrabold text-green-700 mb-1">حسابك موثّق ✓</h2>
            <p className="text-sm text-on-surface-variant">تم توثيق حسابك بنجاح — badge التوثيق يظهر في بروفايلك</p>
          </div>
        )}

        {/* Verification History */}
        {verifications && verifications.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              سجل الطلبات
            </h2>
            <div className="space-y-3">
              {verifications.map((v) => {
                const sc = statusConfig[v.status] || statusConfig.PENDING;
                return (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-lg ${sc.color.split(' ')[1]}`}>{sc.icon}</span>
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${sc.color}`}>{sc.label}</span>
                        <p className="text-xs text-on-surface-variant mt-1">
                          {new Date(v.createdAt).toLocaleDateString('ar-OM')}
                        </p>
                      </div>
                    </div>
                    {v.rejectionReason && (
                      <p className="text-xs text-red-600 max-w-[200px] truncate">{v.rejectionReason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Form — only if not verified and no pending request */}
        {!isVerified && !hasPending && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                ارفع المستندات
              </h2>

              <div>
                <label className="block text-sm font-bold mb-2">صورة رخصة القيادة *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {licenseFile && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {licenseFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">صورة بطاقة الهوية *</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                    className={inputClass}
                  />
                  {idFile && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {idFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات تريد إضافتها..."
                  className={`${inputClass} min-h-[80px] resize-none`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || submitVerification.isPending}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-extrabold text-base hover:brightness-110 transition disabled:opacity-50"
            >
              {uploading ? 'جاري رفع الملفات...' : submitVerification.isPending ? 'جاري الإرسال...' : 'إرسال طلب التوثيق'}
            </button>
          </form>
        )}

        {hasPending && !isVerified && (
          <div className="glass-card rounded-xl p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-yellow-600 mb-3 block">hourglass_top</span>
            <h2 className="text-xl font-extrabold mb-1">طلبك قيد المراجعة</h2>
            <p className="text-sm text-on-surface-variant">سيتم مراجعة طلبك وإشعارك بالنتيجة</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
