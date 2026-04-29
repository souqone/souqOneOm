'use client';

import { SellerRow } from '@/features/sale/components/SellerRow';
import type { UnifiedSeller } from '@/features/sale/types/unified.types';

const BASE_SELLER: UnifiedSeller = {
  id: 'seller-001',
  name: 'أحمد بن سعيد',
  image: '/brands/toyota.png',
  phone: '+96891234567',
  whatsapp: '+96891234567',
  governorate: 'muscat',
  verified: true,
  memberSince: '2022-03-15T00:00:00.000Z',
  listingCount: 24,
};

const STATES: Array<{ label: string; description: string; seller: UnifiedSeller }> = [
  {
    label: 'كاملة — مع صورة + موثق + عدد إعلانات',
    description: 'كل البيانات موجودة: صورة، اسم، موثق، تاريخ عضوية، عدد إعلانات',
    seller: { ...BASE_SELLER },
  },
  {
    label: 'بدون صورة — يعرض الحرف الأول',
    description: 'لا توجد صورة للبائع → يعرض أول حرف من الاسم',
    seller: { ...BASE_SELLER, id: 'seller-002', image: undefined },
  },
  {
    label: 'غير موثق',
    description: 'البائع غير موثق → لا تظهر علامة التوثيق',
    seller: { ...BASE_SELLER, id: 'seller-003', verified: false },
  },
  {
    label: 'بدون صورة + غير موثق',
    description: 'لا صورة + غير موثق',
    seller: { ...BASE_SELLER, id: 'seller-004', image: undefined, verified: false },
  },
  {
    label: 'بدون عدد إعلانات',
    description: 'listingCount غير معرّف → لا يظهر عداد الإعلانات',
    seller: { ...BASE_SELLER, id: 'seller-005', listingCount: undefined },
  },
  {
    label: 'عدد إعلانات = 0',
    description: 'listingCount = 0 → لا يظهر العداد',
    seller: { ...BASE_SELLER, id: 'seller-006', listingCount: 0 },
  },
  {
    label: 'إعلان واحد',
    description: 'listingCount = 1',
    seller: { ...BASE_SELLER, id: 'seller-007', listingCount: 1 },
  },
  {
    label: 'عضو جديد (اليوم)',
    description: 'تاريخ العضوية = اليوم',
    seller: { ...BASE_SELLER, id: 'seller-008', memberSince: new Date().toISOString() },
  },
  {
    label: 'عضو قديم (2018)',
    description: 'تاريخ العضوية = يناير 2018',
    seller: { ...BASE_SELLER, id: 'seller-009', memberSince: '2018-01-01T00:00:00.000Z' },
  },
  {
    label: 'اسم طويل جداً',
    description: 'اسم بائع طويل لاختبار الـ overflow',
    seller: { ...BASE_SELLER, id: 'seller-010', name: 'عبدالرحمن بن محمد بن سعيد بن خالد الحارثي المسقطي' },
  },
  {
    label: 'اسم حرف واحد',
    description: 'اسم بحرف واحد فقط',
    seller: { ...BASE_SELLER, id: 'seller-011', name: 'م', image: undefined },
  },
  {
    label: 'بدون هاتف + بدون واتساب',
    description: 'لا يوجد رقم هاتف أو واتساب',
    seller: { ...BASE_SELLER, id: 'seller-012', phone: undefined, whatsapp: undefined },
  },
  {
    label: 'بائع بعدد إعلانات كبير',
    description: 'listingCount = 150',
    seller: { ...BASE_SELLER, id: 'seller-013', listingCount: 150 },
  },
  {
    label: 'الحالة الدنيا — أقل بيانات',
    description: 'اسم فقط + بدون صورة + غير موثق + بدون عدد + بدون هاتف',
    seller: {
      id: 'seller-014',
      name: 'مستخدم',
      governorate: 'dhofar',
      verified: false,
      memberSince: '2024-06-01T00:00:00.000Z',
    },
  },
];

export default function SellerCardDevPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-on-surface mb-2">Seller Card States</h1>
        <p className="text-sm text-on-surface-variant mb-8">كل حالات كارت البائع للتطوير والمراجعة</p>

        <div className="space-y-4">
          {STATES.map((state, i) => (
            <div
              key={i}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden"
            >
              {/* State header */}
              <div className="px-5 pt-4 pb-2 border-b border-outline-variant/10 bg-surface-container-low/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    #{i + 1}
                  </span>
                  <h2 className="text-[13px] font-bold text-on-surface">{state.label}</h2>
                </div>
                <p className="text-[11px] text-on-surface-variant">{state.description}</p>
              </div>

              {/* Card preview */}
              <div className="px-5 py-3">
                <SellerRow seller={state.seller} />
              </div>

              {/* Data dump */}
              <div className="px-5 pb-4">
                <details className="group">
                  <summary className="text-[10px] text-on-surface-variant/60 cursor-pointer hover:text-primary transition-colors select-none">
                    عرض البيانات الخام
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed bg-surface-container rounded-lg p-3 overflow-x-auto text-on-surface-variant" dir="ltr">
                    {JSON.stringify(state.seller, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
