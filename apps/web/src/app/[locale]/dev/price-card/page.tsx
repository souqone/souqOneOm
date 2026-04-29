'use client';

import { useState } from 'react';
import { PriceCard } from '@/features/sale/components/PriceCard';
import type { UnifiedListing } from '@/features/sale/types/unified.types';

const baseSeller: UnifiedListing['seller'] = {
  id: 'seller-price-001',
  name: 'محمود',
  // No image — will show fallback (initial letter in gradient circle)
  phone: '+96891234567',
  whatsapp: '+96891234567',
  governorate: 'muscat',
  verified: true,
  memberSince: '2022-03-15T00:00:00.000Z',
  listingCount: 18,
};

const baseListing: UnifiedListing = {
  id: 'price-card-001',
  type: 'car',
  title: 'تويوتا لاندكروزر 2022 فل كامل',
  description: 'سيارة نظيفة جداً وبحالة ممتازة.',
  price: 4999,
  currency: 'OMR',
  negotiable: true,
  condition: 'USED',
  governorate: 'muscat',
  city: 'seeb',
  images: ['/cars/toyota-land-cruiser-2022.png'],
  seller: baseSeller,
  views: 156,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  status: 'ACTIVE',
  listingType: 'SALE',
  carData: {
    brand: 'Toyota',
    model: 'Land Cruiser',
    year: 2022,
    mileage: 12000,
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    doors: 4,
  },
};

const states: Array<{
  label: string;
  description: string;
  listing: UnifiedListing;
  isOwner?: boolean;
  editRoute?: string;
  enableDelete?: boolean;
}> = [
  {
    label: 'مالك الإعلان — الحالة الكاملة',
    description: 'صورة + موثق + قابل للتفاوض + تعديل + حذف + عدد إعلانات',
    listing: {
      ...baseListing,
      id: 'owner-full',
      views: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isOwner: true,
    editRoute: '/edit-listing/car/owner-full',
    enableDelete: true,
  },
  {
    label: 'مالك الإعلان — بدون صورة وغير موثق',
    description: 'يعرض الحرف الأول بدل الصورة، بدون badge التوثيق، وبدون عدد إعلانات',
    listing: {
      ...baseListing,
      id: 'owner-minimal',
      negotiable: false,
      seller: {
        ...baseSeller,
        id: 'seller-price-002',
        name: 'سالم',
        image: undefined,
        verified: false,
        listingCount: undefined,
      },
      views: 21,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    isOwner: true,
    editRoute: '/edit-listing/car/owner-minimal',
    enableDelete: true,
  },
  {
    label: 'زائر — كل وسائل التواصل متاحة',
    description: 'رسائل + واتساب + اتصال + قابل للتفاوض',
    listing: {
      ...baseListing,
      id: 'visitor-full',
      views: 340,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    label: 'زائر — واتساب فقط',
    description: 'بدون رقم هاتف، فيظهر زر الرسائل + واتساب فقط',
    listing: {
      ...baseListing,
      id: 'visitor-whatsapp',
      seller: {
        ...baseSeller,
        id: 'seller-price-003',
        phone: undefined,
      },
      views: 87,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    label: 'زائر — اتصال فقط',
    description: 'بدون واتساب، فيظهر زر الرسائل + الاتصال فقط',
    listing: {
      ...baseListing,
      id: 'visitor-call',
      seller: {
        ...baseSeller,
        id: 'seller-price-004',
        whatsapp: undefined,
      },
      views: 156,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    label: 'زائر — بدون اتصال مباشر',
    description: 'بدون واتساب وبدون هاتف، فيبقى زر الرسائل فقط',
    listing: {
      ...baseListing,
      id: 'visitor-message-only',
      negotiable: false,
      seller: {
        ...baseSeller,
        id: 'seller-price-005',
        phone: undefined,
        whatsapp: undefined,
      },
      views: 9,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    label: 'خدمة — سعر من إلى',
    description: 'type=service مع priceTo لعرض السعر كمدى',
    listing: {
      ...baseListing,
      id: 'service-range',
      type: 'service',
      title: 'خدمة تلميع وتنظيف متنقلة',
      price: 15,
      negotiable: false,
      listingType: 'SERVICE',
      serviceData: {
        serviceType: 'CAR_WASH',
        providerType: 'INDIVIDUAL',
        priceTo: 35,
        homeService: true,
      },
      seller: {
        ...baseSeller,
        id: 'seller-price-006',
        name: 'مركز النظافة المتنقلة',
        image: undefined,
      },
      views: 412,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export default function PriceCardDevPage() {
  const [lastAction, setLastAction] = useState('لا يوجد تفاعل بعد');

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-on-surface mb-2">Price Card States</h1>
          <p className="text-sm text-on-surface-variant mb-2">معاينة جميع حالات كارت الشريط الجانبي في صفحة تفاصيل البيع</p>
          <p className="text-xs text-on-surface-variant/70">آخر تفاعل: {lastAction}</p>
        </div>

        <div className="lg:hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 text-sm text-on-surface-variant mb-6">
          الكارت نفسه مخفي تحت مقاس `lg` لأنه مصمم كـ desktop sidebar. افتح الصفحة على شاشة أكبر لمعاينته.
        </div>

        <div className="hidden lg:grid lg:grid-cols-2 2xl:grid-cols-3 gap-6 items-start">
          {states.map((state, index) => (
            <div key={state.label} className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-outline-variant/10 bg-surface-container-low/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">#{index + 1}</span>
                  <h2 className="text-[13px] font-bold text-on-surface">{state.label}</h2>
                </div>
                <p className="text-[11px] text-on-surface-variant">{state.description}</p>
              </div>

              <div className="p-5 bg-surface-container-low/20">
                <PriceCard
                  listing={state.listing}
                  isOwner={state.isOwner}
                  editRoute={state.editRoute}
                  onMessage={() => setLastAction(`Message clicked on ${state.label}`)}
                  onWhatsApp={() => setLastAction(`WhatsApp clicked on ${state.label}`)}
                  onCall={state.listing.seller.phone ? () => setLastAction(`Call clicked on ${state.label}`) : undefined}
                  onReport={() => setLastAction(`Report clicked on ${state.label}`)}
                  onDelete={state.enableDelete ? () => setLastAction(`Delete clicked on ${state.label}`) : undefined}
                />
              </div>

              <div className="px-5 pb-4">
                <details className="group">
                  <summary className="text-[10px] text-on-surface-variant/60 cursor-pointer hover:text-primary transition-colors select-none">
                    عرض البيانات الخام
                  </summary>
                  <pre className="mt-2 text-[10px] leading-relaxed bg-surface-container rounded-lg p-3 overflow-x-auto text-on-surface-variant" dir="ltr">
                    {JSON.stringify({
                      isOwner: state.isOwner,
                      editRoute: state.editRoute,
                      seller: state.listing.seller,
                      price: state.listing.price,
                      negotiable: state.listing.negotiable,
                      views: state.listing.views,
                      createdAt: state.listing.createdAt,
                      type: state.listing.type,
                      serviceData: state.listing.serviceData,
                    }, null, 2)}
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
