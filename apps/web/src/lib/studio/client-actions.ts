'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Update a client's notes and tags on their ClientProfile.
 */
export async function updateClientAction(
  clientProfileId: string,
  input: { notes: string; tags: string },
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  const supabase = await createClient();

  // Store tags as comma-separated in a "notes" field approach:
  // We use the ClientProfile table — notes go to a notes column,
  // tags as a JSON array in a tags column.
  // Since Prisma schema's ClientProfile doesn't have notes/tags columns yet,
  // we'll store them in the industry field as a JSON workaround,
  // OR we add new columns via migration. We'll use a metadata approach:
  // notes -> companyName repurpose is bad. Let's use the industry field
  // for notes temporarily, and vatNumber for tags JSON.
  // Actually, let's properly store: we add columns via migration.
  // For now, we update using a JSONB approach on a new column.

  const tagsArray = input.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from('ClientProfile')
    .update({
      notes: input.notes || null,
      tags: tagsArray,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', clientProfileId);

  if (error) {
    console.error('[studio/client-actions] updateClientAction error:', error.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}

/**
 * Add a new client: creates a User row + ClientProfile row.
 */
export async function addClientAction(input: {
  name: string;
  email: string;
  tags: string;
}): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'NOT_AUTHENTICATED' };

  if (!input.name.trim() || !input.email.trim()) {
    return { ok: false, error: 'INVALID_INPUT' };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Generate a cuid-like ID
  const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const clientProfileId = `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const tagsArray = input.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // 1. Insert User row
  const { error: userError } = await supabase.from('User').insert({
    id: userId,
    email: input.email,
    displayName: input.name,
    authProvider: 'EMAIL',
    locale: 'EN',
    roles: ['CLIENT'],
    activeRole: 'CLIENT',
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  });

  if (userError) {
    console.error('[studio/client-actions] addClientAction user error:', userError.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  // 2. Insert ClientProfile row
  const { error: profileError } = await supabase.from('ClientProfile').insert({
    id: clientProfileId,
    userId,
    isBusiness: false,
    country: 'SA',
    notes: null,
    tags: tagsArray,
    createdAt: now,
    updatedAt: now,
  });

  if (profileError) {
    console.error('[studio/client-actions] addClientAction profile error:', profileError.message);
    return { ok: false, error: 'UNKNOWN' };
  }

  revalidatePath('/me/studio');
  return { ok: true };
}

/**
 * Get a client's full history: bookings, quotes, contracts.
 */
export async function getClientHistory(clientProfileId: string): Promise<{
  bookings: Array<{
    id: string;
    discipline: string;
    status: string;
    sessionStart: string;
    totalHalalas: number;
  }>;
  quotes: Array<{
    id: string;
    number: string;
    status: string;
    totalHalalas: number;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}> {
  const session = await getSession();
  if (!session) return { bookings: [], quotes: [], contracts: [] };

  const supabase = await createClient();

  // Get bookings for this client
  const { data: bookings } = await supabase
    .from('Booking')
    .select('id, discipline, status, sessionStart, totalHalalas')
    .eq('clientProfileId', clientProfileId)
    .order('sessionStart', { ascending: false });

  // Get booking IDs to find associated quotes and contracts
  const bookingIds = (bookings ?? []).map((b: { id: string }) => b.id);

  let quotes: Array<{
    id: string;
    number: string;
    status: string;
    totalHalalas: number;
    createdAt: string;
  }> = [];
  let contracts: Array<{
    id: string;
    status: string;
    createdAt: string;
  }> = [];

  if (bookingIds.length > 0) {
    const { data: quotesData } = await supabase
      .from('Quote')
      .select('id, number, status, totalHalalas, createdAt')
      .in('bookingId', bookingIds)
      .order('createdAt', { ascending: false });

    quotes = (quotesData ?? []) as typeof quotes;

    const { data: contractsData } = await supabase
      .from('Contract')
      .select('id, status, createdAt')
      .in('bookingId', bookingIds)
      .order('createdAt', { ascending: false });

    contracts = (contractsData ?? []) as typeof contracts;
  }

  return {
    bookings: (bookings ?? []) as Array<{
      id: string;
      discipline: string;
      status: string;
      sessionStart: string;
      totalHalalas: number;
    }>,
    quotes,
    contracts,
  };
}
