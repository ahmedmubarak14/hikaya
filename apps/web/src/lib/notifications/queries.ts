import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { type Locale } from '@/i18n/config';

export interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * List the signed-in user's notifications, newest first. Locale picks which
 * of the EN/AR title+body fields to surface — the Notification model stores
 * both so we can swap at read time without a translation roundtrip.
 */
export async function listMyNotifications(
  userId: string,
  locale: Locale,
  limit = 50,
): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Notification')
    .select('id, kind, titleEn, titleAr, bodyEn, bodyAr, href, readAt, createdAt')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[notifications/queries] listMyNotifications error:', error.message);
    return [];
  }

  const isAr = locale === 'ar';
  return (data ?? []).map((n) => ({
    id: n.id as string,
    kind: n.kind as string,
    title: (isAr ? (n.titleAr as string | null) : null) ?? (n.titleEn as string),
    body: (isAr ? (n.bodyAr as string | null) : null) ?? (n.bodyEn as string | null),
    href: (n.href as string | null) ?? null,
    readAt: (n.readAt as string | null) ?? null,
    createdAt: n.createdAt as string,
  }));
}

/**
 * Count the user's unread notifications. Cheap — used by the sidebar badge.
 */
export async function countMyUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('Notification')
    .select('id', { count: 'exact', head: true })
    .eq('userId', userId)
    .is('readAt', null);

  if (error) {
    console.error(
      '[notifications/queries] countMyUnreadNotifications error:',
      error.message,
    );
    return 0;
  }
  return count ?? 0;
}
