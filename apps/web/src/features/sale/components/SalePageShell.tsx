/**
 * Sale Page Shell — Main page layout orchestrator.
 * Combines all sub-components into the unified sale detail page.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Share2, Heart, MessageCircle, Phone, Trash2, Star, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { haversineDistance } from '@/lib/geo-utils';
import { resolveLocationLabel, resolveCityLabel } from '@/lib/location-data';
import {
  useCreateConversation,
  useDeleteListing,
  useDeleteBusListing,
  useDeleteEquipmentListing,
  useDeletePart,
  useDeleteCarService,
} from '@/lib/api';
import { useFavContext } from '@/providers/favorites-provider';
import type { EntityType } from '@/lib/api/favorites';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/toast';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { ListingBadge } from '@/components/listing-badge';

import type { UnifiedListing } from '../types/unified.types';
import type { SectionConfig } from '../types/config.types';
import { Highlights } from './Highlights';
import { SpecsGrid } from './SpecsGrid';
import { DetailsTable } from './DetailsTable';
import { ContractDetails } from './ContractDetails';
import { PriceCard } from './PriceCard';
import { MobileCTABar } from './MobileCTABar';
import { SimilarItems } from './SimilarItems';
import { SellerRow } from './SellerRow';

const MapView = dynamic(() => import('@/components/map/map-view'), { ssr: false });

interface SalePageShellProps {
  listing: UnifiedListing;
  config: SectionConfig;
}

function formatRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
  return rtf.format(-Math.floor(diffDays / 30), 'month');
}

/**
 * Simple divider component.
 */
function Divider() {
  return <div className="h-px bg-outline-variant/20 my-5" />;
}

/**
 * Section title with styling.
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-on-surface tracking-tight">{children}</h2>
      <div className="mt-1 h-[3px] w-8 rounded-full bg-primary" />
    </div>
  );
}

/**
 * Elegant dropdown section with collapsible content.
 */
function DropdownSection({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-2 shadow-sm">
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

/**
 * Expandable text component for descriptions.
 */
function ExpandableText({ text, expandLabel, collapseLabel }: { text: string; expandLabel: string; collapseLabel: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 200;

  if (text.length <= maxLength) {
    return <p className="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-line">{text}</p>;
  }

  const displayText = expanded ? text : text.slice(0, maxLength) + '...';

  return (
    <div>
      <p className="text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[12px] text-primary hover:underline underline-offset-2 font-medium"
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}

/**
 * Breadcrumb navigation component.
 */
function Breadcrumb({ listing, config, homeLabel }: { listing: UnifiedListing; config: SectionConfig; homeLabel: string }) {
  const listPaths: Record<string, string> = {
    car: '/cars/browse',
    bus: '/browse/buses',
    equipment: '/browse/equipment',
    part: '/browse/parts',
    service: '/browse/services',
  };

  return (
    <nav className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant flex-wrap">
      <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">home</span>
        {homeLabel}
      </Link>
      <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
      <Link href={listPaths[listing.type]} className="hover:text-primary transition-colors">
        {config.displayName}
      </Link>
      <span className="material-symbols-outlined text-[14px] opacity-50">chevron_left</span>
      <span className="text-on-surface truncate max-w-[140px] sm:max-w-[200px]">{listing.title}</span>
    </nav>
  );
}

/**
 * Main sale page shell component.
 */
/** Get the edit route for a given listing type + id */
function getEditRoute(type: string, id: string): string {
  const map: Record<string, string> = {
    car: `/edit-listing/car/${id}`,
    bus: `/edit-listing/bus/${id}`,
    equipment: `/edit-listing/equipment/${id}`,
    part: `/edit-listing/parts/${id}`,
    service: `/edit-listing/service/${id}`,
  };
  return map[type] || `/edit-listing/car/${id}`;
}

export function SalePageShell({ listing, config }: SalePageShellProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const ts = useTranslations('sale');
  const deleteListing = useDeleteListing();
  const deleteBusListing = useDeleteBusListing();
  const deleteEquipmentListing = useDeleteEquipmentListing();
  const deletePart = useDeletePart();
  const deleteCarService = useDeleteCarService();
  const locale = useLocale();
  const requireAuth = useRequireAuth();
  const createConv = useCreateConversation();
  const { user } = useAuth();
  const { isFav: checkFav, toggleFav } = useFavContext();

  const isOwner = !!(user && listing.seller.id === user.id);
  const deleteMutation = {
    car: deleteListing,
    bus: deleteBusListing,
    equipment: deleteEquipmentListing,
    part: deletePart,
    service: deleteCarService,
  }[listing.type];

  // ─── Favorite entity type mapping ──────────────────────────────────────────
  const favEntityType: EntityType = (() => {
    switch (listing.type) {
      case 'car': return 'LISTING';
      case 'bus': return 'BUS_LISTING';
      case 'equipment': return 'EQUIPMENT_LISTING';
      case 'part': return 'SPARE_PART';
      case 'service': return 'CAR_SERVICE';
      default: return 'LISTING';
    }
  })();
  const saved = checkFav(`${favEntityType}:${listing.id}`);

  // ─── User location for distance calc ──────────────────────────────────────
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ─── Sticky CTA bar — shown when mobile price section scrolls out of view ──
  const mobilePriceSectionRef = useRef<HTMLDivElement>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  useEffect(() => {
    const el = mobilePriceSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyBarVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const lat = sessionStorage.getItem('userLat');
    const lng = sessionStorage.getItem('userLng');
    if (lat && lng) {
      setUserLat(parseFloat(lat));
      setUserLng(parseFloat(lng));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          sessionStorage.setItem('userLat', String(pos.coords.latitude));
          sessionStorage.setItem('userLng', String(pos.coords.longitude));
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const distance =
    userLat !== null && userLng !== null && listing.location
      ? haversineDistance(userLat, userLng, listing.location.lat, listing.location.lng)
      : null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleMessage = useCallback(async () => {
    requireAuth(async () => {
      try {
        const entityTypeMap: Record<string, string> = {
          car: 'LISTING',
          bus: 'BUS_LISTING',
          equipment: 'EQUIPMENT_LISTING',
          part: 'SPARE_PART',
          service: 'CAR_SERVICE',
        };

        const conv = await createConv.mutateAsync({
          entityType: entityTypeMap[listing.type] as string,
          entityId: listing.id,
        });
        router.push(`/messages/${conv.id}`);
      } catch (err) {
        addToast(
          'error',
          err instanceof Error ? err.message : ts('errorConversation')
        );
      }
    }, ts('loginToContact'));
  }, [listing.type, listing.id, requireAuth, createConv, router, addToast, ts]);

  const handleWhatsApp = useCallback(() => {
    if (!listing.seller.whatsapp) return;
    requireAuth(() => {
      const phone = listing.seller.whatsapp!.replace(/\D/g, '');
      const message = encodeURIComponent(ts('whatsappMessage', { title: listing.title }));
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }, ts('loginToContact'));
  }, [listing.seller.whatsapp, listing.title, requireAuth, ts]);

  const handleCall = useCallback(() => {
    if (!listing.seller.phone) return;
    requireAuth(() => {
      window.location.href = `tel:${listing.seller.phone}`;
    }, ts('loginToContact'));
  }, [listing.seller.phone, requireAuth, ts]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: listing.title, url });
    } else {
      navigator.clipboard.writeText(url);
      addToast('success', ts('linkCopied'));
    }
  }, [listing.title, addToast, ts]);

  const handleSave = useCallback(() => {
    requireAuth(async () => {
      try {
        await toggleFav.mutateAsync({ entityType: favEntityType, entityId: listing.id });
        addToast('success', saved ? ts('removedFromFav') : ts('addedToFav'));
      } catch {
        addToast('error', ts('errorConversation'));
      }
    }, ts('loginToContact'));
  }, [saved, addToast, requireAuth, toggleFav, favEntityType, listing.id, ts]);

  const handleReport = useCallback(() => {
    // TODO: Implement report modal
    addToast('info', ts('reportComingSoon'));
  }, [addToast, ts]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(listing.id);
      addToast('success', ts('deleteSuccessToast'));
      router.push('/my-listings');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : ts('deleteErrorToast'));
    }
  }, [deleteMutation, listing.id, addToast, router, ts]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-16">
        {/* ══ A — TOP BAR ══ */}
        <div className="flex items-center justify-between mb-5 bg-surface-container-lowest/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-outline-variant/20 shadow-sm">
          <Breadcrumb listing={listing} config={config} homeLabel={ts('breadcrumbHome')} />

          {/* Share + Save */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[13px] font-bold text-on-surface transition-all duration-200 active:scale-95"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">{ts('share')}</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-[13px] font-bold transition-all duration-200 active:scale-95 ${
                saved
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface'
              }`}
            >
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">{saved ? ts('saved') : ts('save')}</span>
            </button>
          </div>
        </div>

        {/* ══ B — TITLE SECTION ══ */}
        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <h1 className="text-[24px] md:text-[28px] font-black text-on-surface leading-tight tracking-tight">
              {listing.title}
            </h1>
            {listing.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 uppercase tracking-wider">
                <Star size={10} className="fill-amber-500 text-amber-500" />
                {ts('premiumListing')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ListingBadge type={listing.listingType} />
            
            {(listing.city || listing.governorate) && (
              <>
                <span className="w-1 h-1 rounded-full bg-outline-variant/40" />
                <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-[18px] text-primary/70">location_on</span>
                  <span>
                    {[resolveCityLabel(listing.city, locale), resolveLocationLabel(listing.governorate, locale), ts('country')].filter(Boolean).join('، ')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ STATUS BANNER — shown if listing is not active ══ */}
        {listing.status && !['ACTIVE', 'AVAILABLE'].includes(listing.status.toUpperCase()) && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
            <span className="material-symbols-outlined text-base">warning</span>
            {listing.status === 'SOLD' ? ts('statusSold') : ts('statusUnavailable')}
          </div>
        )}

        {/* ══ C — PHOTO GALLERY ══ */}
        {listing.images.length > 0 && (
          <div className="mb-4">
            <PhotoGallery images={listing.images} title={listing.title} placeholderIcon={config.icon} />
          </div>
        )}

        {/* ══ MOBILE/TABLET CTA BUTTONS — Below Gallery ══ */}
        <div className="lg:hidden mb-4" ref={mobilePriceSectionRef}>
          {/* Price row */}
          <div className="flex items-baseline gap-1.5 mb-3">
            {listing.type === 'bus' && listing.busData?.contractMonthly ? (
              <>
                <span className="text-[22px] font-black text-red-600 leading-none">
                  {Number(listing.busData.contractMonthly).toLocaleString('en-US')}
                </span>
                <span className="text-[13px] text-on-surface-variant">{listing.currency}</span>
                <span className="text-[11px] text-on-surface-variant">/ {ts('contractMonthlyLabel')}</span>
              </>
            ) : !listing.price || listing.price <= 0 ? (
              <span className="text-[16px] font-bold text-on-surface">{ts('contactForPrice')}</span>
            ) : (
              <>
                <span className="text-[26px] font-black text-red-600 leading-none">
                  {listing.price.toLocaleString('en-US')}
                </span>
                <span className="text-[13px] text-on-surface-variant">
                  {listing.currency === 'OMR' ? ts('currencyUnit') : listing.currency}
                </span>
                {listing.negotiable && (
                  <span className="text-[11px] font-semibold text-emerald-600 ms-1">{ts('negotiableLabel')}</span>
                )}
              </>
            )}
          </div>
          {isOwner ? (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={getEditRoute(listing.type, listing.id)}
                className="h-12 rounded-xl bg-primary text-on-primary text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {ts('editListing')}
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="h-12 rounded-xl bg-error text-on-error text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-error/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <Trash2 size={18} />
                {ts('deleteListing')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleMessage}
                className="h-10 rounded-xl bg-primary text-on-primary text-[12px] font-medium flex items-center justify-center gap-1"
              >
                <MessageCircle size={14} />
                {ts('contact')}
              </button>
              {listing.seller.phone ? (
                <button
                  onClick={handleCall}
                  className="h-10 rounded-xl border border-outline-variant/30 text-on-surface text-[12px] font-medium flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
                >
                  <Phone size={14} />
                  {ts('call')}
                </button>
              ) : (
                <button
                  disabled
                  className="h-10 rounded-xl border border-outline-variant/20 text-on-surface-variant/40 text-[12px] font-medium flex items-center justify-center gap-1 cursor-not-allowed bg-surface-container-low"
                >
                  <Phone size={14} />
                  {ts('call')}
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
                  {ts('whatsapp')}
                </button>
              ) : (
                <button
                  disabled
                  className="h-10 rounded-xl border border-outline-variant/20 text-on-surface-variant/40 text-[12px] font-medium flex items-center justify-center gap-1 cursor-not-allowed bg-surface-container-low"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.141.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {ts('whatsapp')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ══ D — TWO-COLUMN LAYOUT ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
          {/* ════ LEFT COLUMN ════ */}
          <div>
            {/* Seller Row */}
            <SellerRow seller={listing.seller} />
            <div className="h-[2px] w-full rounded-full bg-primary/20 mt-1" />

            {/* Mobile stats — views + date (desktop shows these in PriceCard) */}
            <div className="lg:hidden flex items-center gap-4 text-[11px] text-on-surface-variant mb-4 mt-3">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">visibility</span>
                {ts('views', { count: listing.views.toLocaleString('en-US') })}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {formatRelativeTime(listing.createdAt, locale)}
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {listing.status === 'SOLD' ? ts('statusSoldShort') : ts('statusActive')}
              </span>
            </div>

            <Divider />

            {/* Description */}
            {listing.description && (
              <>
                <div>
                  <SectionTitle>{ts('descriptionTitle')}</SectionTitle>
                  <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-6 shadow-sm">
                    <div className="absolute top-4 end-4 text-on-surface-variant/10">
                      <span className="material-symbols-outlined text-3xl">description</span>
                    </div>
                    <ExpandableText text={listing.description} expandLabel={ts('expand')} collapseLabel={ts('collapse')} />
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Specs Grid */}
            {config.specsFields?.length > 0 && (
              <>
                <div>
                  <SectionTitle>{ts('specsTitle')}</SectionTitle>
                  <SpecsGrid listing={listing} fields={config.specsFields} />
                </div>
                <Divider />
              </>
            )}

            {/* Contract Details Section */}
            <ContractDetails listing={listing} />

            {/* Highlights */}
            {config.highlightFields?.length > 0 && (
              <DropdownSection
                title={locale === 'ar' ? 'أبرز المميزات' : 'Highlights'}
                subtitle={`${config.highlightFields.length} ${locale === 'ar' ? 'عناصر' : 'items'}`}
                icon="auto_awesome"
              >
                <Highlights listing={listing} fields={config.highlightFields} />
              </DropdownSection>
            )}

            {/* Details Table */}
            {config.tableFields?.length > 0 && (
              <DropdownSection
                title={ts('detailsTitle', { type: config.displayName })}
                subtitle={`${config.tableFields.length} ${ts('specsTitle')}`}
                icon="list_alt"
              >
                <DetailsTable listing={listing} fields={config.tableFields} />
              </DropdownSection>
            )}

            {/* Features / الكماليات */}
            {(() => {
              const features =
                listing.carData?.features ||
                listing.busData?.features ||
                listing.equipmentData?.features ||
                listing.serviceData?.features ||
                [];
              if (features.length === 0) return null;
              return (
                <>
                  <Divider />
                  <div>
                    <SectionTitle>{ts('featuresTitle')}</SectionTitle>
                    <div className="flex flex-wrap gap-2.5">
                      {features.map((feat) => (
                        <span
                          key={feat}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 text-[12px] font-medium text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300/80 transition-all duration-200"
                        >
                          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </span>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Location Map */}
            {listing.location && (
              <>
                <Divider />
                <div>
                  <SectionTitle>{ts('locationTitle')}</SectionTitle>
                  <p className="text-[12px] text-on-surface-variant mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                    {[resolveCityLabel(listing.city, locale), resolveLocationLabel(listing.governorate, locale), ts('country')].filter(Boolean).join('، ')}
                    {distance !== null && (
                      <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant ms-1">
                        {distance < 1
                          ? ts('distanceMeters', { distance: Math.round(distance * 1000) })
                          : ts('distanceKm', { distance: distance.toFixed(1) })}
                      </span>
                    )}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm" style={{ height: 200 }}>
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
                      {ts('getDirections')}
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${listing.location.lat},${listing.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant text-[12px] font-medium flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      {ts('viewOnMap')}
                    </a>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ════ RIGHT COLUMN — Price Card ════ */}
          <PriceCard
            listing={listing}
            isOwner={isOwner}
            editRoute={getEditRoute(listing.type, listing.id)}
            onMessage={handleMessage}
            onWhatsApp={handleWhatsApp}
            onCall={listing.seller.phone ? handleCall : undefined}
            onReport={handleReport}
            onDelete={isOwner ? () => setShowDeleteConfirm(true) : undefined}
          />
        </div>

        {/* ══ E — SIMILAR ITEMS ══ */}
        <SimilarItems
          type={listing.type}
          currentId={listing.id}
          governorate={listing.governorate}
        />
      </main>

      {/* ══ MOBILE STICKY CTA BAR ══ */}
      {!isOwner && (
        <MobileCTABar
          listing={listing}
          onMessage={handleMessage}
          onWhatsApp={handleWhatsApp}
          onCall={listing.seller.phone ? handleCall : undefined}
          visible={stickyBarVisible}
        />
      )}

      {/* ══ DELETE CONFIRMATION MODAL ══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header with warning icon */}
            <div className="bg-error/5 px-6 py-5 border-b border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={24} className="text-error" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">
                    {ts('deleteConfirmTitle')}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {ts('deleteListing')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Message body */}
            <div className="px-6 py-5">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {ts('deleteConfirmMessage')}
              </p>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-surface-container-highest/30 border-t border-outline-variant/10">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11 rounded-xl border border-outline-variant/30 text-on-surface text-[14px] font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-150"
                >
                  {ts('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-error text-on-error text-[14px] font-medium hover:bg-error/90 active:scale-[0.98] transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-error/30 border-t-on-error rounded-full animate-spin" />
                      {ts('delete')}
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      {ts('delete')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
