'use client';

import { ClipboardList, Truck, Star, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    num: 1,
    icon: ClipboardList,
    title: 'أنشئ طلبك',
    desc: 'صف احتياجاتك في النقل — نوع البضاعة، المسار، والموعد المناسب.',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    num: 2,
    icon: Truck,
    title: 'استقبل العروض',
    desc: 'يتصفح المزودون المعتمدون طلبك ويرسلون عروضهم مع أسعار واضحة.',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    num: 3,
    icon: Star,
    title: 'اختر الأنسب',
    desc: 'قارن العروض، واقرأ التقييمات، واختر المزود الذي يناسبك.',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    num: 4,
    icon: CheckCircle,
    title: 'أتمّ العملية',
    desc: 'تابع حالة الشحنة وقيّم التجربة بعد اكتمال التسليم.',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-10 sm:py-16 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">
            كيف يعمل المنصة؟
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
            أربع خطوات بسيطة تفصلك عن إتمام عملية النقل بأمان وسهولة
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card-base p-3.5 sm:p-5 flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: step.bg }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: step.color, opacity: 0.25 }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                  {step.title}
                </h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
