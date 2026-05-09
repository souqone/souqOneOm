'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { MapPin, Heart, Car, Bus, Wrench, Settings, Briefcase, HardHat, Phone, MessageCircle } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { getCountryLabel, resolveLocationLabel } from '@/lib/location-data'
import { useAuth } from '@/providers/auth-provider'
import { useFavContext } from '@/providers/favorites-provider'
import { DetailChip, RibbonBadge, TrustBadge, type BadgeIntent } from '@/components/ui/badges'
import type { BadgeColor, UnifiedListingItem } from '../types/unified-item.types'
import type { ListingCategory } from '../types/category.types'
import { ELITE_FRAME_CLS, PREMIUM_FRAME_CLS, ELITE_SHINE_CLS, PREMIUM_SHINE_CLS } from '../constants/card-styles'

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>

const CATEGORY_ICON: Record<ListingCategory | 'jobs', LucideIcon> = {
  cars:      Car,
  buses:     Bus,
  equipment: Wrench,
  'equipment-requests': Wrench,
  operators: HardHat,
  parts:     Settings,
  services:  Wrench,
  jobs:      Briefcase,
}

const BADGE_INTENT: Record<BadgeColor, BadgeIntent> = {
  blue: 'primary',
  green: 'success',
  orange: 'orange',
  purple: 'primary',
  gray: 'neutral',
  red: 'danger',
}

//  Props 

interface UnifiedCardProps {
  item: UnifiedListingItem
  onSave?: (id: string) => void
  isSaved?: boolean
  className?: string
  hideContactButtons?: boolean
}

//  Component 

export function UnifiedCard({ item, onSave, isSaved = false, className = '', hideContactButtons = false }: UnifiedCardProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('listings')
  const { isAuthenticated } = useAuth()
  const { isFav, toggleFav } = useFavContext()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const CategoryIcon = CATEGORY_ICON[item.category]
  const favoriteKey = `${item.favoriteEntityType}:${item.id}`
  const serverSaved = isFav(favoriteKey)
  const [localSaved, setLocalSaved] = useState(onSave ? isSaved : serverSaved)
  const selectedImage = item.images[selectedImageIndex] ?? item.images[0]
  const thumbnails = item.images.length >= 5 ? item.images.slice(0, 4) : []
  const visibleDetails = [
    ...(item.secondaryBadge ? [{ icon: 'Tag', value: item.secondaryBadge.label }] : []),
    ...item.details,
  ].slice(0, 5)
  const fallbackPriceText = item.priceText ?? (item.price == null && item.priceLabel ? item.priceLabel : null)
  const countryLabel = getCountryLabel(
    typeof item.attributes?.country === 'string' && item.attributes.country ? item.attributes.country : 'OM',
    locale,
  )
  const governorateLabel = resolveLocationLabel(item.governorate, locale) ?? (locale === 'en' ? 'Unknown' : 'غير محدد')
  const locationText = `${countryLabel}، ${governorateLabel}`
  const plan = typeof item.attributes?.plan === 'string' ? item.attributes.plan.toUpperCase() : null
  const isElite = plan === 'ELITE'
  const isPremium = isElite || plan === 'PREMIUM' || plan === 'FEATURED' || item.attributes?.isPremium === true
  const frameClass = isElite ? ELITE_FRAME_CLS : isPremium ? PREMIUM_FRAME_CLS : 'border-outline-variant/20 hover:border-outline-variant/40 hover:shadow-md'
  const shineClass = isElite ? ELITE_SHINE_CLS : isPremium ? PREMIUM_SHINE_CLS : ''

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [item.id])

  useEffect(() => {
    setLocalSaved(onSave ? isSaved : serverSaved)
  }, [isSaved, onSave, serverSaved])

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (onSave) {
      onSave(item.id)
      return
    }
    if (!isAuthenticated || !toggleFav) return
    setLocalSaved(!localSaved)
    toggleFav.mutate({ entityType: item.favoriteEntityType as any, entityId: item.id })
  }

  return (
    <div
      onClick={() => router.push(item.href)}
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-background border hover:-translate-y-px transition-all duration-200 cursor-pointer ${frameClass} ${shineClass} ${className}`}
    >
      <div className="flex flex-col bg-surface-container">
        <div className="relative overflow-hidden bg-surface-container" style={{ aspectRatio: '16/10' }}>
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-high/60 via-surface-container to-surface-container-low overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest/80 shadow-sm flex items-center justify-center border border-outline-variant/15 group-hover:scale-110 transition-transform duration-300">
              <CategoryIcon size={24} className="text-on-surface-variant/30" />
            </div>
            <span className="mt-2 text-[10px] font-medium text-on-surface-variant/25 tracking-wide">{t('noImage')}</span>
          </div>
        )}

        {/* Primary badge (top-right) - listing type */}
        {item.primaryBadge && (
          <RibbonBadge
            label={item.primaryBadge.label}
            intent={BADGE_INTENT[item.primaryBadge.color]}
            icon="none"
            position="top-start"
            className="absolute top-0 start-0"
          />
        )}

        {isPremium && (
          <RibbonBadge
            label={isElite ? t('elite') : t('featured')}
            intent={isElite ? 'gold' : 'silver'}
            icon={isElite ? 'crown' : 'star'}
            position="top-end"
            className="absolute top-0 end-0"
          />
        )}

        {/* Save button (top-left, visible on hover) */}
        {(onSave || isAuthenticated) && (
          <button
            onClick={handleSave}
            className={`${isPremium ? 'top-9' : 'top-2'} absolute left-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 hover:bg-background transition-all duration-150`}
            aria-label={localSaved ? t('removeFromFavorites') : t('addToFavorites')}
          >
            <Heart
              size={14}
              className={localSaved ? 'fill-red-500 text-red-500' : 'text-on-surface/70'}
            />
          </button>
        )}

      </div>

        {thumbnails.length > 0 && (
          <div className="flex h-[42px] shrink-0 border-t border-outline-variant/20">
            {thumbnails.map((src, i) => {
              const isLast = i === thumbnails.length - 1
              const remaining = item.images.length - thumbnails.length
              const showOverlay = isLast && remaining > 0
              const isSelected = selectedImageIndex === i

              return (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedImageIndex(i)
                  }}
                  className={`relative min-w-0 flex-1 overflow-hidden border-s border-outline-variant/20 first:border-s-0 ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
                  aria-label={`${item.title} ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="90px" className="object-cover" />
                  {showOverlay && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[11px] font-black text-white">
                      +{remaining}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-3">
        {/* Title */}
        <div className="mb-2 flex items-center gap-2">
          <h3 className="min-w-0 flex-1 line-clamp-2 text-[14px] font-black leading-snug text-on-surface sm:text-[15px]">
            {item.title}
          </h3>
          {item.sellerVerified && (
            <TrustBadge type="verified" variant="badge" className="shrink-0 scale-[85%] origin-center" />
          )}
        </div>

        {/* Details */}
        {visibleDetails.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {visibleDetails.map((detail, i) => (
              <DetailChip key={i} icon={detail.icon} value={detail.value} />
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Divider */}
        <hr className="border-outline-variant/15 mb-2.5" />

        {/* Price + Location row */}
        <div className="flex items-center justify-between gap-2">
          {/* Location */}
          <div className="flex min-w-0 items-center gap-1 text-[11px] text-on-surface-variant/60">
            <MapPin size={10} className="shrink-0 text-primary/40" />
            <span className="truncate">{locationText}</span>
          </div>

          {/* Price */}
          {fallbackPriceText ? (
            <span className="shrink-0 text-[20px] font-black text-primary leading-none">
              {fallbackPriceText}
            </span>
          ) : item.price && item.price > 0 ? (
            <span className="shrink-0 flex items-baseline gap-0.5 text-primary">
              {item.primaryBadge?.label === 'مطلوب' && (
                <span className="text-[10px] font-bold opacity-60">الميزانية</span>
              )}
              <span className="text-[20px] font-black leading-none tracking-tight" dir="ltr">
                {item.price.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] font-bold opacity-60">
                {item.currency === 'OMR' ? ' ر.ع' : ` ${item.currency}`}
                {item.priceLabel && ` / ${item.priceLabel}`}
              </span>
            </span>
          ) : (
            <span className="shrink-0 text-[11px] font-bold text-on-surface-variant">
              {t('contactForPrice')}
            </span>
          )}
        </div>

        {/* Contact buttons — only shown if data exists */}
        {!hideContactButtons && (item.phoneNumber || item.whatsappNumber) && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-outline-variant/20">
            {item.phoneNumber && (
              <a
                href={`tel:${item.phoneNumber}`}
                onClick={e => e.stopPropagation()}
                className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-on-primary text-[12px] font-bold hover:brightness-110 transition-all duration-150 active:scale-95"
              >
                <Phone size={13} />
                <span>اتصال</span>
              </a>
            )}
            {item.whatsappNumber && (
              <a
                href={`https://wa.me/${item.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex flex-1 items-center justify-center gap-1.5 h-8 rounded-lg bg-[#25D366] text-white text-[12px] font-bold hover:brightness-110 transition-all duration-150 active:scale-95"
              >
                <MessageCircle size={13} />
                <span>واتساب</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}