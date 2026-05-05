'use client';

import Image from 'next/image';
import { StarRating } from './star-rating';
import { getImageUrl } from '@/lib/image-utils';
import type { ReviewItem } from '@/lib/api/reviews';
import { useTranslations } from 'next-intl';

export function ReviewCard({ review }: { review: ReviewItem }) {
  const t = useTranslations('reviews');

  const reviewer = review.reviewer;
  const avatar = reviewer.avatarUrl ? getImageUrl(reviewer.avatarUrl) : null;
  const name = reviewer.displayName || reviewer.username;
  const date = new Date(review.createdAt).toLocaleDateString('ar-OM-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl border border-outline-variant/10 p-4">
      <div className="flex items-start gap-3">
        {avatar ? (
          <Image src={avatar} alt={name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="font-black text-on-surface text-sm truncate">{name}</p>
            <span className="text-[10px] text-on-surface-variant shrink-0">{date}</span>
          </div>
          <StarRating value={review.rating} size="sm" readonly />
          {review.comment && (
            <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>

      {review.reply && (
        <div className="mt-3 ms-12 bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border-s-2 border-primary">
          <p className="text-[10px] text-primary font-bold mb-1">{t('sellerReply')}</p>
          <p className="text-xs text-on-surface-variant">{review.reply.body}</p>
        </div>
      )}
    </div>
  );
}
