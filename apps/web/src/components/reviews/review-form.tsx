'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@hikaya/ui';

interface Props {
  bookingId: string;
  creatorProfileId: string;
  subjectUserId: string;
}

/**
 * Client-side form to leave a review on a completed booking.
 * Submits via server action. Only shown to clients on completed bookings.
 */
export function ReviewForm({ bookingId, creatorProfileId, subjectUserId }: Props) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError(t('errorNoRating'));
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const { submitReviewAction } = await import('@/lib/reviews/actions');
      const result = await submitReviewAction({
        bookingId,
        creatorProfileId,
        subjectUserId,
        rating,
        comment,
      });

      if (result.ok) {
        setSubmitted(true);
      } else if (result.error === 'ALREADY_REVIEWED') {
        setError(t('errorAlreadyReviewed'));
      } else {
        setError(t('errorGeneric'));
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="border-sage/30 bg-sage/5 rounded-xl border p-5">
        <span className="text-2xs text-sage">{t('submitted')}</span>
        <p className="text-surface/70 mt-1 text-sm">{t('submittedHint')}</p>
      </div>
    );
  }

  const displayRating = hoveredRating || rating;

  return (
    <div className="border-surface/10 bg-surface/[0.03] rounded-xl border p-5">
      <h3 className="text-surface mb-3 text-lg font-medium">{t('title')}</h3>
      <p className="text-surface/50 mb-4 text-sm">{t('hint')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star rating selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-2xs text-surface/50">{t('ratingLabel')}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const starValue = i + 1;
              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'text-2xl transition-colors',
                    starValue <= displayRating
                      ? 'text-accent-secondary'
                      : 'text-surface/20 hover:text-surface/40',
                  )}
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                >
                  {'★'}
                </button>
              );
            })}
            {rating > 0 && (
              <span className="text-surface/50 ml-2 text-sm">
                {rating} / 5
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <label className="flex flex-col gap-1.5">
          <span className="text-2xs text-surface/50">{t('commentLabel')}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="bg-bg border-surface/15 text-surface focus:border-accent-secondary rounded-md border px-3 py-2 text-sm outline-none transition-colors"
            placeholder={t('commentPlaceholder')}
          />
        </label>

        {error && (
          <p className="text-accent-secondary text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="bg-accent text-bg self-start rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}
