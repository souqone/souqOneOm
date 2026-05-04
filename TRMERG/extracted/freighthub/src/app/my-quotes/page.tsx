'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import type { TransportQuote, QuoteStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { QUOTE_STATUS_LABELS, CURRENCY_LABEL } from '@/features/transport/constants';
import { formatRelativeDate } from '@/lib/utils';

type TabStatus = 'ALL' | QuoteStatus;

interface TabDef {
  key: TabStatus;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'ALL', label: 'الكل' },
  { key: 'PENDING', label: 'بانتظار الرد' },
  { key: 'ACCEPTED', label: 'مقبول' },
  { key: 'REJECTED', label: 'مرفوض' },
];

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  PENDING: {
    bg: 'var(--color-warning-light)',
    text: 'var(--color-warning)',
    border: 'rgba(217,119,6,0.3)',
    icon: Clock,
  },
  ACCEPTED: {
    bg: 'var(--color-success-light)',
    text: 'var(--color-success)',
    border: 'rgba(22,163,74,0.3)',
    icon: CheckCircle,
  },
  REJECTED: {
    bg: 'var(--color-error-light)',
    text: 'var(--color-error)',
    border: 'rgba(220,38,38,0.3)',
    icon: XCircle,
  },
  WITHDRAWN: {
    bg: 'var(--color-surface-container)',
    text: 'var(--color-on-surface-muted)',
    border: 'var(--color-outline)',
    icon: Trash2,
  },
};

export default function MyQuotesPage() {
  const [quotes, setQuotes] = useState<TransportQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transportApi.myQuotes();
      setQuotes(res.items);
    } catch {
      setError('تعذّر تحميل عروضك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async (quoteId: string) => {
    setWithdrawing(quoteId);
    try {
      await transportApi.withdrawQuote(quoteId);
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: 'WITHDRAWN' as QuoteStatus } : q))
      );
    } finally {
      setWithdrawing(null);
    }
  };

  const filtered =
    activeTab === 'ALL' ? quotes : quotes.filter((q) => q.status === activeTab);

  const countFor = (tab: TabStatus) =>
    tab === 'ALL' ? quotes.length : quotes.filter((q) => q.status === tab).length;

  const pendingCount = quotes.filter((q) => q.status === 'PENDING').length;
  const acceptedCount = quotes.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">عروضي</h1>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            تتبع العروض التي قدمتها على طلبات النقل
          </p>
        </div>

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
            const count = countFor(tab.key);
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
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white' :'bg-[var(--color-surface-container)] text-[var(--color-on-surface-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 size={32} className="animate-spin text-[var(--color-brand-navy)]" />
            <p className="text-sm text-[var(--color-on-surface-muted)]">جارٍ التحميل...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertCircle size={36} className="text-[var(--color-error)]" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={load} className="btn-primary text-sm">
              إعادة المحاولة
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] flex items-center justify-center">
              <MessageSquare size={28} className="text-[var(--color-on-surface-muted)]" />
            </div>
            <p className="text-base font-semibold text-[var(--color-on-surface)]">
              {activeTab === 'ALL' ?'لم تقدم أي عروض بعد'
                : `لا توجد عروض بحالة "${QUOTE_STATUS_LABELS[activeTab as QuoteStatus]}"`}
            </p>
            {activeTab === 'ALL' && (
              <Link href="/browse-transport-requests" className="btn-primary">
                تصفح الطلبات
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((quote) => {
              const config = QUOTE_STATUS_CONFIG[quote.status] ?? QUOTE_STATUS_CONFIG['PENDING'];
              const StatusIcon = config.icon;
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
                          href={`/requests/${quote.requestId}`}
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
                      {quote.status === 'ACCEPTED' && (
                        <Link
                          href="/my-requests"
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
  );
}
