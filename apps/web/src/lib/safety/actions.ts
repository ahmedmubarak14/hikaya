'use server';

import { randomUUID } from 'node:crypto';

import { revalidatePath } from 'next/cache';

import { type Locale } from '@/i18n/config';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult = Ok | Err;
type ActionResultWith<T extends object> = (Ok & T) | Err;

export type ReportReasonKind = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'OTHER';
export type ReportTargetKind = 'USER' | 'MESSAGE' | 'CREATOR_PROFILE';

/**
 * Block a user. Idempotent — blocking the same person twice is a no-op.
 * Existing message threads stay readable but the threads list filters out
 * blocked users (see messages queries).
 */
export async function blockUserAction(
  locale: Locale,
  targetUserId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };
  if (targetUserId === session.user.id) return { ok: false, error: 'CANNOT_BLOCK_SELF' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('UserBlock')
    .insert({
      id: `ub_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      blockerId: session.user.id,
      blockedId: targetUserId,
    });

  // Unique constraint violation => already blocked, treat as success.
  if (error && !/duplicate|unique/i.test(error.message)) {
    console.error('[safety/actions] blockUserAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/messages`);
  return { ok: true };
}

export async function unblockUserAction(
  locale: Locale,
  targetUserId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('UserBlock')
    .delete()
    .eq('blockerId', session.user.id)
    .eq('blockedId', targetUserId);

  if (error) {
    console.error('[safety/actions] unblockUserAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath(`/${locale}/me/messages`);
  return { ok: true };
}

/**
 * Create a Report. Lands in the admin queue with status OPEN.
 */
export async function reportAction(
  _locale: Locale,
  input: {
    targetUserId: string | null;
    targetKind: ReportTargetKind;
    targetRef?: string;
    reasonKind: ReportReasonKind;
    reasonNote?: string;
  },
): Promise<ActionResultWith<{ reportId: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };
  if (input.targetUserId && input.targetUserId === session.user.id) {
    return { ok: false, error: 'CANNOT_REPORT_SELF' };
  }
  if (!input.reasonKind) return { ok: false, error: 'INVALID_INPUT' };

  const supabase = await createClient();
  const reportId = `rp_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

  const { error } = await supabase.from('Report').insert({
    id: reportId,
    reporterId: session.user.id,
    targetUserId: input.targetUserId,
    targetKind: input.targetKind,
    targetRef: input.targetRef ?? null,
    reasonKind: input.reasonKind,
    reasonNote: input.reasonNote ?? null,
    status: 'OPEN',
  });

  if (error) {
    console.error('[safety/actions] reportAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true, reportId };
}

/**
 * Admin-only: resolve a report (status RESOLVED or DISMISSED).
 */
export async function resolveReportAction(
  reportId: string,
  resolution: 'RESOLVED' | 'DISMISSED',
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from('User')
    .select('roles')
    .eq('id', session.user.id)
    .maybeSingle();
  const roles = ((userRow?.roles ?? []) as string[]).concat(session.user.roles as string[]);
  if (!roles.includes('ADMIN')) return { ok: false, error: 'NOT_AUTHORIZED' };

  const { error } = await supabase
    .from('Report')
    .update({
      status: resolution,
      resolvedAt: new Date().toISOString(),
      resolverId: session.user.id,
    })
    .eq('id', reportId);

  if (error) {
    console.error('[safety/actions] resolveReportAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/admin/moderation');
  return { ok: true };
}
