'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReportResourceType =
  | 'PROFILE'
  | 'JOB'
  | 'BLOG_POST'
  | 'SPACE'
  | 'MESSAGE';

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE_CONTENT'
  | 'FRAUD'
  | 'IMPERSONATION'
  | 'OTHER';

export type ModerationErrorKey =
  | 'NOT_AUTHENTICATED'
  | 'INVALID_INPUT'
  | 'CANNOT_REPORT_SELF'
  | 'CANNOT_BLOCK_SELF'
  | 'ALREADY_BLOCKED'
  | 'NOT_BLOCKED'
  | 'NOT_ADMIN'
  | 'REPORT_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export interface ModerationFailure {
  ok: false;
  error: ModerationErrorKey;
  message?: string;
}

export interface ModerationSuccess {
  ok: true;
  error?: undefined;
  message?: string;
}

export type ModerationResult = ModerationSuccess | ModerationFailure;

// ---------------------------------------------------------------------------
// Report types for admin queue
// ---------------------------------------------------------------------------

export interface ReportRow {
  id: string;
  reporterId: string;
  reporterName: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 1. Content Report System
// ---------------------------------------------------------------------------

export async function reportContentAction(
  resourceType: ReportResourceType,
  resourceId: string,
  reason: ReportReason,
  description?: string,
): Promise<ModerationResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  // Basic validation
  if (!resourceType || !resourceId || !reason) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  // Prevent reporting your own content
  if (resourceType === 'PROFILE' && resourceId === session.user.id) {
    return { ok: false, error: 'CANNOT_REPORT_SELF' };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('Report').insert({
    reporterId: session.user.id,
    resourceType,
    resourceId,
    reason,
    description: description?.trim() || null,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  if (error) {
    console.error('[moderation/actions] reportContentAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// 2. Block User System
// ---------------------------------------------------------------------------

export async function blockUserAction(blockedId: string): Promise<ModerationResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (blockedId === session.user.id) {
    return { ok: false, error: 'CANNOT_BLOCK_SELF' };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('BlockedUser').insert({
    blockerId: session.user.id,
    blockedId,
    createdAt: now,
  });

  if (error) {
    // Unique constraint violation means already blocked
    if (error.code === '23505') {
      return { ok: false, error: 'ALREADY_BLOCKED' };
    }
    console.error('[moderation/actions] blockUserAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true };
}

export async function unblockUserAction(blockedId: string): Promise<ModerationResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('BlockedUser')
    .delete()
    .eq('blockerId', session.user.id)
    .eq('blockedId', blockedId)
    .select('id');

  if (error) {
    console.error('[moderation/actions] unblockUserAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  if (!data || data.length === 0) {
    return { ok: false, error: 'NOT_BLOCKED' };
  }

  return { ok: true };
}

export async function getBlockedUsersAction(): Promise<
  { id: string; blockedId: string; displayName: string; email: string; createdAt: string }[]
> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();

  // Fetch blocked user IDs
  const { data: blockedRows, error: blockedErr } = await supabase
    .from('BlockedUser')
    .select('id, blockedId, createdAt')
    .eq('blockerId', session.user.id)
    .order('createdAt', { ascending: false });

  if (blockedErr || !blockedRows || blockedRows.length === 0) return [];

  // Fetch display info for each blocked user
  const blockedIds = blockedRows.map((r) => r.blockedId as string);
  const { data: users } = await supabase
    .from('User')
    .select('id, displayName, email')
    .in('id', blockedIds);

  const userMap = new Map(
    (users ?? []).map((u) => [
      u.id as string,
      { displayName: u.displayName as string, email: u.email as string },
    ]),
  );

  return blockedRows.map((r) => ({
    id: r.id as string,
    blockedId: r.blockedId as string,
    displayName: userMap.get(r.blockedId as string)?.displayName ?? 'Unknown',
    email: userMap.get(r.blockedId as string)?.email ?? '',
    createdAt: r.createdAt as string,
  }));
}

export async function isBlockedAction(
  userId: string,
  otherUserId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('BlockedUser')
    .select('id')
    .or(
      `and(blockerId.eq.${userId},blockedId.eq.${otherUserId}),and(blockerId.eq.${otherUserId},blockedId.eq.${userId})`,
    )
    .limit(1);

  return (data ?? []).length > 0;
}

/**
 * Get IDs of users the current user has blocked.
 * Used to filter them out of discover results.
 */
export async function getBlockedUserIdsAction(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from('BlockedUser')
    .select('blockedId')
    .eq('blockerId', session.user.id);

  return (data ?? []).map((r) => r.blockedId as string);
}

// ---------------------------------------------------------------------------
// 4. Admin Moderation Queue
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();
  const { data: userRow } = await supabase
    .from('User')
    .select('roles')
    .eq('id', session.user.id)
    .maybeSingle();

  const dbRoles = (userRow?.roles ?? []) as string[];
  const sessionRoles = session.user.roles as string[];
  const allRoles = [...new Set([...dbRoles, ...sessionRoles])];

  if (!allRoles.includes('ADMIN')) {
    return { ok: false, error: 'NOT_ADMIN' };
  }

  return { ok: true, userId: session.user.id };
}

export async function listPendingReportsAction(): Promise<ReportRow[]> {
  const guard = await requireAdmin();
  if (!guard.ok) return [];

  const supabase = await createClient();

  const { data: reports, error } = await supabase
    .from('Report')
    .select('id, reporterId, resourceType, resourceId, reason, description, status, createdAt')
    .eq('status', 'PENDING')
    .order('createdAt', { ascending: true })
    .limit(100);

  if (error || !reports) return [];

  // Fetch reporter display names
  const reporterIds = [...new Set(reports.map((r) => r.reporterId as string))];
  const { data: reporters } = await supabase
    .from('User')
    .select('id, displayName')
    .in('id', reporterIds);

  const reporterMap = new Map(
    (reporters ?? []).map((u) => [u.id as string, u.displayName as string]),
  );

  return reports.map((r) => ({
    id: r.id as string,
    reporterId: r.reporterId as string,
    reporterName: reporterMap.get(r.reporterId as string) ?? 'Unknown',
    resourceType: r.resourceType as string,
    resourceId: r.resourceId as string,
    reason: r.reason as string,
    description: (r.description as string) ?? null,
    status: r.status as string,
    createdAt: r.createdAt as string,
  }));
}

export async function reviewReportAction(
  reportId: string,
  action: 'DISMISS' | 'TAKE_ACTION',
  suspendUserId?: string,
): Promise<ModerationResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, error: 'NOT_ADMIN' };

  const supabase = await createClient();
  const now = new Date().toISOString();

  const newStatus = action === 'DISMISS' ? 'DISMISSED' : 'ACTION_TAKEN';

  const { error: reportErr } = await supabase
    .from('Report')
    .update({
      status: newStatus,
      reviewedById: guard.userId,
      reviewedAt: now,
      updatedAt: now,
    })
    .eq('id', reportId);

  if (reportErr) {
    console.error('[moderation/actions] reviewReportAction error:', reportErr.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // Optionally suspend the reported user
  if (action === 'TAKE_ACTION' && suspendUserId) {
    const { error: suspendErr } = await supabase
      .from('User')
      .update({ isSuspended: true, updatedAt: now })
      .eq('id', suspendUserId);

    if (suspendErr) {
      console.error('[moderation/actions] suspend user error:', suspendErr.message);
      // Report was already updated; don't fail the whole operation
    }
  }

  revalidatePath('/me/admin/moderation');

  return { ok: true };
}
