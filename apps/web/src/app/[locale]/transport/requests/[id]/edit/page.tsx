'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { transportApi } from '@/features/transport/api';
import type { TransportRequest } from '@/features/transport/types';
import { useAuth } from '@/providers/auth-provider';
import { AuthGuard } from '@/components/auth-guard';
import CreateRequestWizard from '@/features/transport/components/CreateRequestWizard';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await transportApi.getRequest(id);
        if (data.status !== 'OPEN' && data.status !== 'QUOTED') {
          setError('لا يمكن تعديل هذا الطلب في حالته الحالية');
        } else {
          setRequest(data);
        }
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 403) {
          setError('لا تملك صلاحية تعديل هذا الطلب');
        } else {
          setError('تعذّر تحميل الطلب');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (loading || !request) return;

    if (!user) {
      router.replace(`/transport/requests/${id}`);
      return;
    }

    if (request.userId !== user.id) {
      router.replace('/transport/my-requests');
      return;
    }

    if (!['OPEN', 'QUOTED'].includes(request.status)) {
      router.replace(`/transport/requests/${id}`);
      return;
    }
  }, [loading, request, user, id, router]);

  if (loading) return <TransportPageLoader />;
  if (error) return <TransportPageError message={error} onRetry={() => router.push('/transport/my-requests')} />;
  if (!request) return null;

  // M-3: if the stored scheduledAt is in the past the wizard's validation
  // would block submission with "يجب أن يكون الموعد في المستقبل".
  // Auto-fall back to timingType=asap and show an info banner so the user
  // knows they need to pick a new date if they want scheduled delivery.
  const isScheduledInPast =
    !!(request.scheduledAt && new Date(request.scheduledAt) <= new Date());

  const initialData = {
    serviceType: request.serviceType,
    fromGovernorate: request.fromGovernorate,
    fromCity: request.fromCity,
    fromAddress: request.fromAddress,
    fromLat: request.fromLat,
    fromLng: request.fromLng,
    toGovernorate: request.toGovernorate,
    toCity: request.toCity,
    toAddress: request.toAddress,
    toLat: request.toLat,
    toLng: request.toLng,
    cargoDescription: request.cargoDescription,
    weightTons: request.weightTons,
    requiresHelper: request.requiresHelper,
    notes: request.notes,
    timingType: request.scheduledAt && !isScheduledInPast ? 'scheduled' as const : 'asap' as const,
    scheduledAt: request.scheduledAt && !isScheduledInPast ? request.scheduledAt.substring(0, 16) : undefined,
    isFlexible: request.isFlexible,
    budgetMin: request.budgetMin,
    budgetMax: request.budgetMax,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {isScheduledInPast && (
            <div
              className="mb-4 flex items-start gap-3 p-3 rounded-xl border border-[var(--color-brand-amber)]/40 bg-[var(--color-brand-amber)]/8 text-sm text-[var(--color-on-surface)]"
              dir="rtl"
            >
              <span className="mt-0.5 text-[var(--color-brand-amber)] text-base leading-none">⚠</span>
              <span>
                <strong>ملاحظة:</strong> الموعد المجدول السابق قد انتهى، لذا تم تعيين نوع التوقيت إلى{' '}
                <strong>فوري</strong>. يمكنك اختيار موعد جديد في الخطوة الرابعة.
              </span>
            </div>
          )}
          <CreateRequestWizard requestId={id} initialData={initialData} />
        </main>
        <div className="h-16 md:hidden" />
      </div>
    </AuthGuard>
  );
}
