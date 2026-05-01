import Image from 'next/image'
import clsx from 'clsx'
import { getImageUrl } from '@/lib/image-utils'

export interface SellerHeroProps {
  seller: {
    id: string
    name: string
    username: string
    avatarUrl?: string | null
    isVerified: boolean
    memberSince: string
    rating: number | null
    reviewCount: number
    listingsCount: number
    governorate?: string | null
  }
  onMessage: () => void
  onCall?: () => void
  onShare: () => void
  isMessagePending?: boolean
}

export function SellerHero({ seller, onMessage, onCall, onShare, isMessagePending }: SellerHeroProps) {
  const initial = (seller.name || seller.username)[0]?.toUpperCase()

  return (
    <section className="relative px-4 pt-6 pb-5 bg-primary/5">
      {/* ── Avatar + Identity ── */}
      <div className="flex flex-col items-center md:flex-row md:items-start md:gap-5">
        {/* Avatar */}
        <div className="relative mb-3 md:mb-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-md ring-4 ring-background">
            {seller.avatarUrl ? (
              <Image
                src={getImageUrl(seller.avatarUrl) || ''}
                alt={seller.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-black text-3xl">
                {initial}
              </div>
            )}
          </div>
          {/* Verified badge */}
          {seller.isVerified && (
            <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-full bg-background flex items-center justify-center shadow-sm">
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="text-center md:text-right md:flex-1 min-w-0">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className="text-xl font-bold text-on-surface truncate">{seller.name}</h1>
          </div>
          <p className="text-sm text-on-surface-variant mb-3" dir="ltr">
            @{seller.username}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-center md:justify-start gap-5">
            <StatItem
              value={seller.rating ? Number(seller.rating).toFixed(1) : '—'}
              label="التقييم"
              icon={seller.rating ? 'star' : undefined}
              iconFill
              iconColor="text-amber-500"
            />
            <div className="w-px h-8 bg-outline-variant/30" />
            <StatItem value={String(seller.listingsCount)} label="إعلان" />
            <div className="w-px h-8 bg-outline-variant/30" />
            <StatItem value={seller.memberSince} label="عضو منذ" />
          </div>
        </div>
      </div>

      {/* ── Mobile CTAs ── */}
      <div className="flex gap-3 mt-5 md:hidden">
        <button
          onClick={onMessage}
          disabled={isMessagePending}
          className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          مراسلة
        </button>
        {onCall && (
          <button
            onClick={onCall}
            className="flex-1 h-11 rounded-xl border-2 border-outline-variant/30 text-on-surface text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors"
          >
            💬 واتساب
          </button>
        )}
        <button
          onClick={onShare}
          aria-label="مشاركة صفحة البائع"
          className="w-11 h-11 rounded-xl border-2 border-outline-variant/30 flex items-center justify-center text-on-surface-variant active:scale-95 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">share</span>
        </button>
      </div>
    </section>
  )
}

/* ── Stat sub-component ── */
function StatItem({
  value,
  label,
  icon,
  iconFill,
  iconColor,
}: {
  value: string
  label: string
  icon?: string
  iconFill?: boolean
  iconColor?: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="flex items-center gap-1 text-lg font-bold text-on-surface leading-none">
        {value}
        {icon && (
          <span
            className={clsx('material-symbols-outlined text-sm', iconColor)}
            style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
        )}
      </span>
      <span className="text-[11px] text-on-surface-variant font-medium">{label}</span>
    </div>
  )
}
