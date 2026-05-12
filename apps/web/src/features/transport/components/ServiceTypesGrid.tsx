'use client';

import Link from 'next/link';
import { Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench } from 'lucide-react';
import type { TransportServiceType } from '../types';

const SERVICE_CARDS: {
  type: TransportServiceType;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  {
    type: 'GOODS',
    label: 'بضائع عامة',
    sublabel: 'إلكترونيات، مواد غذائية، وغيرها',
    icon: Package,
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
  },
  {
    type: 'FURNITURE',
    label: 'أثاث ومنزليات',
    sublabel: 'نقل الأثاث بعناية واحترافية',
    icon: Sofa,
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
  },
  {
    type: 'CONSTRUCTION',
    label: 'مواد البناء',
    sublabel: 'رمل، إسمنت، طوب، وحديد',
    icon: HardHat,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  {
    type: 'HEAVY',
    label: 'شحن ثقيل',
    sublabel: 'حمولات ضخمة تحتاج معدات خاصة',
    icon: Container,
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
  },
  {
    type: 'BACKLOAD',
    label: 'عودة فارغة',
    sublabel: 'أسعار مخفضة للشاحنات العائدة',
    icon: ArrowLeftRight,
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
  },
  {
    type: 'EQUIPMENT',
    label: 'معدات وآليات',
    sublabel: 'حفارات، رافعات، ومعدات ثقيلة',
    icon: Wrench,
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.08)',
  },
];

export default function ServiceTypesGrid() {
  return (
    <section className="py-8 sm:py-12" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
        <div className="text-center mb-5 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">
            أنواع خدمات النقل
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            اختر نوع الخدمة المناسب لطلبك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {SERVICE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.type}
                href={`/transport/browse?serviceType=${card.type}`}
                className="card-base card-hover p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3"
              >
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon size={22} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                    {card.label}
                  </p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 leading-tight">
                    {card.sublabel}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
