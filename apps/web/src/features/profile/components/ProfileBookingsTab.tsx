import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getBookingEntity, type BookingItem } from '@/lib/api/bookings';
import { getImageUrl } from '@/lib/image-utils';

interface ProfileBookingsTabProps {
  bookings: BookingItem[];
  labels: {
    emptyTitle: string;
    emptyDescription: string;
    currency: string;
  };
}

export function ProfileBookingsTab({ bookings, labels }: ProfileBookingsTabProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">calendar_month</span>
        </div>
        <p className="text-on-surface font-bold">{labels.emptyTitle}</p>
        <p className="text-on-surface-variant text-sm">{labels.emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {bookings.map((booking) => {
        const entity = getBookingEntity(booking);
        const img = entity.images?.find((i: any) => i.isPrimary) ?? entity.images?.[0];
        const imgUrl = typeof img === 'string' ? img : img?.url;

        return (
          <Link key={booking.id} href={`/bookings/${booking.id}`} className="block rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 hover:border-outline-variant/30 hover:shadow-sm transition-all">
            <div className="flex gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                {imgUrl ? (
                  <Image src={getImageUrl(imgUrl) || ''} alt={entity.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-2xl">calendar_month</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium text-on-surface truncate">{entity.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant flex-shrink-0">{booking.status}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </p>
                <p className="text-[12px] text-primary font-bold mt-1">
                  {Number(booking.totalPrice).toLocaleString('en-US')} {booking.currency || labels.currency}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
