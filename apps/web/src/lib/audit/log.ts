import 'server-only';

import { headers } from 'next/headers';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'SIGN_IN'
  | 'SIGN_UP'
  | 'CONTRACT_SIGNED'
  | 'USER_SUSPENDED'
  | 'USER_UNSUSPENDED'
  | 'ACCOUNT_DELETED';

export interface AuditEventInput {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getRequestContext(): Promise<{
  ipAddress: string;
  userAgent: string;
}> {
  try {
    const h = await headers();
    const ipAddress =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      h.get('x-real-ip') ??
      'unknown';
    const userAgent = h.get('user-agent') ?? 'unknown';
    return { ipAddress, userAgent };
  } catch {
    // headers() may throw outside of a request context
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Log an audit event to the AuditLog table.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const supabase = await createClient();
    const { ipAddress, userAgent } = await getRequestContext();

    const { error } = await supabase.from('AuditLog').insert({
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
    });

    if (error) {
      console.error('[audit/log] logAuditEvent error:', error.message);
    }
  } catch (err) {
    console.error('[audit/log] logAuditEvent unexpected error:', err);
  }
}

// ---------------------------------------------------------------------------
// Query: last N events (for admin panel)
// ---------------------------------------------------------------------------

export async function getRecentAuditLogs(
  limit = 50,
): Promise<AuditLogRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('AuditLog')
    .select('id, userId, action, entityType, entityId, metadata, ipAddress, userAgent, createdAt')
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[audit/log] getRecentAuditLogs error:', error.message);
    return [];
  }

  return (data ?? []) as AuditLogRow[];
}
