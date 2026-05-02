import { BookingsPageClient } from '@/components/bookings/BookingsPageClient';

export const metadata = {
  title: 'حجوزاتي | سوق وان',
  description: 'تابع حجوزاتك وإدارتها',
};

export default function BookingsPage() {
  return <BookingsPageClient />;
}