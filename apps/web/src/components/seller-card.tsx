'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations, useLocale } from 'next-intl';
import { resolveLocationLabel } from '@/lib/location-data';

interface SellerCardProps {
  title?: string;
  name: string;
  username?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  location?: string | null;
  phone?: string | null;
  sellerId?: string;
  /** WhatsApp pre-filled message */
  whatsappText?: string;
  onMessage?: () => void;
  messagePending?: boolean;
  onShare?: () => void;
  isOwner?: boolean;
  memberSince?: string | null;
}

export function SellerCard({
  title,
  name,
  username,
  avatarUrl,
  isVerified,
  location,
  phone,
  sellerId,
  whatsappText,
  onMessage,
  messagePending,
  onShare,
  isOwner,
  memberSince,
}: SellerCardProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const initial = (name || username || '?')[0]?.toUpperCase();

  const avatarEl = avatarUrl ? (
    <Image src={getImageUrl(avatarUrl) || ''} alt={name} width={44} height={44} className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover" />
  ) : (
    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#004ac6] to-[#2563eb] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
      {initial}
    </div>
  );

  const nameRow = (
    <div className="min-w-0 flex-1">
      <p className="font-black text-on-surface text-sm truncate">{name}</p>
      {isVerified && (
        <span className="text-[11px] text-primary font-black flex items-center gap-0.5">
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          {tp('sellerCardVerified')}
        </span>
      )}
      {location && (
        <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[11px] text-primary">location_on</span>{resolveLocationLabel(location, locale) ?? location}
        </p>
      )}
    </div>
  );

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 dark:border-outline-variant/20 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 sm:px-6 sm:py-4 border-b border-outline-variant/10 dark:border-outline-variant/20 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-primary text-base">storefront</span>
        <h3 className="font-black text-on-surface text-xs sm:text-sm">{title || tp('sellerCardTitle')}</h3>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-6">
        {/* Avatar + Name */}
        {sellerId ? (
          <Link href={`/seller/${sellerId}`} className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative shrink-0">
              {avatarEl}
              {isVerified && (
                <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>
            {nameRow}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="shrink-0">{avatarEl}</div>
            {nameRow}
          </div>
        )}

        {memberSince && (
          <p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline-variant/10 dark:border-outline-variant/20">
            {tp('sellerCardMemberSince', { date: new Date(memberSince).toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long' }) })}
          </p>
        )}

        {/* Action buttons */}
        {!isOwner && (onMessage || onShare || phone) && (
          <div className="mt-3 space-y-2">
            {/* Row 1: Message + Share side by side */}
            <div className="grid grid-cols-2 gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-lg">call</span> {tp('svcDetailCall')}
                </a>
              )}
              {phone && (
                <a href={`https://wa.me/${phone.replace(/[^0-9+]/g, '')}${whatsappText ? `?text=${encodeURIComponent(whatsappText)}` : ''}`} target="_blank" rel="noopener noreferrer"
                  className="bg-surface-container-high hover:bg-[#25D366] hover:text-white dark:bg-surface-container-highest text-on-surface py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-lg">chat</span> {tp('svcDetailWhatsapp')}
                </a>
              )}
              {onMessage && (
                <button
                  onClick={onMessage}
                  disabled={messagePending}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  {messagePending ? tp('sellerCardMessaging') : tp('sellerCardMessage')}
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="bg-surface-container-high dark:bg-surface-container-highest text-on-surface py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">share</span>
                  {tp('sellerCardShare')}
                </button>
              )}
            </div>

            {/* Row 2: Call + WhatsApp */}
            {phone && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${phone}`}
                  className="bg-primary text-on-primary py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  {tp('sellerCardCall')}
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}${whatsappText ? `?text=${encodeURIComponent(whatsappText)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  {tp('sellerCardWhatsapp')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
