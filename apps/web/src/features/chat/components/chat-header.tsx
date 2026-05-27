'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { getImageUrl } from '@/lib/image-utils';
import { useTranslations } from 'next-intl';
import { ENTITY_KEYS, ENTITY_BADGE_COLORS, ENTITY_NAVIGATE } from '../constants/entity-config';

export interface ChatParticipant {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ChatListingBanner {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  images?: { url: string }[];
}

interface ChatHeaderProps {
  participant: ChatParticipant | null;
  listing: ChatListingBanner | null;
  entityType?: string;
  /** Canonical entity id for deep links (same as conversation.entityId). */
  entityId?: string;
  isOnline: boolean;
  isTyping: boolean;
  searchMode: boolean;
  onToggleSearch: () => void;
}

function listingBannerIcon(entityType?: string) {
  if (entityType === 'BUS_LISTING') return 'directions_bus';
  if (entityType === 'EQUIPMENT_LISTING') return 'construction';
  if (entityType === 'JOB') return 'work';
  if (entityType === 'OPERATOR_LISTING') return 'engineering';
  if (entityType === 'SPARE_PART') return 'build';
  if (entityType === 'CAR_SERVICE') return 'car_repair';
  return 'directions_car';
}

export function ChatHeader({
  participant,
  listing,
  entityType,
  entityId,
  isOnline,
  isTyping,
  searchMode,
  onToggleSearch,
}: ChatHeaderProps) {
  const tp = useTranslations('pages');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const name = participant?.displayName || participant?.username || tp('chatDefaultUser');
  const navigateId = entityId ?? listing?.id ?? '';
  const entityPath =
    entityType && navigateId ? ENTITY_NAVIGATE[entityType]?.(navigateId) ?? null : null;
  const badgeKey = entityType ? ENTITY_KEYS[entityType] : undefined;

  return (
    <div className="flex flex-col shrink-0">
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/8
                   bg-surface-container-lowest shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-0 z-10"
      >
        <Link
          href="/messages"
          className="lg:hidden w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center
                     text-on-surface-variant hover:bg-surface-container transition-all flex-shrink-0"
          aria-label={tp('chatBackToListAria')}
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </Link>

        <div className="relative flex-shrink-0">
          <div
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#0B2447]
                       flex items-center justify-center text-on-primary font-semibold text-base shadow-sm overflow-hidden"
          >
            {participant?.avatarUrl ? (
              <Image
                src={getImageUrl(participant.avatarUrl) || ''}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span>{name[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -start-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-on-surface text-[14px] truncate">
              {name}
            </p>
            {entityType && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                ${ENTITY_BADGE_COLORS[entityType] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}
              >
                {badgeKey ? tp(badgeKey) : tp('notifTypeOther')}
              </span>
            )}
          </div>
          <p className={`text-[11px] font-medium ${isOnline ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
            {isTyping ? (
              <span className="text-primary">{tp('chatTyping')}</span>
            ) : isOnline ? (
              tp('chatOnline')
            ) : (
              tp('chatOffline')
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-label={tp('chatSearchInThreadAria')}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
              ${searchMode ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-base">{searchMode ? 'close' : 'search'}</span>
          </button>
          <button
            type="button"
            aria-label={tp('chatMoreAria')}
            className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center
                      text-on-surface-variant hover:bg-surface-container transition-all"
          >
            <span className="material-symbols-outlined text-base">more_vert</span>
          </button>
        </div>
      </div>

      {listing && !bannerDismissed && (
        <div
          className="mx-3 mt-3 flex items-center gap-3 bg-primary/[0.04] border border-primary/10
                     rounded-2xl p-3 group/banner"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0 relative">
            {listing.images?.[0]?.url ? (
              <Image
                src={getImageUrl(listing.images[0].url) || listing.images[0].url}
                alt=""
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-xl">
                  {listingBannerIcon(entityType)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {entityType && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border mb-1 inline-block
                ${ENTITY_BADGE_COLORS[entityType] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}
              >
                {badgeKey ? tp(badgeKey) : tp('notifTypeOther')}
              </span>
            )}
            <p className="text-[12px] font-semibold text-on-surface truncate">{listing.title}</p>

            {entityPath && (
              <Link
                href={entityPath}
                className="text-[10px] text-primary font-medium hover:underline inline-flex items-center gap-0.5 mt-0.5"
              >
                {tp('chatViewListing')}
                <span className="material-symbols-outlined text-xs">chevron_left</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label={tp('chatDismissBannerAria')}
            className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center
                      text-on-surface-variant/40 hover:bg-surface-container-low hover:text-on-surface-variant
                      transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
