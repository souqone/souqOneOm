import { BookingCardSkeleton } from './BookingCardSkeleton';

export function BookingsListSkeleton() {
  return (
    <div className="space-y-3">
      <BookingCardSkeleton />
      <BookingCardSkeleton />
      <BookingCardSkeleton />
    </div>
  );
}
