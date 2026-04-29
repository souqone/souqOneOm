'use client'

import { UnifiedCard } from '@/features/listings/components/UnifiedCard'
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types'

const now = new Date().toISOString()

const previewItems: Array<{ label: string; description: string; item: UnifiedListingItem }> = [
  {
    label: 'سيارة للبيع',
    description: 'بيع عادي مع حالة ومؤشرات ثقة',
    item: {
      id: 'car-sale-preview',
      category: 'cars',
      title: 'Toyota Land Cruiser 2022',
      price: 18500,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/toyota.png', '/brands/lexus.png', '/brands/nissan.png', '/brands/bmw.png', '/brands/mercedes-benz.png'],
      governorate: 'OM_MUS',
      createdAt: now,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'شبه جديد', color: 'green' },
      details: [
        { icon: 'Calendar', value: '2022' },
        { icon: 'Gauge', value: '42,000 كم' },
        { icon: 'Settings2', value: 'أوتوماتيك' },
      ],
      href: '/sale/car/car-sale-preview',
      phoneNumber: '+96890000001',
      isPriceNegotiable: true,
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
      attributes: {
        plan: 'PREMIUM',
      },
    },
  },
  {
    label: 'سيارة مطلوبة',
    description: 'طلب شراء مع عرض الميزانية',
    item: {
      id: 'car-wanted-preview',
      category: 'cars',
      title: 'مطلوب Nissan Patrol بحالة ممتازة',
      price: 12000,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/nissan.png', '/brands/toyota.png', '/brands/infiniti.png'],
      governorate: 'OM_BAN',
      createdAt: now,
      primaryBadge: { label: 'مطلوب', color: 'orange' },
      secondaryBadge: { label: 'مستعمل', color: 'blue' },
      details: [
        { icon: 'Calendar', value: '2019+' },
        { icon: 'Gauge', value: 'أقل من 90,000 كم' },
        { icon: 'Fuel', value: 'بنزين' },
      ],
      href: '/sale/car/car-wanted-preview',
      phoneNumber: '+96890000002',
      favoriteEntityType: 'LISTING',
    },
  },
  {
    label: 'سيارة للإيجار',
    description: 'إيجار يومي مع السعر الدوري',
    item: {
      id: 'car-rental-preview',
      category: 'cars',
      title: 'Kia Sportage 2023 للإيجار اليومي',
      price: 22,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: ['/brands/kia.png', '/brands/hyundai.png', '/brands/toyota.png', '/brands/honda.png'],
      governorate: 'OM_DHO',
      createdAt: now,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'جديد', color: 'green' },
      details: [
        { icon: 'Calendar', value: '2023' },
        { icon: 'Settings2', value: 'أوتوماتيك' },
        { icon: 'Tag', value: 'تأمين شامل' },
      ],
      href: '/rental/car/car-rental-preview',
      phoneNumber: '+96890000003',
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
      attributes: {
        plan: 'ELITE',
      },
    },
  },
  {
    label: 'باص للبيع',
    description: 'باص مع السعة والنوع',
    item: {
      id: 'bus-sale-preview',
      category: 'buses',
      title: 'حافلة Toyota Coaster 30 راكب',
      price: 14500,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'OM_SHS',
      createdAt: now,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'Coaster', color: 'gray' },
      details: [
        { icon: 'Users', value: '30 راكب' },
        { icon: 'Bus', value: 'Toyota' },
        { icon: 'Calendar', value: '2020' },
      ],
      href: '/sale/bus/bus-sale-preview',
      phoneNumber: '+96890000004',
      isPriceNegotiable: true,
      favoriteEntityType: 'BUS_LISTING',
    },
  },
  {
    label: 'باص للإيجار',
    description: 'إيجار باص مع سائق',
    item: {
      id: 'bus-rental-preview',
      category: 'buses',
      title: 'باص 50 راكب للإيجار مع سائق',
      price: 65,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_DAK',
      createdAt: now,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع سائق', color: 'blue' },
      details: [
        { icon: 'Users', value: '50 راكب' },
        { icon: 'Bus', value: 'Mercedes' },
        { icon: 'Fuel', value: 'ديزل' },
      ],
      href: '/rental/bus/bus-rental-preview',
      whatsappNumber: '+96890000005',
      sellerVerified: true,
      favoriteEntityType: 'BUS_LISTING',
    },
  },
  {
    label: 'معدة للبيع',
    description: 'معدات ثقيلة للبيع مع الحالة',
    item: {
      id: 'equipment-sale-preview',
      category: 'equipment',
      title: 'حفار Caterpillar 320D للبيع',
      price: 38000,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'OM_WUS',
      createdAt: now,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'جيد', color: 'blue' },
      details: [
        { icon: 'Wrench', value: 'حفار' },
        { icon: 'Settings2', value: 'Caterpillar' },
        { icon: 'Gauge', value: '3,200 س' },
      ],
      href: '/sale/equipment/equipment-sale-preview',
      phoneNumber: '+96890000006',
      isPriceNegotiable: true,
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },
  {
    label: 'معدة للإيجار',
    description: 'إيجار معدة مع مشغّل',
    item: {
      id: 'equipment-rent-preview',
      category: 'equipment',
      title: 'رافعة شوكية للإيجار اليومي',
      price: 45,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAS',
      createdAt: now,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع مشغّل', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'رافعة شوكية' },
        { icon: 'HardHat', value: 'مع مشغّل' },
        { icon: 'Clock', value: 'حد أدنى يومين' },
      ],
      href: '/rental/equipment/equipment-rent-preview',
      whatsappNumber: '+96890000007',
      sellerVerified: true,
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },
  {
    label: 'طلب معدة',
    description: 'طلب استئجار معدة مع ميزانية ومشغّل',
    item: {
      id: 'equipment-request-preview',
      category: 'equipment-requests',
      title: 'مطلوب حفار صغير لمدة أسبوع في مسقط',
      price: 650,
      priceLabel: null,
      priceText: 'الميزانية: 650 ر.ع',
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      primaryBadge: { label: 'طلب معدة', color: 'orange' },
      secondaryBadge: { label: 'مفتوح', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'حفار' },
        { icon: 'Tag', value: 'الكمية: 1' },
        { icon: 'HardHat', value: 'مع مشغّل' },
      ],
      href: '/equipment/requests/equipment-request-preview',
      phoneNumber: '+96890000012',
      sellerVerified: true,
      favoriteEntityType: 'EQUIPMENT_REQUEST',
    },
  },
  {
    label: 'مشغّل معدات',
    description: 'مشغّل مستقل مع خبرة وسعر يومي',
    item: {
      id: 'operator-preview',
      category: 'operators',
      title: 'مشغل رافعات شوكية خبرة 7 سنوات',
      price: 35,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAS',
      createdAt: now,
      primaryBadge: { label: 'مشغّل', color: 'purple' },
      secondaryBadge: { label: '7 سنوات خبرة', color: 'gray' },
      details: [
        { icon: 'HardHat', value: 'مشغّل' },
        { icon: 'Calendar', value: '7 سنوات خبرة' },
        { icon: 'Wrench', value: 'رافعة شوكية، لودر' },
      ],
      href: '/equipment/operators/operator-preview',
      whatsappNumber: '+96890000013',
      isPriceNegotiable: true,
      sellerVerified: true,
      favoriteEntityType: 'OPERATOR_LISTING',
      attributes: {
        plan: 'PREMIUM',
      },
    },
  },
  {
    label: 'قطعة غيار',
    description: 'قطعة أصلية أو بديلة',
    item: {
      id: 'part-preview',
      category: 'parts',
      title: 'كمبروسر مكيف أصلي لكزس',
      price: 120,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      primaryBadge: { label: 'جديد', color: 'green' },
      secondaryBadge: { label: 'أصلي', color: 'green' },
      details: [
        { icon: 'Settings', value: 'كهرباء' },
        { icon: 'Car', value: 'Lexus، Toyota' },
        { icon: 'Calendar', value: '2018–2023' },
      ],
      href: '/sale/part/part-preview',
      phoneNumber: '+96890000008',
      favoriteEntityType: 'SPARE_PART',
    },
  },
  {
    label: 'خدمة سيارات',
    description: 'خدمة مع سعر يبدأ من وشارة منزلية',
    item: {
      id: 'service-preview',
      category: 'services',
      title: 'صيانة متنقلة وفحص شامل للسيارات',
      price: 15,
      priceLabel: null,
      priceText: 'يبدأ من 15 ر.ع',
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      primaryBadge: { label: 'صيانة', color: 'green' },
      secondaryBadge: { label: 'خدمة منزلية', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'صيانة' },
        { icon: 'Building2', value: 'شركة' },
        { icon: 'MapPin', value: 'خدمة منزلية' },
      ],
      href: '/sale/service/service-preview',
      phoneNumber: '+96890000009',
      whatsappNumber: '+96890000009',
      sellerVerified: true,
      favoriteEntityType: 'CAR_SERVICE',
    },
  },
  {
    label: 'مطلوب موظف',
    description: 'إعلان توظيف براتب شهري',
    item: {
      id: 'job-hiring-preview',
      category: 'jobs',
      title: 'مطلوب سائق شاحنة خبرة 3 سنوات',
      price: 450,
      priceLabel: '/شهر',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAN',
      createdAt: now,
      primaryBadge: { label: 'مطلوب موظف', color: 'green' },
      secondaryBadge: { label: 'دوام كامل', color: 'gray' },
      details: [
        { icon: 'Tag', value: 'دوام كامل' },
        { icon: 'Calendar', value: '3 سنوات خبرة' },
        { icon: 'Truck', value: 'رخصة ثقيل' },
      ],
      href: '/jobs/job-hiring-preview',
      phoneNumber: '+96890000010',
      favoriteEntityType: 'JOB',
    },
  },
  {
    label: 'باحث عن عمل',
    description: 'مرشح يعرض خدماته والتفاوض على الراتب',
    item: {
      id: 'job-offering-preview',
      category: 'jobs',
      title: 'سائق خاص يبحث عن عمل في مسقط',
      price: null,
      priceLabel: null,
      priceText: 'قابل للتفاوض',
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      primaryBadge: { label: 'باحث عن عمل', color: 'blue' },
      secondaryBadge: { label: 'دوام جزئي', color: 'gray' },
      details: [
        { icon: 'Tag', value: 'دوام جزئي' },
        { icon: 'Calendar', value: '5 سنوات خبرة' },
        { icon: 'Car', value: 'يملك سيارة' },
      ],
      href: '/jobs/job-offering-preview',
      phoneNumber: '+96890000011',
      favoriteEntityType: 'JOB',
    },
  },
]

export default function UnifiedCardDevPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-surface-container-lowest p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-outline-variant/20 bg-background p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Dev Preview</p>
          <h1 className="mt-2 text-3xl font-black text-on-surface">UnifiedCard Gallery</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
            معاينة بصرية للكارت الأساسي الجديد في حالات البيع والشراء/المطلوب والإيجار والخدمات والمعدات والباصات والتوظيف.
          </p>
        </header>

        <section className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previewItems.map(({ label, description, item }) => (
            <article key={item.id} className="flex h-full flex-col space-y-3 rounded-2xl border border-outline-variant/20 bg-background p-3 shadow-sm">
              <div className="px-1">
                <h2 className="text-sm font-black text-on-surface">{label}</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
              </div>
              <UnifiedCard item={item} className="h-full flex-1" />
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
