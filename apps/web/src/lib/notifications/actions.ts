'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

export interface NotificationPreferences {
  remind7Days: boolean;
  remind24Hours: boolean;
  remindDayOf: boolean;
}

/**
 * Get notification preferences for the current user.
 */
export async function getNotificationPreferencesAction(): Promise<NotificationPreferences> {
  const session = await getSession();
  if (!session) return { remind7Days: true, remind24Hours: true, remindDayOf: true };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('NotificationPreference')
    .select('remind7Days, remind24Hours, remindDayOf')
    .eq('userId', session.user.id)
    .maybeSingle();

  if (error || !data) {
    // Default to all enabled
    return { remind7Days: true, remind24Hours: true, remindDayOf: true };
  }

  return {
    remind7Days: data.remind7Days as boolean,
    remind24Hours: data.remind24Hours as boolean,
    remindDayOf: data.remindDayOf as boolean,
  };
}

/**
 * Update notification preferences for the current user.
 * Upserts into the NotificationPreference table.
 */
export async function updateNotificationPreferencesAction(
  prefs: NotificationPreferences,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Try to upsert
  const { error } = await supabase.from('NotificationPreference').upsert(
    {
      userId: session.user.id,
      remind7Days: prefs.remind7Days,
      remind24Hours: prefs.remind24Hours,
      remindDayOf: prefs.remindDayOf,
      updatedAt: now,
    },
    { onConflict: 'userId' },
  );

  if (error) {
    console.error(
      '[notifications/actions] updateNotificationPreferencesAction error:',
      error.message,
    );
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/settings');
  return { ok: true };
}
