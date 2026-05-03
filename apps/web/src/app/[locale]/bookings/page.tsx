import { BookingsPageClient } from '@/features/bookings/components/BookingsPageClient';

export const metadata = {
  title: 'حجوزاتي | سوق وان',
  description: 'تابع حجوزاتك وإدارتها',
};

export default function BookingsPage() {
  return <BookingsPageClient />;
}