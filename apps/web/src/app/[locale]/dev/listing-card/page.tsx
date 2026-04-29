'use client'

import { ListingCard } from '@/features/listings/components/ListingCard'
import type { UnifiedListingItem, BadgeColor } from '@/features/listings/types/unified-item.types'

const now = new Date().toISOString()

// ── All badge colors used in the app ──
const ALL_BADGES: Array<{ label: string; color: BadgeColor }> = [
  { label: 'للبيع', color: 'blue' },
  { label: 'للإيجار', color: 'green' },
  { label: 'مطلوب', color: 'orange' },
  { label: 'مشغّل', color: 'purple' },
  { label: 'مستعمل', color: 'gray' },
  { label: 'خطير', color: 'red' },
]

const previewItems: Array<{ label: string; description: string; item: UnifiedListingItem }> = [
  // ── Cars ──
  {
    label: 'سيارة للبيع',
    description: 'بيع عادي — primaryBadge: blue, secondaryBadge: green',
    item: {
      id: 'lc-car-sale',
      category: 'cars',
      title: 'Toyota Land Cruiser 2022 VXR فل كامل',
      price: 18500,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/toyota.png', '/brands/lexus.png', '/brands/nissan.png', '/brands/bmw.png', '/brands/mercedes-benz.png'],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 342,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'شبه جديد', color: 'green' },
      details: [
        { icon: 'Calendar', value: '2022' },
        { icon: 'Gauge', value: '42,000 كم' },
        { icon: 'Settings2', value: 'أوتوماتيك' },
        { icon: 'Fuel', value: 'بنزين' },
      ],
      href: '/sale/car/lc-car-sale',
      phoneNumber: '+96890000001',
      whatsappNumber: '+96890000001',
      isPriceNegotiable: true,
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
      attributes: { plan: 'PREMIUM' },
    },
  },
  {
    label: 'سيارة مطلوبة',
    description: 'طلب شراء — primaryBadge: orange, secondaryBadge: blue',
    item: {
      id: 'lc-car-wanted',
      category: 'cars',
      title: 'مطلوب Nissan Patrol بحالة ممتازة',
      price: 12000,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/nissan.png', '/brands/toyota.png', '/brands/infiniti.png'],
      governorate: 'OM_BAN',
      createdAt: now,
      viewCount: 89,
      primaryBadge: { label: 'مطلوب', color: 'orange' },
      secondaryBadge: { label: 'مستعمل', color: 'blue' },
      details: [
        { icon: 'Calendar', value: '2019+' },
        { icon: 'Gauge', value: 'أقل من 90,000 كم' },
        { icon: 'Fuel', value: 'بنزين' },
      ],
      href: '/sale/car/lc-car-wanted',
      phoneNumber: '+96890000002',
      favoriteEntityType: 'LISTING',
    },
  },
  {
    label: 'سيارة للإيجار',
    description: 'إيجار يومي — primaryBadge: green, secondaryBadge: green, plan: ELITE',
    item: {
      id: 'lc-car-rental',
      category: 'cars',
      title: 'Kia Sportage 2023 للإيجار اليومي',
      price: 22,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: ['/brands/kia.png', '/brands/hyundai.png', '/brands/toyota.png', '/brands/honda.png'],
      governorate: 'OM_DHO',
      createdAt: now,
      viewCount: 156,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'جديد', color: 'green' },
      details: [
        { icon: 'Calendar', value: '2023' },
        { icon: 'Settings2', value: 'أوتوماتيك' },
        { icon: 'Tag', value: 'تأمين شامل' },
      ],
      href: '/rental/car/lc-car-rental',
      phoneNumber: '+96890000003',
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
      attributes: { plan: 'ELITE' },
    },
  },

  // ── Buses ──
  {
    label: 'باص للبيع',
    description: 'primaryBadge: blue, secondaryBadge: gray (نوع الباص)',
    item: {
      id: 'lc-bus-sale',
      category: 'buses',
      title: 'حافلة Toyota Coaster 30 راكب 2020',
      price: 14500,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/toyota.png', '/brands/mercedes-benz.png'],
      governorate: 'OM_SHS',
      createdAt: now,
      viewCount: 74,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'Coaster', color: 'gray' },
      details: [
        { icon: 'Users', value: '30 راكب' },
        { icon: 'Bus', value: 'Toyota' },
        { icon: 'Calendar', value: '2020' },
        { icon: 'Fuel', value: 'ديزل' },
      ],
      href: '/sale/bus/lc-bus-sale',
      phoneNumber: '+96890000004',
      isPriceNegotiable: true,
      favoriteEntityType: 'BUS_LISTING',
    },
  },
  {
    label: 'باص للإيجار',
    description: 'primaryBadge: green, secondaryBadge: blue (مع سائق)',
    item: {
      id: 'lc-bus-rental',
      category: 'buses',
      title: 'باص 50 راكب للإيجار مع سائق',
      price: 65,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_DAK',
      createdAt: now,
      viewCount: 45,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع سائق', color: 'blue' },
      details: [
        { icon: 'Users', value: '50 راكب' },
        { icon: 'Bus', value: 'Mercedes' },
        { icon: 'Fuel', value: 'ديزل' },
      ],
      href: '/rental/bus/lc-bus-rental',
      whatsappNumber: '+96890000005',
      sellerVerified: true,
      favoriteEntityType: 'BUS_LISTING',
    },
  },

  // ── Equipment ──
  {
    label: 'معدة للبيع',
    description: 'primaryBadge: blue, secondaryBadge: blue (حالة)',
    item: {
      id: 'lc-equip-sale',
      category: 'equipment',
      title: 'حفار Caterpillar 320D للبيع',
      price: 38000,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/generic.png', '/brands/generic.png', '/brands/generic.png'],
      governorate: 'OM_WUS',
      createdAt: now,
      viewCount: 128,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'جيد', color: 'blue' },
      details: [
        { icon: 'Wrench', value: 'حفار' },
        { icon: 'Settings2', value: 'Caterpillar' },
        { icon: 'Gauge', value: '3,200 ساعة' },
      ],
      href: '/sale/equipment/lc-equip-sale',
      phoneNumber: '+96890000006',
      isPriceNegotiable: true,
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },
  {
    label: 'معدة للإيجار',
    description: 'primaryBadge: green, secondaryBadge: green (مع مشغّل)',
    item: {
      id: 'lc-equip-rent',
      category: 'equipment',
      title: 'رافعة شوكية للإيجار اليومي مع مشغّل',
      price: 45,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAS',
      createdAt: now,
      viewCount: 33,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع مشغّل', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'رافعة شوكية' },
        { icon: 'HardHat', value: 'مع مشغّل' },
      ],
      href: '/rental/equipment/lc-equip-rent',
      whatsappNumber: '+96890000007',
      sellerVerified: true,
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },

  // ── Equipment Request ──
  {
    label: 'طلب معدة',
    description: 'primaryBadge: orange, secondaryBadge: green (مفتوح), priceText',
    item: {
      id: 'lc-equip-req',
      category: 'equipment-requests',
      title: 'مطلوب حفار صغير لمدة أسبوع في مسقط',
      price: 650,
      priceLabel: null,
      priceText: 'الميزانية: 650 ر.ع',
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 21,
      primaryBadge: { label: 'طلب معدة', color: 'orange' },
      secondaryBadge: { label: 'مفتوح', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'حفار' },
        { icon: 'Tag', value: 'الكمية: 1' },
        { icon: 'HardHat', value: 'مع مشغّل' },
      ],
      href: '/equipment/requests/lc-equip-req',
      phoneNumber: '+96890000012',
      sellerVerified: true,
      favoriteEntityType: 'EQUIPMENT_REQUEST',
    },
  },

  // ── Operators ──
  {
    label: 'مشغّل معدات',
    description: 'primaryBadge: purple, secondaryBadge: gray, plan: PREMIUM',
    item: {
      id: 'lc-operator',
      category: 'operators',
      title: 'مشغل رافعات شوكية خبرة 7 سنوات',
      price: 35,
      priceLabel: 'يومياً',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAS',
      createdAt: now,
      viewCount: 67,
      primaryBadge: { label: 'مشغّل', color: 'purple' },
      secondaryBadge: { label: '7 سنوات خبرة', color: 'gray' },
      details: [
        { icon: 'HardHat', value: 'مشغّل' },
        { icon: 'Calendar', value: '7 سنوات خبرة' },
        { icon: 'Wrench', value: 'رافعة شوكية، لودر' },
      ],
      href: '/equipment/operators/lc-operator',
      whatsappNumber: '+96890000013',
      isPriceNegotiable: true,
      sellerVerified: true,
      favoriteEntityType: 'OPERATOR_LISTING',
      attributes: { plan: 'PREMIUM' },
    },
  },

  // ── Parts ──
  {
    label: 'قطعة غيار',
    description: 'primaryBadge: green (جديد), secondaryBadge: green (أصلي)',
    item: {
      id: 'lc-part',
      category: 'parts',
      title: 'كمبروسر مكيف أصلي لكزس ES350',
      price: 120,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/lexus.png', '/brands/toyota.png'],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 95,
      primaryBadge: { label: 'جديد', color: 'green' },
      secondaryBadge: { label: 'أصلي', color: 'green' },
      details: [
        { icon: 'Settings', value: 'كهرباء' },
        { icon: 'Car', value: 'Lexus، Toyota' },
        { icon: 'Calendar', value: '2018–2023' },
      ],
      href: '/sale/part/lc-part',
      phoneNumber: '+96890000008',
      favoriteEntityType: 'SPARE_PART',
    },
  },

  // ── Services ──
  {
    label: 'خدمة سيارات',
    description: 'primaryBadge: green, secondaryBadge: green (منزلية), priceText',
    item: {
      id: 'lc-service',
      category: 'services',
      title: 'صيانة متنقلة وفحص شامل للسيارات',
      price: 15,
      priceLabel: null,
      priceText: 'يبدأ من 15 ر.ع',
      currency: 'OMR',
      images: ['/brands/generic.png', '/brands/generic.png', '/brands/generic.png'],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 210,
      primaryBadge: { label: 'صيانة', color: 'green' },
      secondaryBadge: { label: 'خدمة منزلية', color: 'green' },
      details: [
        { icon: 'Wrench', value: 'صيانة' },
        { icon: 'Building2', value: 'شركة' },
        { icon: 'MapPin', value: 'خدمة منزلية' },
      ],
      href: '/sale/service/lc-service',
      phoneNumber: '+96890000009',
      whatsappNumber: '+96890000009',
      sellerVerified: true,
      favoriteEntityType: 'CAR_SERVICE',
    },
  },

  // ── Jobs ──
  {
    label: 'مطلوب موظف (توظيف)',
    description: 'primaryBadge: green, secondaryBadge: gray (دوام كامل)',
    item: {
      id: 'lc-job-hiring',
      category: 'jobs',
      title: 'مطلوب سائق شاحنة خبرة 3 سنوات',
      price: 450,
      priceLabel: '/شهر',
      currency: 'OMR',
      images: [],
      governorate: 'OM_BAN',
      createdAt: now,
      viewCount: 312,
      primaryBadge: { label: 'مطلوب موظف', color: 'green' },
      secondaryBadge: { label: 'دوام كامل', color: 'gray' },
      details: [
        { icon: 'Tag', value: 'دوام كامل' },
        { icon: 'Calendar', value: '3 سنوات خبرة' },
        { icon: 'Truck', value: 'رخصة ثقيل' },
      ],
      href: '/jobs/lc-job-hiring',
      phoneNumber: '+96890000010',
      favoriteEntityType: 'JOB',
    },
  },
  {
    label: 'باحث عن عمل',
    description: 'primaryBadge: blue, secondaryBadge: gray, priceText (قابل للتفاوض)',
    item: {
      id: 'lc-job-offering',
      category: 'jobs',
      title: 'سائق خاص يبحث عن عمل في مسقط',
      price: null,
      priceLabel: null,
      priceText: 'قابل للتفاوض',
      currency: 'OMR',
      images: [],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 58,
      primaryBadge: { label: 'باحث عن عمل', color: 'blue' },
      secondaryBadge: { label: 'دوام جزئي', color: 'gray' },
      details: [
        { icon: 'Tag', value: 'دوام جزئي' },
        { icon: 'Calendar', value: '5 سنوات خبرة' },
        { icon: 'Car', value: 'يملك سيارة' },
      ],
      href: '/jobs/lc-job-offering',
      phoneNumber: '+96890000011',
      favoriteEntityType: 'JOB',
    },
  },

  // ── Edge cases ──
  {
    label: 'بدون سعر (اتصل)',
    description: 'price: null — يعرض "اتصل للسعر"',
    item: {
      id: 'lc-no-price',
      category: 'cars',
      title: 'Mercedes G-Class بمواصفات خاصة',
      price: null,
      priceLabel: null,
      currency: 'OMR',
      images: ['/brands/mercedes-benz.png'],
      governorate: 'OM_MUS',
      createdAt: now,
      viewCount: 500,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: null,
      details: [
        { icon: 'Calendar', value: '2024' },
        { icon: 'Settings2', value: 'أوتوماتيك' },
      ],
      href: '/sale/car/lc-no-price',
      phoneNumber: '+96890000020',
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
    },
  },
  {
    label: 'بدون صور',
    description: 'images: [] — يعرض placeholder',
    item: {
      id: 'lc-no-images',
      category: 'equipment',
      title: 'مولد كهربائي 500 KVA للبيع',
      price: 8500,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'OM_WUS',
      createdAt: now,
      viewCount: 12,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'مستعمل', color: 'gray' },
      details: [
        { icon: 'Wrench', value: 'مولد كهربائي' },
        { icon: 'Gauge', value: '500 KVA' },
      ],
      href: '/sale/equipment/lc-no-images',
      phoneNumber: '+96890000021',
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },
]

export default function ListingCardDevPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-surface-container-lowest p-4 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="rounded-3xl border border-outline-variant/20 bg-background p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Dev Preview</p>
          <h1 className="mt-2 text-3xl font-black text-on-surface">ListingCard Gallery</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-on-surface-variant">
            معاينة بصرية للكارت الأفقي (ListingCard) في جميع الأقسام مع كل أنواع البادجات والحالات.
          </p>
        </header>

        {/* Badge Reference */}
        <section className="rounded-2xl border border-outline-variant/20 bg-background p-5 shadow-sm">
          <h2 className="text-sm font-black text-on-surface mb-3">Badge Colors Reference</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_BADGES.map((b) => (
              <span
                key={b.color}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white ${
                  b.color === 'green' ? 'bg-emerald-500' :
                  b.color === 'blue' ? 'bg-blue-500' :
                  b.color === 'orange' ? 'bg-red-500' :
                  b.color === 'purple' ? 'bg-blue-600' :
                  b.color === 'gray' ? 'bg-slate-400' :
                  'bg-red-500'
                }`}
              >
                {b.label}
                <span className="opacity-70">({b.color})</span>
              </span>
            ))}
          </div>
        </section>

        {/* Cards Grid */}
        <section className="space-y-5">
          {previewItems.map(({ label, description, item }) => (
            <article key={item.id} className="rounded-2xl border border-outline-variant/20 bg-background p-4 shadow-sm space-y-3">
              <div className="px-1">
                <h2 className="text-sm font-black text-on-surface">{label}</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant font-mono">{description}</p>
              </div>
              <ListingCard item={item} />
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
