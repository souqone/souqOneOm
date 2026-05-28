'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { transportApi } from '@/features/transport/api';
import type { TransportRequest } from '@/features/transport/types';
import { TransportServiceType } from '@/features/transport/types';
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
      } catch (err: any) {
        if (err.status === 403) {
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
    timingType: request.scheduledAt ? 'scheduled' as const : 'asap' as const,
    scheduledAt: request.scheduledAt ? request.scheduledAt.substring(0, 16) : undefined,
    isFlexible: request.isFlexible,
    budgetMin: request.budgetMin,
    budgetMax: request.budgetMax,
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <CreateRequestWizard requestId={id} initialData={initialData} />
        </main>
        <div className="h-16 md:hidden" />
      </div>
    </AuthGuard>
  );
}
