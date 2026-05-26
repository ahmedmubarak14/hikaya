'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface ReviewResult {
  ok: boolean;
  error?: string;
}

interface SubmitReviewInput {
  bookingId: string;
  creatorProfileId: string;
  subjectUserId: string;
  rating: number;
  comment: string;
}

/**
 * Submit a review for a completed booking. Only the client on the booking
 * should call this. Validates: rating 1-5, booking exists, no duplicate.
 */
export async function submitReviewAction(input: SubmitReviewInput): Promise<ReviewResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const { bookingId, creatorProfileId, subjectUserId, rating, comment } = input;

  if (rating < 1 || rating > 5) return { ok: false, error: 'INVALID_RATING' };

  const supabase = await createClient();

  // Check no duplicate review
  const { data: existing } = await supabase
    .from('Review')
    .select('id')
    .eq('bookingId', bookingId)
    .eq('authorId', session.user.id)
    .maybeSingle();

  if (existing) return { ok: false, error: 'ALREADY_REVIEWED' };

  // Insert the review
  const now = new Date().toISOString();
  const { error: insertErr } = await supabase.from('Review').insert({
    bookingId,
    authorId: session.user.id,
    subjectId: subjectUserId,
    rating,
    body: comment.trim() || null,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  });

  if (insertErr) {
    console.error('[reviews/actions] submitReviewAction insert error:', insertErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Update CreatorProfile.reviewScore and reviewCount
  // First get all reviews for this creator's subject user
  const { data: allReviews } = await supabase
    .from('Review')
    .select('rating')
    .eq('subjectId', subjectUserId);

  if (allReviews && allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating as number), 0);
    const reviewCount = allReviews.length;
    const reviewScore = totalRating / reviewCount;

    await supabase
      .from('CreatorProfile')
      .update({
        reviewScore,
        reviewCount,
        updatedAt: now,
      })
      .eq('id', creatorProfileId);
  }

  revalidatePath('/');
  return { ok: true };
}
