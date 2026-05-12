import { Suspense } from 'react';
import BrowseContent from '@/features/transport/components/BrowseContent';

export const metadata = {
  title: 'تصفح طلبات النقل',
  description: 'تصفح جميع طلبات نقل البضائع في سلطنة عُمان وقدّم عروضك',
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 sm:py-8">
        <Suspense>
          <BrowseContent />
        </Suspense>
      </main>
      <div className="h-16 md:hidden" />
    </div>
  );
}
