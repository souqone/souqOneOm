import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import CreateRequestWizard from './components/CreateRequestWizard';

export const metadata = {
  title: 'أنشئ طلب نقل — فريت هب',
  description: 'أنشئ طلب نقل بضائع جديد في سلطنة عُمان واستقبل عروض الأسعار',
};

export default function CreateRequestPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <CreateRequestWizard />
      </main>
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}