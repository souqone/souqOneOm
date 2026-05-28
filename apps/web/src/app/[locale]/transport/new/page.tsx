import { AuthGuard } from '@/components/auth-guard';
import CreateRequestWizard from '@/features/transport/components/CreateRequestWizard';

export const metadata = {
  title: 'أنشئ طلب نقل',
  description: 'أنشئ طلب نقل بضائع جديد في سلطنة عُمان واستقبل عروض الأسعار',
};

export default function CreateRequestPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <CreateRequestWizard />
        </main>
        <div className="h-16 md:hidden" />
      </div>
    </AuthGuard>
  );
}

