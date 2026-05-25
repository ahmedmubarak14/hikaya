import 'server-only';

import type { Quote, QuoteLineItem, QuoteStatus } from './mock-data';

/**
 * Real Supabase queries for quotes (Quote + QuoteLineItem).
 *
 * Each function uses the Next.js server Supabase client (cookie-based auth,
 * anon key) and returns data shaped to match the `Quote` type from
 * mock-data.ts so downstream components don't need changes.
 *
 * Note: The DB Quote model stores money as `subtotalHalalas`, `vatHalalas`,
 * `discountHalalas`, `totalHalalas` — matching mock-data 1:1.  The Quote
 * table has `bookingId` FK; we join through Booking -> CreatorProfile to
 * filter by creator.  The mock model uses `creatorId` directly, so we
 * derive it from the booking's `creatorProfileId`.
 */

async function getClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

// ---------------------------------------------------------------------------
// Mapping helpers — DB row -> front-end Quote shape
// ---------------------------------------------------------------------------

interface DbQuoteLineItemRow {
  id: string;
  descriptionEn: string;
  descriptionAr: string | null;
  quantity: number;
  unitHalalas: number;
  totalHalalas: number;
  orderIndex: number;
}

interface DbQuoteRow {
  id: string;
  bookingId: string;
  number: string;
  status: string;
  expiresAt: string | null;
  notes: string | null;
  subtotalHalalas: number;
  vatHalalas: number;
  discountHalalas: number;
  totalHalalas: number;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  Booking?: { creatorProfileId: string; clientProfileId: string; ClientProfile?: { User?: { displayName: string; email: string } | null } | null } | null;
  QuoteLineItem?: DbQuoteLineItemRow[];
}

function mapQuote(row: DbQuoteRow): Quote {
  const lineItems: QuoteLineItem[] = (row.QuoteLineItem ?? [])
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((li) => ({
      id: li.id,
      descriptionEn: li.descriptionEn,
      descriptionAr: li.descriptionAr ?? undefined,
      quantity: li.quantity,
      unitHalalas: li.unitHalalas,
      totalHalalas: li.totalHalalas,
    }));

  return {
    id: row.id,
    number: row.number,
    shareSlug: row.number.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    creatorId: row.Booking?.creatorProfileId ?? '',
    clientName: row.Booking?.ClientProfile?.User?.displayName ?? 'Client',
    clientEmail: row.Booking?.ClientProfile?.User?.email,
    notes: row.notes ?? undefined,
    status: row.status as QuoteStatus,
    expiresAt: row.expiresAt ?? undefined,
    approvedAt: row.approvedAt ?? undefined,
    rejectedAt: row.rejectedAt ?? undefined,
    lineItems,
    subtotalHalalas: row.subtotalHalalas,
    vatHalalas: row.vatHalalas,
    discountHalalas: row.discountHalalas,
    totalHalalas: row.totalHalalas,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const QUOTE_SELECT = `
  id, bookingId, number, status,
  expiresAt, notes,
  subtotalHalalas, vatHalalas, discountHalalas, totalHalalas,
  approvedAt, rejectedAt,
  createdAt, updatedAt,
  Booking ( creatorProfileId, clientProfileId, ClientProfile:ClientProfile ( User:User ( displayName, email ) ) ),
  QuoteLineItem ( id, descriptionEn, descriptionAr, quantity, unitHalalas, totalHalalas, orderIndex )
`;

// ---------------------------------------------------------------------------
// Exported query functions
// ---------------------------------------------------------------------------

export async function listQuotesByCreatorFromDB(creatorId: string): Promise<Quote[]> {
  const supabase = await getClient();

  // Quote doesn't have creatorId directly — it goes through Booking.
  // We filter by Booking.creatorProfileId via an inner join filter.
  const { data, error } = await supabase
    .from('Quote')
    .select(QUOTE_SELECT)
    .eq('Booking.creatorProfileId', creatorId)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[supabase-queries] listQuotesByCreatorFromDB error:', error.message);
    return [];
  }

  // Filter out rows where the Booking join didn't match (Supabase returns nulled joins)
  return (data ?? [])
    .filter((row: unknown) => (row as DbQuoteRow).Booking?.creatorProfileId === creatorId)
    .map((row: unknown) => mapQuote(row as DbQuoteRow));
}

export async function getQuoteByIdFromDB(id: string): Promise<Quote | null> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Quote')
    .select(QUOTE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getQuoteByIdFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapQuote(data as unknown as DbQuoteRow);
}

export async function getQuoteBySlugFromDB(slug: string): Promise<Quote | null> {
  // The DB Quote model uses `number` (e.g. "Q-2026-0001") as the unique
  // identifier. The mock model uses `shareSlug` which is derived from number.
  // Try matching the number first, then fall back to derived slug match.
  const supabase = await getClient();

  const { data, error } = await supabase
    .from('Quote')
    .select(QUOTE_SELECT)
    .eq('number', slug.toUpperCase().replace(/-/g, '-'))
    .maybeSingle();

  if (error) {
    console.error('[supabase-queries] getQuoteBySlugFromDB error:', error.message);
    return null;
  }

  if (!data) return null;
  return mapQuote(data as unknown as DbQuoteRow);
}
