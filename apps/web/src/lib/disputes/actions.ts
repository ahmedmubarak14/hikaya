'use server';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DisputeReason = 'QUALITY' | 'TIMELINESS' | 'NO_SHOW' | 'OTHER';

export type DisputeStatus =
  | 'OPEN'
  | 'CREATOR_RESPONDED'
  | 'UNDER_REVIEW'
  | 'RESOLVED_CREATOR'
  | 'RESOLVED_CLIENT_PARTIAL'
  | 'RESOLVED_CLIENT_FULL'
  | 'APPEALED';

export interface DisputeRow {
  id: string;
  bookingId: string;
  raisedByUserId: string;
  reason: string;
  description: string;
  creatorResponse: string | null;
  resolution: string | null;
  status: DisputeStatus;
  raisedAt: string;
  responseDueAt: string;
  resolvedAt: string | null;
  evidenceUrls: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// File a dispute
// ---------------------------------------------------------------------------

export interface FileDisputeInput {
  bookingId: string;
  reason: DisputeReason;
  description: string;
  evidenceUrls: string[];
}

export type FileDisputeResult =
  | { ok: true; disputeId: string }
  | { ok: false; error: string };

export async function fileDisputeAction(
  input: FileDisputeInput,
): Promise<FileDisputeResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.bookingId || !input.reason || !input.description) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  if (input.description.length < 20) {
    return { ok: false, error: 'DESCRIPTION_TOO_SHORT' };
  }

  const supabase = await createClient();

  // Verify the booking exists and belongs to this user (as client or creator)
  const { data: booking } = await supabase
    .from('Booking')
    .select('id, clientProfileId, creatorProfileId, status, ClientProfile ( userId ), CreatorProfile:CreatorProfile ( userId )')
    .eq('id', input.bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  const clientUserId = (booking.ClientProfile as unknown as Record<string, unknown>)?.userId as string | undefined;
  const creatorUserId = (booking.CreatorProfile as unknown as Record<string, unknown>)?.userId as string | undefined;

  if (session.user.id !== clientUserId && session.user.id !== creatorUserId) {
    return { ok: false, error: 'NOT_AUTHORIZED' };
  }

  // Check no existing dispute on this booking
  const { data: existing } = await supabase
    .from('Dispute')
    .select('id')
    .eq('bookingId', input.bookingId)
    .maybeSingle();

  if (existing) return { ok: false, error: 'DISPUTE_ALREADY_EXISTS' };

  const now = new Date();
  const responseDue = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h

  const { data, error } = await supabase
    .from('Dispute')
    .insert({
      bookingId: input.bookingId,
      raisedByUserId: session.user.id,
      reason: input.reason,
      description: input.description,
      status: 'OPEN',
      raisedAt: now.toISOString(),
      responseDueAt: responseDue.toISOString(),
      updatedAt: now.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[disputes/actions] fileDispute error:', error.message);
    return { ok: false, error: 'DB_ERROR' };
  }

  // Update booking status to DISPUTED
  await supabase
    .from('Booking')
    .update({ status: 'DISPUTED', updatedAt: now.toISOString() })
    .eq('id', input.bookingId);

  return { ok: true, disputeId: data.id };
}

// ---------------------------------------------------------------------------
// Creator responds to dispute
// ---------------------------------------------------------------------------

export interface RespondToDisputeInput {
  disputeId: string;
  response: string;
}

export type RespondToDisputeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function respondToDisputeAction(
  input: RespondToDisputeInput,
): Promise<RespondToDisputeResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.response || input.response.length < 10) {
    return { ok: false, error: 'RESPONSE_TOO_SHORT' };
  }

  const supabase = await createClient();

  // Fetch dispute
  const { data: dispute } = await supabase
    .from('Dispute')
    .select('id, bookingId, raisedByUserId, status, responseDueAt')
    .eq('id', input.disputeId)
    .maybeSingle();

  if (!dispute) return { ok: false, error: 'DISPUTE_NOT_FOUND' };

  if (dispute.status !== 'OPEN') {
    return { ok: false, error: 'DISPUTE_NOT_OPEN' };
  }

  // Check that the responder is the OTHER party (creator side)
  const { data: booking } = await supabase
    .from('Booking')
    .select('creatorProfileId, CreatorProfile:CreatorProfile ( userId )')
    .eq('id', dispute.bookingId)
    .maybeSingle();

  if (!booking) return { ok: false, error: 'BOOKING_NOT_FOUND' };

  const creatorUserId = (booking.CreatorProfile as unknown as Record<string, unknown>)?.userId as string | undefined;

  if (session.user.id !== creatorUserId) {
    return { ok: false, error: 'NOT_AUTHORIZED' };
  }

  // Check 48h window
  const now = new Date();
  if (new Date(dispute.responseDueAt) < now) {
    return { ok: false, error: 'RESPONSE_WINDOW_EXPIRED' };
  }

  const { error } = await supabase
    .from('Dispute')
    .update({
      creatorResponse: input.response,
      status: 'CREATOR_RESPONDED',
      updatedAt: now.toISOString(),
    })
    .eq('id', input.disputeId);

  if (error) {
    console.error('[disputes/actions] respondToDispute error:', error.message);
    return { ok: false, error: 'DB_ERROR' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin status transitions (for future admin panel)
// ---------------------------------------------------------------------------

export async function transitionDisputeAction(
  disputeId: string,
  newStatus: DisputeStatus,
  resolution?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  // Admin-only - check roles (ADMIN role lives in User.roles)
  if (!session.user.roles.includes('ADMIN' as never)) {
    return { ok: false, error: 'NOT_ADMIN' };
  }

  const supabase = await createClient();
  const now = new Date();

  const update: Record<string, unknown> = {
    status: newStatus,
    updatedAt: now.toISOString(),
  };

  if (resolution) {
    update.resolution = resolution;
  }

  if (
    newStatus === 'RESOLVED_CREATOR' ||
    newStatus === 'RESOLVED_CLIENT_PARTIAL' ||
    newStatus === 'RESOLVED_CLIENT_FULL'
  ) {
    update.resolvedAt = now.toISOString();
  }

  const { error } = await supabase
    .from('Dispute')
    .update(update)
    .eq('id', disputeId);

  if (error) {
    console.error('[disputes/actions] transitionDispute error:', error.message);
    return { ok: false, error: 'DB_ERROR' };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// List disputes for current user
// ---------------------------------------------------------------------------

export async function getMyDisputesAction(): Promise<DisputeRow[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = await createClient();

  // Get disputes where user is the raiser
  const { data: raisedDisputes, error: err1 } = await supabase
    .from('Dispute')
    .select('*')
    .eq('raisedByUserId', session.user.id)
    .order('createdAt', { ascending: false });

  if (err1) {
    console.error('[disputes/actions] getMyDisputes (raised) error:', err1.message);
  }

  // Get disputes where user is the creator (via booking)
  const { data: profile } = await supabase
    .from('CreatorProfile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  let creatorDisputes: DisputeRow[] = [];
  if (profile) {
    const { data: bookings } = await supabase
      .from('Booking')
      .select('id')
      .eq('creatorProfileId', profile.id);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b: { id: string }) => b.id);
      const { data, error: err2 } = await supabase
        .from('Dispute')
        .select('*')
        .in('bookingId', bookingIds)
        .neq('raisedByUserId', session.user.id)
        .order('createdAt', { ascending: false });

      if (err2) {
        console.error('[disputes/actions] getMyDisputes (creator) error:', err2.message);
      }
      creatorDisputes = (data ?? []) as unknown as DisputeRow[];
    }
  }

  // Also check as client profile
  const { data: clientProfile } = await supabase
    .from('ClientProfile')
    .select('id')
    .eq('userId', session.user.id)
    .maybeSingle();

  let clientDisputes: DisputeRow[] = [];
  if (clientProfile) {
    const { data: bookings } = await supabase
      .from('Booking')
      .select('id')
      .eq('clientProfileId', clientProfile.id);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b: { id: string }) => b.id);
      const { data, error: err3 } = await supabase
        .from('Dispute')
        .select('*')
        .in('bookingId', bookingIds)
        .neq('raisedByUserId', session.user.id)
        .order('createdAt', { ascending: false });

      if (err3) {
        console.error('[disputes/actions] getMyDisputes (client) error:', err3.message);
      }
      clientDisputes = (data ?? []) as unknown as DisputeRow[];
    }
  }

  // Merge and dedupe
  const allDisputes = [
    ...((raisedDisputes ?? []) as unknown as DisputeRow[]),
    ...creatorDisputes,
    ...clientDisputes,
  ];

  const seen = new Set<string>();
  return allDisputes.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Get a single dispute by ID
// ---------------------------------------------------------------------------

export async function getDisputeByIdAction(
  disputeId: string,
): Promise<DisputeRow | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Dispute')
    .select('*')
    .eq('id', disputeId)
    .maybeSingle();

  if (error || !data) return null;

  return data as unknown as DisputeRow;
}
