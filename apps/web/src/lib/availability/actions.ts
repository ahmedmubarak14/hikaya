'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'ON_VACATION';

export interface BlockedDateRange {
  start: string; // ISO date
  end: string; // ISO date
  reason?: string;
}

/**
 * Get the creator's current availability and blocked dates.
 */
export async function getAvailabilityAction(): Promise<{
  status: AvailabilityStatus;
  blockedDates: BlockedDateRange[];
} | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('CreatorProfile')
    .select('availability, blockedDates')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[availability/actions] getAvailabilityAction error:', error.message);
    return null;
  }

  return {
    status: (data.availability as AvailabilityStatus) ?? 'AVAILABLE',
    blockedDates: (data.blockedDates as BlockedDateRange[] | null) ?? [],
  };
}

/**
 * Update the creator's availability status.
 */
export async function updateAvailabilityStatusAction(
  status: AvailabilityStatus,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const validStatuses: AvailabilityStatus[] = ['AVAILABLE', 'BUSY', 'ON_VACATION'];
  if (!validStatuses.includes(status)) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('CreatorProfile')
    .update({
      availability: status,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', session.user.id);

  if (error) {
    console.error('[availability/actions] updateAvailabilityStatusAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/availability');
  return { ok: true };
}

/**
 * Update the creator's blocked date ranges.
 */
export async function updateBlockedDatesAction(
  blockedDates: BlockedDateRange[],
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('CreatorProfile')
    .update({
      blockedDates: blockedDates,
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', session.user.id);

  if (error) {
    console.error('[availability/actions] updateBlockedDatesAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/availability');
  return { ok: true };
}
