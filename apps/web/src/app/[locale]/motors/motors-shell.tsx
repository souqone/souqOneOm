'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Search, ArrowLeft, ArrowRight, ChevronLeft, Car, Wrench, Key, Shield, Plus, Sparkles } from 'lucide-react';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import { BRAND_LOGOS } from '@/features/listings/config/brand-logos.config';
import type { ListingItem } from '@/lib/api/listings';

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  serviceType: string;
  providerType: string;
  providerName: string;
  priceFrom?: string;
  priceTo?: string;
  currency: string;
  isHomeService: boolean;
  governorate: string;
  city?: string;
  viewCount: number;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  createdAt: string;
  user: { id: string; username: string; displayName?: string; avatarUrl?: string; isVerified?: boolean };
}

interface MotorsShellProps {
  saleCars: ListingItem[];
  rentalCars: ListingItem[];
  services: ServiceItem[];
}

// ── Popular Brands (subset for quick access) ─────────────────────────────────

const TOP_BRANDS = [
  { name: 'تويوتا', key: 'toyota', value: 'Toyota' },
  { name: 'نيسان', key: 'nissan', value: 'Nissan' },
  { name: 'هيونداي', key: 'hyundai', value: 'Hyundai' },
  { name: 'لكزس', key: 'lexus', value: 'Lexus' },
  { name: 'كيا', key: 'kia', value: 'Kia' },
  { name: 'مرسيدس', key: 'mercedes-benz', value: 'Mercedes-Benz' },
  { name: 'بي إم دبليو', key: 'bmw', value: 'BMW' },
  { name: 'فورد', key: 'ford', value: 'Ford' },
  { name: 'هوندا', key: 'honda', value: 'Honda' },
  { name: 'لاند روفر', key: 'land-rover', value: 'Land Rover' },
  { name: 'جيب', key: 'jeep', value: 'Jeep' },
  { name: 'شفروليه', key: 'chevrolet', value: 'Chevrolet' },
  { name: 'بي واي دي', key: 'byd', value: 'BYD' },
  { name: 'شانجان', key: 'changan', value: 'Changan' },
  { name: 'جيلي', key: 'geely', value: 'Geely' },
  { name: 'إم جي', key: 'mg', value: 'MG' },
];

// ── Quick Links Data ─────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { title: 'سيارات للبيع', desc: 'تصفح أحدث السيارات المعروضة للبيع', icon: Car, href: '/browse/cars', gradient: 'from-blue-600 to-indigo-700', count: 'آلاف الإعلانات' },
  { title: 'إيجار سيارات', desc: 'يومي، أسبوعي، أو شهري بأفضل الأسعار', icon: Key, href: '/browse/cars?listingType=RENTAL', gradient: 'from-emerald-600 to-teal-700', count: 'أسعار تنافسية' },
  { title: 'خدمات السيارات', desc: 'صيانة، تنظيف، تعديل، فحص وأكثر', icon: Wrench, href: '/browse/services', gradient: 'from-orange-500 to-red-600', count: 'ورش معتمدة' },
  { title: 'قطع غيار', desc: 'أصلية ومستعملة بضمان الجودة', icon: Shield, href: '/browse/parts', gradient: 'from-purple-600 to-pink-600', count: 'توصيل سريع' },
];


// ── Main Component ───────────────────────────────────────────────────────────

export function MotorsShell({ saleCars, rentalCars, services }: MotorsShellProps) {
  const { transformCar, transformService } = useItemTransformers();
  const [searchQuery, setSearchQuery] = useState('');
  const brandsRef = useRef<HTMLDivElement>(null);

  const scrollBrands = (dir: 'left' | 'right') => {
    if (!brandsRef.current) return;
    const amount = 200;
    brandsRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO SECTION — Premium gradient with search
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-slate-900 via-slate-800 to-primary/90 pt-8 pb-16 md:pt-12 md:pb-24">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-primary blur-[100px]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-blue-400 blur-[120px]" />
        </div>
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-white/60 mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              الرئيسية
            </Link>
            <ChevronLeft size={14} className="opacity-50" />
            <span className="text-white font-medium">السيارات</span>
          </nav>

          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-[12px] font-medium mb-4">
              <Sparkles size={14} className="text-amber-400" />
              أكبر سوق سيارات في عُمان
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3">
              اكتشف عالم <span className="text-primary">السيارات</span>
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto">
              تصفح آلاف السيارات للبيع والإيجار، وخدمات الصيانة والتعديل من أفضل المزودين
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:bg-white/30 transition-all duration-300" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                <Search size={20} className="mr-4 text-on-surface-variant shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن سيارة، خدمة، أو قطعة غيار..."
                  className="flex-1 h-14 bg-transparent text-[15px] text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                />
                <Link
                  href={`/browse/cars${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                  className="h-10 px-6 ml-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[14px] font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 shrink-0"
                >
                  بحث
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-8">
            {[
              { label: 'سيارات للبيع', value: '+2,500' },
              { label: 'سيارات للإيجار', value: '+400' },
              { label: 'مزود خدمة', value: '+150' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[11px] md:text-[12px] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. QUICK LINKS — Action cards
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="-mt-10 relative z-20 max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="group relative overflow-hidden rounded-2xl p-5 md:p-6 bg-white dark:bg-surface-container border border-outline-variant/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${link.gradient}`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <link.icon size={22} className="text-white" />
              </div>
              <h3 className="text-[14px] md:text-[15px] font-bold text-on-surface mb-1">{link.title}</h3>
              <p className="text-[11px] md:text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">{link.desc}</p>
              <span className="inline-block mt-2 text-[10px] md:text-[11px] font-bold text-primary/80">{link.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. BROWSE BY BRAND — Horizontal scroll
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12 md:mt-16 max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-black text-on-surface">تصفح حسب الماركة</h2>
            <p className="text-[12px] text-on-surface-variant mt-0.5">اختر ماركتك المفضلة</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scrollBrands('right')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
              <ArrowRight size={16} />
            </button>
            <button onClick={() => scrollBrands('left')} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} />
            </button>
            <Link href="/browse/cars" className="text-[12px] text-primary font-bold hover:underline mr-2">
              عرض الكل
            </Link>
          </div>
        </div>

        <div
          ref={brandsRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
        >
          {TOP_BRANDS.map((brand) => (
            <Link
              key={brand.key}
              href={`/browse/cars?make=${brand.value}`}
              className="group flex flex-col items-center gap-2 min-w-[90px] p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm group-hover:shadow-md transition-shadow">
                <Image
                  src={BRAND_LOGOS[brand.key] || '/brands/placeholder.png'}
                  alt={brand.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-[11px] font-bold text-on-surface text-center leading-tight">{brand.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. CARS FOR SALE — Featured grid
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12 md:mt-16 py-10 bg-surface-container-low/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-primary" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface">أحدث السيارات للبيع</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">سيارات جديدة تضاف يومياً</p>
              </div>
            </div>
            <Link href="/browse/cars" className="text-[13px] text-primary font-bold hover:underline flex items-center gap-1">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {saleCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {saleCars.map((item) => (
                <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">directions_car</span>
              <p className="font-medium">لا توجد سيارات حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. CARS FOR RENT — Highlight section
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-0 py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-emerald-500" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface">سيارات للإيجار</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">يومي، أسبوعي، أو شهري</p>
              </div>
            </div>
            <Link href="/browse/cars?listingType=RENTAL" className="text-[13px] text-emerald-600 font-bold hover:underline flex items-center gap-1">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {rentalCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {rentalCars.map((item) => (
                <UnifiedCard key={item.id} item={transformCar(item)} className="h-full" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">car_rental</span>
              <p className="font-medium">لا توجد سيارات للإيجار حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          6. CAR SERVICES — Grid with premium cards
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-surface-container-low/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-orange-500" />
              <div>
                <h2 className="text-lg md:text-xl font-black text-on-surface">خدمات السيارات</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">صيانة، تنظيف، تعديل وأكثر</p>
              </div>
            </div>
            <Link href="/browse/services" className="text-[13px] text-orange-600 font-bold hover:underline flex items-center gap-1">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {services.map((svc) => (
                <UnifiedCard key={svc.id} item={transformService(svc as any)} className="h-full" />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">build</span>
              <p className="font-medium">لا توجد خدمات حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          7. CTA — Post your ad
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-primary via-primary/90 to-indigo-700 p-8 md:p-12">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] translate-x-1/4 translate-y-1/4" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-[12px] font-medium mb-4">
                <Plus size={14} />
                نشر إعلان جديد
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                عندك سيارة تبغى تبيعها؟
              </h2>
              <p className="text-white/70 text-sm md:text-base max-w-md mx-auto mb-6">
                انشر إعلانك مجاناً ووصّل لآلاف المشترين في عُمان
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/add-listing/car"
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-primary font-bold text-[14px] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Plus size={18} />
                  بيع سيارة
                </Link>
                <Link
                  href="/add-listing/service"
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white/15 backdrop-blur-md text-white font-bold text-[14px] border border-white/20 hover:bg-white/25 transition-all duration-200"
                >
                  <Wrench size={18} />
                  أضف خدمة
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  إعلان مجاني
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  نشر فوري
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  +5000 مشتري نشط
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
