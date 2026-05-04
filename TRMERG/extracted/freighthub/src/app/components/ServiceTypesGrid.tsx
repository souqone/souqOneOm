import Link from 'next/link';
import { Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench } from 'lucide-react';
import type { TransportServiceType } from '@/features/transport/types';
import Icon from '@/components/ui/AppIcon';


const SERVICE_CARDS: {
  type: TransportServiceType;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    type: 'GOODS',
    label: 'بضائع عامة',
    sublabel: 'سلع تجارية، مواد غذائية',
    Icon: Package,
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.08)',
  },
  {
    type: 'FURNITURE',
    label: 'أثاث ومنزليات',
    sublabel: 'نقل الأثاث والأجهزة',
    Icon: Sofa,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
  {
    type: 'CONSTRUCTION',
    label: 'مواد البناء',
    sublabel: 'إسمنت، حديد، رمل',
    Icon: HardHat,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
  },
  {
    type: 'HEAVY',
    label: 'شحن ثقيل',
    sublabel: 'معدات صناعية ثقيلة',
    Icon: Container,
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.08)',
  },
  {
    type: 'BACKLOAD',
    label: 'عودة فارغة',
    sublabel: 'شحن بأسعار مخفّضة',
    Icon: ArrowLeftRight,
    color: '#16a34a',
    bg: 'rgba(22, 163, 74, 0.08)',
  },
  {
    type: 'EQUIPMENT',
    label: 'معدات وآليات',
    sublabel: 'حفارات، رافعات، قلابات',
    Icon: Wrench,
    color: '#0891b2',
    bg: 'rgba(8, 145, 178, 0.08)',
  },
];

export default function ServiceTypesGrid() {
  return (
    <section className="py-12 sm:py-16" dir="rtl">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2
            className="text-2xl sm:text-3xl text-[var(--color-on-surface)] mb-2"
            style={{ fontWeight: 800 }}
          >
            ما الذي تريد نقله؟
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm sm:text-base">
            اختر نوع الخدمة وابدأ في تلقّي العروض
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {SERVICE_CARDS.map(({ type, label, sublabel, Icon, color, bg }) => (
            <Link
              key={`service-card-${type}`}
              href={`/browse-transport-requests?serviceType=${type}`}
              className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-[var(--color-outline-variant)] bg-white hover:border-transparent hover:shadow-lg transition-all duration-200 text-center"
              style={{
                ['--hover-bg' as string]: bg,
              }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: bg }}
              >
                <Icon size={24} style={{ color }} />
              </div>
              <div>
                <div
                  className="text-sm font-bold text-[var(--color-on-surface)] mb-0.5"
                  style={{ fontWeight: 700 }}
                >
                  {label}
                </div>
                <div className="text-[11px] text-[var(--color-on-surface-muted)] hidden sm:block leading-tight">
                  {sublabel}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}