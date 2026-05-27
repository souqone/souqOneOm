/**
 * Price card component (desktop sticky sidebar).
 * Shows price, quick info, CTA buttons, and seller mini-card.
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MessageCircle, Trash2, Clock, Eye, Tag } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';
import type { UnifiedListing } from '../types/unified.types';

interface PriceCardProps {
  listing: UnifiedListing;
  isOwner?: boolean;
  isAuthenticated?: boolean;
  editRoute?: string;
  onMessage: () => void;
  onWhatsApp: () => void;
  onCall?: () => void;
  onReport: () => void;
  onDelete?: () => void;
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

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '•'.repeat(phone.length);
  return phone.slice(0, 4) + ' •••• ••';
}

export const PriceCard = memo(function PriceCard({
  listing,
  isOwner,
  isAuthenticated = false,
  editRoute,
  onMessage,
  onWhatsApp,
  onCall,
  onReport,
  onDelete,
}: PriceCardProps) {
  const ts = useTranslations('sale');
  const locale = useLocale();
  const { seller } = listing;

  const hasPhone = Boolean(seller.phone);
  const hasWhatsApp = Boolean(seller.whatsapp);
  const relativeDate = formatRelativeTime(listing.createdAt, locale);
  const currencyLabel = locale === 'ar' ? 'ر.ع' : listing.currency;

  return (
    <div className="hidden lg:block sticky top-5">
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="h-[3px] w-full bg-primary" />
        <div className="p-5 flex flex-col gap-4">

          {/* ① SELLER — أول حاجة */}
          <Link href={`/seller/${seller.id}`} className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high">
                {seller.image ? (
                  <Image src={seller.image} alt={seller.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-white font-bold text-base">{seller.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                  {seller.name}
                </p>
                {seller.verified && (
                  <span
                    className="material-symbols-outlined text-primary text-[16px] leading-none"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title={ts('verifiedSeller')}
                  >
                    verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {seller.verified ? ts('verifiedSeller') : ts('seller')}
                {seller.governorate ? ` · ${resolveLocationLabel(seller.governorate, locale)}` : ''}
              </p>
              {seller.listingCount !== undefined && (
                <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                  {ts('listingCount', { count: seller.listingCount })}
                </p>
              )}
            </div>
          </Link>

          <hr className="border-t border-outline-variant/15" />

          {/* ② PRICE */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {listing.negotiable && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-medium">
                  <Tag size={10} />
                  {ts('negotiableLabel')}
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-medium">
                <Clock size={10} />
                {relativeDate}
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[11px] px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-medium">
                <Eye size={10} />
                {ts('views', { count: listing.views })}
              </span>
            </div>
            {!listing.price || listing.price <= 0 ? (
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="material-symbols-outlined text-primary text-[20px]">contact_phone</span>
                <span className="text-[16px] font-bold text-on-surface">{ts('contactForPrice')}</span>
              </div>
            ) : listing.type === 'service' && listing.serviceData?.priceTo ? (
              <div className="flex items-baseline gap-1 flex-wrap justify-center" dir="ltr">
                <span className="text-[13px] text-on-surface-variant">{currencyLabel}</span>
                <span className="text-[24px] font-bold text-red-600">{listing.price.toLocaleString('en-US')}</span>
                <span className="text-[14px] text-on-surface-variant mx-0.5">—</span>
                <span className="text-[24px] font-bold text-red-600">{listing.serviceData.priceTo.toLocaleString('en-US')}</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5 flex-wrap justify-center" dir="ltr">
                <span className="text-[13px] text-on-surface-variant">
                  {currencyLabel}{listing.priceLabel ? ` / ${listing.priceLabel}` : ''}
                </span>
                <span className="text-[28px] font-bold text-red-600 leading-none">{listing.price.toLocaleString('en-US')}</span>
              </div>
            )}
          </div>

          <hr className="border-t border-outline-variant/15" />

          {/* ③ CTA BUTTONS */}
          <div className="flex flex-col gap-2.5">
            {isOwner && editRoute ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={editRoute}
                  className="h-12 rounded-xl bg-primary text-on-primary text-[14px] font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  {ts('editListing')}
                </Link>
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="h-12 rounded-xl bg-error text-on-error text-[14px] font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-error/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
                  >
                    <Trash2 size={18} />
                    {ts('deleteListing')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {hasPhone && onCall && (
                  <button
                    onClick={onCall}
                    className="w-full h-12 rounded-xl bg-primary text-on-primary text-[14px] font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
                    dir="ltr"
                  >
                    <Phone size={18} />
                    {isAuthenticated ? seller.phone : maskPhone(seller.phone || '')}
                  </button>
                )}

                <div className={`grid ${hasWhatsApp ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                  <button
                    onClick={onMessage}
                    className="h-11 rounded-xl border border-outline-variant/30 text-on-surface text-[13px] font-medium flex items-center justify-center gap-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <MessageCircle size={16} />
                    {ts('contactWithSeller')}
                  </button>

                  {hasWhatsApp && (
                    <button
                      onClick={onWhatsApp}
                      className="h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 transition-colors"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {ts('whatsapp')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ④ REPORT */}
          <div className="text-center -mt-1">
            <button
              onClick={onReport}
              className="text-[10px] text-on-surface-variant/60 hover:text-error cursor-pointer underline underline-offset-2 transition-colors"
            >
              {ts('reportListing')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
});
