import webpush from 'web-push';

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Configure VAPID once per process. Falls back to a no-op when keys aren't
 * set so dev/local environments don't crash — `sendPushToUser` becomes a
 * silent skip in that case.
 */
let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:no-reply@hikaya.sa';
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  /** Where to navigate when the notification is clicked. */
  url?: string;
  /** Optional tag — replacing duplicates instead of stacking. */
  tag?: string;
}

/**
 * Send a push notification to every device the user has registered. Stale
 * 404/410 endpoints are pruned automatically. Skips entirely when VAPID
 * isn't configured so the caller can fire-and-forget without crashing.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    console.info('[push] VAPID not configured — skipping push to', userId);
    return;
  }

  const supabase = await createServiceClient();
  const { data: subs, error } = await supabase
    .from('PushSubscription')
    .select('id, endpoint, p256dh, auth')
    .eq('userId', userId);

  if (error || !subs || subs.length === 0) {
    if (error) console.error('[push] list subs error:', error.message);
    return;
  }

  const json = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint as string,
            keys: { p256dh: s.p256dh as string, auth: s.auth as string },
          },
          json,
        );
        await supabase
          .from('PushSubscription')
          .update({ lastUsedAt: new Date().toISOString() })
          .eq('id', s.id as string);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          stale.push(s.id as string);
        } else {
          console.error('[push] send error:', err);
        }
      }
    }),
  );

  if (stale.length > 0) {
    await supabase.from('PushSubscription').delete().in('id', stale);
  }
}
