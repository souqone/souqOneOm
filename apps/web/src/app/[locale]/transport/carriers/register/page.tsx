import { AuthGuard } from '@/components/auth-guard';
import CarrierRegistrationForm from '@/features/transport/components/CarrierRegistrationForm';
import { Shield, Clock, FileCheck, Info } from 'lucide-react';

export const metadata = {
  title: 'سجل كناقل - المنصة الشاملة للنقل',
  description: 'سجل كشركة أو فرد لتقديم خدمات النقل في عُمان واربح معنا',
};

export default function CarrierRegistrationPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)] py-6 lg:py-10" dir="rtl">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-on-surface)] mb-2">
              انضم لشبكة الناقلين الموثوقين
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-on-surface-muted)]">
              أكمل بياناتك وأرفق المستندات المطلوبة لبدء استقبال طلبات النقل فور اعتماد حسابك.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Form Section */}
            <div className="w-full lg:w-2/3">
              <CarrierRegistrationForm />
            </div>

            {/* FAQ / Instructions Sidebar */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 sticky top-24">
              <div className="card-base p-6 border-t-4 border-[var(--color-brand-amber)] flex flex-col gap-6 bg-gradient-to-br from-white to-[var(--color-surface-container)]">
                <div className="flex items-center gap-2">
                  <Info className="text-[var(--color-brand-amber)]" size={24} />
                  <h2 className="text-lg font-bold text-[var(--color-on-surface)]">معلومات هامة للتوثيق</h2>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
                    <Shield size={16} className="text-[var(--color-brand-navy)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
                      لماذا جميع البيانات إجبارية؟
                    </h3>
                    <p className="text-xs text-[var(--color-on-surface-muted)] leading-relaxed">
                      نحرص على تقديم بيئة آمنة وعالية الموثوقية للعملاء، طلب الهوية والرخصة يضمن حماية حقوقك وحقوق العميل ويقلل من عمليات الاحتيال.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
                    <Clock size={16} className="text-[var(--color-brand-navy)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
                      كم تستغرق المراجعة؟
                    </h3>
                    <p className="text-xs text-[var(--color-on-surface-muted)] leading-relaxed">
                      يتم مراجعة الطلبات والملفات المرفقة من قبل إدارة المنصة واعتمادها خلال مدة أقصاها 24 ساعة في أيام العمل الرسمية.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center">
                    <FileCheck size={16} className="text-[var(--color-brand-navy)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface-variant)] mb-1">
                      ماذا يحدث بعد التسجيل؟
                    </h3>
                    <p className="text-xs text-[var(--color-on-surface-muted)] leading-relaxed">
                      سيتم تحويلك إلى لوحة التحكم الخاصة بك. يمكنك تصفح الطلبات الحالية، ولكن لا يمكنك استلام شحنات كـ &quot;ناقل موثق&quot; حتى تكتمل المراجعة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--color-info-light)] text-[var(--color-info)] p-4 rounded-xl text-xs font-semibold text-center border border-[var(--color-info)]/20 shadow-sm">
                نضمن سرية وحماية جميع وثائقك ومعلوماتك ولن يتم مشاركتها أو عرضها للعموم بأي شكل.
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
