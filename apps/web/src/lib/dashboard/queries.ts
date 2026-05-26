'use server';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

/**
 * Dashboard stat data fetched from real Supabase tables.
 * Used by the /me dashboard page for the stat tiles and activity sections.
 */

export interface DashboardStats {
  profileViews: number;
  activeBookings: number;
  unreadMessages: number;
  revenueThisMonthHalalas: number;
}

export interface RecentThread {
  id: string;
  otherName: string;
  otherAvatarUrl?: string;
  lastMessageBody: string;
  lastMessageAt: string;
}

export interface UpcomingSession {
  id: string;
  clientName: string;
  sessionStart: string;
  discipline: string;
  status: string;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const session = await getSession();
  if (!session) return { profileViews: 0, activeBookings: 0, unreadMessages: 0, revenueThisMonthHalalas: 0 };

  const supabase = await createClient();

  // Profile views
  let profileViews = 0;
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id, profileViewCount')
    .eq('userId', userId)
    .maybeSingle();
  if (profile) {
    profileViews = (profile.profileViewCount as number) ?? 0;
  }

  // Active bookings (CONFIRMED or IN_PROGRESS)
  let activeBookings = 0;
  if (profile) {
    const { count } = await supabase
      .from('Booking')
      .select('id', { count: 'exact', head: true })
      .eq('creatorProfileId', profile.id)
      .in('status', ['CONFIRMED', 'IN_PROGRESS']);
    activeBookings = count ?? 0;
  }

  // Unread messages
  let unreadMessages = 0;
  try {
    const { getUnreadMessageCountFromDB } = await import('@/lib/messages/supabase-queries');
    unreadMessages = await getUnreadMessageCountFromDB(userId);
  } catch {
    // Supabase unavailable
  }

  // Revenue this month (completed bookings)
  let revenueThisMonthHalalas = 0;
  if (profile) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: completedBookings } = await supabase
      .from('Booking')
      .select('totalHalalas')
      .eq('creatorProfileId', profile.id)
      .eq('status', 'COMPLETED')
      .gte('updatedAt', monthStart)
      .lte('updatedAt', monthEnd);

    revenueThisMonthHalalas = (completedBookings ?? []).reduce(
      (sum: number, b: Record<string, unknown>) => sum + ((b.totalHalalas as number) ?? 0),
      0,
    );
  }

  return { profileViews, activeBookings, unreadMessages, revenueThisMonthHalalas };
}

export async function getRecentThreads(userId: string, limit = 3): Promise<RecentThread[]> {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from('Thread')
    .select(`
      id, creatorUserId, clientUserId, lastMessageAt,
      creatorUser:User!creatorUserId ( displayName, avatarUrl ),
      clientUser:User!clientUserId ( displayName, avatarUrl )
    `)
    .or(`creatorUserId.eq.${userId},clientUserId.eq.${userId}`)
    .order('lastMessageAt', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (!threads || threads.length === 0) return [];

  const results: RecentThread[] = [];

  for (const t of threads) {
    const row = t as Record<string, unknown>;
    const isCreator = (row.creatorUserId as string) === userId;
    const otherUser = isCreator
      ? (row.clientUser as Record<string, unknown> | null)
      : (row.creatorUser as Record<string, unknown> | null);

    // Fetch last message for this thread
    const { data: lastMsg } = await supabase
      .from('Message')
      .select('body, createdAt')
      .eq('threadId', row.id as string)
      .order('createdAt', { ascending: false })
      .limit(1);

    const msg = lastMsg?.[0] as Record<string, unknown> | undefined;

    results.push({
      id: row.id as string,
      otherName: (otherUser?.displayName as string) ?? 'Unknown',
      otherAvatarUrl: (otherUser?.avatarUrl as string) ?? undefined,
      lastMessageBody: (msg?.body as string) ?? '',
      lastMessageAt: (row.lastMessageAt as string) ?? (msg?.createdAt as string) ?? '',
    });
  }

  return results;
}

export async function getUpcomingSessions(userId: string, limit = 3): Promise<UpcomingSession[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (!profile) return [];

  const { data } = await supabase
    .from('Booking')
    .select(
      'id, discipline, status, sessionStart, ClientProfile:ClientProfile ( User:User ( displayName ) )',
    )
    .eq('creatorProfileId', profile.id)
    .gte('sessionStart', now)
    .in('status', ['CONFIRMED', 'IN_PROGRESS', 'CONTRACTED', 'QUOTED'])
    .order('sessionStart', { ascending: true })
    .limit(limit);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const clientProfile = row.ClientProfile as Record<string, unknown> | null;
    const user = clientProfile?.User as Record<string, unknown> | null;
    return {
      id: row.id as string,
      clientName: (user?.displayName as string) ?? 'Client',
      sessionStart: row.sessionStart as string,
      discipline: row.discipline as string,
      status: row.status as string,
    };
  });
}
