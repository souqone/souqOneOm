'use client';

import { Link } from '@/i18n/navigation';
import { Search, Tag, CheckCircle, ArrowLeft } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'تصفّح الطلبات',
    desc: 'ابحث عن طلبات تناسب مركبتك ومنطقتك من صفحة التصفح',
  },
  {
    icon: Tag,
    title: 'قدّم عرض سعر',
    desc: 'أدخل سعرك وأي ملاحظات للشاحن — العرض مجاني تماماً',
  },
  {
    icon: CheckCircle,
    title: 'ابدأ الرحلة وأتمّها',
    desc: 'بعد قبول عرضك، اضغط "بدأت التحميل" ثم "تم التسليم" عند الوصول',
  },
];

export default function CarrierOnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[var(--color-brand-navy)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">
            مرحباً بك في سوق وان!
          </h1>
          <p className="text-sm text-[var(--color-on-surface-muted)] mt-2">
            تم تسجيلك كناقل بنجاح. إليك كيف تبدأ:
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {STEPS.map((step, i) => (
            <div key={i} className="card-base p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-navy)]/10 flex items-center justify-center flex-shrink-0">
                <step.icon size={18} className="text-[var(--color-brand-navy)]" />
              </div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-[var(--color-on-surface-muted)] mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/transport/browse"
          className="btn-primary w-full justify-center flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          ابدأ تصفح الطلبات
        </Link>

        <Link
          href="/transport/carriers/dashboard"
          className="btn-ghost w-full justify-center mt-3 text-sm"
        >
          الذهاب للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
