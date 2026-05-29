'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Package } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import type { TransportRequest, RequestStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import TransportRequestCard from '@/features/transport/components/TransportRequestCard';
import RequestCardSkeleton from '@/features/transport/components/RequestCardSkeleton';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/providers/auth-provider';
import { TransportPageError } from '@/features/transport/components/TransportPageState';

type TabStatus = 'ALL' | RequestStatus;

interface TabDef {
  key: TabStatus;
  label: string;
}

export default function MyRequestsPage() {
  const t = useTranslations('transport');
  
  const TABS: TabDef[] = [
    { key: 'ALL', label: t('tabs.all') },
    { key: 'OPEN', label: t('tabs.open') },
    { key: 'QUOTED', label: t('tabs.quoted') },
    { key: 'EXPIRED', label: t('tabs.expired') },
    { key: 'COMPLETED', label: t('tabs.completed') },
    { key: 'CANCELLED', label: t('tabs.cancelled') },
  ];

  const EMPTY_MESSAGES: Record<TabStatus, string> = {
    ALL: t('emptyStates.requestsAll'),
    OPEN: t('emptyStates.requestsOpen'),
    QUOTED: t('emptyStates.requestsQuoted'),
    ACCEPTED: t('emptyStates.requestsAccepted'),
    IN_PROGRESS: t('emptyStates.requestsInProgress'),
    COMPLETED: t('emptyStates.requestsCompleted'),
    CANCELLED: t('emptyStates.requestsCancelled'),
    EXPIRED: t('emptyStates.requestsExpired'),
  };

  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const load = async (tab: TabStatus, page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await transportApi.myRequests(page, ITEMS_PER_PAGE, tab === 'ALL' ? undefined : tab);
      setRequests(res.items);
      setTotalPages(res.meta.totalPages || 1);
      setCurrentPage(page);
    } catch {
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(activeTab, 1); }, [activeTab]);

  const handleTabChange = (tab: TabStatus) => { setActiveTab(tab); };

  const handleRepost = async (id: string) => {
    setRenewingId(id);
    try {
      const updated = await transportApi.repostRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError(t('errors.renewFailed'));
    } finally {
      setRenewingId(null);
    }
  };

  const handleDuplicate = (request: TransportRequest) => {
    const draft = {
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
      budgetMin: request.budgetMin,
      budgetMax: request.budgetMax,
      isFlexible: request.isFlexible,
      notes: request.notes,
    };
    sessionStorage.setItem('transport_draft', JSON.stringify(draft));
    router.push('/transport/new');
  };

  const handleCancel = async (id: string) => {
    if (confirmCancelId !== id) {
      setConfirmCancelId(id);
      return;
    }
    setConfirmCancelId(null);
    setCancellingId(id);
    try {
      await transportApi.cancelRequest(id);
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'CANCELLED' as RequestStatus } : r)
      );
    } catch {
      setError(t('errors.cancelFailed'));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">{t('myRequests')}</h1>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {t('emptyStates.manageYourRequests')}
            </p>
          </div>
          <Link href="/transport/new" className="btn-primary">
            <Plus size={16} />
            {t('newRequest')}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[var(--color-brand-navy)] text-white'
                    : 'bg-white text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RequestCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <TransportPageError message={error} onRetry={() => load(activeTab)} />
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] flex items-center justify-center">
              <Package size={28} className="text-[var(--color-on-surface-muted)]" />
            </div>
            <p className="text-base font-semibold text-[var(--color-on-surface)]">
              {EMPTY_MESSAGES[activeTab]}
            </p>
            {activeTab === 'ALL' && (
              <Link href="/transport/new" className="btn-primary">
                <Plus size={16} />
                {t('emptyStates.createFirstRequest')}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requests.map((req) => (
                <TransportRequestCard
                  key={req.id}
                  request={req}
                  onRepost={() => handleRepost(req.id)}
                  onDuplicate={() => handleDuplicate(req)}
                  isRenewing={renewingId === req.id}
                  currentUserId={user?.id}
                  onCancel={['OPEN', 'QUOTED'].includes(req.status) ? () => handleCancel(req.id) : undefined}
                  isCancelling={cancellingId === req.id}
                  isConfirmingCancel={confirmCancelId === req.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => load(activeTab, currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-outline px-4 py-2"
                >
                  السابق
                </button>
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => load(activeTab, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-outline px-4 py-2"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
