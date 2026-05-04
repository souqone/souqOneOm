'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, Package } from 'lucide-react';
import type { TransportRequest, RequestStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import TransportRequestCard from '@/features/transport/components/TransportRequestCard';

type TabStatus = 'ALL' | RequestStatus;

interface TabDef {
  key: TabStatus;
  label: string;
}

const TABS: TabDef[] = [
  { key: 'ALL', label: 'الكل' },
  { key: 'OPEN', label: 'مفتوح' },
  { key: 'QUOTED', label: 'وصلت عروض' },
  { key: 'COMPLETED', label: 'مكتمل' },
  { key: 'CANCELLED', label: 'ملغى' },
];

const EMPTY_MESSAGES: Record<TabStatus, string> = {
  ALL: 'لا توجد طلبات بعد. أنشئ طلبك الأول!',
  OPEN: 'لا توجد طلبات مفتوحة حالياً',
  QUOTED: 'لا توجد طلبات وصلت لها عروض',
  ACCEPTED: 'لا توجد طلبات مقبولة',
  IN_PROGRESS: 'لا توجد طلبات جارٍ تنفيذها',
  COMPLETED: 'لا توجد طلبات مكتملة بعد',
  CANCELLED: 'لا توجد طلبات ملغاة',
  EXPIRED: 'لا توجد طلبات منتهية الصلاحية',
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await transportApi.myRequests();
        setRequests(res.items);
      } catch {
        setError('تعذّر تحميل طلباتك');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    activeTab === 'ALL' ? requests : requests.filter((r) => r.status === activeTab);

  const countFor = (tab: TabStatus) =>
    tab === 'ALL' ? requests.length : requests.filter((r) => r.status === tab).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">طلباتي</h1>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              إدارة طلبات النقل الخاصة بك
            </p>
          </div>
          <Link href="/transport/new" className="btn-primary">
            <Plus size={16} />
            أنشئ طلب جديد
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
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
                        ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-muted)]'
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
            <p className="text-sm font-semibold text-[var(--color-on-surface)]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filtered.length === 0 ? (
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
                أنشئ طلبك الأول
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((req) => (
              <TransportRequestCard
                key={req.id}
                request={req}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
