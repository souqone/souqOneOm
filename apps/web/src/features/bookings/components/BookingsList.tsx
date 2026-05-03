'use client';

import { BookingCard } from './BookingCard';
import { BookingsEmptyState } from './empty/BookingsEmptyState';
import type { BookingItem } from '@/lib/api';
import type { BookingTabKey } from '@/lib/constants/bookings';

type BookingRole = 'renter' | 'owner';

interface Props {
  bookings: BookingItem[];
  role: BookingRole;
  tab: BookingTabKey;
  onRate: (b: BookingItem) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  onChat: (userId: string) => void;
}

export function BookingsList({ bookings, role, tab, onRate, onConfirm, onReject, onCancel, onChat }: Props) {
  if (bookings.length === 0) return <BookingsEmptyState tab={tab} role={role} />;

  return (
    <div className="space-y-3">
      {bookings.map(b => (
        <BookingCard
          key={b.id}
          booking={b}
          role={role}
          onRate={onRate}
          onConfirm={onConfirm}
          onReject={onReject}
          onCancel={onCancel}
          onChat={onChat}
        />
      ))}
    </div>
  );
}
