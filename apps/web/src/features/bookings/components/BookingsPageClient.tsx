'use client';

import { useState, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { useMyBookings, useReceivedBookings } from '@/lib/api';
import { useCancelBooking, useConfirmBooking, useRejectBooking } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import type { BookingItem } from '@/lib/api';
import { useToast } from '@/components/toast';
import { useTranslations } from 'next-intl';
import { BOOKING_TABS } from '@/lib/constants/bookings';
import type { BookingTabKey } from '@/lib/constants/bookings';
import { BookingsRoleToggle } from './BookingsRoleToggle';
import { BookingsStatsBar } from './BookingsStatsBar';
import { BookingsFilterTabs } from './BookingsFilterTabs';
import { BookingsList } from './BookingsList';
import { BookingsListSkeleton } from './BookingsListSkeleton';
import { BookingActiveHighlight } from './BookingActiveHighlight';
import { BookingPendingOwnerAlert } from './BookingPendingOwnerAlert';
import { BookingRateModal } from './BookingRateModal';

type BookingRole = 'renter' | 'owner';

export function BookingsPageClient() {
  return (
    <AuthGuard>
      <BookingsContent />
    </AuthGuard>
  );
}

function BookingsContent() {
  const tb = useTranslations('bookings');
  const router = useRouter();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [role, setRole]               = useState<BookingRole>('renter');
  const [tab, setTab]                 = useState<BookingTabKey>('all');
  const [ratingBooking, setRating]    = useState<BookingItem | null>(null);

  const { data: renterData, isLoading: renterLoading } = useMyBookings();
  const { data: ownerData,  isLoading: ownerLoading  } = useReceivedBookings();

  const cancelMut  = useCancelBooking();
  const confirmMut = useConfirmBooking();
  const rejectMut  = useRejectBooking();

  const renterBookings: BookingItem[] = renterData?.items ?? [];
  const ownerBookings:  BookingItem[] = ownerData?.items  ?? [];
  const currentBookings = role === 'renter' ? renterBookings : ownerBookings;
  const isLoading       = role === 'renter' ? renterLoading  : ownerLoading;

  const filtered = useMemo(() => {
    const tabDef = BOOKING_TABS.find(t => t.key === tab);
    if (!tabDef?.statuses) return currentBookings;
    const statuses = tabDef.statuses as unknown as string[];
    return currentBookings.filter(b => statuses.includes(b.status));
  }, [currentBookings, tab]);

  const activeBooking = currentBookings.find(b => b.status === 'ACTIVE');
  const pendingCount  = ownerBookings.filter(b => b.status === 'PENDING').length;

  /* ── Optimistic cancel ── */
  async function handleCancel(id: string) {
    const key = role === 'renter' ? ['my-bookings'] : ['received-bookings'];
    const prev = qc.getQueryData(key);
    qc.setQueryData(key, (old: any) => old
      ? { ...old, items: old.items.map((b: BookingItem) => b.id === id ? { ...b, status: 'CANCELLED' } : b) }
      : old);
    try {
      await cancelMut.mutateAsync(id);
    } catch {
      qc.setQueryData(key, prev);
      addToast('error', tb('errorCancel'));
    }
  }

  /* ── Optimistic confirm ── */
  async function handleConfirm(id: string) {
    const prev = qc.getQueryData(['received-bookings']);
    qc.setQueryData(['received-bookings'], (old: any) => old
      ? { ...old, items: old.items.map((b: BookingItem) => b.id === id ? { ...b, status: 'CONFIRMED' } : b) }
      : old);
    try {
      await confirmMut.mutateAsync(id);
    } catch {
      qc.setQueryData(['received-bookings'], prev);
      addToast('error', tb('errorConfirm'));
    }
  }

  /* ── Optimistic reject ── */
  async function handleReject(id: string) {
    const prev = qc.getQueryData(['received-bookings']);
    qc.setQueryData(['received-bookings'], (old: any) => old
      ? { ...old, items: old.items.map((b: BookingItem) => b.id === id ? { ...b, status: 'REJECTED' } : b) }
      : old);
    try {
      await rejectMut.mutateAsync(id);
    } catch {
      qc.setQueryData(['received-bookings'], prev);
      addToast('error', tb('errorConfirm'));
    }
  }

  function handleChat(userId: string) {
    router.push(`/messages?userId=${userId}`);
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background" dir="rtl">

        {/* ── Mobile ── */}
        <div className="md:hidden">
          <div className="px-3 pt-20 pb-3 space-y-2">
            <BookingsRoleToggle role={role} onChange={(r) => { setRole(r); setTab('all'); }} />
            <BookingsStatsBar bookings={currentBookings} />
          </div>
          <BookingsFilterTabs tab={tab} onChange={setTab} bookings={currentBookings} />
          <main className="px-3 pt-3 pb-24 space-y-3" id="main-content">
            {isLoading
              ? <BookingsListSkeleton />
              : <BookingsList bookings={filtered} role={role} tab={tab}
                  onRate={setRating} onConfirm={handleConfirm}
                  onReject={handleReject} onCancel={handleCancel} onChat={handleChat}
                />
            }
          </main>
        </div>

        {/* ── Desktop ── */}
        <div className="hidden md:block">
          <div className="max-w-5xl mx-auto px-6 pt-28 pb-8 flex gap-6">

            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 space-y-4 sticky top-20 h-fit">
              <BookingsRoleToggle role={role} onChange={(r) => { setRole(r); setTab('all'); }} />
              <BookingsStatsBar bookings={currentBookings} variant="vertical" />
              {activeBooking && <BookingActiveHighlight booking={activeBooking} />}
              {role === 'owner' && pendingCount > 0 && (
                <BookingPendingOwnerAlert count={pendingCount} onTabChange={setTab} />
              )}
            </aside>

            {/* Main */}
            <main className="flex-1 min-w-0 pb-8" id="main-content">
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-semibold text-on-surface text-xl">
                  {role === 'renter' ? tb('myBookings') : tb('bookingsOnMyListings')}
                </h1>
              </div>
              <BookingsFilterTabs tab={tab} onChange={setTab} bookings={currentBookings} variant="pills" />
              <div className="mt-4 space-y-3">
                {isLoading
                  ? <BookingsListSkeleton />
                  : <BookingsList bookings={filtered} role={role} tab={tab}
                      onRate={setRating} onConfirm={handleConfirm}
                      onReject={handleReject} onCancel={handleCancel} onChat={handleChat}
                    />
                }
              </div>
            </main>
          </div>
        </div>
      </div>

      <BookingRateModal
        booking={ratingBooking}
        role={role}
        onClose={() => setRating(null)}
      />

      <div className="hidden md:block"><Footer /></div>
    </>
  );
}
