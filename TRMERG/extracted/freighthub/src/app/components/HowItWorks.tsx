import { ClipboardList, Search, Handshake, CheckCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const STEPS = [
  {
    key: 'post',
    number: '١',
    icon: ClipboardList,
    title: 'أنشئ طلب نقل',
    desc: 'حدّد نوع البضاعة ومسار الرحلة والميزانية المتوقعة في أقل من 5 دقائق.',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
  },
  {
    key: 'receive',
    number: '٢',
    icon: Search,
    title: 'استقبل العروض',
    desc: 'يتواصل معك مزودو النقل المتاحون بعروض أسعار تنافسية مباشرة.',
    color: 'var(--color-brand-amber)',
    bg: 'rgba(232, 120, 30, 0.08)',
  },
  {
    key: 'accept',
    number: '٣',
    icon: Handshake,
    title: 'اقبل أفضل عرض',
    desc: 'راجع تقييمات المزودين واختر العرض الأنسب لاحتياجاتك وميزانيتك.',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
  {
    key: 'complete',
    number: '٤',
    icon: CheckCircle,
    title: 'أكمل الرحلة بأمان',
    desc: 'تابع حالة الشحنة حتى وصولها وقيّم تجربتك مع المزود.',
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 sm:py-16 bg-white" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2
            className="text-2xl sm:text-3xl text-[var(--color-on-surface)] mb-2"
            style={{ fontWeight: 800 }}
          >
            كيف تعمل المنصة؟
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm sm:text-base">
            أربع خطوات بسيطة تفصلك عن إتمام عملية النقل
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS?.map(({ key, number, icon: Icon, title, desc, color, bg }, index) => (
            <div key={`step-${key}`} className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line (hidden on last item) */}
              {index < STEPS?.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-[var(--color-outline-variant)] -z-0" style={{ right: '-50%', width: '100%' }} />
              )}

              {/* Icon circle */}
              <div
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: bg }}
              >
                <Icon size={28} style={{ color }} />
                {/* Step number */}
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: color, fontWeight: 800 }}
                >
                  {number}
                </div>
              </div>

              <div>
                <h3
                  className="text-base font-bold text-[var(--color-on-surface)] mb-2"
                  style={{ fontWeight: 700 }}
                >
                  {title}
                </h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}