'use client';

import { useState, useEffect, useRef } from 'react';
import { transportApi } from '../api';
import StarRating from '@/components/ui/StarRating';
import { Loader2, User } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { CarrierReview } from '../types';

interface Props {
  carrierId: string;
}

export default function CarrierReviews({ carrierId }: Props) {
  const [reviews, setReviews] = useState<CarrierReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // NEW-S-1: generation counter — prevents stale carrier reviews from a
  // previous profile being appended when the user navigates quickly.
  const loadGenRef = useRef(0);

  useEffect(() => {
    loadReviews(1);
  }, [carrierId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReviews = async (p: number) => {
    const gen = ++loadGenRef.current;
    setLoading(true);
    try {
      const data = await transportApi.getCarrierReviews(carrierId, p, 5);
      if (gen !== loadGenRef.current) return;
      if (p === 1) {
        setReviews(data.items);
      } else {
        setReviews((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.meta.page < data.meta.totalPages);
      setPage(p);
    } catch (err) {
      if (gen !== loadGenRef.current) return;
      console.error(err);
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="animate-spin text-[var(--color-brand-navy)]" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center p-6 bg-[var(--color-surface-container)] rounded-2xl">
        <p className="text-sm text-[var(--color-on-surface-muted)]">لا توجد تقييمات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 rounded-xl border border-[var(--color-outline)] bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {review.reviewer?.avatarUrl ? (
                <img src={review.reviewer.avatarUrl} alt={review.reviewer.displayName} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center">
                  <User size={18} className="text-[var(--color-on-surface-muted)]" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-[var(--color-on-surface)]">
                  {review.reviewer?.displayName || 'مستخدم مجهول'}
                </p>
                <p className="text-xs text-[var(--color-on-surface-muted)]">
                  {formatRelativeDate(review.createdAt)}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} readOnly size={16} />
          </div>
          {review.comment && (
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => loadReviews(page + 1)}
          disabled={loading}
          className="text-sm font-bold text-[var(--color-brand-navy)] py-2 mt-2 hover:underline disabled:opacity-50"
        >
          {loading ? 'جارٍ التحميل...' : 'عرض المزيد'}
        </button>
      )}
    </div>
  );
}
