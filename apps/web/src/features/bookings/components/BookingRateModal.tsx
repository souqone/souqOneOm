'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import { useCreateReview } from '@/lib/api';
import { useToast } from '@/components/toast';
import { getBookingEntity } from '@/lib/api';
import type { BookingItem } from '@/lib/api';

type BookingRole = 'renter' | 'owner';

interface Props {
  booking: BookingItem | null;
  role: BookingRole;
  onClose: () => void;
  onSubmit?: () => void;
}

export function BookingRateModal({ booking, role, onClose, onSubmit }: Props) {
  const tb = useTranslations('bookings');
  const { addToast } = useToast();
  const createReview = useCreateReview();

  const [rating, setRating]           = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment]         = useState('');

  const entity = booking ? getBookingEntity(booking) : null;
  const revieweeId = role === 'renter' ? booking?.ownerId : booking?.renterId;

  async function handleSubmit() {
    if (!booking || rating === 0 || !revieweeId) return;
    try {
      await createReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
        entityType: 'BOOKING',
        entityId: booking.id,
        revieweeId,
      });
      addToast('success', tb('ratingSubmitted'));
      onSubmit?.();
      onClose();
    } catch {
      addToast('error', tb('ratingError'));
    }
  }

  return (
    <Modal open={!!booking} onClose={onClose} title={tb('rateTitle')} size="sm">
      <div dir="rtl">
        {entity && (
          <p className="text-on-surface-variant text-sm text-center mb-4">{entity.title}</p>
        )}

        {/* Stars */}
        <div className="flex justify-center gap-2 my-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-all active:scale-90"
              aria-label={`${s} ${tb('stars')}`}>
              <span className={`material-symbols-outlined text-4xl transition-colors ${
                s <= (hoverRating || rating) ? 'text-yellow-400' : 'text-on-surface-variant/20'
              }`} style={{ fontVariationSettings: s <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0" }}>
                star
              </span>
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={tb('rateCommentPlaceholder')}
          rows={3}
          className="w-full rounded-xl bg-surface-container-low border border-outline-variant/15 text-sm p-3
                     focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none text-on-surface"
        />

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || createReview.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold text-sm
                       shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
            {createReview.isPending && (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            )}
            {tb('submitRating')}
          </button>
          <button onClick={onClose}
            className="w-full h-10 rounded-2xl text-on-surface-variant text-sm hover:bg-surface-container-low transition-colors">
            {tb('cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
