'use server';

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
