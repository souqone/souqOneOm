'use client';

/**
 * ──────────────────────────────────────────────────────────────────
 *  🛠  DEV ONLY — Card Sandbox
 *  صفحة تطوير لعرض كارت UnifiedCard في جميع حالاته
 *  الرابط: /[locale]/dev/card-sandbox
 * ──────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import type { UnifiedListingItem } from '@/features/listings/types/unified-item.types';

// ── Dummy Images ──────────────────────────────────────────────────

const CAR_IMG    = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80';
const BUS_IMG    = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80';
const TRUCK_IMG  = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80';
const PART_IMG   = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80';
const WORKER_IMG = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80';

// ── Mock Items ────────────────────────────────────────────────────

const ITEMS: Array<{ label: string; desc: string; item: UnifiedListingItem }> = [
  // ─── 1. Car — For Sale (Normal)
  {
    label: '🚗 سيارة للبيع — عادي',
    desc: 'كارت عادي بدون تمييز، صورة واحدة',
    item: {
      id: 'car-normal',
      category: 'cars',
      title: 'تويوتا كامري XLE 2022',
      price: 8500,
      priceLabel: null,
      currency: 'OMR',
      images: [CAR_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      viewCount: 142,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: null,
      details: [
        { icon: 'Calendar', value: '2022' },
        { icon: 'Gauge', value: '45,000 كم' },
        { icon: 'Settings', value: 'أوتوماتيك' },
      ],
      href: '#',
      sellerVerified: false,
      isPriceNegotiable: false,
      favoriteEntityType: 'LISTING',
    },
  },

  // ─── 2. Car — For Sale (ELITE)
  {
    label: '⭐ سيارة Elite',
    desc: 'حالة Elite — إطار ذهبي + ريبون تاج',
    item: {
      id: 'car-elite',
      category: 'cars',
      title: 'مرسيدس S500 AMG 2023 — فل كامل',
      price: 32000,
      priceLabel: null,
      currency: 'OMR',
      images: [CAR_IMG, TRUCK_IMG, BUS_IMG, PART_IMG, WORKER_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      viewCount: 980,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: { label: 'موثق', color: 'green' },
      details: [
        { icon: 'Calendar', value: '2023' },
        { icon: 'Gauge', value: '12,000 كم' },
        { icon: 'Settings', value: 'أوتوماتيك' },
      ],
      href: '#',
      sellerVerified: true,
      isPriceNegotiable: false,
      favoriteEntityType: 'LISTING',
      attributes: { plan: 'ELITE', isPremium: true },
    },
  },

  // ─── 3. Car — For Sale (PREMIUM)
  {
    label: '🥈 سيارة Premium',
    desc: 'حالة Premium — إطار فضي + ريبون نجمة',
    item: {
      id: 'car-premium',
      category: 'cars',
      title: 'لكزس LX600 2022',
      price: 28500,
      priceLabel: null,
      currency: 'OMR',
      images: [CAR_IMG, TRUCK_IMG],
      governorate: 'dhofar',
      createdAt: new Date().toISOString(),
      viewCount: 450,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: null,
      details: [
        { icon: 'Calendar', value: '2022' },
        { icon: 'Gauge', value: '30,000 كم' },
        { icon: 'Fuel', value: 'بنزين' },
      ],
      href: '#',
      sellerVerified: false,
      favoriteEntityType: 'LISTING',
      attributes: { plan: 'PREMIUM', isPremium: true },
    },
  },

  // ─── 4. Car — Rental
  {
    label: '📅 سيارة إيجار',
    desc: 'سعر يومي + priceLabel',
    item: {
      id: 'car-rental',
      category: 'cars',
      title: 'نيسان ألتيما 2021 — للإيجار',
      price: 25,
      priceLabel: 'يوم',
      currency: 'OMR',
      images: [CAR_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      viewCount: 78,
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع سائق', color: 'orange' },
      details: [
        { icon: 'Calendar', value: '2021' },
        { icon: 'Users', value: '5 مقاعد' },
        { icon: 'Settings', value: 'أوتوماتيك' },
      ],
      href: '#',
      isPriceNegotiable: true,
      favoriteEntityType: 'LISTING',
    },
  },

  // ─── 5. Car — Wanted
  {
    label: '🔍 سيارة مطلوبة',
    desc: 'كارت مطلوب — يعرض "الميزانية:"',
    item: {
      id: 'car-wanted',
      category: 'cars',
      title: 'مطلوب يوكن أو تاهو موديل 2020 فأكثر',
      price: 12000,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      viewCount: 33,
      primaryBadge: { label: 'مطلوب', color: 'orange' },
      secondaryBadge: null,
      details: [
        { icon: 'Calendar', value: '2020+' },
        { icon: 'Gauge', value: 'أقل من 100k' },
      ],
      href: '#',
      favoriteEntityType: 'LISTING',
    },
  },

  // ─── 6. No Image
  {
    label: '🖼️ بدون صورة',
    desc: 'fallback placeholder مع أيقونة الفئة',
    item: {
      id: 'no-image',
      category: 'cars',
      title: 'هوندا سيفيك 2019',
      price: 4200,
      priceLabel: null,
      currency: 'OMR',
      images: [],
      governorate: 'batinah',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: null,
      details: [{ icon: 'Calendar', value: '2019' }],
      href: '#',
      favoriteEntityType: 'LISTING',
    },
  },

  // ─── 7. No Price
  {
    label: '💬 بدون سعر',
    desc: '"اتصل لمعرفة السعر"',
    item: {
      id: 'no-price',
      category: 'services',
      title: 'خدمة صيانة متكاملة — ورشة الفحم',
      price: null,
      priceLabel: null,
      currency: 'OMR',
      images: [WORKER_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'صيانة', color: 'purple' },
      secondaryBadge: { label: 'خدمة منزلية', color: 'blue' },
      details: [
        { icon: 'Wrench', value: 'كهربائي' },
        { icon: 'Building', value: 'شركة' },
      ],
      href: '#',
      favoriteEntityType: 'CAR_SERVICE',
    },
  },

  // ─── 8. Bus Listing
  {
    label: '🚌 باص للإيجار',
    desc: 'فئة buses',
    item: {
      id: 'bus-1',
      category: 'buses',
      title: 'باص 45 راكب — رحلات مدرسية وشركات',
      price: 120,
      priceLabel: 'يوم',
      currency: 'OMR',
      images: [BUS_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'نقل عام', color: 'blue' },
      secondaryBadge: null,
      details: [
        { icon: 'Users', value: '45 راكب' },
        { icon: 'Map', value: 'مكيف' },
      ],
      href: '#',
      favoriteEntityType: 'BUS_LISTING',
    },
  },

  // ─── 9. Equipment
  {
    label: '🏗️ معدة — حفار',
    desc: 'فئة equipment',
    item: {
      id: 'equipment-1',
      category: 'equipment',
      title: 'حفار كاتربيلر 320GC 2020 للإيجار',
      price: 450,
      priceLabel: 'يوم',
      currency: 'OMR',
      images: [TRUCK_IMG],
      governorate: 'dhofar',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'للإيجار', color: 'green' },
      secondaryBadge: { label: 'مع مشغل', color: 'orange' },
      details: [
        { icon: 'Gauge', value: '3200 ساعة' },
        { icon: 'Box', value: 'جيد' },
      ],
      href: '#',
      favoriteEntityType: 'EQUIPMENT_LISTING',
    },
  },

  // ─── 10. Spare Part
  {
    label: '⚙️ قطعة غيار',
    desc: 'فئة parts',
    item: {
      id: 'part-1',
      category: 'parts',
      title: 'فلتر زيت أصلي — تويوتا كامري 2020-2023',
      price: 12,
      priceLabel: null,
      currency: 'OMR',
      images: [PART_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'أصلي', color: 'green' },
      secondaryBadge: { label: 'جديد', color: 'blue' },
      details: [
        { icon: 'Settings', value: 'محرك' },
        { icon: 'Box', value: 'جديد' },
        { icon: 'Car', value: 'تويوتا' },
      ],
      href: '#',
      favoriteEntityType: 'SPARE_PART',
    },
  },

  // ─── 11. Job
  {
    label: '💼 وظيفة سائق',
    desc: 'فئة jobs',
    item: {
      id: 'job-1',
      category: 'jobs',
      title: 'مطلوب سائق رخصة ثقيلة — شركة نقل',
      price: 450,
      priceLabel: 'شهر',
      currency: 'OMR',
      images: [],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'توظيف', color: 'blue' },
      secondaryBadge: { label: 'دوام كامل', color: 'green' },
      details: [
        { icon: 'Briefcase', value: 'سائق' },
        { icon: 'Clock', value: 'دوام كامل' },
        { icon: 'Star', value: '3 سنوات' },
      ],
      href: '#',
      favoriteEntityType: 'JOB',
    },
  },

  // ─── 12. Operator
  {
    label: '🦺 مشغّل معدات',
    desc: 'فئة operators مع موثق',
    item: {
      id: 'operator-1',
      category: 'operators',
      title: 'مشغّل حفار — خبرة 8 سنوات',
      price: 80,
      priceLabel: 'يوم',
      currency: 'OMR',
      images: [WORKER_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'مشغّل', color: 'purple' },
      secondaryBadge: { label: 'موثق', color: 'green' },
      details: [
        { icon: 'HardHat', value: 'مشغّل' },
        { icon: 'Star', value: '8 سنوات' },
      ],
      href: '#',
      sellerVerified: true,
      favoriteEntityType: 'OPERATOR_LISTING',
    },
  },

  // ─── 13. Multi-image (thumbnails row)
  {
    label: '🖼️ متعدد الصور (5+)',
    desc: 'يظهر شريط الصور المصغّرة + عداد المتبقي',
    item: {
      id: 'multi-img',
      category: 'cars',
      title: 'رنج روفر فوج 2022 — فل كامل بدون حوادث',
      price: 42000,
      priceLabel: null,
      currency: 'OMR',
      images: [CAR_IMG, TRUCK_IMG, BUS_IMG, PART_IMG, WORKER_IMG, CAR_IMG, TRUCK_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      viewCount: 1200,
      primaryBadge: { label: 'للبيع', color: 'blue' },
      secondaryBadge: null,
      details: [
        { icon: 'Calendar', value: '2022' },
        { icon: 'Gauge', value: '22,000 كم' },
        { icon: 'Settings', value: 'أوتوماتيك' },
      ],
      href: '#',
      sellerVerified: true,
      favoriteEntityType: 'LISTING',
    },
  },

  // ─── 14. priceText override
  {
    label: '📝 priceText مخصص',
    desc: 'يعرض نص السعر كما هو بدون حسابات',
    item: {
      id: 'price-text',
      category: 'services',
      title: 'خدمة نقل أثاث — السعر حسب الكمية',
      price: null,
      priceLabel: null,
      priceText: 'يبدأ من 30 ر.ع',
      currency: 'OMR',
      images: [TRUCK_IMG],
      governorate: 'muscat',
      createdAt: new Date().toISOString(),
      primaryBadge: { label: 'نقل', color: 'orange' },
      secondaryBadge: null,
      details: [{ icon: 'Truck', value: 'نقل أثاث' }],
      href: '#',
      favoriteEntityType: 'CAR_SERVICE',
    },
  },
];

// ── Page ─────────────────────────────────────────────────────────

export default function CardSandboxPage() {
  const [cols, setCols] = useState<1 | 2 | 3 | 4>(3);
  const [darkMode, setDarkMode] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSaved = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[cols];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-on-surface" dir="rtl">

        {/* ── Header ── */}
        <div className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-on-surface">🛠 Card Sandbox</h1>
              <p className="text-xs text-on-surface-variant">صفحة تطوير — UnifiedCard في جميع حالاته</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Cols */}
              <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1">
                {([1, 2, 3, 4] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setCols(c)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${cols === c ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Dark mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm font-bold transition-all"
              >
                <span className="material-symbols-outlined text-base">{darkMode ? 'light_mode' : 'dark_mode'}</span>
                {darkMode ? 'فاتح' : 'داكن'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
          {ITEMS.map(({ label, desc, item }) => (
            <section key={item.id}>
              {/* Section label */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-outline-variant/20" />
                <div className="text-center">
                  <p className="text-sm font-black text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>
                </div>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>

              {/* Card in grid context */}
              <div className={`grid ${colClass} gap-3`}>
                <UnifiedCard
                  item={item}
                  onSave={toggleSaved}
                  isSaved={savedIds.has(item.id)}
                />
                {/* Fill remaining cols with ghost placeholders so card isn't full-width alone */}
                {cols > 1 && Array.from({ length: cols - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-dashed border-outline-variant/30 bg-surface-container/30 flex items-center justify-center text-on-surface-variant/20 text-xs"
                  >
                    slot {i + 2}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* ── All Cards Grid ── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <p className="text-sm font-black text-on-surface">🗂 جميع الكروت في Grid واحد</p>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <div className={`grid ${colClass} gap-3`}>
              {ITEMS.map(({ item }) => (
                <UnifiedCard
                  key={`all-${item.id}`}
                  item={item}
                  onSave={toggleSaved}
                  isSaved={savedIds.has(item.id)}
                />
              ))}
            </div>
          </section>

          <div className="pb-20 text-center text-xs text-on-surface-variant/40">
            🔒 هذه الصفحة للتطوير فقط — لا تنشرها في Production
          </div>
        </div>
      </div>
    </div>
  );
}
