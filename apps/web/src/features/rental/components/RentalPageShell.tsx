'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Share2, Heart, ShieldCheck, ChevronDown,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { haversineDistance } from '@/lib/geo-utils';
import { resolveLocationLabel } from '@/lib/location-data';
import {
  useCreateConversation,
  useReviewSummary,
} from '@/lib/api';
import { useFavContext } from '@/providers/favorites-provider';
import type { EntityType } from '@/lib/api/favorites';
import { useAuth } from '@/providers/auth-provider';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useToast } from '@/components/toast';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { useTranslations, useLocale } from 'next-intl';
import {
  cancelLabels,
} from '@/lib/constants/mappings';

import type { UnifiedRentalListing } from '../types/unified-rental.types';
import type { RentalSectionConfig, RentalSpecField, RentalHighlightField } from '../types/config.types';
import { getNestedValue } from '../config/rental.config';
import { RentalBookingCard } from './RentalBookingCard';
import { SimilarRentals } from './SimilarRentals';
import { SellerRow } from '@/features/sale/components/SellerRow';

const MapView = dynamic(() => import('@/components/map/map-view'), { ssr: false });

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="h-px bg-outline-variant/20 my-5" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-on-surface tracking-tight">{children}</h2>
      <div className="mt-1 h-[3px] w-8 rounded-full bg-primary" />
    </div>
  );
}

function DropdownSection({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-1 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 bg-gradient-to-br from-slate-50 to-blue-50 hover:from-slate-100/80 hover:to-blue-100/60 transition-colors duration-200 cursor-pointer select-none"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <span className="material-symbols-outlined text-[20px] text-white">{icon || 'list_alt'}</span>
        </div>
        <div className="flex-1 text-start">
          <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-3 bg-gradient-to-br from-slate-50/30 to-blue-50/20">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandableText({ text, expandedLabel, collapsedLabel }: { text: string; expandedLabel: string; collapsedLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 260;
  return (
    <div>
      <p className={`text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-line ${!expanded && isLong ? 'line-clamp-3' : ''}`}>{text}</p>
      {isLong && (
        <button onClick={() => setExpanded(e => !e)} className="text-[12px] text-primary font-medium mt-2 cursor-pointer hover:underline block w-full text-center">
          {expanded ? expandedLabel : collapsedLabel}
        </button>
      )}
    </div>
  );
}

function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return locale === 'ar' ? 'اليوم' : 'Today';
  if (diffDays === 1) return locale === 'ar' ? 'أمس' : 'Yesterday';
  if (diffDays < 7) return locale === 'ar' ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
  if (diffDays < 30) return locale === 'ar' ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} weeks ago`;
  return locale === 'ar' ? `منذ ${Math.floor(diffDays / 30)} شهر` : `${Math.floor(diffDays / 30)} months ago`;
}

/** Config-driven spec grid (same pattern as sale SpecsGrid) */
function RentalSpecsGrid({ listing, fields }: { listing: UnifiedRentalListing; fields: RentalSpecField[] }) {
  const visibleFields = fields.filter(f => {
    const val = getNestedValue(listing, f.key);
    return !(f.hideIfEmpty && (val == null || val === ''));
  });
  if (visibleFields.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {visibleFields.map(spec => {
        const raw = getNestedValue(listing, spec.key);
        let display = '—';
        if (raw != null && raw !== '') {
          if (spec.format === 'km' && typeof raw === 'number') display = `${raw.toLocaleString('en-US')} ${spec.unit || 'km'}`;
          else if (spec.format === 'number' && typeof raw === 'number') display = `${raw.toLocaleString('en-US')}${spec.unit ? ` ${spec.unit}` : ''}`;
          else display = String(raw) + (spec.unit ? ` ${spec.unit}` : '');
        }
        return (
          <div key={spec.key} className="relative rounded-2xl p-4 text-center overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 hover:from-primary/8 hover:to-primary/15 transition-all duration-200">
            <p className="text-[13px] font-semibold text-on-surface mb-0.5">{spec.label}</p>
            <p className="text-[15px] font-bold text-primary leading-tight">{display}</p>
          </div>
        );
      })}
    </div>
  );
}

/** Config-driven details table — row layout with icons (matches sale DetailsTable) */
function RentalDetailsTable({ listing, fields }: { listing: UnifiedRentalListing; fields: RentalSpecField[] }) {
  const visibleFields = fields.filter(f => {
    const val = getNestedValue(listing, f.key);
    return !(f.hideIfEmpty && (val == null || val === ''));
  });
  if (visibleFields.length === 0) return null;

  return (
    <div className="border border-outline-variant/15 rounded-xl overflow-hidden text-[12px]">
      {visibleFields.map((field, index, arr) => {
        const value = getNestedValue(listing, field.key);
        const formatted = value == null || value === '' ? '—' : Array.isArray(value) ? value.join('، ') : String(value);
        const isLast = index === arr.length - 1;
        const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[field.icon] || Icons.Circle;

        return (
          <div
            key={field.key}
            className={`flex items-center justify-between px-4 py-3 ${
              index % 2 === 0 ? 'bg-surface-container-low/40' : ''
            } ${!isLast ? 'border-b border-outline-variant/10' : ''}`}
          >
            <div className="flex items-center gap-2 text-on-surface-variant">
              <IconComponent size={14} className="text-primary" />
              <span>{field.label}</span>
            </div>
            <span className="font-medium text-on-surface">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Config-driven highlights */
function RentalHighlights({ listing, fields }: { listing: UnifiedRentalListing; fields: RentalHighlightField[] }) {
  const visibleFields = fields.filter(f => !f.condition || f.condition(listing));
  if (visibleFields.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {visibleFields.map((field, i) => {
        const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[field.icon];
        return (
          <div key={i} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20">
              {IconComp ? <IconComp size={18} className="text-primary" /> : <ShieldCheck size={18} className="text-primary" />}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-on-surface">{field.getTitle(listing)}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{field.getSub(listing)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RentalPageShellProps {
  listing: UnifiedRentalListing;
  config: RentalSectionConfig;
  unavailableDates: string[];
  onBook: (startDate: string, endDate: string) => Promise<unknown>;
  isBookingPending: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RentalPageShell({ listing, config, unavailableDates, onBook, isBookingPending }: RentalPageShellProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const createConv = useCreateConversation();
  const tp = useTranslations('pages');
  const tm = useTranslations('mappings');
  const tr = useTranslations('rental');
  const locale = useLocale();

  const cancelMap = cancelLabels(tm);
  const { data: reviewSummary } = useReviewSummary(listing.seller.id);

  const isOwner = !!(user && listing.seller.id === user.id);
  const { isFav: checkFav, toggleFav } = useFavContext();

  // ─── Favorite entity type mapping ──────────────────────────────────────────
  const favEntityType: EntityType = (() => {
    switch (listing.type) {
      case 'car': return 'LISTING';
      case 'bus': return 'BUS_LISTING';
      case 'equipment': return 'EQUIPMENT_LISTING';
      default: return 'LISTING';
    }
  })();
  const saved = checkFav(`${favEntityType}:${listing.id}`);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    const lat = sessionStorage.getItem('userLat');
    const lng = sessionStorage.getItem('userLng');
    if (lat && lng) { setUserLat(parseFloat(lat)); setUserLng(parseFloat(lng)); }
    else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        sessionStorage.setItem('userLat', String(pos.coords.latitude));
        sessionStorage.setItem('userLng', String(pos.coords.longitude));
      }, () => {}, { enableHighAccuracy: false, timeout: 5000 });
    }
  }, []);

  const distance = userLat && userLng && listing.location
    ? haversineDistance(userLat, userLng, listing.location.lat, listing.location.lng)
    : null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleMessage = useCallback(() => {
    requireAuth(async () => {
      try {
        const entityTypeMap: Record<string, string> = {
          car: 'LISTING',
          bus: 'BUS_LISTING',
          equipment: 'EQUIPMENT_LISTING',
        };
        const conv = await createConv.mutateAsync({
          entityType: entityTypeMap[listing.type] as string,
          entityId: listing.id,
        });
        router.push(`/messages/${conv.id}`);
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : tp('carErrorConversation'));
      }
    }, tp('carLoginToMessage'));
  }, [listing.type, listing.id, requireAuth, createConv, router, addToast, tp]);

  const handleBooking = useCallback((startDate: string, endDate: string) => {
    requireAuth(async () => {
      try {
        await onBook(startDate, endDate);
        addToast('success', tp('carBookingSuccess'));
      } catch (err) {
        addToast('error', err instanceof Error ? err.message : tp('carErrorBooking'));
      }
    }, tp('carLoginToBook'));
  }, [requireAuth, onBook, addToast, tp]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: listing.title, url });
    else { navigator.clipboard.writeText(url); addToast('success', tp('carLinkCopied')); }
  }, [listing.title, addToast, tp]);

  const handleWhatsApp = useCallback(() => {
    if (!listing.seller.whatsapp) return;
    requireAuth(() => {
      const phone = listing.seller.whatsapp!.replace(/\D/g, '');
      const message = encodeURIComponent(tr('whatsappMessage', { title: listing.title }));
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }, tr('loginToContact'));
  }, [listing.seller.whatsapp, listing.title, tr, requireAuth]);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const features = useMemo(() => {
    return listing.carData?.features
      || listing.busData?.features
      || listing.equipmentData?.features
      || [];
  }, [listing]);

  const visibleFeatures = showAllFeatures ? features : features.slice(0, 8);

  const BADGE_COLORS: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    teal: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  };

  const listPaths: Record<string, string> = {
    car: '/listings?listingType=RENTAL',
    bus: '/buses?type=BUS_RENT',
    equipment: '/equipment?type=EQUIPMENT_RENT',
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-28 lg:pb-16">

        {/* ══ A — TOP BAR ══ */}
        <div className="flex items-center justify-between mb-8 bg-surface-container-lowest/60 backdrop-blur-md p-3 px-5 rounded-2xl border border-outline-variant/20 shadow-sm">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">home</span>
              {tr('breadcrumbHome')}
            </Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <Link href={listPaths[listing.type]} className="hover:text-primary transition-colors">{tr('breadcrumbList', { type: config.displayName })}</Link>
            <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
            <span className="text-on-surface truncate max-w-[140px] sm:max-w-[200px]">{listing.title}</span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[13px] font-bold text-on-surface transition-all duration-200 active:scale-95">
              <Share2 size={16} />
              <span className="hidden sm:inline">{tr('share')}</span>
            </button>
            <button onClick={() => {
              requireAuth(async () => {
                try {
                  await toggleFav.mutateAsync({ entityType: favEntityType, entityId: listing.id });
                  addToast('success', saved ? tr('removedFromFav') : tr('addedToFav'));
                } catch {
                  addToast('error', tr('errorConversation'));
                }
              }, tr('loginToContact'));
            }} className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-[13px] font-bold transition-all duration-200 active:scale-95 ${saved ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface'}`}>
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">{saved ? tr('saved') : tr('save')}</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h1 className="text-[24px] md:text-[28px] font-black text-on-surface leading-tight tracking-tight">
              {listing.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${BADGE_COLORS[config.badgeColor]}`}>
              {tr('badgeLabel', { type: config.displayName })}
            </span>

            {reviewSummary && reviewSummary.reviewCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-lg leading-none">★</span>
                  <span className="font-bold text-on-surface text-[13px]">{reviewSummary.averageRating.toFixed(1)}</span>
                  <span className="text-[11px] text-on-surface-variant ml-1">({reviewSummary.reviewCount})</span>
                </div>
              </>
            )}

            {listing.governorate && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[18px] text-primary/70">location_on</span>
                  <span>{resolveLocationLabel(listing.governorate, locale)}، {tr('country')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ C — PHOTO GALLERY ══ */}
        <div className="mb-4">
          <PhotoGallery images={listing.images} title={listing.title} placeholderIcon={config.icon} />
        </div>

        {/* ══ MOBILE/TABLET CTA BUTTONS — Below Gallery ══ */}
        <div className="lg:hidden mb-5">
          {/* Price row */}
          <div className="flex items-baseline gap-1.5 mb-3">
            {listing.dailyPrice ? (
              <>
                <span className="text-[26px] font-black text-red-600 leading-none">
                  {listing.dailyPrice.toLocaleString('en-US')}
                </span>
                <span className="text-[13px] text-on-surface-variant">{listing.currency}</span>
                <span className="text-[11px] text-on-surface-variant">/ {tr('perDay')}</span>
                {listing.isPriceNegotiable && (
                  <span className="text-[11px] font-semibold text-emerald-600 ms-1">{tr('negotiable')}</span>
                )}
              </>
            ) : (
              <span className="text-[16px] font-bold text-on-surface">{tr('contactForPrice')}</span>
            )}
          </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleMessage}
            className="h-10 rounded-xl bg-primary text-on-primary text-[12px] font-medium flex items-center justify-center gap-1"
          >
            <Icons.MessageCircle size={14} />
            {tr('contact')}
          </button>
          {listing.seller.phone ? (
            <button
              onClick={() => {
                requireAuth(() => {
                  window.location.href = `tel:${listing.seller.phone}`;
                }, tr('loginToContact'));
              }}
              className="h-10 rounded-xl border border-outline-variant/30 text-on-surface text-[12px] font-medium flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
            >
              <Icons.Phone size={14} />
              {tr('call')}
            </button>
          ) : (
            <button
              disabled
              className="h-10 rounded-xl border border-outline-variant/20 text-on-surface-variant/40 text-[12px] font-medium flex items-center justify-center gap-1 cursor-not-allowed bg-surface-container-low"
            >
              <Icons.Phone size={14} />
              {tr('call')}
            </button>
          )}
          {listing.seller.whatsapp ? (
            <button
              onClick={handleWhatsApp}
              className="h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[12px] font-medium flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {tr('whatsapp')}
            </button>
          ) : (
            <button
              disabled
              className="h-10 rounded-xl border border-outline-variant/20 text-on-surface-variant/40 text-[12px] font-medium flex items-center justify-center gap-1 cursor-not-allowed bg-surface-container-low"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {tr('whatsapp')}
            </button>
          )}
        </div>
        </div>

        {/* ══ MOBILE BOOKING CARD — Below CTA Buttons ══ */}
        <div className="lg:hidden mb-5">
          <RentalBookingCard
            listing={listing}
            isOwner={isOwner}
            unavailableDates={unavailableDates}
            onBook={handleBooking}
            isBookingPending={isBookingPending}
          />
        </div>

        {/* ══ D — TWO-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div>

            {/* S1 — Seller Row */}
            <SellerRow seller={listing.seller} />
            <div className="h-[2px] w-50 rounded-full bg-primary mt-1 mx-auto" />

            {/* Mobile stats */}
            <div className="lg:hidden flex items-center gap-4 text-[11px] text-on-surface-variant mb-4 mt-3">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">visibility</span>
                {tr('views', { count: listing.views.toLocaleString('en-US') })}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {formatRelativeTime(listing.createdAt, locale)}
              </span>
            </div>

            <Divider />

            {/* Description */}
            {listing.description && (
              <>
                <div>
                  <SectionTitle>{tr('descriptionTitle')}</SectionTitle>
                  <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6 shadow-sm">
                    <div className="absolute top-4 end-4 text-on-surface-variant/10">
                      <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                    <ExpandableText text={listing.description} expandedLabel={tr('collapse')} collapsedLabel={tr('expand')} />
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Specs Grid */}
            {config.specsFields?.length > 0 && (
              <>
                <div>
                  <SectionTitle>{tr('specsTitle')}</SectionTitle>
                  <RentalSpecsGrid listing={listing} fields={config.specsFields} />
                </div>
                <Divider />
              </>
            )}

            {/* S2 — Highlights */}
            <DropdownSection
              title={locale === 'ar' ? 'أبرز المميزات' : 'Highlights'}
              subtitle={`${config.highlightFields.filter(field => !field.condition || field.condition(listing)).length} ${locale === 'ar' ? 'عناصر' : 'items'}`}
              icon="auto_awesome"
            >
              <RentalHighlights listing={listing} fields={config.highlightFields} />
            </DropdownSection>
            <Divider />

            {/* S3 — Rental Terms */}
            <DropdownSection
              title={tr('rentalTerms')}
              subtitle={`${[
                listing.minRentalDays != null,
                !!listing.cancellationPolicy,
                listing.depositAmount != null && listing.depositAmount > 0,
                listing.kmLimitPerDay != null && listing.kmLimitPerDay > 0,
                listing.insuranceIncluded === true,
                listing.withDriver === true,
                listing.deliveryAvailable === true,
              ].filter(Boolean).length} ${locale === 'ar' ? 'عناصر' : 'items'}`}
              icon="event_note"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.minRentalDays != null && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('minDaysLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{tr('minDaysValue', { count: listing.minRentalDays! })}</span>
                  </div>
                )}
                {listing.cancellationPolicy && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('cancelPolicyLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{cancelMap[listing.cancellationPolicy] ?? listing.cancellationPolicy}</span>
                  </div>
                )}
                {listing.depositAmount != null && listing.depositAmount > 0 && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('depositLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{tr('depositValue', { amount: listing.depositAmount.toLocaleString('en-US'), currency: listing.currency })}</span>
                  </div>
                )}
                {listing.kmLimitPerDay != null && listing.kmLimitPerDay > 0 && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('kmLimitLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{tr('kmLimitValue', { count: listing.kmLimitPerDay.toLocaleString('en-US') })}</span>
                  </div>
                )}
                {listing.insuranceIncluded === true && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:border-emerald-300 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('insuranceLabel')}</span>
                    <span className="text-[12px] text-emerald-700">{tr('insuranceIncluded')} ✓</span>
                  </div>
                )}
                {listing.withDriver === true && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('driverLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{tr('withDriver')}</span>
                  </div>
                )}
                {listing.deliveryAvailable === true && (
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200">
                    <span className="text-[12px] font-semibold text-on-surface">{tr('deliveryLabel')}</span>
                    <span className="text-[12px] text-on-surface-variant">{tr('deliveryAvailable')}</span>
                  </div>
                )}
              </div>
            </DropdownSection>

            <Divider />

            {/* S5 — Details */}
            <DropdownSection
              title={tr('detailsTitle', { type: config.displayName })}
              subtitle={`${config.tableFields.length} ${tr('specsTitle')}`}
              icon="list_alt"
            >
              <RentalDetailsTable listing={listing} fields={config.tableFields} />
            </DropdownSection>

            {/* S6 — Features */}
            {features.length > 0 && (
              <>
                <Divider />
                <div>
                  <SectionTitle>{tr('featuresTitle')}</SectionTitle>
                  <div className="flex flex-wrap gap-2.5">
                    {visibleFeatures.map(feat => (
                      <span key={feat} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 text-[12px] font-medium text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all duration-200">
                        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </span>
                        {feat}
                      </span>
                    ))}
                  </div>
                  {features.length > 8 && (
                    <button onClick={() => setShowAllFeatures(s => !s)} className="mt-3 text-[12px] text-primary underline-offset-2 hover:underline cursor-pointer font-medium block w-full text-center">
                      {showAllFeatures ? tr('hideFeatures') : tr('showAllFeatures', { count: features.length })}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* S7 — Ratings */}
            {reviewSummary && reviewSummary.reviewCount > 0 && (
              <>
                <Divider />
                <div>
                  <SectionTitle>{tr('ratingsTitle')} · {reviewSummary.averageRating.toFixed(1)} <span className="text-amber-400">★</span> ({reviewSummary.reviewCount})</SectionTitle>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewSummary.distribution[star] || 0;
                      const pct = reviewSummary.reviewCount > 0 ? (count / reviewSummary.reviewCount) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-[11px] text-on-surface-variant w-16 text-right flex-shrink-0">{star} ★</span>
                          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] text-on-surface-variant w-7 text-left flex-shrink-0">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* S8 — Map */}
            {listing.location && (
              <>
                <Divider />
                <div>
                  <SectionTitle>{tr('locationTitle')}</SectionTitle>
                  <p className="text-[12px] text-on-surface-variant mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                    {resolveLocationLabel(listing.governorate, locale)}، {tr('country')}
                    {distance !== null && (
                      <span className="flex items-center gap-1.5 mt-0 text-[11px] text-on-surface-variant ms-1">
                        {distance < 1 ? tr('distanceMeters', { distance: Math.round(distance * 1000) }) : tr('distanceKm', { distance: distance.toFixed(1) })}
                      </span>
                    )}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-outline-variant/40 shadow-sm" style={{ height: 200 }}>
                    <MapView
                      latitude={listing.location.lat}
                      longitude={listing.location.lng}
                      title={listing.title}
                      showDirections
                      showShare
                      sellerPhone={listing.seller.phone}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${listing.location.lat},${listing.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-10 rounded-xl bg-primary/10 text-primary text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">directions</span>
                      {tr('getDirections')}
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${listing.location.lat},${listing.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant text-[12px] font-medium flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      {tr('viewOnMap')}
                    </a>
                  </div>
                </div>
              </>
            )}

            {/* S9 — Things to know */}
            <Divider />
            <div>
              <SectionTitle>{tr('importantInfo')}</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200 text-center">
                  <span className="text-[12px] font-semibold text-on-surface">{tr('contactTerms')}</span>
                  <span className="text-[11px] text-on-surface-variant leading-relaxed">{tr('contactTermsDesc')}</span>
                </div>
                <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 transition-all duration-200 text-center">
                  <span className="text-[12px] font-semibold text-on-surface">{tr('safetyTitle')}</span>
                  <span className="text-[11px] text-on-surface-variant leading-relaxed">{tr('safetyDesc')}</span>
                </div>
              </div>
            </div>

          </div>
          {/* ════ END LEFT COLUMN ════ */}

          {/* ════ RIGHT COLUMN — Booking Card (desktop only) ════ */}
          <div className="hidden lg:block">
            <RentalBookingCard
              listing={listing}
              isOwner={isOwner}
              unavailableDates={unavailableDates}
              onBook={handleBooking}
              isBookingPending={isBookingPending}
              onContactSeller={handleMessage}
              isContactPending={createConv.isPending}
            />
          </div>
          {/* ════ END RIGHT COLUMN ════ */}

        </div>
        {/* ══ END TWO-COLUMN ══ */}

        {/* ══ E — SIMILAR RENTALS ══ */}
        <SimilarRentals
          type={listing.type}
          currentId={listing.id}
          governorate={listing.governorate}
        />

      </main>

      {/* ══ MOBILE STICKY CTA BAR ══ */}
      {!isOwner && (
        <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-background/95 backdrop-blur-sm border-t border-outline-variant/30 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-baseline gap-1.5 mb-2">
            {listing.dailyPrice ? (
              <>
                <span className="text-[18px] font-black text-red-600 leading-none">
                  {listing.dailyPrice.toLocaleString('en-US')}
                </span>
                <span className="text-[12px] text-on-surface-variant">{listing.currency}</span>
                <span className="text-[11px] text-on-surface-variant">/ {tr('perDay')}</span>
                {listing.monthlyPrice && (
                  <span className="text-[11px] text-on-surface-variant ms-2">
                    {listing.monthlyPrice.toLocaleString('en-US')} / {tr('perMonth')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[14px] font-bold text-on-surface">{tr('contactForPrice')}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMessage}
              className="flex-1 h-10 rounded-xl bg-primary text-on-primary text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <Icons.MessageCircle size={15} />
              {tr('contact')}
            </button>
            {listing.seller.phone && (
              <button
                onClick={() => { window.location.href = `tel:${listing.seller.phone}`; }}
                className="h-10 px-4 rounded-xl border border-outline-variant/30 text-on-surface text-[13px] font-medium flex items-center justify-center gap-1.5"
              >
                <Icons.Phone size={15} />
                {tr('call')}
              </button>
            )}
            {listing.seller.whatsapp && (
              <button
                onClick={handleWhatsApp}
                className="h-10 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-medium flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {tr('whatsapp')}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
