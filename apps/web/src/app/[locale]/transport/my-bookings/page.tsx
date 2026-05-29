'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, Package, MapPin, Banknote, Truck } from 'lucide-react';
import type { TransportBooking, BookingStatus } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { BOOKING_STATUS_LABELS, SERVICE_TYPE_LABELS, CURRENCY_LABEL } from '@/features/transport/constants';
import { AuthGuard } from '@/components/auth-guard';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';

type TabStatus = 'ALL' | BookingStatus;

interface TabDef {
  key: TabStatus;
  label: string;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function MyBookingsPage() {
  const t = useTranslations('transport');

  const TABS: TabDef[] = [
    { key: 'ALL',         label: t('tabs.all') },
    { key: 'ACCEPTED',    label: t('bookingStatus.ACCEPTED') },
    { key: 'IN_PROGRESS', label: t('bookingStatus.IN_PROGRESS') },
    { key: 'COMPLETED',   label: t('tabs.completed') },
    { key: 'CANCELLED',   label: t('tabs.cancelled') },
  ];

  const EMPTY_MESSAGES: Record<TabStatus, string> = {
    ALL:         t('emptyStates.bookingsAll'),
    ACCEPTED:    t('emptyStates.bookingsAccepted'),
    IN_PROGRESS: t('emptyStates.bookingsInProgress'),
    COMPLETED:   t('emptyStates.bookingsCompleted'),
    CANCELLED:   t('emptyStates.bookingsCancelled'),
  };

  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');
  const [role, setRole] = useState<'shipper' | 'carrier'>('shipper');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Generation counter — ignores responses from stale concurrent requests
  const loadGenRef = useRef(0);

  const load = async (tab: TabStatus, page = 1, overrideRole?: 'shipper' | 'carrier') => {
    const gen = ++loadGenRef.current;
    const activeRole = overrideRole ?? role;
    setLoading(true);
    setError('');
    try {
      const res = await transportApi.myBookings(
        activeRole,
        page,
        ITEMS_PER_PAGE,
        tab !== 'ALL' ? tab : undefined
      );
      if (gen !== loadGenRef.current) return; // stale response — discard
      setBookings(res.items);
      setTotalPages(res.meta?.totalPages || 1);
      setCurrentPage(page);
    } catch {
      if (gen !== loadGenRef.current) return;
      setError(t('emptyStates.loadFailed'));
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  };
  useEffect(() => { load(activeTab, 1); }, [activeTab, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (tab: TabStatus) => { setActiveTab(tab); };

  // Reset tab to ALL when switching roles so stale tab filters don't carry over
  const handleRoleChange = (newRole: 'shipper' | 'carrier') => {
    setRole(newRole);
    setActiveTab('ALL');
  };

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">{t('myBookings')}</h1>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {t('emptyStates.manageYourBookings')}
            </p>
          </div>
          <Link href="/transport/browse" className="btn-primary">
            <Truck size={16} />
            تصفح الطلبات
          </Link>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleRoleChange('shipper')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              role === 'shipper'
                ? 'bg-[var(--color-brand-navy)] text-white'
                : 'bg-white text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            {t('asShipper')}
          </button>
          <button
            onClick={() => handleRoleChange('carrier')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              role === 'carrier'
                ? 'bg-[var(--color-brand-navy)] text-white'
                : 'bg-white text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            {t('asCarrier')}
          </button>
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
          <TransportPageLoader />
        ) : error ? (
          <TransportPageError message={error} onRetry={() => load(activeTab)} />
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] flex items-center justify-center">
              <CalendarCheck size={28} className="text-[var(--color-on-surface-muted)]" />
            </div>
            <p className="text-base font-semibold text-[var(--color-on-surface)]">
              {EMPTY_MESSAGES[activeTab]}
            </p>
            {activeTab === 'ALL' && (
              <Link href="/transport/browse" className="btn-primary">
                <Truck size={16} />
                تصفح الطلبات
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => load(activeTab, currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-outline px-4 py-2"
            >
              {t('previous')}
            </button>
            <span className="text-sm font-semibold text-[var(--color-on-surface)]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => load(activeTab, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-outline px-4 py-2"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}

function BookingCard({ booking }: { booking: TransportBooking }) {
  const locale = useLocale();
  const req = booking.request;
  const quote = booking.quote;
  const statusClass = STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-500';

  return (
    <Link
      href={`/transport/bookings/${booking.id}`}
      className="card-base p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
    >
      {/* Top row: status + date */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${statusClass}`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
        <span className="text-xs text-[var(--color-on-surface-muted)]">
          {new Date(booking.confirmedAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}
        </span>
      </div>

      {/* Route */}
      {req && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-[var(--color-on-surface)] font-semibold">
            <Package size={14} className="text-[var(--color-brand-navy)]" />
            {SERVICE_TYPE_LABELS[req.serviceType]}
          </div>
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center gap-0.5 pt-1">
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-green)]" />
              <div className="w-px flex-grow border-r border-dashed border-[var(--color-outline)] min-h-[1.5rem]" />
              <div className="w-2 h-2 rounded-full bg-[var(--color-brand-amber)]" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-[var(--color-brand-green)]" />
                <span className="text-xs font-semibold">{req.fromGovernorate}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-[var(--color-brand-amber)]" />
                <span className="text-xs font-semibold">{req.toGovernorate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price */}
      {quote && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-outline-variant)]">
          <Banknote size={14} className="text-[var(--color-brand-navy)]" />
          <span className="text-sm font-bold text-[var(--color-brand-navy)]">
            {quote.price} {CURRENCY_LABEL}
          </span>
        </div>
      )}
    </Link>
  );
}
