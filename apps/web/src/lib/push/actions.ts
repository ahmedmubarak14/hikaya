'use server';

import { randomUUID } from 'node:crypto';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

/**
 * Persist a Web Push subscription returned by PushManager.subscribe()
 * in the browser. Idempotent on endpoint — re-registering the same device
 * just refreshes the row.
 */
export async function registerPushSubscriptionAction(
  input: SubscriptionInput,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };
  if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  const supabase = await createClient();

  // Upsert by endpoint so re-subscribing on the same device is a no-op.
  const id = `ps_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const { error } = await supabase
    .from('PushSubscription')
    .upsert(
      {
        id,
        userId: session.user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        lastUsedAt: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    );

  if (error) {
    console.error('[push/actions] register error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }
  return { ok: true };
}

export async function unregisterPushSubscriptionAction(
  endpoint: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('PushSubscription')
    .delete()
    .eq('userId', session.user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[push/actions] unregister error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }
  return { ok: true };
}
