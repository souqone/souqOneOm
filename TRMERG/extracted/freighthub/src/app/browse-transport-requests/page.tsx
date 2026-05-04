import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import BrowseContent from './components/BrowseContent';

export const metadata = {
  title: 'تصفح طلبات النقل — فريت هب',
  description: 'تصفح جميع طلبات نقل البضائع في سلطنة عُمان وقدّم عروضك',
};

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BrowseContent />
      </main>
      <Footer />
      <BottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}