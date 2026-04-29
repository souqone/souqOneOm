'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { ListingCategory } from '@/features/listings/types/category.types';
import { ListingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { usePublicProfile, useListings, useCreateConversation } from '@/lib/api';
import { useBusListings } from '@/lib/api/buses';
import { useEquipmentListings, useOperatorListings } from '@/lib/api/equipment';
import { useParts } from '@/lib/api/parts';
import { useCarServices } from '@/lib/api/services';
import { useJobs } from '@/lib/api/jobs';
import { useReviews, useReviewSummary } from '@/lib/api/reviews';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useToast } from '@/components/toast';
import { ReviewForm } from '@/components/reviews/review-form';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';
import { useAuth } from '@/providers/auth-provider';

const TABS = [
  { key: 'cars', labelKey: 'sectionCars', entityType: 'LISTING' },
  { key: 'buses', labelKey: 'sectionBuses', entityType: 'BUS_LISTING' },
  { key: 'equipment', labelKey: 'sectionEquipment', entityType: 'EQUIPMENT_LISTING' },
  { key: 'operators', labelKey: 'sectionOperators', entityType: 'OPERATOR_LISTING' },
  { key: 'parts', labelKey: 'sectionParts', entityType: 'SPARE_PART' },
  { key: 'services', labelKey: 'sectionServices', entityType: 'CAR_SERVICE' },
  { key: 'jobs', labelKey: 'sectionJobs', entityType: 'JOB' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('cars');

  const { data: seller, isLoading, isError, refetch } = usePublicProfile(id);
  const sid = seller?.id;

  const cars = useListings(sid ? { sellerId: sid, limit: '50' } : {});
  const buses = useBusListings(sid ? { userId: sid, limit: '50' } : undefined);
  const equipment = useEquipmentListings(sid ? { userId: sid, limit: '50' } : undefined);
  const operators = useOperatorListings(sid ? { userId: sid, limit: '50' } : undefined);
  const parts = useParts(sid ? { sellerId: sid, limit: '50' } : undefined);
  const services = useCarServices(sid ? { userId: sid, limit: '50' } : undefined);
  const jobs = useJobs(sid ? { userId: sid, limit: '50' } : {});

  const createConv = useCreateConversation();
  const requireAuth = useRequireAuth();
  const { addToast } = useToast();
  const { user } = useAuth();
  const tp = useTranslations('pages');
  const locale = useLocale();
  const { transformByCategory } = useItemTransformers();
  const { data: reviewSummary } = useReviewSummary(seller?.id);
  const { data: reviews } = useReviews(seller ? { userId: seller.id, limit: '10' } : undefined);

  function getData(k: TabKey) {
    const map: Record<TabKey, any> = { cars, buses, equipment, operators, parts, services, jobs };
    return { items: map[k]?.data?.items ?? [], loading: map[k]?.isLoading };
  }

  function handleContact() {
    requireAuth(async () => {
      if (!seller) return;
      const first = cars.data?.items?.[0];
      if (!first) { addToast('info', tp('sellerNoListings')); return; }
      try {
        const conv = await createConv.mutateAsync({ entityType: 'LISTING', entityId: first.id });
        router.push(`/messages/${conv.id}`);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : tp('sellerErrorConversation'));
      }
    }, tp('sellerLoginToContact'));
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-[340px] flex-shrink-0">
            <div className="animate-pulse bg-surface-container-lowest rounded-[2rem] h-[400px]" />
          </div>
          <div className="flex-1 animate-pulse space-y-6">
            <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
            <ListingSkeleton count={4} />
          </div>
        </div>
      </>
    );
  }

  if (isError || !seller) {
    return (<><Navbar /><div className="pt-28 px-8"><ErrorState onRetry={() => refetch()} /></div></>);
  }

  const { items: activeItems, loading: tabLoading } = getData(tab);
  const year = new Date(seller.createdAt).getFullYear();
  const gov = seller.governorate ? resolveLocationLabel(seller.governorate, locale) : '';
  const total = seller.totalListings || 0;
  const avgRating = reviewSummary?.averageRating ? Number(reviewSummary.averageRating).toFixed(1) : null;
  const reviewCount = reviewSummary?.reviewCount || 0;
  const initial = (seller.displayName || seller.username)[0]?.toUpperCase();
  const tabsWithCounts = TABS.map(t => ({ ...t, count: getData(t.key).items.length }));
  const visibleTabs = tabsWithCounts.filter(t => t.count > 0 || t.key === 'cars');

  return (
    <>
      <Navbar />
      
      {/* Editorial Minimalist Canvas */}
      <div className="min-h-screen bg-background pb-32 md:pb-16 pt-24 md:pt-32 relative selection:bg-primary/20">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/[0.03] blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
            
            {/* ── STICKY PROFILE CARD (Left in LTR, Right in RTL) ── */}
            <aside className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0 md:sticky md:top-32">
              
              {/* Premium Floating Card */}
              <div className="bg-surface-container-lowest/80 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-outline-variant/20">
                
                {/* Avatar */}
                <div className="flex justify-center mb-8">
                  <div className="relative inline-block">
                    <div className="w-36 h-36 rounded-full overflow-hidden relative shadow-[0_16px_40px_rgba(0,74,198,0.12)] ring-[6px] ring-surface-container-lowest border border-outline-variant/10 group">
                      {seller.avatarUrl ? (
                        <Image src={getImageUrl(seller.avatarUrl) || ''} alt={seller.displayName || seller.username} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-[#0B2447] flex items-center justify-center text-white font-black text-6xl">
                          {initial}
                        </div>
                      )}
                      {/* Inner subtle glare */}
                      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
                    </div>
                    {/* Facebook style verification badge */}
                    {seller.isVerified && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        {/* White circle background (smaller than the icon to fill transparency without a border) */}
                        <div className="absolute w-[30px] h-[30px] bg-surface-container-lowest rounded-full" />
                        {/* The actual icon with a subtle drop shadow instead of a box shadow */}
                        <span className="relative material-symbols-outlined text-[56px] text-primary drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity */}
                <div className="text-center mb-8">
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <h1 className="text-[28px] font-bold text-on-surface tracking-tight leading-tight">
                      {seller.displayName || seller.username}
                    </h1>
                  </div>
                  <p className="text-[15px] font-medium text-on-surface-variant bg-surface-container-low/50 inline-flex px-3 py-1 rounded-full" dir="ltr">@{seller.username}</p>
                </div>

                {/* Micro-Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-gradient-to-b from-surface-container-low/40 to-transparent border border-outline-variant/10">
                    <p className="text-[26px] font-black text-on-surface leading-none mb-1.5">{total}</p>
                    <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">إعلان نشط</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-gradient-to-b from-amber-50/50 dark:from-amber-500/5 to-transparent border border-outline-variant/10">
                    <p className="text-[26px] font-black text-on-surface leading-none mb-1.5 flex items-center gap-1.5">
                      {avgRating || '—'}
                      {avgRating && <span className="material-symbols-outlined text-[20px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                    </p>
                    <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">التقييم</p>
                  </div>
                </div>

                {/* Info List */}
                <div className="space-y-4 mb-8 text-[14px]">
                  <div className="flex items-center gap-3.5 text-on-surface-variant">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-high/50 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">calendar_month</span>
                    </div>
                    <span className="font-medium">عضو منذ {year}</span>
                  </div>
                  {gov && (
                    <div className="flex items-center gap-3.5 text-on-surface-variant">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high/50 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                      </div>
                      <span className="font-medium">{gov}</span>
                    </div>
                  )}
                  {seller.phone && (
                    <div className="flex items-center gap-3.5 text-green-700 dark:text-green-500">
                      <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      </div>
                      <span className="font-bold">رقم الجوال مفعل</span>
                    </div>
                  )}
                </div>

                {/* Primary Action */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleContact}
                    disabled={createConv.isPending}
                    className="w-full h-14 rounded-xl bg-primary text-white text-[15px] font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(0,74,198,0.25)] hover:shadow-[0_12px_28px_rgba(0,74,198,0.35)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    مراسلة البائع
                  </button>
                  {seller.phone && (
                    <a
                      href={`https://wa.me/${seller.phone.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-14 rounded-xl border-2 border-outline-variant/30 text-[15px] font-bold text-on-surface flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
                    >
                      💬 التواصل واتساب
                    </a>
                  )}
                </div>

              </div>
            </aside>

            {/* ── MAIN CONTENT (Right in LTR, Left in RTL) ── */}
            <main className="flex-1 min-w-0 flex flex-col gap-12">
              
              {/* Listings Section */}
              <section>
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1 mb-8">
                  <h2 className="text-[24px] font-black text-on-surface tracking-tight">الإعلانات</h2>
                  
                  {/* Clean Tab Navigation */}
                  <div className="hidden sm:flex gap-8">
                    {visibleTabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`relative pb-4 -mb-[2px] text-[15px] font-bold transition-colors ${
                          tab === t.key ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {tp(t.labelKey)} {t.count > 0 && <span className="text-[12px] opacity-70 ml-1">({t.count})</span>}
                        {tab === t.key && (
                          <span className="absolute bottom-0 inset-x-0 h-[3px] bg-primary rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Tabs Scroll */}
                <div className="sm:hidden flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2 -mx-4 px-4">
                  {visibleTabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                        tab === t.key ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant'
                      }`}
                    >
                      {tp(t.labelKey)} {t.count > 0 && `(${t.count})`}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                {tabLoading ? (
                  <ListingSkeleton count={6} />
                ) : activeItems.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
                    {activeItems.map((item: any) => {
                      const category = (tab === 'cars' ? 'cars' : tab) as ListingCategory;
                      return <UnifiedCard key={item.id} item={transformByCategory(category, item)} className="h-full" />;
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 rounded-[2.5rem] bg-surface-container-low/30 border border-dashed border-outline-variant/30">
                    <div className="w-20 h-20 rounded-3xl bg-surface-container-high/50 flex items-center justify-center mb-5">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
                    </div>
                    <p className="text-[18px] font-bold text-on-surface">لا توجد إعلانات</p>
                    <p className="text-[15px] text-on-surface-variant mt-1.5">لم يقم البائع بنشر إعلانات في هذا القسم حتى الآن.</p>
                  </div>
                )}
              </section>

              {/* Reviews Section */}
              <section>
                <div className="border-t border-outline-variant/20 pt-12 mb-8">
                  <h2 className="text-[24px] font-black text-on-surface tracking-tight flex items-center gap-3">
                    التقييمات
                    {reviewCount > 0 && (
                      <span className="flex items-center gap-1 text-[16px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {avgRating} <span className="text-amber-600/70 dark:text-amber-400/70">({reviewCount})</span>
                      </span>
                    )}
                  </h2>
                </div>

                {reviewCount > 0 && reviews?.items?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.items.map(r => (
                      <div key={r.id} className="p-6 rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/15 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-surface-container-high overflow-hidden relative">
                              {r.reviewer.avatarUrl ? (
                                <Image src={getImageUrl(r.reviewer.avatarUrl) || ''} alt="" fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-on-surface">
                                  {(r.reviewer.displayName || r.reviewer.username)[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-on-surface">{r.reviewer.displayName || r.reviewer.username}</p>
                              <p className="text-[12px] text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`material-symbols-outlined text-[14px] ${i < r.rating ? 'text-amber-500' : 'text-outline-variant/30'}`}
                                style={{ fontVariationSettings: i < r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-[14px] text-on-surface-variant leading-relaxed">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-4xl text-amber-500/30 mb-4">rate_review</span>
                    <p className="text-[16px] font-semibold text-on-surface">لا توجد تقييمات</p>
                    <p className="text-[14px] text-on-surface-variant mt-1">كن أول من يقيّم تجربة التعامل مع هذا البائع</p>
                  </div>
                )}

                {user && user.id !== seller.id && (
                  <div className="mt-8 p-8 rounded-[2rem] bg-surface-container-lowest border border-outline-variant/15 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <h3 className="text-[18px] font-bold text-on-surface mb-6">أضف تقييمك</h3>
                    <ReviewForm entityType="LISTING" entityId={seller.id} revieweeId={seller.id} />
                  </div>
                )}
              </section>

            </main>
          </div>
        </div>
      </div>

      {/* ── MOBILE ACTION BAR (Fixed Top under Navbar) ── */}
      <div className="fixed top-[56px] inset-x-0 z-40 md:hidden bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 px-4 py-3 flex items-center gap-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden relative ring-2 ring-background">
            {seller.avatarUrl ? (
              <Image src={getImageUrl(seller.avatarUrl) || ''} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold text-sm">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-[14px] font-bold text-on-surface truncate">{seller.displayName || seller.username}</span>
            {avgRating && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {avgRating}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {seller.phone && (
            <a
              href={`https://wa.me/${seller.phone.replace(/\+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-[1rem] bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-500 flex items-center justify-center"
            >
              💬
            </a>
          )}
          <button
            onClick={handleContact}
            disabled={createConv.isPending}
            className="h-11 px-5 rounded-[1rem] bg-primary text-on-primary text-[14px] font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            مراسلة
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
