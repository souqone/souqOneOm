import Image from 'next/image'
import { getImageUrl } from '@/lib/image-utils'
import { ReviewForm } from '@/components/reviews/review-form'
import type { ReviewItem, ReviewSummary } from '@/lib/api/reviews'

interface SellerReviewsTabProps {
  reviews: ReviewItem[]
  summary: ReviewSummary | null | undefined
  sellerId: string
  currentUserId?: string
  locale: string
}

export function SellerReviewsTab({ reviews, summary, sellerId, currentUserId, locale }: SellerReviewsTabProps) {
  const avgRating = summary?.averageRating ? Number(summary.averageRating).toFixed(1) : null
  const reviewCount = summary?.reviewCount || 0
  const distribution = summary?.distribution || {}

  return (
    <div className="space-y-8">
      {/* ── Rating Summary Card ── */}
      {reviewCount > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-5">
          <div className="flex items-center gap-5 mb-4">
            <div className="text-center">
              <p className="text-4xl font-black text-on-surface leading-none">{avgRating}</p>
              <div className="flex gap-0.5 mt-1.5 justify-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    className={`material-symbols-outlined text-sm ${
                      s <= Math.round(Number(avgRating)) ? 'text-amber-500' : 'text-outline-variant/30'
                    }`}
                    style={{ fontVariationSettings: s <= Math.round(Number(avgRating)) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">{reviewCount} تقييم</p>
            </div>

            {/* Star bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star] || 0
                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant w-3 text-center">{star}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Review List ── */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(r => (
            <div
              key={r.id}
              className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden relative flex-shrink-0">
                    {r.reviewer.avatarUrl ? (
                      <Image
                        src={getImageUrl(r.reviewer.avatarUrl) || ''}
                        alt={r.reviewer.displayName || r.reviewer.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-on-surface text-sm">
                        {(r.reviewer.displayName || r.reviewer.username)[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {r.reviewer.displayName || r.reviewer.username}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      className={`material-symbols-outlined text-sm ${
                        s <= r.rating ? 'text-amber-500' : 'text-outline-variant/30'
                      }`}
                      style={{ fontVariationSettings: s <= r.rating ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-2xl">
            ⭐
          </div>
          <p className="text-on-surface font-bold">لا توجد تقييمات بعد</p>
          <p className="text-on-surface-variant text-sm">كن أول من يقيّم هذا البائع</p>
        </div>
      )}

      {/* ── Add Review Form ── */}
      {currentUserId && currentUserId !== sellerId && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5">
          <h3 className="text-base font-bold text-on-surface mb-4">أضف تقييمك</h3>
          <ReviewForm entityType="LISTING" entityId={sellerId} revieweeId={sellerId} />
        </div>
      )}
    </div>
  )
}
