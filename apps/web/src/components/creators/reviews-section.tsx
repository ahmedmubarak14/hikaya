import { cn } from '@hikaya/ui';

import type { Locale } from '@/i18n/config';

export interface ReviewDisplay {
  id: string;
  authorName: string;
  rating: number;
  body: string | null;
  createdAt: string;
}

interface Props {
  reviews: ReviewDisplay[];
  locale: Locale;
  title: string;
  emptyText: string;
}

/**
 * Server-rendered reviews section for the creator profile "About" tab.
 * Displays star ratings, comments, reviewer names, and dates.
 */
export function ReviewsSection({ reviews, locale, title, emptyText }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="border-surface/10 rounded-xl border p-6">
        <h3 className="text-surface mb-2 text-lg font-medium">{title}</h3>
        <p className="text-surface/50 text-sm">{emptyText}</p>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="border-surface/10 rounded-xl border p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-surface text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-1.5">
          <Stars rating={Math.round(avgRating)} size="sm" />
          <span className="text-surface/70 text-sm font-medium">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-surface/40 text-2xs">
            ({reviews.length})
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-4">
        {reviews.map((review) => {
          const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-SA', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date(review.createdAt));

          return (
            <li key={review.id} className="border-surface/10 border-b pb-4 last:border-0 last:pb-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-surface text-sm font-medium">{review.authorName}</span>
                  <Stars rating={review.rating} size="xs" />
                </div>
                <span className="text-2xs text-surface/40">{date}</span>
              </div>
              {review.body ? (
                <p className="text-surface/70 text-sm leading-relaxed">{review.body}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Star rating display. Uses filled and empty stars.
 */
export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' }) {
  const sizeClass = size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <span className={cn('text-accent-secondary inline-flex', sizeClass)} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'text-accent-secondary' : 'text-surface/20'}>
          {'★'}
        </span>
      ))}
    </span>
  );
}
