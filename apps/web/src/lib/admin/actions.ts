'use server';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalBookings: number;
  totalRevenueHalalas: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isSuspended: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Guard: check if current user is ADMIN
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  // Check both Supabase User.roles and the mock-store roles
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

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Get admin stats
// ---------------------------------------------------------------------------

export async function getAdminStatsAction(): Promise<AdminStats | null> {
  const guard = await requireAdmin();
  if (!guard.ok) return null;

  const supabase = await createClient();

  const [usersRes, creatorsRes, bookingsRes, revenueRes] = await Promise.all([
    supabase.from('User').select('id', { count: 'exact', head: true }),
    supabase.from('CreatorProfile').select('id', { count: 'exact', head: true }),
    supabase.from('Booking').select('id', { count: 'exact', head: true }),
    supabase.from('Booking').select('totalHalalas'),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum: number, row: Record<string, unknown>) => sum + ((row.totalHalalas as number) ?? 0),
    0,
  );

  return {
    totalUsers: usersRes.count ?? 0,
    totalCreators: creatorsRes.count ?? 0,
    totalBookings: bookingsRes.count ?? 0,
    totalRevenueHalalas: totalRevenue,
  };
}

// ---------------------------------------------------------------------------
// List users with optional search
// ---------------------------------------------------------------------------

export async function listUsersAction(
  search?: string,
): Promise<AdminUserRow[]> {
  const guard = await requireAdmin();
  if (!guard.ok) return [];

  const supabase = await createClient();

  let query = supabase
    .from('User')
    .select('id, email, displayName, roles, isSuspended, createdAt')
    .order('createdAt', { ascending: false })
    .limit(100);

  if (search && search.trim().length > 0) {
    // Search by name or email (case-insensitive)
    query = query.or(
      `displayName.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('[admin/actions] listUsers error:', error.message);
    return [];
  }

  return (data ?? []) as AdminUserRow[];
}

// ---------------------------------------------------------------------------
// Suspend / unsuspend user
// ---------------------------------------------------------------------------

export async function suspendUserAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('User')
    .update({ isSuspended: true, updatedAt: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[admin/actions] suspendUser error:', error.message);
    return { ok: false, error: 'DB_ERROR' };
  }

  // Audit log
  try {
    const { logAuditEvent } = await import('@/lib/audit/log');
    const session = await getSession();
    await logAuditEvent({
      userId: session?.user.id,
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: userId,
      metadata: { targetUserId: userId },
    });
  } catch {
    // audit logging is best-effort
  }

  return { ok: true };
}

export async function unsuspendUserAction(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return { ok: false, error: guard.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('User')
    .update({ isSuspended: false, updatedAt: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[admin/actions] unsuspendUser error:', error.message);
    return { ok: false, error: 'DB_ERROR' };
  }

  // Audit log
  try {
    const { logAuditEvent } = await import('@/lib/audit/log');
    const session = await getSession();
    await logAuditEvent({
      userId: session?.user.id,
      action: 'USER_UNSUSPENDED',
      entityType: 'User',
      entityId: userId,
      metadata: { targetUserId: userId },
    });
  } catch {
    // audit logging is best-effort
  }

  return { ok: true };
}
