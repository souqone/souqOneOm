'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

import { usePublicProfile } from '@/lib/api/users'
import { useListings, useCreateConversation } from '@/lib/api'
import { useBusListings } from '@/lib/api/buses'
import { useEquipmentListings, useOperatorListings } from '@/lib/api/equipment'
import { useParts } from '@/lib/api/parts'
import { useCarServices } from '@/lib/api/services'
import { useJobs } from '@/lib/api/jobs'
import { useReviews, useReviewSummary } from '@/lib/api/reviews'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { useToast } from '@/components/toast'
import { useAuth } from '@/providers/auth-provider'
import { resolveLocationLabel } from '@/lib/location-data'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'

import { SellerHero } from './SellerHero'
import { SellerHeroSkeleton } from './SellerHeroSkeleton'
import { SellerTabs, type TabValue } from './SellerTabs'
import { SellerListingsTab, type ListingTabKey } from './SellerListingsTab'
import { SellerListingsTabSkeleton } from './SellerListingsTabSkeleton'
import { SellerReviewsTab } from './SellerReviewsTab'
import { SellerReviewsTabSkeleton } from './SellerReviewsTabSkeleton'
import { SellerInfoTab } from './SellerInfoTab'
import { SellerInfoTabSkeleton } from './SellerInfoTabSkeleton'
import { SellerSidebar } from './SellerSidebar'
import { SellerSidebarSkeleton } from './SellerSidebarSkeleton'

export function SellerPageClient() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const locale = useLocale()
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const { addToast } = useToast()

  // ── Data fetching ──
  const { data: seller, isLoading, isError, refetch } = usePublicProfile(id)
  const sid = seller?.id

  const cars = useListings(sid ? { sellerId: sid, limit: '50' } : {})
  const buses = useBusListings(sid ? { userId: sid, limit: '50' } : undefined)
  const equipment = useEquipmentListings(sid ? { userId: sid, limit: '50' } : undefined)
  const operators = useOperatorListings(sid ? { userId: sid, limit: '50' } : undefined)
  const parts = useParts(sid ? { sellerId: sid, limit: '50' } : undefined)
  const services = useCarServices(sid ? { userId: sid, limit: '50' } : undefined)
  const jobs = useJobs(sid ? { userId: sid, limit: '50' } : {})

  const { data: reviewSummary } = useReviewSummary(sid)
  const { data: reviewsData } = useReviews(sid ? { userId: sid, limit: '20' } : undefined)

  const createConv = useCreateConversation()

  // ── Local state ──
  const [listingTab, setListingTab] = useState<ListingTabKey>('cars')

  // ── Computed ──
  const totalListings =
    (cars.data?.items?.length ?? 0) +
    (buses.data?.items?.length ?? 0) +
    (equipment.data?.items?.length ?? 0) +
    (operators.data?.items?.length ?? 0) +
    (parts.data?.items?.length ?? 0) +
    (services.data?.items?.length ?? 0) +
    (jobs.data?.items?.length ?? 0)

  const reviewCount = reviewSummary?.reviewCount || 0
  const year = seller ? new Date(seller.createdAt).getFullYear() : 0
  const gov = seller?.governorate ? resolveLocationLabel(seller.governorate, locale) : null

  // ── Handlers ──
  function handleMessage() {
    requireAuth(async () => {
      if (!seller) return
      const first = cars.data?.items?.[0]
      if (!first) {
        addToast('info', 'لا توجد إعلانات لبدء محادثة')
        return
      }
      try {
        const conv = await createConv.mutateAsync({ entityType: 'LISTING', entityId: first.id })
        router.push(`/messages/${conv.id}`)
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : 'حدث خطأ')
      }
    }, 'سجل دخول للمراسلة')
  }

  function handleCall() {
    if (seller?.phone) {
      window.open(`https://wa.me/${seller.phone.replace(/\+/g, '')}`, '_blank')
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: seller?.displayName || '', url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      addToast('success', 'تم نسخ الرابط')
    }
  }

  // ── Render states ──

  // Error
  if (isError) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-on-surface font-bold text-lg">حدث خطأ</h2>
          <p className="text-on-surface-variant text-sm">
            تعذر تحميل صفحة البائع. يرجى المحاولة مرة أخرى.
          </p>
          <Button variant="outline" onClick={() => refetch()} className="rounded-full px-6">
            إعادة المحاولة
          </Button>
        </div>
        <Footer />
      </>
    )
  }

  // Not found (loaded but no data)
  if (!isLoading && !seller) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className="text-6xl">🔍</div>
          <h2 className="text-on-surface font-bold text-lg">البائع غير موجود</h2>
          <p className="text-on-surface-variant text-sm">
            ربما تم حذف هذا الحساب أو الرابط غير صحيح.
          </p>
          <Button variant="primary" href="/" className="rounded-full px-6">
            العودة للرئيسية
          </Button>
        </div>
        <Footer />
      </>
    )
  }

  // ── Data map for listings tab ──
  const dataMap = { cars, buses, equipment, operators, parts, services, jobs }

  // ── Hero props ──
  const heroProps = seller
    ? {
        seller: {
          id: seller.id,
          name: seller.displayName || seller.username,
          username: seller.username,
          avatarUrl: seller.avatarUrl,
          isVerified: seller.isVerified,
          memberSince: String(year),
          rating: reviewSummary?.averageRating ? Number(reviewSummary.averageRating) : null,
          reviewCount,
          listingsCount: seller.totalListings || totalListings,
          governorate: gov,
        },
        onMessage: handleMessage,
        onCall: seller.phone ? handleCall : undefined,
        onShare: handleShare,
        isMessagePending: createConv.isPending,
      }
    : null

  // ── Info props ──
  const infoProps = seller
    ? {
        seller: {
          memberSince: String(year),
          governorate: gov,
          phone: seller.phone,
          isVerified: seller.isVerified,
          bio: seller.bio,
        },
      }
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 md:flex md:flex-row-reverse md:max-w-5xl md:mx-auto md:w-full md:pt-6">
        {/* Desktop sidebar */}
        {isLoading ? (
          <SellerSidebarSkeleton />
        ) : (
          <SellerSidebar
            onMessage={handleMessage}
            onCall={seller?.phone ? handleCall : undefined}
            onShare={handleShare}
            isMessagePending={createConv.isPending}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0" id="main-content">
          {/* Hero */}
          {isLoading || !heroProps ? (
            <SellerHeroSkeleton />
          ) : (
            <SellerHero {...heroProps} />
          )}

          {/* Tabs */}
          <SellerTabs
            listingsCount={seller?.totalListings || totalListings}
            reviewCount={reviewCount}
            isLoading={isLoading}
          >
            {(activeTab: TabValue) => {
              if (isLoading) {
                if (activeTab === 'listings') return <SellerListingsTabSkeleton />
                if (activeTab === 'reviews') return <SellerReviewsTabSkeleton />
                return <SellerInfoTabSkeleton />
              }

              if (activeTab === 'listings') {
                return (
                  <SellerListingsTab
                    activeTab={listingTab}
                    onTabChange={setListingTab}
                    dataMap={dataMap}
                  />
                )
              }

              if (activeTab === 'reviews') {
                return (
                  <SellerReviewsTab
                    reviews={reviewsData?.items ?? []}
                    summary={reviewSummary}
                    sellerId={seller!.id}
                    currentUserId={user?.id}
                    locale={locale}
                  />
                )
              }

              // info
              return infoProps ? <SellerInfoTab {...infoProps} /> : null
            }}
          </SellerTabs>
        </main>
      </div>

      <Footer />
    </div>
  )
}
