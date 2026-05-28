'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { transportApi } from '../api';
import StarRating from '@/components/ui/StarRating';
import { Loader2 } from 'lucide-react';

interface Props {
  bookingId: string;
}

export default function TransportReviewForm({ bookingId }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<{ rating: number; comment?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transportApi.getBookingReview(bookingId)
      .then((review: { rating: number; comment?: string | null } | null) => {
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 size={20} className="animate-spin text-[var(--color-brand-navy)]" />
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">تقييمك:</p>
        <StarRating rating={existingReview.rating} readOnly size={20} />
        {existingReview.comment && (
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 p-3 bg-[var(--color-surface-container)] rounded-xl">
            {existingReview.comment}
          </p>
        )}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('يرجى تحديد التقييم بالنجوم');
      return;
    }
    setIsSubmitting(true);
    try {
      await transportApi.submitReview(bookingId, rating, comment.trim() || undefined);
      toast.success('تم إرسال تقييمك بنجاح');
      setExistingReview({ rating, comment });
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold text-[var(--color-on-surface-variant)] mb-2">كيف كانت تجربتك مع الناقل؟</p>
        <StarRating rating={rating} onRatingChange={setRating} size={28} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب تعليقك هنا (اختياري)..."
        rows={3}
        className="w-full rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-navy)] resize-none"
      />
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="btn-navy justify-center"
      >
        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'إرسال التقييم'}
      </button>
    </form>
  );
}
