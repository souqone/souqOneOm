'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  ExternalLink,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { TransportQuote, QuoteStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { QUOTE_STATUS_LABELS, CURRENCY_LABEL, QUOTE_STATUS_STYLES } from '@/features/transport/constants';
import { formatRelativeDate } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';

type TabStatus = 'ALL' | QuoteStatus;

interface TabDef {
  key: TabStatus;
  label: string;
}

const QUOTE_STATUS_ICON: Record<QuoteStatus, React.ElementType> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle,
  REJECTED: XCircle,
  WITHDRAWN: Trash2,
};

export default function MyQuotesPage() {
  const t = useTranslations('transport');

  const TABS: TabDef[] = [
    { key: 'ALL', label: t('tabs.all') },
    { key: 'PENDING', label: t('tabs.pending') },
    { key: 'ACCEPTED', label: t('tabs.accepted') },
    { key: 'REJECTED', label: t('tabs.rejected') },
  ];

  const [quotes, setQuotes] = useState<TransportQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const pendingWithdrawals = useRef<Set<string>>(new Set());

  const load = async (tab: TabStatus) => {
    setLoading(true);
    setError('');
    try {
      const res = await transportApi.myQuotes(1, 50, tab === 'ALL' ? undefined : tab);
      const newQuotes = res.items.map((q) =>
        pendingWithdrawals.current.has(q.id) ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q
      );
      setQuotes(newQuotes);
    } catch {
      setError('تعذّر تحميل عروضك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleWithdraw = async (quoteId: string) => {
    pendingWithdrawals.current.add(quoteId);
    setWithdrawing(quoteId);
    setWithdrawError(null);
    try {
      await transportApi.withdrawQuote(quoteId);
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q))
      );
    } catch {
      setWithdrawError('تعذّر سحب العرض، حاول مجدداً');
    } finally {
      pendingWithdrawals.current.delete(quoteId);
      setWithdrawing(null);
    }
  };

  const pendingCount = activeTab === 'ALL' ? quotes.filter((q) => q.status === 'PENDING').length : 0;
  const acceptedCount = activeTab === 'ALL' ? quotes.filter((q) => q.status === 'ACCEPTED').length : 0;

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">{t('myQuotes')}</h1>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            {t('emptyStates.manageYourQuotes')}
          </p>
        </div>

        {withdrawError && (
          <div className="mb-4 flex items-center gap-2 bg-[var(--color-error-light)] text-[var(--color-error)] text-sm px-4 py-3 rounded-xl">
            <AlertCircle size={15} />
            {withdrawError}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center">
                <Clock size={18} className="text-[var(--color-warning)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-on-surface)]">{pendingCount}</p>
                <p className="text-xs text-[var(--color-on-surface-muted)]">بانتظار الرد</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
                <CheckCircle size={18} className="text-[var(--color-success)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-on-surface)]">{acceptedCount}</p>
                <p className="text-xs text-[var(--color-on-surface-muted)]">عروض مقبولة</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
          <TransportPageLoader />
        ) : error ? (
          <TransportPageError message={error} onRetry={() => load(activeTab)} />
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] flex items-center justify-center">
              <MessageSquare size={28} className="text-[var(--color-on-surface-muted)]" />
            </div>
            <p className="text-base font-semibold text-[var(--color-on-surface)]">
              {activeTab === 'ALL' ? t('emptyStates.quotesAll')
                : t('emptyStates.quotesStatus', { status: t(`quoteStatus.${activeTab}`) })}
            </p>
            {activeTab === 'ALL' && (
              <Link href="/transport/browse" className="btn-primary">
                تصفح الطلبات
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {quotes.map((quote) => {
              const config = QUOTE_STATUS_STYLES[quote.status] ?? QUOTE_STATUS_STYLES['PENDING'];
              const StatusIcon = QUOTE_STATUS_ICON[quote.status] ?? Clock;
              return (
                <div
                  key={quote.id}
                  className="card-base p-5 flex flex-col gap-4"
                  style={{ borderRight: `3px solid ${config.border}` }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-on-surface-muted)] font-mono">
                          طلب #{quote.requestId}
                        </span>
                        <Link
                          href={`/transport/requests/${quote.requestId}`}
                          className="text-[var(--color-brand-navy)] hover:text-[var(--color-brand-navy-light)]"
                        >
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <Banknote size={16} className="text-[var(--color-brand-navy)]" />
                        <span className="text-xl font-bold text-[var(--color-brand-navy)]">
                          {quote.price} {CURRENCY_LABEL}
                        </span>
                        {quote.estimatedHours && (
                          <span className="text-xs text-[var(--color-on-surface-muted)] flex items-center gap-1">
                            <Clock size={11} />
                            {quote.estimatedHours} ساعة
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: config.bg, color: config.text }}
                    >
                      <StatusIcon size={12} />
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>

                  {quote.message && (
                    <p className="text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-xl px-3 py-2">
                      {quote.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-[var(--color-on-surface-muted)]">
                      {formatRelativeDate(quote.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      {quote.status === 'PENDING' && (
                        <button
                          onClick={() => handleWithdraw(quote.id)}
                          disabled={withdrawing === quote.id}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-error)] font-semibold hover:bg-[var(--color-error-light)] px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                        >
                          {withdrawing === quote.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          سحب العرض
                        </button>
                      )}
                      {quote.status === 'ACCEPTED' && quote.booking?.id && (
                        <Link
                          href={`/transport/bookings/${quote.booking.id}`}
                          className="flex items-center gap-1.5 text-xs text-[var(--color-success)] font-bold bg-[var(--color-success-light)] px-3 py-1.5 rounded-xl hover:opacity-80 transition-all"
                        >
                          <ExternalLink size={12} />
                          عرض الحجز
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
