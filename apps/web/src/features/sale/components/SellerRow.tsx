/**
 * Seller row component.
 * Displays seller avatar, name, and member since date.
 */

'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import type { UnifiedSeller } from '../types/unified.types';

interface SellerRowProps {
  seller: UnifiedSeller;
}

function formatMemberSince(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long' });
  } catch {
    return '';
  }
}

export const SellerRow = memo(function SellerRow({ seller }: SellerRowProps) {
  const ts = useTranslations('sale');
  const locale = useLocale();
  const memberSince = formatMemberSince(seller.memberSince, locale);

  return (
    <div className="flex items-center gap-3 py-1 pb-3">
      {/* Avatar */}
      <Link href={`/seller/${seller.id}`} className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container-high">
          {seller.image ? (
            <Image
              src={seller.image}
              alt={seller.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{seller.name[0]?.toUpperCase()}</span>
            </div>
          )}
        </div>
        {seller.verified && (
          <span
            className="absolute left-1/2 -translate-x-1/2 material-symbols-outlined text-primary text-[12px] leading-none bg-white dark:bg-surface-container rounded-full"
            style={{ fontVariationSettings: "'FILL' 1", bottom: '-6px' }}
          >
            verified
          </span>
        )}
      </Link>

      {/* Info */}
      <div>
        <p className="text-[14px] font-semibold text-on-surface">
          {ts.rich('listedBy', {
            name: seller.name,
            link: (chunks) => (
              <Link href={`/seller/${seller.id}`} className="hover:text-primary transition-colors">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1 flex-wrap">
          {memberSince && <span>{ts('memberSince', { date: memberSince })}</span>}
          {seller.listingCount !== undefined && seller.listingCount > 0 && (
            <>
              {memberSince && <span className="text-outline-variant/40">·</span>}
              <span>{ts('listingCount', { count: seller.listingCount })}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
});
