'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';
import { useFavContext } from '@/providers/favorites-provider';
import { useAuth } from '@/providers/auth-provider';
import { useTranslations, useLocale } from 'next-intl';
import { relativeTimeT } from '@/lib/time-utils';
import { resolveLocationLabel } from '@/lib/location-data';
import { useEnumTranslations } from '@/lib/enum-translations';
import { translateEnum } from '@/lib/translate-enum';
import type { ListingCategory } from '@/features/listings/types/category.types';

const CONDITION_DOT: Record<string, string> = {
  NEW: 'bg-emerald-500', LIKE_NEW: 'bg-teal-500', USED: 'bg-slate-400',
  GOOD: 'bg-sky-500', FAIR: 'bg-amber-500', POOR: 'bg-red-500',
  REFURBISHED: 'bg-orange-500',
};

// Material Symbols icon name per category (used for image fallback)
const CATEGORY_FALLBACK_ICON: Record<ListingCategory | 'jobs', string> = {
  cars:      'directions_car',
  buses:     'directions_bus',
  equipment: 'construction',
  'equipment-requests': 'construction',
  operators: 'engineering',
  parts:     'settings',
  services:  'build',
  jobs:      'work',
};

// Default href builder per category if href not provided
function defaultHref(category: ListingCategory | 'jobs', id: string, _slug?: string | null, listingType?: string | null): string {
  switch (category) {
    case 'cars':      return listingType === 'RENTAL' ? `/rental/car/${id}` : `/sale/car/${id}`;
    case 'buses':     return listingType === 'BUS_RENT' ? `/rental/bus/${id}` : `/sale/bus/${id}`;
    case 'equipment': return listingType === 'EQUIPMENT_RENT' ? `/rental/equipment/${id}` : `/sale/equipment/${id}`;
    case 'equipment-requests': return `/equipment/requests/${id}`;
    case 'operators': return `/equipment/operators/${id}`;
    case 'parts':     return `/sale/part/${id}`;
    case 'services':  return `/sale/service/${id}`;
    case 'jobs':      return `/jobs/${id}`;
  }
}

// Default favorite entityType per category
const CATEGORY_ENTITY_TYPE: Record<ListingCategory | 'jobs', string> = {
  cars:      'LISTING',
  buses:     'BUS_LISTING',
  equipment: 'EQUIPMENT_LISTING',
  'equipment-requests': 'EQUIPMENT_REQUEST',
  operators: 'OPERATOR_LISTING',
  parts:     'SPARE_PART',
  services:  'CAR_SERVICE',
  jobs:      'JOB',
};

export interface VehicleCardProps {
  id: string;
  title: string;
  price: string | number | null;
  currency: string;
  imageUrl?: string | null;
  governorate?: string | null;
  createdAt?: string;
  isVerified?: boolean;
  isPriceNegotiable?: boolean;
  href?: string;

  // ─── Identification ─────────────────────────
  /** Defaults to 'cars' for backwards compatibility */
  category?: ListingCategory | 'jobs';
  slug?: string | null;
  /** Override the favorite entity type (defaults to category-based) */
  entityType?: string;

  // ─── Cars / Buses / Equipment ───────────────
  make?: string;
  model?: string;
  year?: number;
  mileage?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  condition?: string | null;
  listingType?: string | null;
  dailyPrice?: string | number | null;
  monthlyPrice?: string | number | null;

  // ─── Buses ──────────────────────────────────
  busType?: string | null;
  capacity?: number | null;

  // ─── Equipment ──────────────────────────────
  equipmentType?: string | null;
  hoursUsed?: number | null;

  // ─── Parts ──────────────────────────────────
  partCategory?: string | null;
  isOriginal?: boolean;

  // ─── Services ───────────────────────────────
  serviceType?: string | null;
  providerType?: string | null;
  isHomeService?: boolean;

  // ─── Jobs ───────────────────────────────────
  jobType?: string | null;
  employmentType?: string | null;
  salaryPeriod?: string | null;

  // ─── Misc ───────────────────────────────────
  isPremium?: boolean;
  viewCount?: number;
  distance?: number | null;
}

function formatPrice(price: string | number, currencyLabel: string, suffix?: string) {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  const formatted = `${num.toLocaleString('en-US')} ${currencyLabel}`;
  return suffix ? `${formatted}${suffix}` : formatted;
}

export function VehicleCard(props: VehicleCardProps) {
  const t = useTranslations('listings');
  const enums = useEnumTranslations();
  const tt = useTranslations('time');
  const locale = useLocale();

  const category: ListingCategory | 'jobs' = props.category ?? 'cars';
  const entityType = props.entityType ?? CATEGORY_ENTITY_TYPE[category];
  const fallbackIcon = CATEGORY_FALLBACK_ICON[category];

  const imgSrc = getImageUrl(props.imageUrl);
  const conditionLabel = props.condition ? translateEnum(enums.condition, props.condition) : null;
  const badgeCls = props.condition ? CONDITION_DOT[props.condition] : null;

  const { isAuthenticated } = useAuth();
  const { isFav: checkFav, toggleFav } = useFavContext();
  const serverFav = checkFav(`${entityType}:${props.id}`);
  const [localFav, setLocalFav] = useState(serverFav);
  const [animating, setAnimating] = useState(false);

  useEffect(() => { setLocalFav(serverFav); }, [serverFav]);

  const currencyLabel = props.currency === 'OMR' ? t('currency') : props.currency;
  const isWanted = props.listingType === 'WANTED';
  const isRental = props.listingType === 'RENTAL'
    || props.listingType === 'BUS_RENT'
    || props.listingType === 'EQUIPMENT_RENT';

  // Smart price label per category
  let priceText: string;
  const priceVal = props.price;
  if (category === 'jobs') {
    if (priceVal && Number(priceVal) > 0) {
      const periodSuffix = props.salaryPeriod === 'DAILY' ? '/يوم'
        : props.salaryPeriod === 'MONTHLY' ? '/شهر'
        : props.salaryPeriod === 'YEARLY' ? '/سنة' : '';
      priceText = formatPrice(priceVal, currencyLabel, periodSuffix);
    } else {
      priceText = props.salaryPeriod === 'NEGOTIABLE' ? 'قابل للتفاوض' : t('contactForPrice');
    }
  } else if (isWanted) {
    priceText = priceVal && Number(priceVal) > 0
      ? `${t('budget')}: ${formatPrice(priceVal, currencyLabel)}`
      : t('wanted');
  } else if (isRental) {
    const rentPrice = props.dailyPrice ?? priceVal;
    priceText = rentPrice && Number(rentPrice) > 0
      ? formatPrice(rentPrice, currencyLabel, t('perDay'))
      : t('contactForPrice');
  } else if (category === 'services' && priceVal && Number(priceVal) > 0) {
    priceText = `${t('startingFrom')} ${formatPrice(priceVal, currencyLabel)}`;
  } else if (priceVal && Number(priceVal) > 0) {
    priceText = formatPrice(priceVal, currencyLabel);
  } else {
    priceText = t('contactForPrice');
  }

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setLocalFav(!localFav);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
    toggleFav.mutate({ entityType: entityType as any, entityId: props.id });
  };

  const href = props.href || defaultHref(category, props.id, props.slug, props.listingType);

  // Top-right badge: Wanted > Condition > Job type > Service type > Home service
  const topRightBadge = (() => {
    if (isWanted) {
      return { dot: 'bg-orange-500', label: t('wanted') };
    }
    if (conditionLabel && badgeCls) {
      return { dot: badgeCls, label: conditionLabel };
    }
    if (category === 'jobs' && props.jobType) {
      return props.jobType === 'OFFERING'
        ? { dot: 'bg-blue-500', label: 'باحث عن عمل' }
        : { dot: 'bg-emerald-500', label: 'مطلوب موظف' };
    }
    if (category === 'services' && props.isHomeService) {
      return { dot: 'bg-emerald-500', label: 'خدمة منزلية' };
    }
    if (category === 'parts' && props.isOriginal) {
      return { dot: 'bg-emerald-500', label: t('oem') };
    }
    return null;
  })();

  // Listing type badge text
  const listingTypeLabel = (() => {
    if (props.listingType === 'RENTAL' || props.listingType === 'BUS_RENT' || props.listingType === 'EQUIPMENT_RENT') {
      return { text: t('typeRental'), cls: 'text-teal-500' };
    }
    if (props.listingType === 'WANTED') {
      return { text: t('wanted'), cls: 'text-orange-500' };
    }
    if (category === 'jobs') {
      return { text: 'وظيفة', cls: 'text-rose-500' };
    }
    if (category === 'services') {
      return { text: t('service') ?? 'خدمة', cls: 'text-purple-500' };
    }
    if (category === 'parts') {
      return { text: t('part') ?? 'قطعة', cls: 'text-orange-500' };
    }
    if (props.listingType) {
      return { text: t('typeSale'), cls: 'text-primary' };
    }
    return null;
  })();

  return (
    <article
      className="h-full rounded-xl overflow-hidden bg-surface-container-lowest group hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] active:scale-[0.98] transition-all duration-300 border border-outline-variant/10"
      data-testid="listing-card"
    >
      <Link href={href} className="h-full flex flex-col">

        {/* ── Image ── */}
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-low">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={props.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-high/60 via-surface-container to-surface-container-low overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
              <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest/80 shadow-sm flex items-center justify-center border border-outline-variant/15 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/30">{fallbackIcon}</span>
              </div>
              <span className="mt-2 text-[10px] font-medium text-on-surface-variant/25 tracking-wide">{t('noImage')}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

          {/* ── Favorite button (top-left) ── */}
          {isAuthenticated && (
            <button
              onClick={handleFav}
              className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
              aria-label={localFav ? t('removeFromFavorites') : t('addToFavorites')}
            >
              <span
                className={`material-symbols-outlined text-[18px] sm:text-[20px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-all duration-200 ${
                  localFav ? 'text-red-500 scale-100' : 'text-white scale-100'
                } ${animating ? 'animate-[heartPop_0.35s_ease-out]' : ''}`}
                style={{ fontVariationSettings: localFav ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
          )}

          {/* ── Top-right badge ── */}
          {topRightBadge && (
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-px sm:py-0.5 rounded text-[7px] sm:text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${topRightBadge.dot}`} />
              {topRightBadge.label}
            </span>
          )}

          {/* ── Verified badge (bottom-left) ── */}
          {props.isVerified && (
            <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 text-blue-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <span className="material-symbols-outlined text-[13px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </span>
          )}

          {/* ── Price (bottom-right on image) ── */}
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
            <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-px sm:py-0.5 rounded text-[9px] sm:text-xs font-black tracking-tight bg-black/55 backdrop-blur-sm text-white">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isWanted ? 'bg-orange-500' : 'bg-primary'}`} />
              {priceText}
            </span>
          </div>

        </div>

        {/* ── Body ── */}
        <div className="p-2.5 sm:p-3 flex-1 flex flex-col gap-1.5">

          {/* Title */}
          <h3 dir="auto" className="text-[10px] sm:text-[13px] font-black leading-snug line-clamp-2 sm:line-clamp-1">{props.title}</h3>

          {/* listing type · date · location */}
          <div className="flex items-center gap-1 flex-wrap text-[8px] sm:text-[10px] text-on-surface-variant">
            {listingTypeLabel && (
              <span className={`shrink-0 font-bold ${listingTypeLabel.cls}`}>
                {listingTypeLabel.text}
              </span>
            )}
            {listingTypeLabel && props.createdAt && <span className="text-outline/40">·</span>}
            {props.createdAt && (
              <span className="shrink-0">{relativeTimeT(props.createdAt, tt, locale)}</span>
            )}
            {props.createdAt && props.governorate && <span className="text-outline/40">·</span>}
            {props.governorate && (
              <span className="flex items-center gap-px shrink-0">
                <span className="material-symbols-outlined text-[9px] sm:text-[11px]">location_on</span>
                {resolveLocationLabel(props.governorate, locale)}
              </span>
            )}
          </div>

        </div>
      </Link>
    </article>
  );
}
