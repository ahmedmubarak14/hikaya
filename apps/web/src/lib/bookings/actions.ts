'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface UpcomingBooking {
  id: string;
  clientName: string;
  discipline: string;
  status: string;
  sessionStart: string;
  city: string;
  daysUntil: number;
}

/**
 * Get upcoming bookings for the current user (as creator).
 * Returns the next N future bookings sorted by session date.
 */
export async function getUpcomingBookings(
  userId: string,
  limit = 3,
): Promise<UpcomingBooking[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();
  const now = new Date().toISOString();

  // First get the creator profile ID
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('Booking')
    .select(
      'id, discipline, status, sessionStart, city, ClientProfile:ClientProfile ( User:User ( displayName ) )',
    )
    .eq('creatorProfileId', profile.id)
    .gte('sessionStart', now)
    .neq('status', 'CANCELLED')
    .order('sessionStart', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[bookings/actions] getUpcomingBookings error:', error.message);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const sessionDate = new Date(row.sessionStart as string);
    const diffMs = sessionDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const clientProfile = row.ClientProfile as Record<string, unknown> | null;
    const user = clientProfile?.User as Record<string, unknown> | null;

    return {
      id: row.id as string,
      clientName: (user?.displayName as string) ?? 'Client',
      discipline: row.discipline as string,
      status: row.status as string,
      sessionStart: row.sessionStart as string,
      city: row.city as string,
      daysUntil,
    };
  });
}

type BookingActionResult = { ok: true } | { ok: false; error: string };

/**
 * Reschedule a booking by updating the session date.
 */
export async function rescheduleBookingAction(
  bookingId: string,
  newDate: string,
  newTime: string,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const sessionStart = new Date(`${newDate}T${newTime}:00`);
  if (Number.isNaN(sessionStart.getTime())) {
    return { ok: false, error: 'INVALID_DATE' };
  }

  const supabase = await createClient();

  // Verify the booking belongs to the current user (as creator)
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'NO_CREATOR_PROFILE' };

  const { data: booking } = await supabase
    .from('Booking')
    .select('id, creatorProfileId, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if ((booking.creatorProfileId as string) !== (profile.id as string)) {
    return { ok: false, error: 'NOT_OWNER' };
  }
  if ((booking.status as string) === 'CANCELLED' || (booking.status as string) === 'COMPLETED') {
    return { ok: false, error: 'CANNOT_RESCHEDULE' };
  }

  const { error } = await supabase
    .from('Booking')
    .update({
      sessionStart: sessionStart.toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('[bookings/actions] rescheduleBookingAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}

/**
 * Cancel a booking with a reason.
 */
export async function cancelBookingAction(
  bookingId: string,
  reason: string,
): Promise<BookingActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  // Verify the booking belongs to the current user
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (!profile) return { ok: false, error: 'NO_CREATOR_PROFILE' };

  const { data: booking } = await supabase
    .from('Booking')
    .select('id, creatorProfileId, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };
  if ((booking.creatorProfileId as string) !== (profile.id as string)) {
    return { ok: false, error: 'NOT_OWNER' };
  }
  if ((booking.status as string) === 'CANCELLED') {
    return { ok: false, error: 'ALREADY_CANCELLED' };
  }

  const { error } = await supabase
    .from('Booking')
    .update({
      status: 'CANCELLED',
      notes: reason ? `Cancellation reason: ${reason}` : null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', bookingId);

  if (error) {
    console.error('[bookings/actions] cancelBookingAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}
